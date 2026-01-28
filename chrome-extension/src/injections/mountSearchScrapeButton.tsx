import styles from '../globals.css?inline';
import { injectCssIntoShadowRoot } from '../injectCssIntoShadowRoot';
import { createRoot } from 'react-dom/client';
import ScrapeButton from '../components/scrape-buttons/ScrapeButton';
import { LanguageProvider } from '../contexts/LanguageContext';
import { scrapePeopleUtils } from '@/services/linkedin/scrapePeopleUtils';

export function mountSearchScrapeButton() {
  console.log('🔍 mountSearchScrapeButton started');
  let observer: MutationObserver | null = null;
  let root: any = null;
  let shadowHost: HTMLElement | null = null;
  let mount: HTMLElement | null = null;
  observer = new MutationObserver(() => {
    const container = findSearchContainer();
    if (!container) return;
    if (container.querySelector('.scrape-search-persons-button')) return;
    shadowHost = document.createElement('div');
    const shadowRoot = shadowHost.attachShadow({ mode: 'open' });
    injectCssIntoShadowRoot(shadowRoot, styles);
    mount = document.createElement('div');
    shadowRoot.appendChild(mount);
    const wrapper = document.createElement('div');
    wrapper.className = 'scrape-search-persons-button';
    wrapper.appendChild(shadowHost);
    container.prepend(wrapper);
    root = createRoot(mount);
    root.render(
      <LanguageProvider>
        <ScrapeButton type="search_persons" onClick={handleClick} />
      </LanguageProvider>
    );
    console.log('✅ Scrape Search Button injected');
  });
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
  // CLEANUP FUNCTION
  return () => {
    console.log('🧹 Cleaning Search Scrape Button');
    observer?.disconnect();
    observer = null;
    root?.unmount();
    root = null;
    shadowHost?.remove();
    shadowHost = null;
    mount = null;
  };
}

function findSearchContainer(): HTMLElement | null {
  return document.querySelector(
    '.search-results-container, [data-testid="lazy-column"], [data-component-type="LazyColumn"], [role="list"]'
  ) as HTMLElement | null;
}

async function handleClick() {
  console.log('🔍 Scraping search results...');
  await sleep(randomDelay(1000, 2500));
  const data = await scrapePeopleUtils.search_persons();
  console.log('✅ Scraped data:', data);
  return data;
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function randomDelay(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
