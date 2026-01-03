import React from 'react';
import { createRoot } from 'react-dom/client';
import SidebarPopup from '../popup/components/SidebarPopup';

// Create a mount point in the top left
const mount = document.createElement('div');
mount.id = 'targetiq-sidebar-content-root';
mount.style.position = 'fixed';
mount.style.top = '24px';
mount.style.left = '24px';
mount.style.zIndex = '2147483647';
mount.style.background = 'transparent';
document.body.appendChild(mount);

const root = createRoot(mount);
root.render(<SidebarPopup />);
