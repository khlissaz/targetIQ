import { create } from 'zustand';
import { fetchLeadById, updateLeadStatus } from '@/services/leadServices';
import { toast } from '@/hooks/use-toast';
import { EnrichmentTaskI, GetEnrichmentTasksStatusI, LeadI } from './types';
import { fetchCredits, getEnrichmentTasksStatus } from '@/services/enrichServices';


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
  globalTimer: 9,
  leads: [],
  _interval: null,
  enrichmentCredits: 0,
  isEnriching: false,
  isEnrichmentCompleted: false,

  // Méthodes existantes inchangées
  setLeads: (leads) => set({ 
    leads: typeof leads === 'function' ? leads(get().leads) : leads 
  }),
  showEnrichmentProgress: () => set({ isEnrichmentProgressVisible: true }),
  hideEnrichmentProgress: () => set({ isEnrichmentProgressVisible: false, globalTimer: 9 }),
  
  addTask: (task: EnrichmentTaskI) =>
    set((state) => ({
      tasks: [...state.tasks, task],
    })),

  updateGlobalTimer: () => {
    const state = get();
    if (state._interval) clearInterval(state._interval);

    const newInterval = setInterval(() => {
      const current = get();
      if (!current.isEnrichmentProgressVisible) {
        clearInterval(newInterval);
        return;
      }

      if (current.globalTimer <= 0) {
        current.fetchTaskStatus();
        set({ globalTimer: 9 });
      } else {
        set({ globalTimer: current.globalTimer - 1 });
      }
    }, 1000);

    set({ _interval: newInterval });
  },

  cleanup: () => {
    const { _interval } = get();
    if (_interval) clearInterval(_interval);
    set({ _interval: null });
  },

  // fetchTaskStatus avec corrections minimales
  fetchTaskStatus: async () => {
    try {
      const response = await getEnrichmentTasksStatus();
      const updatedTasks: GetEnrichmentTasksStatusI[] = response?.data ?? [];

      if (updatedTasks.length === 0) {
        const { _interval } = get();
        if (_interval) {
          clearInterval(_interval);
          set({ 
            _interval: null,
            isEnrichmentCompleted: true
          });
        }
        return;
      }

      set((state) => {
        // Mise à jour des tâches existantes
        const updatedExistingTasks = state.tasks.map((task): EnrichmentTaskI => {
          const currentTask = updatedTasks.find((s) => s.leadId === task.leadId);
          if (!currentTask) {
            return {
              ...task,
              status: 'terminated',
              message: 'Processus terminé',
            };
          }
          return {
            ...task,
            status: currentTask.status,
            message:
              currentTask.status === 'pending'
                ? "En cours d'enrichissement"
                : currentTask.status === 'success'
                ? `Email trouvé : ${currentTask.email}`
                : 'Email non trouvé',
            email: currentTask.email,
          };
        });

        // Nouvelles tâches
        const newTasks: EnrichmentTaskI[] = updatedTasks
          .filter((s) => !state.tasks.some((t) => t.leadId === s.leadId))
          .map((s) => ({
            leadId: s.leadId,
            name: '', // Ajout du champ name manquant
            status: s.status,
            message:
              s.status === 'pending'
                ? "En cours d'enrichissement"
                : s.status === 'success'
                ? `Email trouvé : ${s.email}`
                : 'Email non trouvé',
            email: s.email,
          }));

        const currentTasks = [...updatedExistingTasks, ...newTasks];

        // Mise à jour des leads (inchangé)
        updatedTasks.forEach(async (updatedTask) => {
          if (updatedTask.status === 'success' || updatedTask.status === 'error') {
            try {
              let updatedLead = await fetchLeadById(updatedTask.leadId);
              await updateLeadStatus(updatedTask.leadId, updatedTask.status);
              updatedLead.status = updatedTask.status;
              
              set((state) => ({
                leads: state.leads.map((lead) =>
                  lead.id === updatedTask.leadId ? updatedLead : lead
                ),
              }));
            } catch (error) {
              console.error(`Erreur lors de la récupération du lead ${updatedTask.leadId}:`, error);
            }
          }
        });

        // Gestion des tâches terminées (inchangé)
        currentTasks.forEach((task) => {
          if (['success', 'failed', 'terminated'].includes(task.status)) {
            setTimeout(() => {
              set((state) => ({
                tasks: state.tasks.filter((t) => t.leadId !== task.leadId),
              }));
            }, 9000);
          }
          if (['error', 'failed'].includes(task.status)) {
            set((state) => ({
              enrichmentCredits: state.enrichmentCredits + 1
            }));
          }
        });

        return { tasks: currentTasks };
      });
    } catch (error) {
      console.error('Error fetching task status:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de récupérer le statut des tâches"
      });
    }
  },

  // Méthodes existantes inchangées
  setIsEnriching: (value) => set({ isEnriching: value }),
  setEnrichmentCompleted: (value) => set({ isEnrichmentCompleted: value }),
  setEnrichmentCredits: (newCredits) => set({ enrichmentCredits: newCredits }),
  
  fetchEnrichmentCredits: async () => {
    try {
      const newCredits = await fetchCredits();
      set({ enrichmentCredits: newCredits });
    } catch (err) {
      console.error('Erreur lors de la récupération de enrichCredits', err);
    }
  },
}));