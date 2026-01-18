import React, { useState } from 'react';
import { Button } from '../ui/button';

export function Controls({
  onStart,
  onStop,
  onUpload,
  onClear,
  loading,
}: {
  onStart: (platform: 'whatsapp' | 'linkedin') => void;
  onStop: (platform: 'whatsapp' | 'linkedin') => void;
  onUpload: (apiUrl: string) => void;
  onClear: () => void;
  loading: boolean;
}) {
  const [apiUrl, setApiUrl] = useState('');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'end' }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <Button
          onClick={() => onStart('whatsapp')}
          disabled={loading}
          variant="default"
          size="sm"
          aria-label="Start WhatsApp"
        >
          Start WhatsApp
        </Button>
        <Button
          onClick={() => onStart('linkedin')}
          disabled={loading}
          variant="secondary"
          size="sm"
          aria-label="Start LinkedIn"
        >
          Start LinkedIn
        </Button>
        <Button
          onClick={() => onStop('whatsapp')}
          variant="outline"
          size="sm"
          aria-label="Stop WhatsApp"
        >
          Stop
        </Button>
        <Button
          onClick={onClear}
          variant="outline"
          size="sm"
          aria-label="Clear"
        >
          Clear
        </Button>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          type="text"
          style={{ border: '1px solid #E5E7EB', padding: '6px 10px', borderRadius: 8, fontSize: 14, minWidth: 120 }}
          placeholder="API URL"
          value={apiUrl}
          onChange={e => setApiUrl(e.target.value)}
        />
        <Button
          onClick={() => onUpload(apiUrl)}
          disabled={loading || !apiUrl}
          variant="default"
          size="sm"
          aria-label="Upload"
        >
          Upload
        </Button>
      </div>
    </div>
  );
}
