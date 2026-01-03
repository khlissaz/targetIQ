// Inject SidebarPopup for WhatsApp
if (!document.getElementById('sidebar-popup-root')) {
	const script = document.createElement('script');
	script.type = 'module';
	script.src = chrome.runtime.getURL('sidebar-content-mount.js');
	document.body.appendChild(script);
}
// Content script for WhatsApp Web scraping
// Scrapes group members, handles virtualized lists, deduplication, and posts to background

type Member = {
	name: string;
	phone?: string;
	profileUrl?: string;
};

const scraped = new Set<string>();
let isScraping = false;

function getMemberRows(): HTMLElement[] {
	// WhatsApp Web group member rows (may need selector adjustment)
	return Array.from(document.querySelectorAll('[data-testid="cell-frame-container"]')) as HTMLElement[];
}

function extractMember(row: HTMLElement): Member | null {
	// Try to extract name and phone/profile from row
	const nameEl = row.querySelector('[dir="auto"]');
	if (!nameEl) return null;
	const name = nameEl.textContent?.trim() || '';
	// Try to extract phone/profile (if available)
	let phone = '';
	let profileUrl = '';
	const img = row.querySelector('img');
	if (img && img.src) profileUrl = img.src;
	// WhatsApp sometimes shows phone in title or aria-label
	const title = row.getAttribute('title') || row.getAttribute('aria-label') || '';
	if (/\+\d+/.test(title)) phone = title.match(/\+\d+/)?.[0] || '';
	return { name, phone, profileUrl };
}

function dedupeKey(member: Member) {
	return member.phone || member.name;
}

function sendToBackground(member: Member) {
	chrome.runtime.sendMessage({ type: 'NEW_MEMBER', platform: 'whatsapp', member });
}

async function scrollAndScrape() {
	isScraping = true;
	let lastCount = 0;
	let stuck = 0;
	const scrollContainer = document.querySelector('[data-testid="chat-list"]') || document.scrollingElement;
	if (!scrollContainer) return;
	while (isScraping) {
		const rows = getMemberRows();
		for (const row of rows) {
			const member = extractMember(row);
			if (member) {
				const key = dedupeKey(member);
				if (!scraped.has(key)) {
					scraped.add(key);
					sendToBackground(member);
				}
			}
		}
		// Scroll to bottom to load more
		if (scrollContainer.scrollTop + scrollContainer.clientHeight < scrollContainer.scrollHeight) {
			scrollContainer.scrollTop += 200;
			await new Promise(r => setTimeout(r, 400));
		} else {
			// If no new members found, break after a few tries
			if (rows.length === lastCount) stuck++;
			else stuck = 0;
			lastCount = rows.length;
			if (stuck > 3) break;
			await new Promise(r => setTimeout(r, 600));
		}
	}
}

// Listen for start/stop messages from popup/background
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
	if (msg.type === 'START_SCRAPING_WHATSAPP') {
		if (!isScraping) scrollAndScrape();
		sendResponse({ started: true });
	}
	if (msg.type === 'STOP_SCRAPING_WHATSAPP') {
		isScraping = false;
		sendResponse({ stopped: true });
	}
});
