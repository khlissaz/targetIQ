import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface ContactInfo {
  group_name: string;
  name: string;
  phone: string | null;
}

export interface ScrapeOptions {
  exportXlsx?: boolean; // if true, export final scraped contacts as an XLSX file
  maxItems?: number; // optional limit to stop after N extracted contacts
  humanLike?: boolean; // if true, use randomized, human-like delays, scrolls and mouse events
}

// Small helper to post structured progress/status messages to the page UI
function postScraperMessage(type: string, payload: any) {
  try { window.postMessage({ source: 'scraper', type, payload }, '*'); } catch (e) { /* ignore */ }
}

// Centralized controller factory; ensures a consistent controller object exists on window
function getOrCreateController() {
  const w = window as any;
  if (!w.__whatsapp_scraper_controller) {
    w.__whatsapp_scraper_controller = {
      stopped: false as boolean,
      paused: false as boolean,
      running: false as boolean,
      stop() { this.stopped = true; this.running = false; },
      pause() { this.paused = true; },
      resume() { this.paused = false; },
      restart() { this.stopped = false; this.paused = false; },
      status() { return { stopped: this.stopped, paused: this.paused, running: this.running }; }
    };
  }
  return w.__whatsapp_scraper_controller;
}

// Send a compact progress payload (adds SCRAPE_PROGRESS and SCRAPE_PROGRESS_COUNT messages)
function sendProgress(added: number, contacts: ContactInfo[]) {
  try {
    if (added > 0) {
      // Send the full deduplicated contacts array for real-time UI updates
      postScraperMessage('SCRAPE_PROGRESS', {
        type: 'group_members',
        data: contacts.map(c => ({
          key: c.phone || c.name,
          group_name: c.group_name,
          name: c.name,
          phone: c.phone
        }))
      });
    }
  } catch (e) { /* ignore */ }
  try { postScraperMessage('SCRAPE_PROGRESS_COUNT', { processed: contacts.length }); } catch (e) { /* ignore */ }
}

/**
 * Scrolls through the WhatsApp group members popup and collects all members.
 * Works with virtualized lists: finds a scrollable ancestor, scrolls through it,
 * attempts to click the “Voir les anciens membres” button if present, and
 * deduplicates by normalized phone number (or name when phone absent).
 */
