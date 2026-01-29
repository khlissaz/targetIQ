import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';

export default function DataManagementModal({ onClose }: { onClose: () => void }) {
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [revoking, setRevoking] = useState(false);

  const handleExport = () => {
    setExporting(true);
    try {
      const allData = {};
      for (const key in localStorage) {
        if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
          allData[key] = localStorage.getItem(key);
        }
      }
      const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'targetiq-user-data.json';
      a.click();
      URL.revokeObjectURL(url);
      setMessage('Data exported successfully.');
    } catch (e) {
      setMessage('Failed to export data.');
    }
    setExporting(false);
  };

  const handleDelete = () => {
    setDeleting(true);
    try {
      localStorage.clear();
      setMessage('All local data deleted. Please refresh the extension.');
    } catch (e) {
      setMessage('Failed to delete data.');
    }
    setDeleting(false);
  };

  const handleRevokeConsent = () => {
    setRevoking(true);
    try {
      localStorage.removeItem('userConsent');
      localStorage.removeItem('privacyAccepted');
      localStorage.clear();
      setMessage('Consent revoked and all data deleted. The extension will reload.');
      setTimeout(() => { window.location.reload(); }, 1200);
    } catch (e) {
      setMessage('Failed to revoke consent.');
    }
    setRevoking(false);
  };

  return (
    <div style={{ position: 'fixed', zIndex: 9999, top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(30,40,60,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Card style={{ maxWidth: 420, padding: 28, borderRadius: 16, boxShadow: '0 4px 24px #0002', background: '#fff' }}>
        <h2 style={{ fontWeight: 700, fontSize: 20, marginBottom: 10 }}>Manage Your Data</h2>
        <div style={{ fontSize: 15, color: '#222', marginBottom: 18 }}>
          You can export all your stored data or delete/anonymize it at any time. This action affects only local data. For server data, please contact support.
        </div>
        <Button onClick={handleExport} disabled={exporting} style={{ width: '100%', fontWeight: 700, fontSize: 16, marginBottom: 12 }}>
          {exporting ? 'Exporting...' : 'Export My Data'}
        </Button>
        <Button onClick={handleDelete} disabled={deleting} style={{ width: '100%', fontWeight: 700, fontSize: 16, background: '#c00', color: '#fff', marginBottom: 12 }}>
          {deleting ? 'Deleting...' : 'Delete/Anonymize My Data'}
        </Button>
        <Button onClick={handleRevokeConsent} disabled={revoking} style={{ width: '100%', fontWeight: 700, fontSize: 16, background: '#FF6B00', color: '#fff', marginBottom: 12 }}>
          {revoking ? 'Revoking...' : 'Revoke Consent & Delete All Data'}
        </Button>
        {message && <div style={{ marginTop: 16, color: message.includes('fail') ? '#c00' : '#059669', fontWeight: 600 }}>{message}</div>}
        <Button onClick={onClose} style={{ width: '100%', marginTop: 18 }}>Close</Button>
      </Card>
    </div>
  );
}
