import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { ScrapingI } from '@/lib/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/lib/i18n';

export interface ScrapingDataSelectorProps {
  scrapings: Array<ScrapingI>;
  selectedFile: string | null;
  setSelectedFile: (id: string | undefined) => void;
  setSelectedScrape: (scrape: any) => void;
}

export const ScrapingDataSelector: React.FC<ScrapingDataSelectorProps> = ({
  scrapings,
  selectedFile,
  setSelectedFile,
  setSelectedScrape,
}) => {
  const { language } = useLanguage();
  const { t } = useTranslation(language);

  return (
    <Card className="mb-6 rounded-2xl shadow-lg border-2 border-[#FFBA18] bg-gradient-to-br from-[#FFF7E6] to-[#FFF3D1] w-full">
      <CardContent className="py-4 px-4 sm:px-6 md:px-8">
        <ScrollArea className="h-[170px] sm:h-[200px] md:h-[220px] lg:h-[170px] w-full">
          {scrapings.length > 0 ? (
            <div className="space-y-2">
              {scrapings.map((file, index) => (
                <div
                  key={index}
                  className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 rounded-xl cursor-pointer transition-all border-2 ${
                    selectedFile === file?.id
                      ? 'bg-[#FFBA18] border-[#FF6B00] shadow-md text-[#1A2B3C]'
                      : 'bg-white border-transparent hover:bg-[#FFF0C2] hover:border-[#FFBA18] text-[#1A2B3C]'
                  }`}
                  style={{ boxShadow: selectedFile === file?.id ? '0 2px 12px 0 #FFBA1840' : undefined }}
                  onClick={() => {
                    setSelectedFile(file?.id);
                    const scrape = scrapings.find((scrape) => scrape.id === file?.id);
                    setSelectedScrape(scrape || null);
                  }}
                >
                  <span className="font-semibold text-base truncate w-full sm:w-auto mb-2 sm:mb-0">
                    {file.name} <span className="text-xs font-normal opacity-70">({file.type})</span>
                  </span>
                  <Badge
                    className={`ml-0 sm:ml-2 px-2 py-1 rounded-full text-xs font-bold ${
                      selectedFile === file?.id
                        ? 'bg-[#FF6B00] text-white border border-[#FFBA18]'
                        : 'bg-[#FFE6B0] text-[#FF6B00] border border-[#FFBA18]'
                    }`}
                  >
                    {file.totalLeads ?? 0} {t('lead.leads')}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-[#FF6B00] font-medium">
              {t('lead.no_files_for_date')}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}