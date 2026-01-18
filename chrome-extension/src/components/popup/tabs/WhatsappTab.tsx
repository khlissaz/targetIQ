import { useState, useEffect, useRef } from 'react';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Play, Pause, RefreshCcw, StopCircle, Upload, Send } from 'lucide-react';
import { Label } from '../../ui/label';
import { exportScrapedData, ScrapeOptions } from '../../../services/whatsapp/scrapeGroupMembers';
import { sendLeadToServer } from '../../../services/apiClient';



interface WhatsappTabProps {
  t: (key: string) => string;
}

export default function WhatsappTab({ t }: WhatsappTabProps) {
  const [maxItems, setMaxItems] = useState<number | undefined>(undefined);
  const [data, setData] = useState<any[]>([]);
  const [latestKey, setLatestKey] = useState<string | null>(null);
  const tableBodyRef = useRef<HTMLTableSectionElement>(null);
  const [status, setStatus] = useState<'idle'|'loading'|'running'|'paused'|'stopped'|'completed'>('idle');
  const [processedCount, setProcessedCount] = useState(0);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<{type: 'success'|'error', message: string}|null>(null);

  useEffect(() => {
    function handleScraperResult(event: MessageEvent) {
      if (event.source !== window) return;
      const msg = event.data;
      if (msg && msg.__whatsapp_scraper_result) {
        const contacts = Array.isArray(msg.__whatsapp_scraper_result)
          ? msg.__whatsapp_scraper_result
          : (msg.__whatsapp_scraper_result.contacts || []);
        const map = new Map();
        for (const item of contacts) {
          const k = item.key || item.phone || item.name;
          if (k) map.set(k, item);
        }
        setData(Array.from(map.values()));
        setStatus('completed');
        setToast({ type: 'success', message: t('scrape_done') });
      }
    }
    function handleMessage(event: MessageEvent) {
      if (event.source !== window) return;
      const msg = event.data;
      if (msg?.source !== 'scraper') return;
      if (msg.type === 'SCRAPE_PROGRESS') {
        setStatus('running');
        if (Array.isArray(msg.payload.data)) {
          setData(msg.payload.data);
          if (msg.payload.data.length > 0) {
            const last = msg.payload.data[msg.payload.data.length - 1];
            setLatestKey(last.key || last.phone || last.name || null);
          }
        } else {
          const newItem = msg.payload.data;
          setData(prev => {
            const key = newItem.key || newItem.phone || newItem.name;
            if (!key) return prev;
            // Deduplicate by key
            const map = new Map();
            for (const item of prev) {
              const k = item.key || item.phone || item.name;
              if (k) map.set(k, item);
            }
            map.set(key, newItem);
            const arr = Array.from(map.values());
            setProcessedCount(arr.length); // update processed count in real time
            return arr;
          });
          setLatestKey(newItem.key || newItem.phone || newItem.name || null);
        }
      }
      if (msg.type === 'SCRAPE_PROGRESS_COUNT') {
        setProcessedCount(msg.payload.processed ?? 0);
        if (msg.payload && msg.payload.paused) {
          setStatus('paused');
          setToast({ type: 'error', message: t('scrape_paused') });
        }
      }
      if (msg.type === 'SCRAPE_DONE') {
        setStatus(msg.payload && msg.payload.reason === 'stopped' ? 'stopped' : 'completed');
        setToast({ type: 'success', message: t('scrape_done') });
      }
    }
    window.addEventListener('message', handleMessage);
    window.addEventListener('message', handleScraperResult);
    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('message', handleScraperResult);
    };
  }, [t]);

  useEffect(() => {
    if (tableBodyRef.current) {
      tableBodyRef.current.scrollTop = tableBodyRef.current.scrollHeight;
    }
  }, [data]);

  const persist = (opts: any) => {
    try { localStorage.setItem('whatsapp_opts', JSON.stringify(opts)); } catch(e) { /* ignore */ }
  };

  const handleStart = () => {
    setStatus('loading');
    setData([]);
    setProcessedCount(0);
    const opts: ScrapeOptions = {  exportXlsx: false, maxItems };
    persist(opts);
    window.postMessage({ source: 'scraper-ui', type: 'SCRAPE_START', payload: { type: 'group_members', opts } }, '*');
  };

  const handlePause = () => {
    window.postMessage({ source: 'scraper-ui', type: 'SCRAPE_PAUSE', payload: { type: 'group_members' } }, '*');
  };

  const handleResume = () => {
    window.postMessage({ source: 'scraper-ui', type: 'SCRAPE_RESUME', payload: { type: 'group_members' } }, '*');
  };

  const handleStop = () => {
    window.postMessage({ source: 'scraper-ui', type: 'SCRAPE_STOP', payload: { type: 'group_members' } }, '*');
    setStatus('stopped');
  };

  const handleRestart = () => {
    handleStop();
    setTimeout(() => handleStart(), 300);
  };

  const handleExportXlsx = () => {
    if (!data.length) return;
    try {
      exportScrapedData(data);
      setToast({ type: 'success', message: t('exported_xlsx') });
    } catch (e) {
      setToast({ type: 'error', message: t('export_failed') });
    }
  };

  const sendToServer = async () => {
    setSending(true);
    try {
      for (const lead of data) {
        const payload = { source: "WHATSAPP", type: 'GROUP_MEMBERSHIP', leads: [lead] };
        await sendLeadToServer(payload);
      }
      setToast({ type: 'success', message: t('toast_sent') });
    } catch (err) {
      setToast({ type: 'error', message: t('toast_error') });
    } finally {
      setSending(false);
    }
  };

  return (
    <Card style={{ maxWidth: 700, marginLeft: 'auto', marginRight: 'auto', marginBottom: 20 }}>
      {toast && (
        <div
          className="targetiq-error"
          style={{
            marginBottom: 12,
            padding: '10px 16px',
            borderRadius: 10,
            fontSize: 16,
            fontWeight: 500,
            background: toast.type === 'success' ? '#e6fff5' : '#fff0f0',
            color: toast.type === 'success' ? '#059669' : '#c00',
            border: toast.type === 'success' ? '1.5px solid #05966922' : '1.5px solid #c002',
            boxShadow: '0 2px 8px #0001',
            letterSpacing: 0.1,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            minHeight: 36,
          }}
        >
          {toast.message}
        </div>
      )}
      <div className="targetiq-header" style={{ flexWrap: 'wrap', gap: 14, alignItems: 'center' }}>
        {(status === 'idle' || status === 'completed') ? (
          <Button style={{ minWidth: 90 }} onClick={handleStart}>
            <Play className="w-5 h-5 mr-1 inline-block text-targetiq-primary" /> {t('scrape_start')}
          </Button>
        ) : null}
        {status === 'running' && (
          <Button style={{ minWidth: 90, background: '#FFD600', color: '#1A2B3C' }} onClick={handlePause}>
            <Pause className="w-5 h-5 mr-1 inline-block text-yellow-600" /> {t('scrape_pause')}
          </Button>
        )}
        {status === 'paused' && (
          <Button style={{ minWidth: 90, background: '#059669' }} onClick={handleResume}>
            <Play className="w-5 h-5 mr-1 inline-block text-green-600" /> {t('scrape_resume')}
          </Button>
        )}
        {(status === 'running' || status === 'paused') && (
          <Button style={{ minWidth: 90, background: '#c00' }} onClick={handleStop}>
            <StopCircle className="w-5 h-5 mr-1 inline-block text-red-600" /> {t('scrape_stop')}
          </Button>
        )}
        {status === 'stopped' && (
          <Button style={{ minWidth: 90, background: '#1A2B3C' }} onClick={handleRestart}>
            <RefreshCcw className="w-5 h-5 mr-1 inline-block text-targetiq-navy" /> {t('scrape_restart')}
          </Button>
        )}
        <Button style={{ minWidth: 110, opacity: !data.length ? 0.5 : 1 }} onClick={handleExportXlsx} disabled={!data.length}>
          <Upload className="w-5 h-5 mr-1 inline-block text-targetiq-primary" /> {t('export_xlsx')}
        </Button>
        <Button style={{ minWidth: 110, opacity: !data.length || sending ? 0.5 : 1, background: '#1A2B3C' }} onClick={sendToServer} disabled={!data.length || sending}>
          <Send className="w-5 h-5 mr-1 inline-block text-targetiq-navy" /> {sending ? t('data_sending') : t('data_send')}
        </Button>
        <Label className="ml-2 targetiq-label" style={{ fontSize: 16, display: 'flex', alignItems: 'center', gap: 4 }}>
          <input type="number" placeholder={t('option_max')} value={maxItems ?? ''} onChange={(e)=>setMaxItems(e.target.value ? Number(e.target.value) : undefined)} style={{ width: 80, borderRadius: 6, border: '1px solid #e0e7ef', padding: '3px 8px', fontSize: 15 }} /> {t('option_max')}
        </Label>
        <span className="ml-2 targetiq-label" style={{ fontSize: 16 }}>{t('option_processed')}: <strong>{processedCount}</strong></span>
        <span className="ml-2 targetiq-label" style={{ fontSize: 16 }}>{t('option_status')}: <strong>{t('scrape_status_' + status)}</strong></span>
      </div>
      <div className="overflow-x-auto mt-2" style={{ marginTop: 18 }}>
        {data.length === 0 ? (
          <p className="text-sm text-gray-500 italic text-center mt-8 targetiq-label" style={{ fontSize: 16 }}>{t('no_data')}</p>
        ) : (
          <div style={{ maxHeight: 340, overflow: 'auto', borderRadius: 14, background: '#fff', fontFamily: 'inherit', border: '1.5px solid #F4F6F8', boxShadow: '0 2px 12px #1a2b3c0a', marginTop: 2 }}>
            <table className="min-w-full bg-white" style={{ fontFamily: 'inherit', fontSize: 16, borderRadius: 14, width: '100%' }}>
              <thead>
                <tr style={{ background: '#1A2B3C', color: '#fff', fontWeight: 700, fontSize: 17, letterSpacing: 0.2, borderTopLeftRadius: 14, borderTopRightRadius: 14 }}>
                  <th style={{ padding: 10, textAlign: 'center' }}>{t('whatsapp_id')}</th>
                  <th style={{ padding: 10, textAlign: 'center' }}>{t('whatsapp_group_name')}</th>
                  <th style={{ padding: 10, textAlign: 'center' }}>{t('whatsapp_name')}</th>
                  <th style={{ padding: 10, textAlign: 'center' }}>{t('whatsapp_phone')}</th>
                </tr>
              </thead>
              <tbody ref={tableBodyRef} style={{ maxHeight: 300, overflowY: 'auto' }}>
                {data.map((row, idx) => {
                  const groupName = row.group_name || '';
                  const contactName = row.name || '';
                  const phoneNumber = row.phone || '';
                  const rowKey = row.key || row.phone || row.name;
                  const isLatest = latestKey && rowKey === latestKey;
                  return (
                    <tr
                      key={idx}
                      style={{
                        background: isLatest ? 'rgba(255,107,0,0.13)' : idx % 2 === 0 ? '#F4F6F8' : '#fff',
                        transition: 'background 0.2s',
                        borderBottom: '1.5px solid #F4F6F8',
                        height: 50,
                        fontSize: 16,
                        textAlign: 'center',
                        fontWeight: isLatest ? 600 : 400,
                      }}
                    >
                      <td style={{ padding: 10 }}>{idx + 1}</td>
                      <td style={{ padding: 10, verticalAlign: 'middle', color: '#1A2B3C', fontWeight: 500 }}>{groupName || <span style={{ color: '#aaa', fontStyle: 'italic' }}>—</span>}</td>
                      <td style={{ padding: 10, verticalAlign: 'middle', color: '#1A2B3C', fontWeight: 500 }}>{contactName || <span style={{ color: '#aaa', fontStyle: 'italic' }}>—</span>}</td>
                      <td style={{ padding: 10, fontFamily: 'monospace', color: '#4f8cff', verticalAlign: 'middle', fontWeight: 500 }}>{phoneNumber || <span style={{ color: '#aaa', fontStyle: 'italic' }}>—</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>
  );
}
