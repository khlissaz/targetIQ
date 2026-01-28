
import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { ScraperTable, Entry } from "../../tables/ScraperTable";
import ScrapeControls from '../../controls/ScrapeControls';

export default function SearchPersonsTab({ t, serverLimit, handleExportXLSX, handleSendToServer, searchPersons, setSearchPersons }: any) {
  const [exporting, setExporting] = useState(false);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState("");

  // Listen for real-time person data
  useEffect(() => {
    if (!setSearchPersons) return;
    function handleMessage(event: MessageEvent) {
      if (event.source !== window || !event.data?.source) return;
      if (event.data.type === "SCRAPE_PROGRESS" && event.data.payload?.type === "search_persons") {
        setSearchPersons((prev: any[]) => [...prev, event.data.payload.data]);
      }
      if (event.data.type === "SCRAPE_DONE" && event.data.payload?.type === "search_persons") {
        setSearchPersons(event.data.payload.data || []);
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [setSearchPersons]);

  // Clear table handler
  const handleClearTable = () => {
    if (setSearchPersons) setSearchPersons([]);
    localStorage.removeItem('linkedin_search_persons');
  };

  // Enhanced handlers for export and send actions
  const handleExport = async () => {
    setExporting(true);
    setFeedback("");
    try {
      if (handleExportXLSX) await handleExportXLSX();
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
      if (handleSendToServer) await handleSendToServer();
      setFeedback(t('subtab.sendSuccess'));
    } catch (err) {
      setFeedback(t('subtab.sendError'));
    } finally {
      setSending(false);
    }
  };

  // Save to localStorage on change
  useEffect(() => {
    if (!setSearchPersons) return;
    if (searchPersons && searchPersons.length > 0) {
      localStorage.setItem('linkedin_search_persons', JSON.stringify(searchPersons));
    }
  }, [searchPersons, setSearchPersons]);

  // Load from localStorage on mount if parent data is empty
  useEffect(() => {
    if (!setSearchPersons) return;
    if (searchPersons && searchPersons.length > 0) return;
    const saved = localStorage.getItem('linkedin_search_persons');
    if (saved) setSearchPersons(JSON.parse(saved));
  }, [setSearchPersons]);

  return (
    <Card style={{ marginBottom: 20 }}>
      <h3 style={{ marginBottom: 12, color: 'var(--targetiq-primary, #FF6B00)', fontWeight: 700, fontSize: 'clamp(18px,2vw,22px)', fontFamily: 'inherit' }}>{t('subtab.searchPersons')}</h3>
      <div style={{fontSize:'clamp(15px,1.5vw,17px)',color:'var(--targetiq-navy, #1A2B3C)', lineHeight:1.7, background:'#fff', borderRadius:12, padding:'1vw 1.5vw', boxShadow:'0 1px 4px rgba(26,43,60,0.04)', marginTop:4}}>{t('subtab.searchPersonsContent')}</div>
      {/* Controls Row */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 mt-4 mb-4 bg-[var(--targetiq-bg,#F4F6F8)] rounded-xl px-4 py-3 shadow-sm">
        <ScrapeControls
          dataLength={searchPersons.length}
          onExport={handleExport}
          onSend={handleSend}
          exportLabel={exporting ? t('subtab.exporting') : t('subtab.exportXLSX')}
          sendLabel={sending ? t('subtab.sending') : t('subtab.sendToServer')}
        />
        <div className="flex gap-2">
          <button onClick={handleClearTable} className="bg-[#FF6B00] text-white px-3 py-1 rounded font-semibold text-sm">{t('subtab.clearTable') || 'Clear Table'}</button>
        </div>
      </div>
      {/* Feedback message for export/send actions */}
      {feedback && (
        <div className={feedback.includes('error') ? 'text-[#c00]' : 'text-targetiq-navy'} style={{ fontWeight: 600, marginBottom: 8, fontSize: 15 }}>{feedback}</div>
      )}
      {/* Real-time counter display */}
      <div className="flex items-center gap-4 mb-2 font-semibold text-base text-targetiq-primary bg-[#e0e7ef] rounded-lg px-3 py-1 shadow-sm w-fit">
        <span>{t('subtab.scraped')}: <span className="text-[#222]">{searchPersons.length}</span></span>
        <span className="text-[#888] font-normal">/</span>
        <span>{t('subtab.limit')}: <span className="text-[#222]">{serverLimit !== null && serverLimit !== undefined ? serverLimit : <span className="text-[#aaa]">?</span>}</span></span>
      </div>
      <div className="overflow-auto w-full max-h-[400px]">
        <ScraperTable
          entries={searchPersons.map((p: any) => ({
            name: p.name,
            phone: p.phone,
            profileUrl: p.picture,
            platform: 'LinkedIn',
            text: p.caption,
            timestamp: p.timestamp || Date.now(),
          }))}
        />
      </div>
    </Card>
  );
}
