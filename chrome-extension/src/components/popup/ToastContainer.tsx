
import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Card } from '../ui/card';

type Toast = { id: number; type: 'success' | 'error'; message: string };
let toastId = 0;
let addToast: ((toast: Toast) => void) | null = null;

export function toast() {}
toast.success = (message: string) => {
  addToast && addToast({ id: ++toastId, type: 'success', message });
};
toast.error = (message: string) => {
  addToast && addToast({ id: ++toastId, type: 'error', message });
};

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const { t } = useLanguage();
  useEffect(() => {
    addToast = (toast: Toast) => {
      setToasts((prev) => [...prev, toast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, 2500);
    };
    return () => {
      addToast = null;
    };
  }, []);
  return (
    <div style={{ position: 'fixed', bottom: 16, right: 16, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {toasts.map((t) => (
        <Card
          key={t.id}
          style={{
            padding: '12px 20px',
            borderRadius: 12,
            boxShadow: '0 2px 8px rgba(26,43,60,0.10)',
            color: '#fff',
            background: t.type === 'success' ? '#22c55e' : '#ef4444',
            fontWeight: 600,
            fontSize: 16,
            letterSpacing: 0.2,
            minWidth: 180,
            maxWidth: 320,
            fontFamily: 'inherit',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {t.type === 'success' ? <span style={{fontSize:20}}>✅</span> : <span style={{fontSize:20}}>❌</span>}
          <span>{t.message}</span>
        </Card>
      ))}
    </div>
  );
}