export async function scrapeGroupWhatsappMembersWithScroll(opts: ScrapeOptions = {}): Promise<ContactInfo[] | { contacts: ContactInfo[]; diagnostics: any }> {
  try { console.debug('[whatsapp-scraper] scrapeGroupWhatsappMembersWithScroll called with opts=', opts); } catch (e) {}
  const contacts: ContactInfo[] = [];
  const seen = new Set<string>(); // Track unique members by normalized phone or name

  const diagnostics: any = { scanned: 0, extracted: 0, skipped: { shortName: 0, audio: 0, invalidPhone: 0 }, samples: { extracted: [], skipped: [] } };

  // Get group name from the header (try a couple of selectors)
  const groupNameEl = document.querySelector('._alcd') || document.querySelector('[role="heading"]') || document.querySelector('header');
  const groupName = groupNameEl ? (groupNameEl.textContent || '').trim() : 'Unknown Group';

  // Find the modal container robustly by class (not text)
  const modal = document.querySelector('div[data-animate-modal-popup="true"]');
  // Fallback to old logic if not found
  const scrollableContainer = modal ? modal.querySelector('[role="listitem"]')?.parentElement : findScrollableContainer();

  // Try to click the "Show old members" button if present, regardless of language
  async function clickShowOldMembersButton() {
    // Use robust class-based selector, not text
    const btn = modal?.querySelector('button.xjb2p0i.xk390pu.x1heor9g.xjbqb8w.x972fbf.x10w94by.x1qhh985.x14e42zd.x1fmog5m.xu25z0z.x140muxe.xo1y3bh.xtnn1bt.x9v5kkp.xmw7ebm.xrdum7p.xexx8yu.xyri2b.x18d9i69.x1c1uobl.xh8yej3.x5yr21d');
    if (btn && !btn.disabled && btn.offsetParent !== null) {
      try {
        btn.click();
        await sleep(400); // Wait for the old members to load
        return true;
      } catch (e) { /* ignore */ }
    }
    return false;
  }

  // Always try to click the button before starting the scroll loop
  await clickShowOldMembersButton();

  // Try to parse expected total members from the header (if present)
  let expectedTotal: number | null = null;
  try {
    const headerText = (groupNameEl?.textContent || document.querySelector('header')?.textContent || '') as string;
    const m = headerText.match(/(\d{1,6})\s*(?:membre|membres|participant(?:s)?|member(?:s)?)/i);
    expectedTotal = m ? Number(m[1]) : null;
    if (expectedTotal) console.debug('[whatsapp-scraper] expectedTotal parsed', expectedTotal);
  } catch (e) { /* ignore */ }

  // Adaptive attempt limits. If we know the expected total, allow more passes.
  const maxAttempts = expectedTotal ? Math.max(600, Math.ceil(expectedTotal / 2)) : 600; // safety cap
  const delay = 150; // baseline ms between scrolls
  function isHumanLikeEnabled(options: ScrapeOptions): boolean {
    try {
      if (typeof options.humanLike !== 'undefined') return !!options.humanLike;
      const stored = (typeof localStorage !== 'undefined' && localStorage.getItem) ? localStorage.getItem('whatsapp.humanLike') : null;
      if (stored === 'false') return false;
    } catch (e) { /* ignore */ }
    // default: human-like enabled (mandated unless explicitly disabled)
    return true;
  }
  const useHuman = isHumanLikeEnabled(opts);
  const maybeDelay = async () => { if (useHuman) return humanDelay(100, 300); return sleep(delay); }
  let prevCount = -1;
  let stagnant = 0;

  try { (window as any).__whatsapp_exported_during_run = false; } catch(e) {}

  const controller = getOrCreateController();
  controller.stopped = false;
  controller.paused = false;
  controller.running = true;

  // Emit initial status to UI
  try { postScraperMessage('SCRAPE_PROGRESS_COUNT', { processed: 0 }); } catch (e) { /* ignore */ }

  for (let i = 0; i < maxAttempts; i++) {
    // Try to click the old members button again if it appears during scrolling
    await clickShowOldMembersButton();
    // allow stop/pause to take effect
    if (controller.stopped) {
      try { window.postMessage({ source: 'scraper', type: 'SCRAPE_DONE', payload: { type: 'group_members', reason: 'stopped', processed: contacts.length } }, '*'); } catch (e) {}
      break;
    }
    while (controller.paused) {
      // send heartbeat so UI stays aware of paused status
      try { window.postMessage({ source: 'scraper', type: 'SCRAPE_PROGRESS_COUNT', payload: { processed: contacts.length, paused: true } }, '*'); } catch (e) {}
      await sleep(250);
      if (controller.stopped) {
        try { window.postMessage({ source: 'scraper', type: 'SCRAPE_DONE', payload: { type: 'group_members', reason: 'stopped', processed: contacts.length } }, '*'); } catch (e) {}
        break;
      }
    }

    // Extract members visible in the DOM right now
    const before = contacts.length;
    // Real-time extraction: for each visible member, add and post immediately if new
    const memberElements = Array.from(scrollableContainer.querySelectorAll('[role="listitem"]')) as HTMLElement[];
    for (const item of memberElements) {
      const member = (item.querySelector('div[role="button"]') as HTMLElement) || item;
      const phones = extractPhonesFromMember(member);
      const name = extractNameFromMember(member, phones);
      // Filter out common placeholders (audio notes, empty/one-letter names)
      if (/^msg-audio|^msg-video|^voice note/i.test((name || '').toLowerCase())) {
        continue;
      }
      if (phones.length === 0 && (!name || name.length < 2)) {
        continue;
      }
      // Add all valid phones as separate contacts
      for (const phone of phones) {
        const key = phone;
        if (!seen.has(key)) {
          seen.add(key);
          const contact = { group_name: groupName, name: name || '', phone: phone, key };
          contacts.push(contact);
          // Real-time: post each contact as soon as scraped
          // This ensures the UI updates immediately for each new contact
          try { postScraperMessage('SCRAPE_PROGRESS', { data: contact }); } catch (e) { /* ignore */ }
        }
      }
      // If no phones, add by name (for non-phone contacts)
      if (phones.length === 0) {
        const normalizedNameKey = name ? name.toLowerCase().replace(/^[~\-\s]+/, '').trim() : '';
        const key = `name:${normalizedNameKey || 'unknown'}`;
        if (!seen.has(key)) {
          seen.add(key);
          const contact = { group_name: groupName, name: name || '', phone: null, key };
          contacts.push(contact);
          // Real-time: post each contact as soon as scraped
          // This ensures the UI updates immediately for each new contact
          try { postScraperMessage('SCRAPE_PROGRESS', { data: contact }); } catch (e) { /* ignore */ }
        }
      }
    }
    const added = contacts.length - before;
    diagnostics.scanned = document.querySelectorAll('[role="listitem"]')['length'];
    diagnostics.extracted = contacts.length;

    // Stop early if we've seen the expected total
    if (expectedTotal && contacts.length >= expectedTotal) {
      console.debug('[whatsapp-scraper] reached expected total, stopping');
      break;
    }

    // Send progress updates to UI
    try { sendProgress(added, contacts); } catch (e) { /* ignore */ }

    // If there is a "Voir les anciens membres" button, click it to load more
    try {
      const buttons = Array.from(scrollableContainer.querySelectorAll('button')) as HTMLButtonElement[];
      for (const b of buttons) {
        const txt = (b.textContent || '').trim();
        if (/ancien|ancienn|older|voir les anciens membres/i.test(txt) && !b.disabled) {
          b.click();
          await sleep(200);
        }
      }
    } catch (e) {
      // ignore
    }

    // Scroll by a viewport fraction; make it human-like when requested
    const old = scrollableContainer?.scrollTop;
    const viewport = (scrollableContainer as HTMLElement).clientHeight || 300;
    const frac = useHuman ? (0.6 + Math.random() * 0.35) : 0.9;
    const behavior = useHuman ? 'smooth' : 'auto';
    try {
      (scrollableContainer as HTMLElement).scrollBy({ top: viewport * frac, behavior: behavior as ScrollBehavior });
    } catch (e) {
      // fallback
      (scrollableContainer as HTMLElement).scrollTop = (old || 0) + viewport * frac;
    }

    await maybeDelay();


    // Stop if we've reached the end of scroll and no new members were added
    if (contacts.length === prevCount) {
      stagnant++;
    } else {
      stagnant = 0;
      prevCount = contacts.length;
    }

    // If scrollTop is unchanged for a while, assume end reached
    if (scrollableContainer.scrollTop === old) {
      stagnant++;
      // When the container isn't progressing, try additional fallbacks to trigger
      // virtualized list loaders: scroll the last visible item into view and
      // dispatch synthetic events (wheel / keyboard) to simulate user actions.
      if (stagnant >= 2) {
        try {
          const items = Array.from(scrollableContainer.querySelectorAll('[role="listitem"]')) as HTMLElement[];
          const last = items[items.length - 1];
          if (last && typeof last.scrollIntoView === 'function') {
            try {
              last.scrollIntoView({ block: 'end', behavior: useHuman ? 'smooth' : 'auto' });
              if (useHuman) await simulateMouseMoves(last, randInt(3, 7));
              await maybeDelay();
            } catch (e) { /* ignore */ }
          }
        } catch (e) { /* ignore */ }
        // Try several small wheel events with varying deltas (human-like jitter)
        try {
          const clientH = scrollableContainer?.clientHeight || 300;
          const deltas = useHuman ? [clientH * (0.18 + Math.random() * 0.07), clientH * (0.35 + Math.random() * 0.12), clientH * (0.7 + Math.random() * 0.2)] : [Math.floor(clientH * 0.25), Math.floor(clientH * 0.5), Math.floor(clientH * 0.9)];
          for (const rawd of deltas) {
            const d = Math.floor(rawd);
            try {
              const wheel = new WheelEvent('wheel', { deltaY: d, bubbles: true, cancelable: true });
              scrollableContainer?.dispatchEvent(wheel);
              await sleep(useHuman ? randInt(50, 140) : 80);
            } catch (e) { /* ignore */ }
          }
        } catch (e) { /* ignore */ }
        // Keyboard fallback (PageDown) to move virtual scroller
        try {
          try { (scrollableContainer as HTMLElement).focus?.(); } catch (e) {}
          const kd = new KeyboardEvent('keydown', { key: 'PageDown', keyCode: 34, bubbles: true });
          scrollableContainer?.dispatchEvent(kd);
          await sleep(useHuman ? randInt(100, 220) : 120);
        } catch (e) { /* ignore */ }
        // As a stronger fallback, try jumping to the bottom of the container
        try {
          scrollableContainer.scrollTop = scrollableContainer.scrollHeight;
          await maybeDelay();
        } catch (e) { /* ignore */ }
        console.debug('[whatsapp-scraper] fallback scroll attempted (scrollIntoView + wheel(s) + PageDown + scrollToBottom)');
      }
    }
    // If stagnant for many passes, break
    if (stagnant >= 10) break;
  // Aggressively scroll to the bottom multiple times and extract after each scroll
  try {
    for (let i = 0; i < 8; i++) {
      scrollableContainer.scrollTop = scrollableContainer.scrollHeight;
      await sleep(500);
      extractVisibleMembers(groupName, seen, contacts);
      // Debug: log number of visible listitems
      const items = document.querySelectorAll('[role="listitem"]');
      console.debug(`[whatsapp-scraper] After forced scroll #${i+1}, found ${items.length} visible members, total unique: ${contacts.length}`);
    }
    // Final extraction after all scrolling
    extractVisibleMembers(groupName, seen, contacts);
    const finalItems = document.querySelectorAll('[role="listitem"]');
    console.debug(`[whatsapp-scraper] Final extraction, found ${finalItems.length} visible members, total unique: ${contacts.length}`);
  } catch (e) { /* ignore */ }

    // Respect maxItems option
    if (opts.maxItems && contacts.length >= opts.maxItems) break;
  }

  // If we parsed an expected total but didn't reach it, do an aggressive final pass
  if (expectedTotal && contacts.length < expectedTotal) {
    try {
      console.debug('[whatsapp-scraper] performing aggressive final pass to coax virtual scroller');
      for (let pass = 0; pass < 40 && contacts.length < expectedTotal; pass++) {
        const items = Array.from(scrollableContainer.querySelectorAll('[role="listitem"]')) as HTMLElement[];
        if (items.length) {
          // Scroll the last few visible items into view to force rendering
          for (let j = items.length - 1; j >= Math.max(0, items.length - 6); j--) {
            try { items[j].scrollIntoView({ block: 'end', behavior: 'auto' }); await sleep(70); } catch (e) { /* ignore */ }
          }
        }
        try { scrollableContainer.scrollTop = scrollableContainer.scrollHeight; } catch (e) { /* ignore */ }
        try { scrollableContainer.dispatchEvent(new WheelEvent('wheel', { deltaY: (scrollableContainer.clientHeight||300)*0.75, bubbles: true })); } catch (e) { /* ignore */ }
        await sleep(200);
        extractVisibleMembers(groupName, seen, contacts);
      }
    } catch (e) {
      // ignore
    }
  }
  console.log(`Scraped ${contacts.length} unique group members from "${groupName}"`);

  // Mark controller as finished and notify UI
  try {
    const ctrl = getOrCreateController();
    if (ctrl) { ctrl.running = false; }
    postScraperMessage('SCRAPE_DONE', { type: 'group_members', reason: 'completed', processed: contacts.length });
  } catch (e) { /* ignore */ }

  // Filter to only phones if requested
  const filtered = contacts.filter(c => !!c.phone);

  return filtered;
}

