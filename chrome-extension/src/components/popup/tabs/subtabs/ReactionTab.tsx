import { Card } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { useEffect, useRef, useState } from "react";
import ScrapeControls from "../../controls/ScrapeControls";
import { ScraperTable } from "../../tables/ScraperTable";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

export default function ReactionTab({
  highlight,
  progressMessages,
  scrapingState,
  serverLimit,
  handleExportXLSX,
  handleSendToServer,
  handleStopScraping,
  handleRestartScraping,
  linkedinReactions,
  setLinkedinReactions,
}: any) {
  // Load from localStorage on mount if parent data is empty
  useEffect(() => {
    if (linkedinReactions && linkedinReactions.length > 0) return;
    const saved = localStorage.getItem('linkedin_reactions');
    if (saved) setLinkedinReactions(JSON.parse(saved));
  }, []);

  // Save to localStorage on change: merge with previous if not empty
  useEffect(() => {
    if (!linkedinReactions || linkedinReactions.length === 0) return;
    const previous = localStorage.getItem('linkedin_reactions');
    let prevArr: any[] = [];
    if (previous) {
      try { prevArr = JSON.parse(previous); } catch {}
    }
    // Merge: keep unique by timestamp+name
    const merged = [...prevArr];
    linkedinReactions.forEach((r: any) => {
      if (!merged.some((m: any) => m.timestamp === r.timestamp && m.name === r.name)) {
        merged.push(r);
      }
    });
    localStorage.setItem('linkedin_reactions', JSON.stringify(merged));
    
  }, [linkedinReactions]);

  // Clear table handler
  const handleClearTable = () => {
    if (setLinkedinReactions) setLinkedinReactions([]);
    localStorage.removeItem('linkedin_reactions');
  };
  const scrapingInProgress = useRef(false);
  const [feedback, setFeedback] = useState<string>("");
  const [sending, setSending] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Listen for scraped data from injected button via window.postMessage
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.source !== window || !event.data?.source) return;
      if (event.data.type === "SCRAPE_PROGRESS" && event.data.payload?.type === "reactions") {
        if (setLinkedinReactions) setLinkedinReactions((prev: any[]) => [...prev, event.data.payload.data]);
        scrapingInProgress.current = true;
      }
      if (event.data.type === "SCRAPE_DONE" && event.data.payload?.type === "reactions") {
        if (setLinkedinReactions) setLinkedinReactions(event.data.payload.data || []);
        scrapingInProgress.current = false;
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [linkedinReactions]);

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
    <Card className="targetiq-card mb-5 p-0 bg-[var(--targetiq-bg,#F4F6F8)] shadow-targetiq-card rounded-2xl">
      {/* Controls Row */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 mb-4 bg-[var(--targetiq-bg,#F4F6F8)] rounded-xl px-4 py-3 shadow-sm">
        <ScrapeControls
          dataLength={linkedinReactions.length}
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
        <div className="mb-2 flex items-center gap-2 text-targetiq-primary font-semibold text-base bg-[#fff7f0] rounded-lg px-3 py-1 shadow-sm w-fit">
          <span className="inline-block animate-spin" style={{ width: 18, height: 18 }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="9" cy="9" r="7" stroke="#FF6B00" strokeWidth="3" strokeDasharray="34" strokeDashoffset="10" opacity="0.3" />
              <path d="M16 9A7 7 0 1 1 9 2" stroke="#FF6B00" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </span>
          {localProgress}
        </div>
      )}
      {/* Feedback message for export/send actions */}
      {feedback && (
        <div className={feedback.includes('error') ? 'text-[#c00]' : 'text-targetiq-navy'} style={{ fontWeight: 600, marginBottom: 8, fontSize: 15 }}>{feedback}</div>
      )}
      {/* Real-time counter display */}
      <div className="flex items-center gap-4 mb-2 font-semibold text-base text-targetiq-primary bg-[#e0e7ef] rounded-lg px-3 py-1 shadow-sm w-fit">
        <span>{t('subtab.scraped')}: <span className="text-[#222]">{linkedinReactions.length}</span></span>
        <span className="text-[#888] font-normal">/</span>
        <span>{t('subtab.limit')}: <span className="text-[#222]">{serverLimit !== null ? serverLimit : <span className="text-[#aaa]">?</span>}</span></span>
      </div>
      {/* ScraperTable display */}
      <div className="overflow-auto w-full">
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        <ScraperTable
          entries={linkedinReactions.map((r: any) => ({
            name: r.name,
            profileUrl: r.picture,
            platform: 'LinkedIn',
            text: r.caption,
            timestamp: r.timestamp || Date.now(),
          }))}
          highlight={highlight}
          progressMessages={progressMessages}
        />
      </div>
    </Card>
  );
}
