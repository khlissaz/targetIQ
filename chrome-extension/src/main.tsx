import { createRoot } from 'react-dom/client';
import styles from './globals.css?inline';
import { injectCssIntoShadowRoot } from './injectCssIntoShadowRoot';
import App from './App';
import { LanguageProvider } from './contexts/LanguageContext';

function mountIntoShadow() {
  // Prevent double injection
  if (document.getElementById('shadow-sidebar-host')) return;

  // Create Shadow DOM host
  const host = document.createElement('div');
  host.id = 'shadow-sidebar-host';
  host.style.position = 'fixed';
  host.style.top = '24px';
  host.style.left = '24px';
  host.style.zIndex = '2147483647';
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: 'open' });

  // Inject styles using utility
  injectCssIntoShadowRoot(shadow, styles);

  // Mount React root
  const mount = document.createElement('div');
  mount.id = 'shadow-react-root';
  shadow.appendChild(mount);


  const root = createRoot(mount);
  root.render(
    <LanguageProvider>
      <App />
    </LanguageProvider>
  );
}

mountIntoShadow();

// Expose for debugging
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).__INJECT_SIDEBAR = mountIntoShadow;