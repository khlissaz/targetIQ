import { observeVisiblePostsAndInject } from './observeVisiblePostsAndInject';

export function injectComponentByPageType() {
  const url = window.location.href;

  if (url.includes("https://www.linkedin.com/feed/")) {
    console.log("🟢 Feed page detected → injecting post buttons...");
    observeVisiblePostsAndInject(); // comments, reactions, reposts
    return;
  }
}