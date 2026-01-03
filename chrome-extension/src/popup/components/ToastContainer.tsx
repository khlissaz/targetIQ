import React, { useEffect, useState } from 'react';

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
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`px-4 py-2 rounded shadow text-white ${
            t.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