// Small helpers
function sleep(ms: number) { return new Promise(resolve => setTimeout(resolve, ms)); }

function randInt(min: number, max: number) { return Math.floor(min + Math.random() * (max - min + 1)); }

/** Human-like randomized delay */
async function humanDelay(min = 80, max = 300) {
  const t = randInt(min, max);
  // small jitter
  await sleep(t + randInt(0, 40));
}

/** Simulate lightweight mouse movement over an element */
async function simulateMouseMoves(el: HTMLElement, steps = 6) {
  if (!el || typeof el.getBoundingClientRect !== 'function') return;
  try {
    const r = el.getBoundingClientRect();
    for (let i = 0; i < steps; i++) {
      const x = Math.floor(r.left + 8 + Math.random() * Math.max(1, r.width - 16));
      const y = Math.floor(r.top + 8 + Math.random() * Math.max(1, r.height - 16));
      try { el.dispatchEvent(new MouseEvent('mousemove', { clientX: x, clientY: y, bubbles: true })); } catch (e) { /* ignore */ }
      await sleep(randInt(20, 80));
    }
  } catch (e) { /* ignore */ }
}

function normalizePhone(phone: string | null): string | null {
  if (!phone) return null;
  return phone.replace(/[^\d\+]/g, '').replace(/^(00)/, '+').replace(/\s+/g, '');
}

