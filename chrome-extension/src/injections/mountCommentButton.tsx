import styles from '../globals.css?inline';
import { injectCssIntoShadowRoot } from '../injectCssIntoShadowRoot';
import { createRoot } from 'react-dom/client';
import ScrapeButton from '../components/scrape-buttons/ScrapeButton';
import { LanguageProvider } from '../contexts/LanguageContext';
import { scrapeComments } from '../services/linkedin/scrapeComments';
import { LeadI } from '../types';


export function mountCommentButton(parent: HTMLElement, post: Element) {
  const shadowHost = document.createElement('div');
  const shadowRoot = shadowHost.attachShadow({ mode: 'open' });
  injectCssIntoShadowRoot(shadowRoot, styles);

  const mount = document.createElement('div');
  shadowRoot.appendChild(mount);
  parent.appendChild(shadowHost);


  // Check if the post has any comment elements with count > 0
  function checkHasComments() {
    // Try to find a comment count element (update selector as needed)
    const el = post.querySelector('[data-view-name="feed-comment-count"], button[data-comment-details]');
    if (el) {
      const text = el.textContent || el.getAttribute('aria-label') || '';
      const match = text.match(/\d+/);
      return match ? parseInt(match[0], 10) > 0 : false;
    }
    // Fallback: check for comment elements
    return !!post.querySelector('div[data-view-name="comment-container"], article.comments-comment-entity, div[data-id^="comment-"], div.comments-comment-item, li.social-details-social-counts__comments');
  }

  const hasComments = checkHasComments();

  const handleClick = async (): Promise<LeadI[]> => {
    let leads: LeadI[] = [];
    console.log('⚡ parent', parent);
    console.log('⚡ post', post);
    leads = await scrapeComments(post);
    return leads;
  };

  const root = createRoot(mount);
  root.render(
    <LanguageProvider>
      <ScrapeButton type="comments" onClick={handleClick} disabled={!hasComments} />
    </LanguageProvider>
  );
}
