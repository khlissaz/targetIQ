import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { ScrapingI } from '@/lib/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/lib/i18n';

export interface ScrapingDataSelectorProps {
  collections: Array<ScrapingI>;
  selectedFile: string | null;
  setSelectedFile: (id: string | undefined) => void;
  setSelectedCollection: (scrape: any) => void;
}

export const CollectionDataSelector: React.FC<ScrapingDataSelectorProps> = ({
  collections,
  selectedFile,
  setSelectedFile,
  setSelectedCollection,
}) => {
  const { language } = useLanguage();
  const { t } = useTranslation(language);
  const isArabic = language === 'ar';

  const getSafeTypeLabel = (type: unknown): string => {
    const raw = String(type ?? '');
    if (!raw) return '';
    return raw
      .replace(/scraping/gi, 'capture session')
      .replace(/scraped/gi, 'captured')
      .replace(/scrape/gi, 'capture');
  };

  return (
    <Card className="mb-6 w-full rounded-tiqLg border border-tiq-border bg-gradient-to-br from-tiq-bg to-tiq-surface shadow-tiq">
      <CardContent className="py-4 px-4 sm:px-6 md:px-8">
        <ScrollArea className="h-[170px] sm:h-[200px] md:h-[220px] lg:h-[170px] w-full">
          {collections.length > 0 ? (
            <div className="space-y-2">
              {collections.map((file, index) => (
                <div
                  key={index}
                  className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 rounded-xl cursor-pointer transition-all border-2 ${
                    selectedFile === file?.id
                      ? 'bg-tiq-primary/10 border-tiq-primary shadow-tiq text-tiq-navy'
                      : 'bg-tiq-surface border-transparent hover:bg-tiq-primary/5 hover:border-tiq-border text-tiq-navy'
                  }`}
                  onClick={() => {
                    setSelectedFile(file?.id);
                    const collection = collections.find((scrape) => scrape.id === file?.id);
                    setSelectedCollection(collection || null);
                  }}
                >
                  <span className="font-semibold text-base truncate w-full sm:w-auto mb-2 sm:mb-0">
                    {file.name}{' '}
                    <span className="text-xs font-normal opacity-70">({getSafeTypeLabel(file.type)})</span>
                  </span>
                  <Badge
                    className={`${isArabic ? 'mr-0 sm:mr-2' : 'ml-0 sm:ml-2'} px-2 py-1 rounded-full text-xs font-bold ${
                      selectedFile === file?.id
                        ? 'bg-tiq-primary text-tiq-surface border border-tiq-primary'
                        : 'bg-tiq-primary/10 text-tiq-primary border border-tiq-border'
                    }`}
                  >
                    {file.totalLeads ?? 0} {t('lead.leads')}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-tiq-primary font-medium">
              {t('lead.no_files_for_date')}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}