/** Escape string for safe use in RegExp constructors */
function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function findScrollableContainer(): HTMLElement | null {
  // Find a listitem then walk up to find a scrollable container
  const anyItem = document.querySelector('[role="listitem"]');
  if (!anyItem) return null;

  // Prefer nearest ancestor that contains many listitems
  let candidate = anyItem.parentElement;
  for (let i = 0; i < 6 && candidate; i++) {
    const items = candidate.querySelectorAll('[role="listitem"]');
    if (items.length > 8) break;
    candidate = candidate.parentElement;
  }

  // Walk up from candidate to find overflow:auto/scroll or large inline height
  let el = candidate || anyItem.parentElement;
  while (el) {
    try {
      const cs = window.getComputedStyle(el);
      const overflowY = cs.overflowY || '';
      if ((overflowY === 'auto' || overflowY === 'scroll') && el.scrollHeight > el.clientHeight + 20) return el as HTMLElement;
      const style = el.getAttribute('style') || '';
      const hMatch = style.match(/height:\s*(\d+)px/);
      if (hMatch && Number(hMatch[1]) > 800) return el as HTMLElement;
    } catch (e) {
      // ignore
    }
    el = el.parentElement;
  }

  // fallback to document scrolling element
  return document.scrollingElement as HTMLElement | null;
}

