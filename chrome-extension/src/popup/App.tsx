import React, { useEffect, useState, useRef } from 'react';
import SidebarPopup from './components/SidebarPopup';
import { ScraperTable } from './components/ScraperTable';
import { Controls } from './components/Controls';
import { ToastContainer, toast } from './components/ToastContainer';
import { useI18n } from './i18n';

export type Entry = {
  name: string;
  phone?: string;
  profileUrl?: string;
  platform: string;
  timestamp: number;
};

export default function App() {
  const { t } = useI18n();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlight, setHighlight] = useState<string | null>(null);
  const highlightTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'GET_ENTRIES' }, (res) => {
      if (res?.entries) setEntries(res.entries);
    });
    const listener = (msg: any) => {
      if (msg.type === 'ENTRY_ADDED' && msg.entry) {
        setEntries((prev) => [...prev, msg.entry]);
        setHighlight(msg.entry.platform + '|' + (msg.entry.phone || msg.entry.name));
        if (highlightTimeout.current) clearTimeout(highlightTimeout.current);
        highlightTimeout.current = setTimeout(() => setHighlight(null), 2000);
        toast.success(t('entryAdded'));
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, [t]);

  const startScraping = (platform: 'whatsapp' | 'linkedin') => {
    setLoading(true);
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(
          tabs[0].id,
          { type: platform === 'whatsapp' ? 'START_SCRAPING_WHATSAPP' : 'START_SCRAPING_LINKEDIN' },
          () => setLoading(false)
        );
      }
    });
  };

  const stopScraping = (platform: 'whatsapp' | 'linkedin') => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(
          tabs[0].id,
          { type: platform === 'whatsapp' ? 'STOP_SCRAPING_WHATSAPP' : 'STOP_SCRAPING_LINKEDIN' }
        );
      }
    });
  };

  const upload = (apiUrl: string) => {
    setLoading(true);
    chrome.runtime.sendMessage({ type: 'UPLOAD_ENTRIES', apiUrl }, (res) => {
      setLoading(false);
      if (res?.ok) toast.success(t('uploadSuccess'));
      else toast.error(res?.error || t('uploadError'));
    });
  };

  const clear = () => {
    chrome.runtime.sendMessage({ type: 'CLEAR_ENTRIES' }, () => setEntries([]));
  };

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-[#1A2B3C] flex flex-col p-4 w-[400px] relative">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1A2B3C]">AgentAI Scraper</h1>
        <Controls
          onStart={startScraping}
          onStop={stopScraping}
          onUpload={upload}
          onClear={clear}
          loading={loading}
        />
      </header>
      <ScraperTable entries={entries} highlight={highlight} />
      <SidebarPopup />
      <ToastContainer />
    </div>
  );
}
