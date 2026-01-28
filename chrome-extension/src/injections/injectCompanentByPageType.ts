import { mountSearchScrapeButton } from './mountSearchScrapeButton';
import { observeVisiblePostsAndInject } from './observeVisiblePostsAndInject';

export function injectComponentByPageType() {
  const url = window.location.href;

  if (url.includes("https://www.linkedin.com/feed/")) {
    console.log("🟢 Feed page detected → injecting post buttons...");
    observeVisiblePostsAndInject(); // comments, reactions, reposts
    return;
  }
  if (url.includes("https://www.linkedin.com/search/results/people/?keywords=")) {
    console.log("🟢 Content search page detected → injecting search scrape button...");
    mountSearchScrapeButton();
    return;
  }
}