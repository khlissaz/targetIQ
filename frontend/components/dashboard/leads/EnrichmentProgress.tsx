'use client';

import React from 'react';
import { useAppStore } from '@/lib/appStore';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';

const EnrichmentProgress: React.FC = () => {
  const { language } = useLanguage();
  const { t } = useTranslation(language);
  const isArabic = language === "ar";

  const {
    isEnrichmentProgressVisible,
    tasks,
    globalTimer,
    hideEnrichmentProgress,
    isEnrichmentCompleted
  } = useAppStore();

  if (!isEnrichmentProgressVisible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 flex justify-center z-50"
      dir={isArabic ? "rtl" : "ltr"}
    >
      {/* Container matches LeadsPage max width */}
      <div className="w-full max-w-7xl mx-auto px-6 lg:px-8">
        <div className="bg-gray-800 text-white p-4 border-t border-gray-600 rounded-t-lg shadow-lg">
          {!isEnrichmentCompleted && tasks.length > 0 && (
            <div className={`mb-2 text-sm ${isArabic ? "text-right" : "text-left"}`}>
              {isArabic
                ? `التحديث خلال ${globalTimer} ثوان`
                : `Refresh in ${globalTimer}s`}
            </div>
          )}

          <div className="flex justify-between items-center">
            <div className={`${isArabic ? "text-right" : "text-left"} flex-1`}>
              {!isEnrichmentCompleted && tasks.length > 0 ? (
                tasks.map((task) => (
                  <div key={task.leadId} className="mb-2">
                    <span>{task.name}: {task.message}</span>
                  </div>
                ))
              ) : (
                <span>{t("lead.enrichmentCompleted")}</span>
              )}
            </div>

            <Button
              size="sm"
              variant="outline"
              className={`${isArabic ? "mr-4" : "ml-4"} text-white border-white`}
              onClick={hideEnrichmentProgress}
            >
              {isArabic ? "إغلاق" : "Close"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnrichmentProgress;
