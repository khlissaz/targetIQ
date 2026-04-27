import { create } from 'zustand';
import { useEffect } from 'react';
import { fetchLeadById, updateLeadStatus } from '@/services/leadServices';
import { EnrichmentTaskI, GetEnrichmentTasksStatusI, LeadI } from './types';
import { fetchCredits, getEnrichmentTasksByLeadIds } from '@/services/enrichServices';
import { translate } from '@/lib/i18n';
import { safeLog, sanitizeError, hashIdentifier } from '@/lib/safeLogging';

/** Emit a store-level error via custom event so UI can toast without coupling Zustand to toast libs */
function emitStoreError(key: string, message: string): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('targetiq:store-error', { detail: { key, message } }),
  );
}

/** React hook — subscribe to store errors and call handler(key, message) */
export function useStoreErrors(handler: (key: string, message: string) => void): void {
  useEffect(() => {
    const listener = (e: Event) => {
      const { key, message } = (e as CustomEvent<{ key: string; message: string }>).detail;
      handler(key, message);
    };
    window.addEventListener('targetiq:store-error', listener);
    return () => window.removeEventListener('targetiq:store-error', listener);
  }, [handler]);
}

interface AppStoreState {
  isEnrichmentProgressVisible: boolean;
  tasks: EnrichmentTaskI[];
  globalTimer: number;
  leads: LeadI[];
  setLeads: (leads: LeadI[] | ((prevLeads: LeadI[]) => LeadI[])) => void;
  showEnrichmentProgress: () => void;
  hideEnrichmentProgress: () => void;
  addTask: (task: EnrichmentTaskI) => void;
  updateGlobalTimer: () => void;
  fetchTaskStatus: () => Promise<void>;
  _interval: NodeJS.Timeout | null;
  isEnriching: boolean;
  setIsEnriching: (value: boolean) => void;
  enrichmentCredits: number;
  setEnrichmentCredits: (newCredits: number) => void;
  fetchEnrichmentCredits: () => Promise<void>;
  isEnrichmentCompleted: boolean;
  setEnrichmentCompleted: (value: boolean) => void;
  cleanup: () => void;
}

export const useAppStore = create<AppStoreState>((set, get) => ({
  isEnrichmentProgressVisible: false,
  tasks: [],
  globalTimer: 10,
  leads: [],
  _interval: null,
  enrichmentCredits: 0,
  isEnriching: false,
  isEnrichmentCompleted: false,

  setLeads: (leads) => set({ leads: typeof leads === 'function' ? leads(get().leads) : leads }),
  showEnrichmentProgress: () => set({ isEnrichmentProgressVisible: true, isEnrichmentCompleted: false }),
  hideEnrichmentProgress: () => set({ isEnrichmentProgressVisible: false, globalTimer: 10 }),

  addTask: (task: EnrichmentTaskI) =>
    set((state) => {
      const existingIndex = state.tasks.findIndex((t) => t.leadId === task.leadId);
      if (existingIndex === -1) {
        return { tasks: [...state.tasks, task] };
      }
      const existing = state.tasks[existingIndex];
      const next = [...state.tasks];
      next[existingIndex] = {
        ...existing,
        ...task,
        // Preserve creditsUsed from original — status updates don't include it
        creditsUsed: task.creditsUsed ?? existing.creditsUsed,
      };
      return { tasks: next };
    }),

  updateGlobalTimer: () => {
    const state = get();
    if (state._interval) clearInterval(state._interval);

    set({ globalTimer: 10, isEnrichmentCompleted: false });

    const newInterval = setInterval(() => {
      const current = get();
      if (!current.isEnrichmentProgressVisible) {
        clearInterval(newInterval);
        return;
      }

      if (current.isEnrichmentCompleted) {
        clearInterval(newInterval);
        set({ _interval: null });
        return;
      }

      if (current.globalTimer <= 1) {
        current.fetchTaskStatus();
        set({ globalTimer: 10 });
        return;
      }

      set({ globalTimer: current.globalTimer - 1 });
    }, 1000);

    set({ _interval: newInterval });
  },

  cleanup: () => {
    const { _interval } = get();
    if (_interval) clearInterval(_interval);
    set({ _interval: null });
  },

  fetchTaskStatus: async () => {
    try {
      const stateNow = get();
      const leadIds = (stateNow.tasks || []).map((t) => t.leadId).filter(Boolean);

      if (leadIds.length === 0) {
        const { _interval } = get();
        if (_interval) clearInterval(_interval);
        set({ _interval: null, isEnrichmentCompleted: true, globalTimer: 10 });
        return;
      }

      const updatedTasks: GetEnrichmentTasksStatusI[] = await getEnrichmentTasksByLeadIds(leadIds);

      set((state) => {
        const currentTasks = (state.tasks || []).map((task): EnrichmentTaskI => {
          const currentTask = updatedTasks.find((s) => s.leadId === task.leadId);
          if (!currentTask) {
            return { ...task, status: 'terminated', message: translate('lead.enrichmentFinished') };
          }

          return {
            ...task,
            status: currentTask.status as any,
            email: currentTask.email,
            phone: currentTask.phone,
            requestedFields: currentTask.requestedFields,
            message: currentTask.message || task.message,
          };
        });

        return { tasks: currentTasks };
      });

      updatedTasks.forEach(async (updatedTask) => {
        if (updatedTask.status === 'success' || updatedTask.status === 'error') {
          try {
            const updatedLead = await fetchLeadById(updatedTask.leadId);
            await updateLeadStatus(updatedTask.leadId, updatedTask.status);
            (updatedLead as any).status = updatedTask.status;

            set((state) => ({
              leads: state.leads.map((lead) =>
                lead.id === updatedTask.leadId ? (updatedLead as any) : lead,
              ),
            }));

            // Refresh credits every time a task succeeds (credits were consumed)
            if (updatedTask.status === 'success') {
              await get().fetchEnrichmentCredits();
            }
          } catch (error) {
            const se = sanitizeError(error);
            safeLog('error', 'appstore.fetchLead.failed', {
              leadIdHash: updatedTask?.leadId ? hashIdentifier(String(updatedTask.leadId), 'leadId') : undefined,
              message: se.message,
              code: se.code,
            });
          }
        }
      });

      const after = get();
      const allDone = (after.tasks || []).length > 0 && (after.tasks || []).every((t) => t.status !== 'pending');
      if (allDone) {
        const { _interval } = after;
        if (_interval) clearInterval(_interval);
        set({ _interval: null, isEnrichmentCompleted: true, globalTimer: 10 });
        await get().fetchEnrichmentCredits();
      }
    } catch (error) {
      const se = sanitizeError(error);
      safeLog('error', 'appstore.fetchTaskStatus.failed', { message: se.message, code: se.code });
      emitStoreError('fetchTaskStatus', se.message || translate('lead.enrichmentTasksStatusFetchFailed'));
    }
  },

  setIsEnriching: (value) => set({ isEnriching: value }),
  setEnrichmentCompleted: (value) => set({ isEnrichmentCompleted: value }),
  setEnrichmentCredits: (newCredits) => set({ enrichmentCredits: newCredits }),

  fetchEnrichmentCredits: async () => {
    try {
      const newCredits = await fetchCredits();
      set({ enrichmentCredits: newCredits });
    } catch (err) {
      const se = sanitizeError(err);
      safeLog('error', 'appstore.fetchCredits.failed', { message: se.message, code: se.code });
    }
  },
}));
