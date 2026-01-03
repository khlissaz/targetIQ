import React from 'react';
import { createRoot } from 'react-dom/client';
import SidebarPopup from './components/SidebarPopup';

// Only inject once
if (!document.getElementById('sidebar-popup-root')) {
  const container = document.createElement('div');
  container.id = 'sidebar-popup-root';
  document.body.appendChild(container);
  const root = createRoot(container);
  root.render(<SidebarPopup />);
}
