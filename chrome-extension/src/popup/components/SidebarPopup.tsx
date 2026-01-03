import React, { useState } from 'react';

// SidebarPopup global styles (inject once)
if (typeof window !== 'undefined' && !document.getElementById('sidebar-popup-style')) {
  const style = document.createElement('style');
  style.id = 'sidebar-popup-style';
  style.innerHTML = `
    :root {
      --sidebar-bg: #fff;
      --sidebar-header-bg: #f8f9fa;
      --sidebar-tab-bg: #f1f3f6;
      --sidebar-tab-active: #e0e7ef;
      --sidebar-body-bg: #fff;
      --sidebar-accent: #4f8cff;
      --sidebar-radius: 16px;
    }
    @media (max-width: 600px) {
      .sidebar-popup-root {
        width: 100vw !important;
        min-width: 0 !important;
        max-width: 100vw !important;
        height: 100vh !important;
        min-height: 0 !important;
        max-height: 100vh !important;
        top: 0 !important;
        border-radius: 0 !important;
      }
    }
    .sidebar-popup-root button:focus {
      outline: 2px solid var(--sidebar-accent);
      outline-offset: 1px;
    }
    .sidebar-popup-root select:focus {
      outline: 2px solid var(--sidebar-accent);
    }
  `;
  document.head.appendChild(style);
}

const MIN_WIDTH = 60;
const MIN_HEIGHT = 60;
const DEFAULT_WIDTH = 360;
const DEFAULT_HEIGHT = 500;
const MAX_WIDTH = 600;
const MAX_HEIGHT = 800;

export type SidebarPopupState = 'open' | 'minimized' | 'closed';

const tabs = [
  { key: 'linkedin', label: 'LinkedIn' },
  { key: 'whatsapp', label: 'WhatsApp' },
];