function extractPhonesFromMember(member: HTMLElement): string[] {
  const foundPhones = new Set<string>();
  // 1. span[title] (check both title and textContent)
  const spanTitleEls = Array.from(member.querySelectorAll('span[title]')) as HTMLElement[];
  for (const s of spanTitleEls) {
    const titleVal = s.getAttribute('title') || '';
    const textVal = s.textContent || '';
    if (/\d{7,}/.test(titleVal)) foundPhones.add(normalizePhone(titleVal) || '');
    if (/\d{7,}/.test(textVal)) foundPhones.add(normalizePhone(textVal) || '');
  }
  // 2. span textContent (all spans)
  const allSpans = Array.from(member.querySelectorAll('span')) as HTMLElement[];
  for (const s of allSpans) {
    const textVal = s.textContent || '';
    if (/\d{7,}/.test(textVal.replace(/\s/g, ''))) foundPhones.add(normalizePhone(textVal) || '');
  }
  // 3. [aria-colindex="1"] or [role="gridcell"]
  const gridCells = Array.from(member.querySelectorAll('[aria-colindex="1"], [role="gridcell"]')) as HTMLElement[];
  for (const cell of gridCells) {
    const cellSpans = Array.from(cell.querySelectorAll('span')) as HTMLElement[];
    for (const s of cellSpans) {
      const textVal = s.textContent || '';
      if (/\d{7,}/.test(textVal.replace(/\s/g, ''))) foundPhones.add(normalizePhone(textVal) || '');
    }
    const cellText = cell.textContent || '';
    if (/\d{7,}/.test(cellText.replace(/\s/g, ''))) foundPhones.add(normalizePhone(cellText) || '');
  }
  // 4. All descendant text nodes
  const walker = document.createTreeWalker(member, NodeFilter.SHOW_TEXT, null);
  let node: Node | null = walker.nextNode();
  while (node) {
    const txt = (node.textContent || '').replace(/\s/g, '');
    if (/\d{7,}/.test(txt)) foundPhones.add(normalizePhone(node.textContent || '') || '');
    node = walker.nextNode();
  }
  // Remove empty and short/invalid numbers
  return Array.from(foundPhones).filter(p => p && p.replace(/[^\d]/g, '').length >= 7);
}


function extractNameFromMember(member: HTMLElement, phones: string[]): string {
  const nameNode = member.querySelector('.copyable-text, [data-testid="selectable-text"], [aria-colindex="2"], [role="gridcell"]') as HTMLElement | null;
  let name = nameNode ? normalizeName(nameNode.textContent || '') : '';
  if (!name) {
    // Fallback: try to find a text node that isn't a phone number
    const walker = document.createTreeWalker(member, NodeFilter.SHOW_TEXT, null);
    let node: Node | null = walker.nextNode();
    while (node) {
      const txt = (node.textContent || '').trim();
      if (txt && !phones.some(p => txt.includes(p)) && txt.length > 1 && /[a-zA-Z\u0600-\u06FF]/.test(txt)) {
        name = normalizeName(txt);
        break;
      }
      node = walker.nextNode();
    }
  }
  return name;
}

function normalizeName(name: string | null): string {
  if (!name) return '';
  // Remove extra whitespace, invisible chars, emojis, and trim
  return name.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s+/g, ' ').replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').trim();
}

function extractVisibleMembers(groupName: string, seen: Set<string>, contacts: ContactInfo[]): ContactInfo[] {
  const memberElements = Array.from(document.querySelectorAll('[role="listitem"]')) as HTMLElement[];
  let skipped = { shortName: 0, audio: 0, noContainer: 0, invalidPhone: 0 };

  function normalizeName(name: string | null): string {
    if (!name) return '';
    return name.replace(/^[~\s\-\u200E\u200F]+/, '').replace(/\s+/g, ' ').trim();
  }

  for (const item of memberElements) {
    const member = (item.querySelector('div[role="button"]') as HTMLElement) || item;
    const phones = extractPhonesFromMember(member);
    const name = extractNameFromMember(member, phones);

    // Filter out common placeholders (audio notes, empty/one-letter names)
    if (/^msg-audio|^msg-video|^voice note/i.test((name || '').toLowerCase())) {
      skipped.audio++;
      continue;
    }

    if (phones.length === 0 && (!name || name.length < 2)) {
      skipped.shortName++;
      continue;
    }

    // Add all valid phones as separate contacts
    for (const phone of phones) {
      const key = phone;
      if (!seen.has(key)) {
        seen.add(key);
        contacts.push({ group_name: groupName, name: name || '', phone: phone });
      }
    }
    // If no phones, add by name (for non-phone contacts)
    if (phones.length === 0) {
      const normalizedNameKey = name ? name.toLowerCase().replace(/^[~\-\s]+/, '').trim() : '';
      const key = `name:${normalizedNameKey || 'unknown'}`;
      if (!seen.has(key)) {
        seen.add(key);
        contacts.push({ group_name: groupName, name: name || '', phone: null });
      }
    }
  }
  console.debug(`WhatsApp scraper: scanned ${memberElements.length} items, extracted ${contacts.length}, skipped:`, skipped);
  return contacts;
}

