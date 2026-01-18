import styles from '../globals.css?inline';
import { injectCssIntoShadowRoot } from '../injectCssIntoShadowRoot';
import { createRoot } from "react-dom/client";
import { injectPopupScrapeButton } from "./injectPopupScrapeButton";
import { OpenPopupButton } from "@/components/scrape-buttons/OpenPopupButton";
import { LanguageProvider } from "../contexts/LanguageContext";
import React, { useEffect, useState } from "react";

export function mountReactionButton(parent: HTMLElement, post: HTMLElement) {
  const shadowHost = document.createElement("div");
  const shadowRoot = shadowHost.attachShadow({ mode: "open" });
  injectCssIntoShadowRoot(shadowRoot, styles);

  const mount = document.createElement("div");
  shadowRoot.appendChild(mount);
  parent.appendChild(shadowHost);

  // Check if the post has reactions
  const hasReactions = !!post.querySelector('[data-view-name="feed-reaction-count"], button[data-reaction-details]');

  const handleClick = async () => {
    console.log("⚡ Clicked Reactions button");
    const reactionsButton = post.querySelector('[data-view-name="feed-reaction-count"], button[data-reaction-details]') as HTMLElement;
    if (reactionsButton) {
      reactionsButton.click();
      // Wait for the LinkedIn popup to appear
      const checkPopup = setInterval(() => {
        const popup = document.querySelector("dialog, [role='dialog']");
        if (popup) {
          clearInterval(checkPopup);
          injectPopupScrapeButton(post, "reactions");
        }
      }, 400);
    } else {
      console.error("Reactions button not found in post element.");
    }
  };
  function checkHasReactions() {
    // Try to find a counter element and check if its count > 0
    const el = post.querySelector('[data-view-name="feed-reaction-count"], button[data-reaction-details]');
    if (!el) return false;
    // Try to extract count from textContent or aria-label
    const text = el.textContent || el.getAttribute('aria-label') || '';
    const match = text.match(/\d+/);
    return match ? parseInt(match[0], 10) > 0 : false;
  }

  // Use React state for dynamic enable/disable
  function ReactionButtonWrapper() {
    const [hasReactions, setHasReactions] = React.useState(checkHasReactions());

    React.useEffect(() => {
      // Re-check after a short delay in case LinkedIn renders late
      const timeout = setTimeout(() => setHasReactions(checkHasReactions()), 800);
      return () => clearTimeout(timeout);
    }, []);

    const handleClick = async () => {
      console.log("⚡ Clicked Reactions button");
      const reactionsButton = post.querySelector('[data-view-name="feed-reaction-count"], button[data-reaction-details]') as HTMLElement;
      if (reactionsButton) {
        reactionsButton.click();
        // Wait for the LinkedIn popup to appear
        const checkPopup = setInterval(() => {
          const popup = document.querySelector("dialog, [role='dialog']");
          if (popup) {
            clearInterval(checkPopup);
            injectPopupScrapeButton(post, "reactions");
          }
        }, 400);
      } else {
        alert("No reactions found for this post.");
      }
    };

    return (
      <LanguageProvider>
        <OpenPopupButton post={post} onClick={handleClick} type="reactions" disabled={!hasReactions} />
      </LanguageProvider>
    );
  }

  const root = createRoot(mount);
  root.render(<ReactionButtonWrapper />);
}