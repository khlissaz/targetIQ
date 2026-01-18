import { injectButtonsForPost } from './injectButtonsForPost';


function getAllPosts(): HTMLElement[] {
  // Adjust selector to match LinkedIn post containers
  return Array.from(document.querySelectorAll('[data-urn], .feed-shared-update-v2'));
}

function injectAllVisiblePosts() {
  getAllPosts().forEach(post => injectButtonsForPost(post as HTMLElement));
}

function observeNewPosts() {
  const feed = document.querySelector('[role="main"]') || document.body;
  if (!feed) return;

  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach(node => {
        if (node instanceof HTMLElement) {
          // If a new post, inject buttons
          if (node.matches('[data-urn], .feed-shared-update-v2')) {
            injectButtonsForPost(node);
          }
          // Or if a subtree contains posts
          node.querySelectorAll?.('[data-urn], .feed-shared-update-v2').forEach(post => {
            injectButtonsForPost(post as HTMLElement);
          });
        }
      });
    }
  });

  observer.observe(feed, { childList: true, subtree: true });
}

export function observeVisiblePostsAndInject() {
  injectAllVisiblePosts();
  observeNewPosts();
}
