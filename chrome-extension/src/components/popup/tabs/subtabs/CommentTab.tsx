
import React, { useEffect, useRef, useState } from 'react';
import ScrapeControls from '../../controls/ScrapeControls';
import { ScraperTable } from '../../tables/ScraperTable';
import { useLanguage } from '../../../../contexts/LanguageContext';
import { Card } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '../../../../components/ui/tooltip';

export default function subtab({
  highlight,
  progressMessages,
  scrapingState,
  serverLimit,
  handleExportXLSX,
  handleSendToServer,
  handleStopScraping,
  handleRestartScraping,
  linkedinComments,
  setLinkedinComments,
}: any) {
  // Load from localStorage on mount if parent data is empty
  useEffect(() => {
    if (linkedinComments && linkedinComments.length > 0) return;
    const saved = localStorage.getItem('linkedin_comments');
    if (saved && setLinkedinComments) setLinkedinComments(JSON.parse(saved));
  }, []);

  // Save to localStorage on change: merge with previous if not empty
  useEffect(() => {
    if (linkedinComments && linkedinComments.length > 0) {
      const prev = localStorage.getItem('linkedin_comments');
      let prevArr: any[] = [];
      if (prev) {
        try { prevArr = JSON.parse(prev); } catch {}
      }
      // Merge: keep unique by timestamp+name
      const merged = [...prevArr];
      linkedinComments.forEach((c: any) => {
        if (!merged.some((m: any) => m.timestamp === c.timestamp && m.name === c.name)) {
          merged.push(c);
        }
      });
      localStorage.setItem('linkedin_comments', JSON.stringify(merged));
    }
  }, [linkedinComments]);

  // Clear table handler
  const handleClearTable = () => {
    if (setLinkedinComments) setLinkedinComments([]);
    localStorage.removeItem('linkedin_comments');
  };
  const scrapingInProgress = useRef(false);
  const [feedback, setFeedback] = useState<string>("");
  const [sending, setSending] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Listen for scraped data from injected button via window.postMessage
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.source !== window || !event.data?.source) return;
      if (event.data.type === "SCRAPE_PROGRESS" && event.data.payload?.type === "comments") {
        if (setLinkedinComments) setLinkedinComments((prev: any[]) => [...prev, event.data.payload.data]);
        scrapingInProgress.current = true;
      }
      if (event.data.type === "SCRAPE_DONE" && event.data.payload?.type === "comments") {
        if (setLinkedinComments) setLinkedinComments(event.data.payload.data || []);
        scrapingInProgress.current = false;
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [setLinkedinComments]);

  // Show progress message when scraping starts
  const { t } = useLanguage();
  const [localProgress, setLocalProgress] = useState<string>("");

  useEffect(() => {
    if (scrapingState === "scraping") {
      setLocalProgress(t('subtab.progressScraping'));
    } else if (scrapingState === "loading") {
      setLocalProgress(t('subtab.progressLoading'));
    } else if (scrapingState === "stopped") {
      setLocalProgress(t('subtab.progressStopped'));
    } else {
      setLocalProgress("");
    }
  }, [scrapingState, t]);

  // Enhanced handlers for export and send actions
  const handleExport = async () => {
    setExporting(true);
    setFeedback("");
    try {
      await handleExportXLSX();
      setFeedback(t('subtab.exportSuccess'));
    } catch (err) {
      setFeedback(t('subtab.exportError'));
    } finally {
      setExporting(false);
    }
  };

  const handleSend = async () => {
    setSending(true);
    setFeedback("");
    try {
      await handleSendToServer();
      setFeedback(t('subtab.sendSuccess'));
    } catch (err) {
      setFeedback(t('subtab.sendError'));
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="targetiq-card mb-5 p-0 bg-[var(--targetiq-bg,#F4F6F8)]">
      {/* Controls Row */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 mb-4 bg-[var(--targetiq-bg,#F4F6F8)] rounded-xl px-4 py-3 shadow-sm">
        <ScrapeControls
          dataLength={linkedinComments.length}
          onExport={handleExport}
          onSend={handleSend}
          exportLabel={exporting ? t('subtab.exporting') : t('subtab.exportXLSX')}
          sendLabel={sending ? t('subtab.sending') : t('subtab.sendToServer')}
        />
        <div className="flex gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="secondary"
                onClick={handleClearTable}
                className="font-semibold text-base px-4 py-2"
                type="button"
              >
                {t('subtab.clearTable')}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('subtab.clearTable')}</TooltipContent>
          </Tooltip>
          {scrapingState === 'loading' && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button disabled variant="ghost" className="font-semibold text-base px-4 py-2 opacity-70 flex items-center gap-2 cursor-not-allowed">
                  <span className="loader" style={{ width: 18, height: 18, border: '3px solid #FF6B00', borderTop: '3px solid #e5e7eb', borderRadius: '50%', display: 'inline-block', animation: 'spin 1s linear infinite' }} />
                  {t('subtab.loading')}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('subtab.loading')}</TooltipContent>
            </Tooltip>
          )}
          {scrapingState === 'scraping' && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={handleStopScraping} variant="secondary" className="font-bold text-base px-5 py-2">
                  {t('subtab.stop')}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('subtab.stop') + ' scraping'}</TooltipContent>
            </Tooltip>
          )}
          {scrapingState === 'stopped' && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={handleRestartScraping} variant="default" className="font-bold text-base px-5 py-2">
                  {t('subtab.restart')}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('subtab.restart') + ' scraping'}</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
      {/* Progress message display */}
      {localProgress && (
        <div className="text-targetiq-primary font-semibold mb-2 text-[15px]">{localProgress}</div>
      )}
      {/* Feedback message for export/send actions */}
      {feedback && (
        <div className={feedback.includes('error') ? 'text-[#c00]' : 'text-targetiq-navy'} style={{ fontWeight: 600, marginBottom: 8, fontSize: 15 }}>{feedback}</div>
      )}
      {/* Real-time counter display */}
      <div className="flex items-center gap-4 mb-2 font-semibold text-base text-targetiq-primary bg-[#e0e7ef] rounded-lg px-3 py-1 shadow-sm w-fit">
        <span>{t('subtab.scraped')}: <span className="text-[#222]">{linkedinComments.length}</span></span>
        <span className="text-[#888] font-normal">/</span>
        <span>{t('subtab.limit')}: <span className="text-[#222]">{serverLimit !== null ? serverLimit : <span className="text-[#aaa]">?</span>}</span></span>
      </div>
      {/* ScraperTable display */}
      <div className="overflow-auto w-full max-h-[400px]">
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        <ScraperTable
          entries={linkedinComments ? linkedinComments.map((c: any) => ({
            name: c.name,
            phone: c.phone,
            profileUrl: c.picture,
            platform: 'LinkedIn',
            text: c.text,
            timestamp: c.timestamp || Date.now(),
          })) : []}
          highlight={highlight}
          progressMessages={progressMessages}
        />
      </div>
    </Card>
  );
}
