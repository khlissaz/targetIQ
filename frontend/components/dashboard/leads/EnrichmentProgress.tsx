'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { useAppStore, useStoreErrors } from '@/lib/appStore';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/lib/i18n';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, Zap, ChevronDown, ChevronUp, X } from 'lucide-react';

function TaskStatusIcon({ status }: { status: string }) {
  if (status === 'success')
    return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />;
  if (status === 'error' || status === 'failed')
    return <XCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />;
  if (status === 'terminated')
    return <CheckCircle2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />;
  return (
    <span className="h-3.5 w-3.5 shrink-0 inline-flex items-center justify-center">
      <span className="h-2.5 w-2.5 rounded-full bg-tiq-primary/60 animate-pulse" />
    </span>
  );
}

function taskSummary(task: any, t: (key: string) => string): string {
  if (task.status === 'success') {
    const parts: string[] = [];
    if (task.email) parts.push(task.email);
    if (task.phone) parts.push(task.phone);
    return parts.length > 0 ? parts.join(' \u00b7 ') : t('enrichment.found');
  }
  if (task.status === 'error' || task.status === 'failed') return task.message || t('enrichment.failed');
  if (task.status === 'terminated') return t('enrichment.noDataFound');
  return task.message || t('enrichment.processing');
}

const EnrichmentProgress: React.FC = () => {
  const { language } = useLanguage();
  const { t, dir } = useTranslation(language);
  const [expanded, setExpanded] = useState(false);

  const {
    isEnrichmentProgressVisible,
    tasks,
    isEnrichmentCompleted,
    hideEnrichmentProgress,
    enrichmentCredits,
  } = useAppStore();

  const handleStoreError = useCallback((_key: string, message: string) => {
    toast.error(message);
  }, []);
  useStoreErrors(handleStoreError);

  const { total, done, failed, pending, creditsUsed } = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((t) => t.status === 'success' || t.status === 'terminated').length;
    const failed = tasks.filter((t) => t.status === 'error' || t.status === 'failed').length;
    const pending = tasks.filter((t) => t.status === 'pending').length;
    const creditsUsed = tasks.reduce(
      (sum, t) => sum + (typeof t.creditsUsed === 'number' ? t.creditsUsed : 0),
      0,
    );
    return { total, done, failed, pending, creditsUsed };
  }, [tasks]);

  const progressPercent = total > 0 ? Math.round(((done + failed) / total) * 100) : 0;
  const currentTask = tasks.find((t) => t.status === 'pending');

  if (!isEnrichmentProgressVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50" dir={dir}>
      <div className="w-full max-w-7xl mx-auto px-4 lg:px-8">
        <div className="bg-tiq-navy text-tiq-surface rounded-t-2xl shadow-2xl border border-white/10 overflow-hidden">

          {/* Progress bar */}
          <div className="h-1 w-full bg-white/10">
            <div
              className="h-1 bg-tiq-primary transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Main row */}
          <div className="flex items-center gap-3 px-4 py-3">

            {/* Status */}
            <div className="flex-1 min-w-0">
              {isEnrichmentCompleted ? (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span className="text-sm font-medium">
                    {t('enrichment.complete')} —{' '}
                    <span className="text-emerald-400">{done} {t('enrichment.found')}</span>
                    {failed > 0 && <span className="text-red-400 ml-1">\u00b7 {failed} {t('enrichment.failed')}</span>}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 min-w-0">
                  <span className="h-2 w-2 rounded-full bg-tiq-primary animate-pulse shrink-0" />
                  <span className="text-sm font-medium truncate">
                    {currentTask ? (
                      <>{t('enrichment.enriching')} <span className="text-tiq-primary/90">{currentTask.name}</span>\u2026</>
                    ) : pending > 0 ? t('enrichment.queued').replace('{{count}}', String(pending)) : t('enrichment.finishing')}
                  </span>
                </div>
              )}
            </div>

            {/* Counter */}
            <div className="shrink-0 text-sm font-mono text-white/70 tabular-nums">
              {done + failed} / {total}
            </div>

            {/* Credits */}
            <div className="shrink-0 flex items-center gap-1 text-sm">
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-white/70">{enrichmentCredits} {t('enrichment.creditsLeft')}</span>
              {creditsUsed > 0 && (
                <span className="text-white/40 text-xs">(\u2212{creditsUsed} {t('enrichment.used')})</span>
              )}
            </div>

            {/* Expand + Close */}
            <div className="flex items-center gap-1 shrink-0">
              {tasks.length > 0 && (
                <button
                  onClick={() => setExpanded((v) => !v)}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white"
                >
                  {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                </button>
              )}
              <button
                onClick={hideEnrichmentProgress}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Stats strip */}
          <div className="flex items-center gap-4 px-4 pb-2.5 text-xs text-white/50">
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {done} {t('enrichment.enriched')}
            </span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
              {pending} {t('enrichment.pending')}
            </span>
            {failed > 0 && (
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                {failed} {t('enrichment.failedCount')}
              </span>
            )}
            <span className="ml-auto">{progressPercent}% {t('enrichment.percentComplete')}</span>
          </div>

          {/* Expanded task list */}
          {expanded && tasks.length > 0 && (
            <div className="border-t border-white/10 max-h-64 overflow-y-auto">
              {tasks.map((task) => (
                <div
                  key={task.leadId}
                  className="flex items-center gap-2.5 px-4 py-2 border-b border-white/5 last:border-0 hover:bg-white/5"
                >
                  <TaskStatusIcon status={task.status} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{task.name}</div>
                    <div className="text-xs text-white/50 truncate">{taskSummary(task, t)}</div>
                  </div>
                  {typeof task.creditsUsed === 'number' && task.creditsUsed > 0 && (
                    <div className="shrink-0 text-xs text-amber-400/70 tabular-nums">
                      −{task.creditsUsed} cr
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default EnrichmentProgress;

