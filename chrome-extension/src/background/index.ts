// Background script for messaging, deduplication, storage, and API upload
type ScrapedEntry = {
	name: string;
	phone?: string;
	profileUrl?: string;
	platform: string;
	timestamp: number;
};
let entries: ScrapedEntry[] = [];
const dedupeSet = new Set<string>();



chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
	if (msg.type === 'NEW_MEMBER' && msg.member && msg.platform) {
		const entry: ScrapedEntry = { ...msg.member, platform: msg.platform, timestamp: Date.now() };
		const key = dedupeKey(entry);
		if (!dedupeSet.has(key)) {
			dedupeSet.add(key);
			entries.push(entry);
			// Notify popup for live update
			chrome.runtime.sendMessage({ type: 'ENTRY_ADDED', entry });
		}
		sendResponse({ ok: true });
	}
	if (msg.type === 'GET_ENTRIES') {
		sendResponse({ entries });
	}
	if (msg.type === 'CLEAR_ENTRIES') {
		entries = [];
		dedupeSet.clear();
		sendResponse({ ok: true });
	}
	if (msg.type === 'UPLOAD_ENTRIES' && msg.apiUrl) {
		const token = localStorage.getItem('token');
		fetch(msg.apiUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				...(token ? { Authorization: `Bearer ${token}` } : {}),
			},
			body: JSON.stringify(entries),
		})
			.then((res) => res.json())
			.then((data) => sendResponse({ ok: true, data }))
			.catch((e) => sendResponse({ ok: false, error: e.message }));
		return true; // async
	}
	if (msg.type === 'EXPORT_XLSX') {
		// Export to XLSX using xlsx library (in popup, not background)
		sendResponse({ ok: false, error: 'Not implemented in background' });
	}
});
