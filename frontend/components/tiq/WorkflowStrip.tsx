'use client';

import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface WorkflowStep {
  label: string;
  description?: string;
}

export type WorkflowStatus = 'complete' | 'current' | 'upcoming';

export interface WorkflowStripProps {
  steps: WorkflowStep[];
  currentStep: number; // 0-based index
  className?: string;
}

function stepStatus(idx: number, current: number): WorkflowStatus {
  if (idx < current) return 'complete';
  if (idx === current) return 'current';
  return 'upcoming';
}

export function WorkflowStrip({ steps, currentStep, className }: WorkflowStripProps) {
  return (
    <nav aria-label="Progress" className={cn('overflow-x-auto', className)}>
      <ol className="flex min-w-max items-center gap-0">
        {steps.map((step, idx) => {
          const status = stepStatus(idx, currentStep);
          const isLast = idx === steps.length - 1;

          return (
            <React.Fragment key={idx}>
              <li className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors',
                      status === 'complete' &&
                        'border-tiq-primary bg-tiq-primary text-white',
                      status === 'current' &&
                        'border-tiq-primary bg-white text-tiq-primary',
                      status === 'upcoming' &&
                        'border-tiq-border bg-white text-tiq-muted',
                    )}
                  >
                    {status === 'complete' ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      idx + 1
                    )}
                  </div>
                  <div className="mt-1.5 min-w-[64px] max-w-[96px] text-center">
                    <p
                      className={cn(
                        'text-[11px] font-medium leading-tight',
                        status === 'current'
                          ? 'text-tiq-navy'
                          : status === 'complete'
                            ? 'text-tiq-primary'
                            : 'text-tiq-muted',
                      )}
                    >
                      {step.label}
                    </p>
                    {step.description && (
                      <p className="mt-0.5 text-[10px] text-tiq-muted">
                        {step.description}
                      </p>
                    )}
                  </div>
                </div>
              </li>

              {!isLast && (
                <li
                  className={cn(
                    'h-px w-8 flex-shrink-0 self-start mt-4',
                    idx < currentStep ? 'bg-tiq-primary' : 'bg-tiq-border',
                  )}
                  aria-hidden="true"
                />
              )}
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