export function exportScrapedData(data: any[]) {
    try { console.debug('[whatsapp-scraper] exportScrapedData invoked with', (data||[]).length, 'rows'); } catch (e) { /* ignore */ }

    const header = ['group_name', 'name', 'phone'];
    const rows = [header].concat((data||[]).map((r:any) => [r.group_name || '', r.name || '', r.phone || '']));
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'WhatsApp Members');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });

    const meta = { filename: 'whatsapp_members.xlsx', size: blob.size, rows: (data||[]).length };
    try { (window as any).__whatsapp_last_export = meta; console.debug('[whatsapp-scraper] set __whatsapp_last_export'); } catch (e) { /* ignore */ }
    try { document.dispatchEvent(new CustomEvent('whatsapp_export', { detail: meta, bubbles: true, composed: true })); console.debug('[whatsapp-scraper] dispatched whatsapp_export CustomEvent'); } catch (e) { /* ignore */ }
    try { window.postMessage({ __whatsapp_export: meta }, '*'); console.debug('[whatsapp-scraper] posted __whatsapp_export via window.postMessage'); } catch (e) { /* ignore */ }
    try { document.documentElement.setAttribute('data-whatsapp-last-export', JSON.stringify(meta)); setTimeout(()=>{ try{ document.documentElement.removeAttribute('data-whatsapp-last-export'); }catch(e){} }, 3000); console.debug('[whatsapp-scraper] set data-whatsapp-last-export attribute'); } catch (e) { /* ignore */ }

    try { saveAs(blob, 'whatsapp_members.xlsx'); } catch (e) { console.warn('[whatsapp-scraper] saveAs failed in exportScrapedData', e); throw e; }
}

function exportDiagnostics(payload: { contacts: ContactInfo[]; diagnostics: any }) {
  try {
    // create a concise CSV containing counts and samples for quick inspection
    const rows: string[] = [];
    rows.push('scanned,' + (payload.diagnostics.scanned || ''));
    rows.push('extracted,' + (payload.diagnostics.extracted || ''));
    rows.push('skipped_shortName,' + (payload.diagnostics.skipped?.shortName || 0));
    rows.push('skipped_audio,' + (payload.diagnostics.skipped?.audio || 0));
    rows.push('skipped_invalidPhone,' + (payload.diagnostics.skipped?.invalidPhone || 0));
    rows.push('');
    rows.push('EXTRACTED_SAMPLE_NAME,EXTRACTED_SAMPLE_PHONE');
    (payload.diagnostics.samples.extracted || []).slice(0, 50).forEach((c: any) => {
      rows.push(`"${(c.name||'').replace(/"/g,'""')}","${(c.phone||'').replace(/"/g,'""')}"`);
    });
    rows.push('');
    rows.push('SKIPPED_SAMPLE_NAME,SKIPPED_SAMPLE_PHONE');
    (payload.diagnostics.samples.skipped || []).slice(0, 50).forEach((s: any) => {
      rows.push(`"${(s.name||'').replace(/"/g,'""')}","${(s.phone||'').replace(/"/g,'""')}"`);
    });

    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'whatsapp_members_diagnostics.csv'; a.click();
    URL.revokeObjectURL(url);
  } catch (e) {
    console.warn('Failed to export diagnostics', e);
  }
}

