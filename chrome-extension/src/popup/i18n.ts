import { useState } from 'react';
const translations: { [lang: string]: { [key: string]: string } } = {
  en: {
    start: 'Start',
    pause: 'Pause',
    stop: 'Stop',
    export: 'Export',
    upload: 'Upload',
    name: 'Name',
    platform: 'Platform',
    details: 'Details',
    entryAdded: 'Entry added',
    uploadSuccess: 'Upload successful',
    uploadError: 'Upload failed',
  },
  // Add more languages here
};
export function useI18n() {
  const [lang] = useState('en');
  return { t: (k: string) => translations[lang][k] || k };
}
