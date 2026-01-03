import React, { useState } from 'react';

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
    <div className="flex flex-col gap-2 items-end">
      <div className="flex gap-2">
        <button
          className="bg-[#FF6B00] text-white px-3 py-1 rounded hover:bg-[#ff7d1a]"
          onClick={() => onStart('whatsapp')}
          disabled={loading}
        >
          Start WhatsApp
        </button>
        <button
          className="bg-[#1A2B3C] text-white px-3 py-1 rounded"
          onClick={() => onStart('linkedin')}
          disabled={loading}
        >
          Start LinkedIn
        </button>
        <button
          className="bg-gray-400 text-white px-3 py-1 rounded"
          onClick={() => onStop('whatsapp')}
        >
          Stop
        </button>
        <button
          className="bg-gray-400 text-white px-3 py-1 rounded"
          onClick={onClear}
        >
          Clear
        </button>
      </div>
      <div className="flex gap-2 items-center">
        <input
          type="text"
          className="border px-2 py-1 rounded text-xs"
          placeholder="API URL"
          value={apiUrl}
          onChange={e => setApiUrl(e.target.value)}
        />
        <button
          className="bg-[#FF6B00] text-white px-3 py-1 rounded hover:bg-[#ff7d1a]"
          onClick={() => onUpload(apiUrl)}
          disabled={loading || !apiUrl}
        >
          Upload
        </button>
      </div>
    </div>
  );
}
