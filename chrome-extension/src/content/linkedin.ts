// Inject SidebarPopup for LinkedIn
if (!document.getElementById('sidebar-popup-root')) {
	const script = document.createElement('script');
	script.type = 'module';
	script.src = chrome.runtime.getURL('sidebar-content-mount.js');
	document.body.appendChild(script);
}
// Content script for LinkedIn scraping
// To be implemented: scroll, extract, deduplicate, postMessage to background

type LinkedInMember = {
	name: string;
	profileUrl?: string;
	headline?: string;
	connection?: string;
};

const linkedinScraped = new Set<string>();
let linkedinIsScraping = false;

function getProfileRows(): HTMLElement[] {
	// LinkedIn: adjust selector for people list
	return Array.from(document.querySelectorAll('.reusable-search__result-container')) as HTMLElement[];
}

function extractProfile(row: HTMLElement): LinkedInMember | null {
	const nameEl = row.querySelector('.entity-result__title-text span[aria-hidden="true"]');
	if (!nameEl) return null;
	const name = nameEl.textContent?.trim() || '';
	const profileUrl = (row.querySelector('a') as HTMLAnchorElement)?.href || '';
	const headline = row.querySelector('.entity-result__primary-subtitle')?.textContent?.trim() || '';
	const connection = row.querySelector('.entity-result__simple-insight-text')?.textContent?.trim() || '';
	return { name, profileUrl, headline, connection };
}


chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
	if (msg.type === 'START_SCRAPING_LINKEDIN') {
		if (!linkedinIsScraping) scrollAndScrape();
		sendResponse({ started: true });
	}
	if (msg.type === 'STOP_SCRAPING_LINKEDIN') {
		linkedinIsScraping = false;
		sendResponse({ stopped: true });
	}
});
