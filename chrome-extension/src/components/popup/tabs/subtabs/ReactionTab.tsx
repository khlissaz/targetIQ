import { Card } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { useEffect, useRef, useState } from "react";
import ScrapeControls from "../../controls/ScrapeControls";
import { ScraperTable } from "../../tables/ScraperTable";

export default function ReactionTab({
  highlight,
  progressMessages,
  scrapingState,
  serverLimit,
  handleExportXLSX,
  handleSendToServer,
  handleStopScraping,
  handleRestartScraping,
}: any) {
  // Real-time LinkedIn reactions state
  const [linkedinReactions, setLinkedinReactions] = useState<any[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('linkedin_reactions');
    if (saved) setLinkedinReactions(JSON.parse(saved));
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem('linkedin_reactions', JSON.stringify(linkedinReactions));
  }, [linkedinReactions]);

  // Clear table handler
  const handleClearTable = () => {
    setLinkedinReactions([]);
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
        setLinkedinReactions(prev => [...prev, event.data.payload.data]);
        scrapingInProgress.current = true;
      }
      if (event.data.type === "SCRAPE_DONE" && event.data.payload?.type === "reactions") {
        setLinkedinReactions(event.data.payload.data || []);
        scrapingInProgress.current = false;
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

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
          <button
            onClick={handleClearTable}
            className="bg-gray-200 text-gray-700 rounded-lg px-4 py-2 font-semibold text-base border-none shadow-sm cursor-pointer"
            type="button"
          >
            {t('subtab.clearTable')}
          </button>
          {scrapingState === 'loading' && (
            <button disabled className="bg-targetiq-grey text-[#888] rounded-lg px-4 py-2 font-semibold text-base border-none opacity-70 flex items-center gap-2 cursor-not-allowed">
              <span className="loader" style={{ width: 18, height: 18, border: '3px solid #FF6B00', borderTop: '3px solid #e5e7eb', borderRadius: '50%', display: 'inline-block', animation: 'spin 1s linear infinite' }} />
              {t('subtab.loading')}
            </button>
          )}
          {scrapingState === 'scraping' && (
            <button onClick={handleStopScraping} className="bg-targetiq-grey text-targetiq-primary rounded-lg px-5 py-2 font-bold text-base border-none shadow-sm cursor-pointer transition-colors">
              {t('subtab.stop')}
            </button>
          )}
          {scrapingState === 'stopped' && (
            <button onClick={handleRestartScraping} className="bg-targetiq-navy text-white rounded-lg px-5 py-2 font-bold text-base border-none shadow-sm cursor-pointer transition-colors">
              {t('subtab.restart')}
            </button>
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
