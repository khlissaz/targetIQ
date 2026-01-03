
import { createRoot } from 'react-dom/client';
import SidebarPopup from './components/SidebarPopup';
import { LanguageProvider } from '../../../contexts/LanguageContext';
// import styles from './App.css?inline'; // No App.css found, remove or replace with actual CSS if needed

function mountSidebar() {
	if (document.getElementById('shadow-sidebar-host')) return;

	const host = document.createElement('div');
	host.id = 'shadow-sidebar-host';
	host.style.all = 'initial';
	document.body.appendChild(host);

	const shadow = host.attachShadow({ mode: 'open' });

	// Optionally inject styles here if you have a CSS file
	// const styleEl = document.createElement('style');
	// styleEl.textContent = styles;
	// shadow.appendChild(styleEl);

	// React root
	const mount = document.createElement('div');
	mount.id = 'shadow-react-root';
	shadow.appendChild(mount);

	const root = createRoot(mount);
	root.render(
		<LanguageProvider>
			<SidebarPopup />
		</LanguageProvider>
	);
}


// Inject a floating button to open the sidebar if not present
function injectSidebarButton() {
	if (document.getElementById('targetiq-sidebar-open-btn')) return;
	const btn = document.createElement('button');
	btn.id = 'targetiq-sidebar-open-btn';
	btn.title = 'Open TargetIQ sidebar';
	btn.setAttribute('aria-label', 'Open TargetIQ sidebar');
	btn.style.position = 'fixed';
	btn.style.top = '24px';
	btn.style.right = '24px';
	btn.style.zIndex = '2147483647';
	btn.style.background = '#fff';
	btn.style.border = '2px solid #FF6B00';
	btn.style.borderRadius = '16px';
	btn.style.boxShadow = '0 2px 16px rgba(0,0,0,0.15)';
	btn.style.width = '48px';
	btn.style.height = '48px';
	btn.style.display = 'flex';
	btn.style.alignItems = 'center';
	btn.style.justifyContent = 'center';
	btn.style.cursor = 'pointer';
	btn.style.transition = 'background 0.2s';
	btn.style.padding = '0';
	btn.innerHTML = '<span style="font-size:28px;color:#FF6B00;font-weight:700;display:flex;align-items:center;gap:4;">🎯<span style="font-size:16px;color:#222;">IQ</span></span>';
	btn.onclick = () => {
		mountSidebar();
		btn.remove();
	};
	document.body.appendChild(btn);
}

// Only inject the button if the sidebar is not present
if (!document.getElementById('shadow-sidebar-host')) {
	injectSidebarButton();
}

// Expose for testing/debugging
(window as any).__INJECT_SIDEBAR = mountSidebar;
