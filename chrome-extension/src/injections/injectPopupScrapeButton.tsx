import styles from '../globals.css?inline';
import { injectCssIntoShadowRoot } from '../injectCssIntoShadowRoot';
import ScrapePopupButton from '@/components/scrape-buttons/ScrapePopupButton';
import { LanguageProvider } from '../contexts/LanguageContext';
import { createRoot } from 'react-dom/client';

export function injectPopupScrapeButton(
  post: HTMLElement,
  type: 'reactions' | 'reposts'
) {
  // Find the popup container (LinkedIn dialog or any role="dialog")
  const popup = document.querySelector('dialog, [role="dialog"]') as HTMLElement;
  if (!popup) return;
  if (popup.querySelector('.scrape-popup-button-container')) return;

  // Create a container for the button
  const container = document.createElement('div');
  container.className = 'scrape-popup-button-container';
  Object.assign(container.style, {
    padding: '12px',
    borderBottom: '1px solid #e5e7eb',
    background: 'white',
    display: 'flex',
    justifyContent: 'center',
    zIndex: '9999',
  });

  // Prevent clicks inside container from closing popup
  container.addEventListener('click', (e) => e.stopPropagation());

  popup.prepend(container);

  // Create shadow DOM
  const shadowHost = document.createElement('div');
  const shadowRoot = shadowHost.attachShadow({ mode: 'open' });
  injectCssIntoShadowRoot(shadowRoot, styles);

  // Prevent clicks inside shadow root from closing popup
  shadowRoot.addEventListener('click', (e) => e.stopPropagation());

  container.appendChild(shadowHost);

  const mount = document.createElement('div');
  shadowRoot.appendChild(mount);
  const urn =post.getAttribute('componentKey')  || post.getAttribute('data-urn');
  const postUrl = urn ? `https://www.linkedin.com/feed/update/${urn}` : '';

  const root = createRoot(mount);


  root.render(
    <LanguageProvider>
      <ScrapePopupButton type={type} postUrl={postUrl} popup={popup} t={(key) => key} />
    </LanguageProvider>
  );
}
