console.log('TargetIQ background.js loaded (service worker start)');

// Manifest V3: Service worker context
chrome.runtime.onInstalled.addListener(() => {
  if (chrome.contextMenus && chrome.contextMenus.create) {
    chrome.contextMenus.create({
      id: 'captureLead',
      title: 'Capture Lead with TargetIQ',
      contexts: ['selection'],
    });
    if (chrome.contextMenus.onClicked) {
      chrome.contextMenus.onClicked.addListener((info, tab) => {
        if (info.menuItemId === 'captureLead') {
          // chrome.action.openPopup() is not supported in service workers
          // Instead, send a message or perform another action
          chrome.tabs.sendMessage(tab.id, { action: 'openSidebar' });
        }
      });
    }
  }
});

// Keep-alive workaround for debugging
self.addEventListener('install', () => {
  console.log('Service worker installed');
});
self.addEventListener('activate', () => {
  console.log('Service worker activated');
});


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'saveUser') {
    chrome.storage.local.set({ user: request.user }, () => {
      sendResponse({ success: true });
    });
    return true;
  }

  if (request.action === 'getUser') {
    chrome.storage.local.get(['user'], (result) => {
      sendResponse({ user: result.user || null });
    });
    return true;
  }

  // Relay scraped comments to all extension views (sidebar/popup)
  if (request.action === 'scrapedComments') {
    // Send to all extension views (popups, sidebars, etc.)
    chrome.runtime.sendMessage({
      action: 'scrapedComments',
      type: request.type,
      payload: request.payload,
    });
  }
});