// Expose functions on window for E2E tests to call directly
if (typeof window !== 'undefined') {
  (window as any).__whatsappScraper = {
    scrapeGroupWhatsappMembersWithScroll,
    // controller helpers
    stop: () => { try { (window as any).__whatsapp_scraper_controller?.stop?.(); } catch (e) {} },
    pause: () => { try { (window as any).__whatsapp_scraper_controller?.pause?.(); } catch (e) {} },
    resume: () => { try { (window as any).__whatsapp_scraper_controller?.resume?.(); } catch (e) {} },
    status: () => { try { return (window as any).__whatsapp_scraper_controller?.status?.() || null; } catch (e) { return null; } }
  };
  try { console.debug('[whatsapp-scraper] bridge installed on window'); } catch (e) {}

  // Also install a page-context bridge so page scripts (and tests) can call into
  // the content-script scraper via postMessage (avoids isolated-world issues).
  window.addEventListener('message', async (ev) => {
    try {
      const d = ev.data || {};

      // UI-driven scraper control messages
      if (d && d.source === 'scraper-ui') {
        try {
          const ctrl = (window as any).__whatsapp_scraper_controller;
          switch (d.type) {
            case 'SCRAPE_START': {
              const opts = (d.payload && d.payload.opts) || {};
              if (ctrl && ctrl.running) {
                // already running — reply with current status
                try { window.postMessage({ source: 'scraper', type: 'SCRAPE_PROGRESS_COUNT', payload: { processed: 0, running: true } }, '*'); } catch (e) {}
                break;
              }
              // run asynchronously and return results via existing result messages
              (async () => {
                try {
                  // reset controller state and mark running
                  if (ctrl) { ctrl.stopped = false; ctrl.paused = false; ctrl.running = true; }
                  try { window.postMessage({ source: 'scraper', type: 'SCRAPE_PROGRESS_COUNT', payload: { processed: 0 } }, '*'); } catch (e) {}
                  const res = await scrapeGroupWhatsappMembersWithScroll(opts);
                  // results are posted by the run handler via __whatsapp_scraper_result already when invoked by run(); but ensure posts here for UI flows
                  if (Array.isArray(res)) {
                    window.postMessage({ __whatsapp_scraper_result: { contacts: res, diagnostics: null, exported: (window as any).__whatsapp_last_export || null } }, '*');
                  } else {
                    window.postMessage({ __whatsapp_scraper_result: Object.assign({}, res, { exported: (window as any).__whatsapp_last_export || null }) }, '*');
                  }
                } catch (err: any) {
                  window.postMessage({ __whatsapp_scraper_error: String(err) }, '*');
                }
              })();
              break;
            }
            case 'SCRAPE_PAUSE': {
              if (ctrl) ctrl.pause();
              try { window.postMessage({ source: 'scraper', type: 'SCRAPE_PROGRESS_COUNT', payload: { processed: 0, paused: true } }, '*'); } catch (e) {}
              break;
            }
            case 'SCRAPE_RESUME': {
              if (ctrl) ctrl.resume();
              try { window.postMessage({ source: 'scraper', type: 'SCRAPE_PROGRESS_COUNT', payload: { processed: 0, paused: false } }, '*'); } catch (e) {}
              break;
            }
            case 'SCRAPE_STOP': {
              if (ctrl) ctrl.stop();
              try { window.postMessage({ source: 'scraper', type: 'SCRAPE_DONE', payload: { type: 'group_members', reason: 'stopped', processed: (window as any).__last_processed || 0 } }, '*'); } catch (e) {}
              break;
            }
            case 'SCRAPE_RESTART': {
              if (ctrl) { ctrl.stop(); }
              // small delay and then start
              setTimeout(() => window.postMessage({ source: 'scraper-ui', type: 'SCRAPE_START', payload: d.payload || {} }, '*'), 200);
              break;
            }
            default:
              break;
          }
        } catch (e) { /* ignore */ }
      }

      if (d && d.__whatsapp_scraper_action === 'run') {
        try {
          const opts = d.options || {};
          const res = await scrapeGroupWhatsappMembersWithScroll(opts);
          // if an export occurred during the run, immediately post it to the page so tests can detect it deterministically
          try {
            const exported = (window as any).__whatsapp_last_export || null;
            if (exported) {
              try { window.postMessage({ __whatsapp_export: exported }, '*'); } catch (e) { /* ignore */ }
            }
          } catch (e) { /* ignore */ }

          // always return object form for clarity and include exported meta when available
          if (Array.isArray(res)) {
            window.postMessage({ __whatsapp_scraper_result: { contacts: res, diagnostics: null, exported: (window as any).__whatsapp_last_export || null } }, '*');
          } else {
            window.postMessage({ __whatsapp_scraper_result: Object.assign({}, res, { exported: (window as any).__whatsapp_last_export || null }) }, '*');
          }
        } catch (err: any) {
          window.postMessage({ __whatsapp_scraper_error: String(err) }, '*');
        }
      }

      // Allow page to query pending diagnostics via bridge (so tests don't need chrome.storage access)
      if (d && d.__whatsapp_scraper_action === 'get_pending_diagnostics') {
        try {
          const chromeAny = (window as any).chrome;
          chromeAny?.storage?.local?.get?.(['pendingDiagnostics'], (res: any) => {
            const existing = (res && res.pendingDiagnostics) ? res.pendingDiagnostics : [];
            window.postMessage({ __whatsapp_scraper_result: { pendingDiagnostics: existing } }, '*');
          });
        } catch (err) {
          window.postMessage({ __whatsapp_scraper_error: String(err) }, '*');
        }
      }

      if (d && d.__whatsapp_scraper_action === 'set_pending_diagnostics') {
        try {
          const toSet = d.pendingDiagnostics || [];
          const chromeAny = (window as any).chrome;
          chromeAny?.storage?.local?.set?.({ pendingDiagnostics: toSet }, () => {
            window.postMessage({ __whatsapp_scraper_result: { ok: true } }, '*');
          });
        } catch (err) {
          window.postMessage({ __whatsapp_scraper_error: String(err) }, '*');
        }
      }
    } catch (err) {
      // ignore
    }
  });

  // Inject the helper as an external page script so CSP doesn't block inline execution
  try {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
      const src = chrome.runtime.getURL('injected-whatsapp-bridge.js');
      const s = document.createElement('script');
      s.src = src;
      s.onload = () => s.parentElement?.removeChild(s);
      (document.head || document.documentElement || document.body || document).appendChild(s);
    } else {
      // If runtime URL isn't available, fall back to postMessage-only bridge (already installed above)
    }
  } catch (e) {
    // ignore injection errors
  }
}

  // Robust WhatsApp Web group member scraper
  export async function scrapeAllGroupMembers(): Promise<{ groupName: string, members: { name: string, phone: string|null }[] }> {
    // Find the modal popup
    const modal = document.querySelector('div[data-animate-modal-popup="true"]');
    if (!modal) throw new Error('Group members modal not found');

    // Find the scrollable container inside the modal
    let scrollable = modal.querySelector('[role="listitem"]')?.parentElement;
    if (!scrollable) {
      const items = modal.querySelectorAll('[role="listitem"]');
      if (items.length) scrollable = items[0].parentElement;
    }
    if (!scrollable) throw new Error('Scrollable container not found');

    // Get group name
    const groupNameEl = modal.querySelector('[role="heading"], header, ._alcd');
    const groupName = groupNameEl ? (groupNameEl.textContent || '').trim() : 'Unknown Group';

    // Helper to extract name/phone from a listitem
    function extractMember(el: Element): { name: string, phone: string|null } {
      let phone: string|null = null;
      const phoneSpan = el.querySelector('span[title]');
      if (phoneSpan && /\d{7,}/.test(phoneSpan.getAttribute('title') || '')) {
        phone = (phoneSpan.getAttribute('title') || '').replace(/[^\d+]/g, '');
      } else {
        const text = el.textContent || '';
        const match = text.match(/\+?\d{7,}/);
        if (match) phone = match[0].replace(/[^\d+]/g, '');
      }
      let name = '';
      const nameSpan = el.querySelector('[data-testid="selectable-text"], .copyable-text');
      if (nameSpan) name = nameSpan.textContent?.trim() || '';
      if (!name) name = (el.textContent || '').trim();
      return { name, phone };
    }

    // Scroll and collect all members
    const seen = new Set<string>();
    const members: { name: string, phone: string|null }[] = [];
    let stagnant = 0;
    let prevCount = -1;
    for (let i = 0; i < 600; i++) {
      // Extract all visible members
      const items = Array.from(scrollable.querySelectorAll('[role="listitem"]'));
      for (const el of items) {
        const { name, phone } = extractMember(el);
        const key = phone || name;
        if (key && !seen.has(key)) {
          seen.add(key);
          members.push({ name, phone });
        }
      }
      if (members.length === prevCount) stagnant++; else stagnant = 0;
      prevCount = members.length;
      // Scroll
      const old = (scrollable as HTMLElement).scrollTop;
      (scrollable as HTMLElement).scrollBy({ top: 300, behavior: 'auto' });
      await new Promise(r => setTimeout(r, 120));
      if ((scrollable as HTMLElement).scrollTop === old) stagnant++;
      if (stagnant >= 6) break;
    }
    // Final pass
    const items = Array.from(scrollable.querySelectorAll('[role="listitem"]'));
    for (const el of items) {
      const { name, phone } = extractMember(el);
      const key = phone || name;
      if (key && !seen.has(key)) {
        seen.add(key);
        members.push({ name, phone });
      }
    }
    return { groupName, members };
  }