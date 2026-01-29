import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';

export default function ConsentModal({ onAccept }: { onAccept: () => void }) {
  const [accepted, setAccepted] = useState(false);
  return (
    <div style={{ position: 'fixed', zIndex: 9999, top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(30,40,60,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Card style={{ maxWidth: 420, padding: 28, borderRadius: 16, boxShadow: '0 4px 24px #0002', background: '#fff' }}>
        <h2 style={{ fontWeight: 700, fontSize: 20, marginBottom: 10 }}>Consent Required</h2>
        <div style={{ fontSize: 15, color: '#222', marginBottom: 18 }}>
          To comply with privacy laws, you must provide explicit consent before any scraping or sending of personal data. You can revoke this consent at any time in the settings.
        </div>
        <label style={{ display: 'flex', alignItems: 'center', marginBottom: 18 }}>
          <input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} style={{ marginRight: 8 }} />
          I consent to the collection and processing of personal data for lead management purposes.
        </label>
        <Button disabled={!accepted} onClick={onAccept} style={{ width: '100%', fontWeight: 700, fontSize: 16 }}>
          Give Consent
        </Button>
      </Card>
    </div>
  );
}