export default function SidebarPopup() {
  const [state, setState] = useState<SidebarPopupState>('open');
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [height, setHeight] = useState(DEFAULT_HEIGHT);
  const [activeTab, setActiveTab] = useState('linkedin');
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDir, setResizeDir] = useState<'width' | 'height' | null>(null);
  const [language, setLanguage] = useState('en');


  // Drag-to-resize logic
  React.useEffect(() => {
    if (!isResizing || !resizeDir) return;
    const handleMouseMove = (e: MouseEvent) => {
      if (resizeDir === 'width') {
        const newWidth = Math.min(
          Math.max(window.innerWidth - e.clientX, MIN_WIDTH),
          MAX_WIDTH
        );
        setWidth(newWidth);
      } else if (resizeDir === 'height') {
        const newHeight = Math.min(
          Math.max(e.clientY - 20, MIN_HEIGHT),
          MAX_HEIGHT
        );
        setHeight(newHeight);
      }
    };
    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeDir(null);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeDir]);

  // Minimize sidebar
  const handleMinimize = () => setState('minimized');
  // Restore sidebar
  const handleRestore = () => setState('open');
  // Close sidebar
  const handleClose = () => setState('closed');

  // If minimized, clicking the bar restores
  if (state === 'minimized') {
    return (
      <div
        style={{
          position: 'fixed',
          top: 20,
          right: 0,
          zIndex: 9999,
          width: MIN_WIDTH,
          height: MIN_HEIGHT,
          borderRadius: '16px 0 0 16px',
          background: 'var(--sidebar-bg, #fff)',
          boxShadow: '0 2px 16px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(.4,0,.2,1)',
          border: '2px solid #FF6B00',
        }}
        title="Restore TargetIQ sidebar"
        aria-label="Restore TargetIQ sidebar"
        tabIndex={0}
        onClick={handleRestore}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleRestore(); }}
      >
        <span style={{ fontSize: 28, color: '#FF6B00', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
          🎯 <span style={{ fontSize: 18, color: '#222' }}>TargetIQ</span>
        </span>
      </div>
    );
  }

  if (state === 'closed') {
    return (
      <div
        style={{
          position: 'fixed',
          top: 24,
          right: 24,
          zIndex: 9999,
        }}
      >
        <button
          onClick={() => setState('open')}
          title="Open TargetIQ sidebar"
          aria-label="Open TargetIQ sidebar"
          style={{
            background: '#fff',
            border: '2px solid #FF6B00',
            borderRadius: 16,
            boxShadow: '0 2px 16px rgba(0,0,0,0.15)',
            width: 48,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'background 0.2s',
            padding: 0,
          }}
        >
          <span style={{ fontSize: 28, color: '#FF6B00', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
            🎯<span style={{ fontSize: 16, color: '#222' }}>IQ</span>
          </span>
        </button>
      </div>
    );
  }

  return (
    <div
      className="sidebar-popup-root"
      style={{
        position: 'fixed',
        top: 20,
        right: 0,
        zIndex: 9999,
        width: state === 'minimized' ? MIN_WIDTH : width,
        height: state === 'minimized' ? MIN_HEIGHT : height,
        borderRadius: 'var(--sidebar-radius) 0 0 var(--sidebar-radius)',
        background: 'var(--sidebar-bg)',
        boxShadow: '0 2px 16px rgba(0,0,0,0.15)',
        transition:
          'width 0.3s cubic-bezier(.4,0,.2,1), height 0.3s cubic-bezier(.4,0,.2,1), border-radius 0.3s, background 0.2s',
        overflow: 'hidden',
        display: state === 'closed' ? 'none' : 'flex',
        flexDirection: 'column',
        opacity: state === 'open' ? 1 : 0.95,
        pointerEvents: state === 'closed' ? 'none' : 'auto',
        boxSizing: 'border-box',
        minWidth: 200,
        minHeight: 200,
        maxWidth: 600,
        maxHeight: 800,
      }}
    >
      {/* Header with controls and language selector */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 16px',
        borderBottom: '1px solid #eee',
        background: 'var(--sidebar-header-bg, #f8f9fa)',
        minHeight: 48,
      }}>
        <div style={{ fontWeight: 700, fontSize: 20, letterSpacing: 1, color: '#FF6B00' }}>
          Target<span style={{ color: '#222' }}>IQ</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label htmlFor="sidebar-lang" style={{ fontSize: 14, marginRight: 4 }}>🌐</label>
          <select
            id="sidebar-lang"
            value={language}
            onChange={e => setLanguage(e.target.value)}
            style={{
              marginRight: 8,
              borderRadius: 4,
              border: '1px solid #ccc',
              padding: '2px 6px',
              fontSize: 14,
              background: 'var(--sidebar-header-bg, #f8f9fa)',
            }}
            aria-label="Select language"
          >
            <option value="en">EN</option>
            <option value="es">ES</option>
            <option value="fr">FR</option>
            <option value="de">DE</option>
          </select>
          {/* Minimize button */}
          <button
            onClick={handleMinimize}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 20,
              marginRight: 4,
              width: 32,
              height: 32,
              borderRadius: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s',
            }}
            title="Minimize"
            aria-label="Minimize sidebar"
            tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleMinimize(); }}
          >
            <span style={{ fontSize: 22, lineHeight: 1 }}>—</span>
          </button>
          {/* Close button */}
          <button
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 20,
              color: '#c00',
              width: 32,
              height: 32,
              borderRadius: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s',
            }}
            title="Close"
            aria-label="Close sidebar"
            tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleClose(); }}
          >
            <span style={{ fontSize: 22, lineHeight: 1 }}>×</span>
          </button>
        </div>
      </div>
      {/* Tab navigation */}
      <nav
        style={{
          display: state === 'minimized' ? 'none' : 'flex',
          borderBottom: '1px solid #eee',
          background: 'var(--sidebar-tab-bg, #f1f3f6)',
        }}
        aria-label="Sidebar tabs"
      >
        {tabs.map(tab => (
          <button
            key={tab.key}
            style={{
              flex: 1,
              padding: '10px 0',
              background: activeTab === tab.key ? 'var(--sidebar-tab-active, #e0e7ef)' : 'transparent',
              border: 'none',
              fontWeight: activeTab === tab.key ? 600 : 400,
              cursor: 'pointer',
              transition: 'background 0.2s',
              outline: activeTab === tab.key ? '2px solid #4f8cff' : 'none',
              color: activeTab === tab.key ? '#222' : '#666',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              fontSize: 15,
            }}
            aria-selected={activeTab === tab.key}
            aria-controls={`sidebar-tabpanel-${tab.key}`}
            tabIndex={activeTab === tab.key ? 0 : -1}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.key === 'linkedin' && <span style={{fontSize:18}}>🔗</span>}
            {tab.key === 'whatsapp' && <span style={{fontSize:18}}>💬</span>}
            {tab.label}
          </button>
        ))}
      </nav>
      {/* Tab content */}
      <section
        id={`sidebar-tabpanel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`sidebar-tab-${activeTab}`}
        style={{
          flex: 1,
          display: state === 'minimized' ? 'none' : 'block',
          padding: 16,
          overflowY: 'auto',
          background: 'var(--sidebar-body-bg, #fff)',
        }}
      >
        {activeTab === 'linkedin' && <div>LinkedIn Content</div>}
        {activeTab === 'whatsapp' && <div>WhatsApp Content</div>}
      </section>
      {/* Resize handles */}
      {/* Right edge for width */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: -8,
          width: 8,
          height: '100%',
          cursor: 'ew-resize',
          zIndex: 10000,
          userSelect: 'none',
        }}
        onMouseDown={() => {
          setIsResizing(true);
          setResizeDir('width');
        }}
        title="Resize width"
      />
      {/* Bottom edge for height */}
      <div
        style={{
          position: 'absolute',
          bottom: -8,
          left: 0,
          width: '100%',
          height: 8,
          cursor: 'ns-resize',
          zIndex: 10000,
          userSelect: 'none',
        }}
        onMouseDown={() => {
          setIsResizing(true);
          setResizeDir('height');
        }}
        title="Resize height"
      />
    </div>
  );
}
