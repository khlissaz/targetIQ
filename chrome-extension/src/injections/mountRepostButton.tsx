import styles from '../globals.css?inline';
import { injectCssIntoShadowRoot } from '../injectCssIntoShadowRoot';
import { createRoot } from 'react-dom/client';
import { injectPopupScrapeButton } from './injectPopupScrapeButton';
import { OpenPopupButton } from '@/components/scrape-buttons/OpenPopupButton';
import { LanguageProvider } from '../contexts/LanguageContext';
import React, { useEffect, useState } from 'react';

export function mountRepostButton(parent: HTMLElement, post: HTMLElement) {
  const shadowHost = document.createElement('div');
  const shadowRoot = shadowHost.attachShadow({ mode: 'open' });
  injectCssIntoShadowRoot(shadowRoot, styles);

  const mount = document.createElement('div');
  shadowRoot.appendChild(mount);
  parent.appendChild(shadowHost);

  // Check if the post has reposts
  const hasReposts = !!post.querySelector('[data-view-name="feed-repost-count"], button[data-repost-details]');

  const handleClick = async () => {
    console.log('⚡ Clicked Reposts button');
    const checkPopup = setInterval(() => {
      const popup = document.querySelector('.artdeco-modal__content');
      if (popup) {
        clearInterval(checkPopup);
        injectPopupScrapeButton(popup as HTMLElement, 'reposts');
      }
    }, 400);
  };

  function checkHasReposts() {
    const el = post.querySelector('[data-view-name="feed-repost-count"], button[data-repost-details]');
    if (!el) return false;
    const text = el.textContent || el.getAttribute('aria-label') || '';
    const match = text.match(/\d+/);
    return match ? parseInt(match[0], 10) > 0 : false;
  }

  function RepostButtonWrapper() {
    const [hasReposts, setHasReposts] = React.useState(checkHasReposts());

    React.useEffect(() => {
      const timeout = setTimeout(() => setHasReposts(checkHasReposts()), 800);
      return () => clearTimeout(timeout);
    }, []);

    const handleClick = async () => {
      console.log('⚡ Clicked Reposts button');
      const repostsButton = post.querySelector('[data-view-name="feed-repost-count"], button[data-repost-details]') as HTMLElement;
      if (repostsButton) {
        // Open reposts modal if needed
        const checkPopup = setInterval(() => {
          const popup = document.querySelector('.artdeco-modal__content');
          if (popup) {
            clearInterval(checkPopup);
            injectPopupScrapeButton(popup as HTMLElement, 'reposts');
          }
        }, 400);
      } else {
        alert('No reposts found for this post.');
      }
    };

    return (
      <LanguageProvider>
        <OpenPopupButton post={post} onClick={handleClick} type="reposts" disabled={!hasReposts} />
      </LanguageProvider>
    );
  }

  const root = createRoot(mount);
  root.render(<RepostButtonWrapper />);
}
