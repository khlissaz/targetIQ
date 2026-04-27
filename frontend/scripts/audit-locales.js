#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const en = JSON.parse(fs.readFileSync('lib/locales/en.json', 'utf8'));
const ar = JSON.parse(fs.readFileSync('lib/locales/ar.json', 'utf8'));

const files = [
  'app/landing/page.tsx',
  'app/(dashboard)/dashboard/[businessId]/page.tsx',
  'app/(dashboard)/dashboard/[businessId]/billing/page.tsx',
  'app/(dashboard)/dashboard/[businessId]/leads/page.tsx',
  'app/(dashboard)/dashboard/[businessId]/settings/page.tsx',
];

let allMissing = [];

files.forEach(f => {
  let content;
  try { content = fs.readFileSync(f, 'utf8'); } catch { return; }

  // Find t('key') || 'fallback' patterns — check key exists in both locales
  const re1 = /t\(['"]([^'"]+)['"]\)\s*\|\|\s*['"]([^'"]+)['"]/g;
  // Find t('key') with no fallback — these MUST have locale entry
  const re2 = /\bt\(['"]([^'"]+)['"]\)/g;

  const fallbacks = [...content.matchAll(re1)].map(m => ({ key: m[1], fallback: m[2], file: f }));
  const plain = [...content.matchAll(re2)].map(m => ({ key: m[1], fallback: null, file: f }));

  [...fallbacks, ...plain].forEach(({ key, fallback, file }) => {
    const enMiss = !en[key];
    const arMiss = !ar[key];
    if (enMiss || arMiss) {
      allMissing.push({ key, fallback, file, enMiss, arMiss });
    }
  });
});

if (allMissing.length === 0) {
  console.log('All locale keys are present in both EN and AR!');
} else {
  console.log(`Found ${allMissing.length} missing locale key references:\n`);
  const byFile = {};
  allMissing.forEach(item => {
    byFile[item.file] = byFile[item.file] || [];
    byFile[item.file].push(item);
  });
  Object.entries(byFile).forEach(([file, items]) => {
    console.log(`== ${file} ==`);
    const uniqKeys = [...new Set(items.map(i => i.key))];
    uniqKeys.forEach(key => {
      const item = items.find(i => i.key === key);
      const flags = (item.enMiss ? '[EN MISS]' : '') + (item.arMiss ? '[AR MISS]' : '');
      const fb = item.fallback ? ` => "${item.fallback}"` : '';
      console.log(`  ${flags} ${key}${fb}`);
    });
    console.log('');
  });
}
