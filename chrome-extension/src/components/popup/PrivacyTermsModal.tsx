import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';

const PRIVACY_POLICY = `
Your privacy is important to us. This extension collects and processes personal data (such as names, phone numbers, and profile links) only with your explicit consent. Data is used solely for lead management and is never sold to third parties. You have the right to export, delete, or anonymize your data at any time. For full details, see our Privacy Policy and Terms of Use.
`;

const TERMS_OF_USE = `
By using this extension, you agree to use it in compliance with all applicable laws, including GDPR and CASL. You must obtain consent from any individuals whose data you collect. Misuse of this extension may result in termination of your access.
`;

export default function PrivacyTermsModal({ onAccept }: { onAccept: () => void }) {
  const [show, setShow] = useState(true);
  const [accepted, setAccepted] = useState(false);

  if (!show) return null;

  return (
    <div style={{ position: 'fixed', zIndex: 9999, top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(30,40,60,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Card style={{ maxWidth: 480, padding: 32, borderRadius: 16, boxShadow: '0 4px 24px #0002', background: '#fff' }}>
        <h2 style={{ fontWeight: 700, fontSize: 22, marginBottom: 12 }}>Privacy Policy & Terms of Use</h2>
        <div style={{ fontSize: 15, color: '#222', marginBottom: 18, whiteSpace: 'pre-line' }}>{PRIVACY_POLICY}</div>
        <div style={{ fontSize: 15, color: '#222', marginBottom: 18, whiteSpace: 'pre-line' }}>{TERMS_OF_USE}</div>
        <label style={{ display: 'flex', alignItems: 'center', marginBottom: 18 }}>
          <input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} style={{ marginRight: 8 }} />
          I have read and accept the Privacy Policy and Terms of Use
        </label>
        <Button disabled={!accepted} onClick={() => { setShow(false); onAccept(); }} style={{ width: '100%', fontWeight: 700, fontSize: 16 }}>
          Accept & Continue
        </Button>
      </Card>
    </div>
  );
}
