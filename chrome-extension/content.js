console.log('[TargetIQ] content.js loaded');

// Relay window.postMessage (from injected scripts) to extension
window.addEventListener('message', (event) => {
  // Only accept messages from the same window
  if (event.source !== window) return;
  const { type, payload, source } = event.data || {};
  if (source === 'scraper' && (type === 'SCRAPE_PROGRESS' || type === 'SCRAPE_DONE')) {
    chrome.runtime.sendMessage({
      action: 'scrapedComments',
      type,
      payload,
    });
  }
});
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractData') {
    const extractedData = extractPageData();
    sendResponse({ data: extractedData });
  }
  return true;
});

function extractPageData() {
  const data = {
    email: null,
    name: null,
    company: null,
    phone: null,
  };

  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;

  const bodyText = document.body.innerText;

  const emails = bodyText.match(emailRegex);
  if (emails && emails.length > 0) {
    data.email = emails[0];
  }

  const phones = bodyText.match(phoneRegex);
  if (phones && phones.length > 0) {
    data.phone = phones[0];
  }

  const metaTags = {
    'og:title': document.querySelector('meta[property="og:title"]')?.content,
    'og:site_name': document.querySelector('meta[property="og:site_name"]')?.content,
    'author': document.querySelector('meta[name="author"]')?.content,
    'twitter:creator': document.querySelector('meta[name="twitter:creator"]')?.content,
  };

  data.name = metaTags['author'] || metaTags['twitter:creator'] || null;
  data.company = metaTags['og:site_name'] || null;


  const isLinkedIn = window.location.hostname.includes('linkedin.com');
  const isWhatsApp = window.location.hostname.includes('web.whatsapp.com');
  if (isLinkedIn) {
    const nameElement = document.querySelector('h1');
    if (nameElement) {
      data.name = nameElement.textContent.trim();
    }
  }

  const twitterProfile = document.querySelector('[data-testid="UserName"]');
  if (twitterProfile) {
    data.name = twitterProfile.textContent.trim();
  }

  // Always inject SidebarPopup for LinkedIn and WhatsApp tabs
  if ((isLinkedIn || isWhatsApp) && !document.getElementById('targetiq-sidebar-direct-mount')) {
    const mount = document.createElement('div');
    mount.id = 'targetiq-sidebar-direct-mount';
    mount.style.position = 'fixed';
    mount.style.top = '24px';
    mount.style.left = '24px';
    mount.style.zIndex = '2147483647';
    mount.style.background = 'transparent';
    document.body.appendChild(mount);
    // Dynamically load React and SidebarPopup bundle
    const script = document.createElement('script');
    script.type = 'module';
    script.src = chrome.runtime.getURL('assets/SidebarPopup-CEfY6VFo.js'); // Adjust hash if needed
    script.onload = () => {
      // Try to mount SidebarPopup if exported globally
      if (window.SidebarPopup) {
        window.SidebarPopup(mount);
      }
    };
    document.body.appendChild(script);
  }

  return data;
}
