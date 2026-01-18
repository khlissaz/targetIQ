import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Upload, Rocket } from 'lucide-react';
import React from 'react';

interface ScrapeControlsProps {
  dataLength: number;
  onExport: () => void;
  onSend: () => void;
  exportLabel: string;
  sendLabel: string;
}

const ScrapeControls: React.FC<ScrapeControlsProps> = ({
  dataLength,
  onExport,
  onSend,
  exportLabel,
  sendLabel,
}) => (
  <div className="flex gap-2 sm:gap-4 items-center">
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={onExport}
            variant={dataLength ? 'ghost' : 'outline'}
            disabled={!dataLength}
            title={exportLabel}
            aria-label={exportLabel}
            className="targetiq-btn flex items-center gap-2 px-3 py-2 text-base sm:text-lg font-bold rounded-xl shadow-md transition-all duration-200"
            style={{ minWidth: 44, fontWeight: 700, fontSize: 16 }}
          >
            <Upload  />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{exportLabel}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={onSend}
            variant={dataLength ? 'ghost' : 'outline'}
            disabled={!dataLength}
            title={sendLabel}
            aria-label={sendLabel}
            className="targetiq-btn flex items-center gap-2 px-3 py-2 text-base sm:text-lg font-bold rounded-xl shadow-md transition-all duration-200 bg-targetiq-navy text-white"
            style={{ minWidth: 44, fontWeight: 700, fontSize: 16 }}
          >
            <Rocket  />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{sendLabel}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </div>
);

export default ScrapeControls;
