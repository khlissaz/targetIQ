import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const IGNORE_DIRS = new Set([
  'node_modules',
  '.next',
  'dist',
  'build',
  'coverage',
  '.turbo',
  '.git',
]);

function walk(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (IGNORE_DIRS.has(entry.name)) continue;
      walk(path.join(dir, entry.name), files);
      continue;
    }

    if (!entry.isFile()) continue;
    if (!/\.(ts|tsx)$/.test(entry.name)) continue;
    files.push(path.join(dir, entry.name));
  }
  return files;
}

function extractKeysFromFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  // Strip block + line comments to reduce false positives.
  const src = raw
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
  const keys = [];

  // Matches t('some.key') / translate('some.key')
  const re = /\b(?:t|translate)\(\s*(['"`])([^'"`]+?)\1\s*[),]/g;
  let m;
  while ((m = re.exec(src))) {
    const key = m[2].trim();
    if (!key) continue;
    if (key.includes('${')) continue;
    keys.push(key);
  }

  return keys;
}

function loadJson(jsonPath) {
  return JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
}

function main() {
  const localeEnPath = path.join(projectRoot, 'lib', 'locales', 'en.json');
  const localeArPath = path.join(projectRoot, 'lib', 'locales', 'ar.json');

  const en = loadJson(localeEnPath);
  const ar = loadJson(localeArPath);

  const enKeys = new Set(Object.keys(en));
  const arKeys = new Set(Object.keys(ar));

  const tsFiles = walk(projectRoot);
  const usedKeys = new Set();
  for (const f of tsFiles) {
    for (const k of extractKeysFromFile(f)) usedKeys.add(k);
  }

  const missingInEn = [...usedKeys].filter((k) => !enKeys.has(k)).sort();
  const missingInAr = [...usedKeys].filter((k) => !arKeys.has(k)).sort();

  const enOnly = [...enKeys].filter((k) => !arKeys.has(k)).sort();
  const arOnly = [...arKeys].filter((k) => !enKeys.has(k)).sort();

  const problems = [];
  if (missingInEn.length) problems.push(`Missing in en.json: ${missingInEn.length}`);
  if (missingInAr.length) problems.push(`Missing in ar.json: ${missingInAr.length}`);
  if (enOnly.length || arOnly.length) problems.push(`Locale keysets differ (en-only: ${enOnly.length}, ar-only: ${arOnly.length})`);

  if (problems.length === 0) {
    console.log(`[i18n-check:web] OK (${usedKeys.size} keys used)`);
    process.exit(0);
  }

  console.error('[i18n-check:web] FAIL');
  for (const p of problems) console.error(`- ${p}`);

  if (missingInEn.length) {
    console.error('\nMissing in en.json:');
    for (const k of missingInEn) console.error(`  - ${k}`);
  }
  if (missingInAr.length) {
    console.error('\nMissing in ar.json:');
    for (const k of missingInAr) console.error(`  - ${k}`);
  }
  if (enOnly.length) {
    console.error('\nKeys only in en.json:');
    for (const k of enOnly) console.error(`  - ${k}`);
  }
  if (arOnly.length) {
    console.error('\nKeys only in ar.json:');
    for (const k of arOnly) console.error(`  - ${k}`);
  }

  process.exit(1);
}

main();
