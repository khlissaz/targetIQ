// ErrorBoundary for catching React errors
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, info: any) {
    // Log error to console for debugging
    console.error('React error boundary caught:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return <div style={{color:'#c00',padding:16}}><b>Something went wrong:</b> {String(this.state.error)}</div>;
    }
    return this.props.children;
  }
}
import React, { useEffect, useState, useRef } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { useAuth } from '../hooks/useAuth';
import ContentTabs from './content';
import LoginForm from './loginForm';
import Header from './header';

import '../globals.css';

// SidebarPopup global styles (inject once)
if (typeof window !== 'undefined' && !document.getElementById('sidebar-popup-style')) {
  const style = document.createElement('style');
  style.id = 'sidebar-popup-style';
  document.head.appendChild(style);
}

const MIN_WIDTH = 100;
const MIN_HEIGHT = 60;
const DEFAULT_WIDTH = 360;
const DEFAULT_HEIGHT = 500;
const MAX_WIDTH = 600;
const MAX_HEIGHT = 800;

export type SidebarPopupState = 'open' | 'minimized' | 'closed';

function SidebarPopup() {
 
  const [state, setState] = useState<SidebarPopupState>('minimized');
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [height, setHeight] = useState(DEFAULT_HEIGHT);
  const [activeTab, setActiveTab] = useState('linkedin');
  const [linkedinSubTab, setLinkedinSubTab] = useState('comments');
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDir, setResizeDir] = useState<'width' | 'height' | null>(null);
  const [language, setLanguage] = useState('en');
  // Real-time LinkedIn comments state
  const [linkedinComments, setLinkedinComments] = useState<any[]>([]);
  // Real-time LinkedIn reactions state
  const [linkedinReactions, setLinkedinReactions] = useState<any[]>([]);
  const [highlight, setHighlight] = useState<string | null>(null);
  const highlightTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Scraping progress messages
  const [progressMessages, setProgressMessages] = useState<string[]>([]);
  // Scraping state: 'idle' | 'loading' | 'scraping' | 'stopped'
  const [scrapingState, setScrapingState] = useState<'idle' | 'loading' | 'scraping' | 'stopped'>('idle');

  // Server limit state
  const [serverLimit, setServerLimit] = useState<number | null>(null);
  const { isAuthenticated, user, login, logout } = useAuth();

  // Fetch the scraping limit from the server on mount
  useEffect(() => {
    async function fetchLimit() {
      try {
        // Use getScrapingLimit from apiClient
        const data = await import('../services/apiClient').then(mod => mod.getScrapingLimit());
        setServerLimit(data?.dailyLimit ?? null);
      } catch {
        setServerLimit(null);
      }
    }
    fetchLimit();
  }, []);

  // Set activeTab to 'linkedin' if URL includes 'linkedin'
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.href.toLowerCase().includes('linkedin')) {
      setActiveTab('linkedin');
    }
  }, []);

  // Listen for scraped comments from injected script via window.postMessage
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data && event.data.type === "TARGETIQ_SCRAPED_COMMENTS") {
        setLinkedinComments(event.data.payload.data || []);
      }
    }
    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  // Drag-to-resize logic (single effect, robust, only when open)
  React.useEffect(() => {
    if (!isResizing || !resizeDir || state !== 'open') return;
    const handleMouseMove = (e: MouseEvent) => {
      if (resizeDir === 'width') {
        // Sidebar is anchored to the right, so width = window.innerWidth - mouseX
        const sidebarRight = 0; // right: 0
        const mouseX = e.clientX;
        const newWidth = Math.min(
          Math.max(window.innerWidth - mouseX - sidebarRight, MIN_WIDTH),
          MAX_WIDTH
        );
        setWidth(newWidth);
      } else if (resizeDir === 'height') {
        // Sidebar is anchored to top: 20, so height = mouseY - 20
        const sidebarTop = 20;
        const mouseY = e.clientY;
        const newHeight = Math.min(
          Math.max(mouseY - sidebarTop, MIN_HEIGHT),
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
  }, [isResizing, resizeDir, state]);

  // Minimize sidebar
  const handleMinimize = () => setState('minimized');
  // Restore sidebar
  const handleRestore = () => setState('open');
  // Close sidebar
  const handleClose = () => setState('closed');

  // If minimized, clicking the bar restores
  if (state === 'minimized') {
    return (
      <Card
        className="fixed top-5 right-0 z-[9999] w-[100px] h-[60px] rounded-l-2xl flex items-center justify-center cursor-pointer border-4 border-targetiq-primary shadow-lg transition-all"
        title="Restore TargetIQ sidebar"
        aria-label="Restore TargetIQ sidebar"
        tabIndex={0}
        onClick={handleRestore}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleRestore(); }}
      >
        <span className="flex items-center font-extrabold font-sans text-lg text-targetiq-navy tracking-tight" >
          <span className="font-bold text-targetiq-navy mr-1">Target</span>
          <span className="font-extrabold text-targetiq-primary flex items-center relative">IQ
            <svg width="18" height="10" viewBox="0 0 28 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="ml-1 mt-1 inline-block align-middle">
              <rect x="0" y="7" width="10" height="4" rx="2" fill="#FF6B00"/>
              <rect x="12" y="9" width="8" height="2" rx="1" fill="#FF6B00"/>
              <rect x="22" y="11" width="6" height="2" rx="1" fill="#FF6B00"/>
            </svg>
          </span>
        </span>
      </Card>
    );
  }

  if (state === 'closed') {
    return (
      <div className="fixed top-6 right-6 z-[9999]">
        <Button
          onClick={() => setState('open')}
          title="Open TargetIQ sidebar"
          aria-label="Open TargetIQ sidebar"
          variant="outline"
          className="bg-white border-4 border-targetiq-primary rounded-2xl shadow-lg w-14 h-14 flex items-center justify-center p-0"
        >
          <span className="text-[28px] text-targetiq-primary font-bold flex items-center gap-1 font-sans">
            <span className="text-base text-targetiq-navy font-extrabold ml-1">IQ</span>
          </span>
        </Button>
      </div>
    );
  }

  // Helper function for SidebarPopupState comparisons
  const isState = (s: SidebarPopupState, value: SidebarPopupState) => s === value;

  return (
    <Card
      className={
        `sidebar-popup-root fixed top-5 right-0 z-[9999] border-l-4 border-targetiq-primary rounded-l-2xl shadow-2xl font-sans overflow-x-hidden bg-[var(--sidebar-bg,#F4F6F8)] transition-all`
      }
      style={{
        width: width,
        height: isState(state, 'minimized') ? MIN_HEIGHT : height,
        minWidth: 240,
        minHeight: 240,
        maxWidth: 600,
        maxHeight: 800,
        opacity: isState(state, 'open') ? 1 : 0.98,
        pointerEvents: isState(state, 'closed') ? 'none' : 'auto',
        display: isState(state, 'closed') ? 'none' : 'table',
      }}
    >
      {/* Minimize and Close buttons in the top-right, under the popup border, above the header */}
      <div className="w-full flex justify-end items-center pt-2 pr-5 bg-transparent z-[10002]">
        <Button
          onClick={handleMinimize}
          title="Minimize"
          aria-label="Minimize sidebar"
          tabIndex={0}
          variant="outline"
          size="sm"
          className="w-8 h-8 rounded-full text-[22px] text-targetiq-primary bg-white hover:bg-targetiq-grey border border-targetiq-primary shadow-sm mr-1"
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleMinimize(); }}
        >
          —
        </Button>
        <Button
          onClick={handleClose}
          title="Close"
          aria-label="Close sidebar"
          tabIndex={0}
          variant="outline"
          size="sm"
          className="w-8 h-8 rounded-full text-[22px] text-[#c00] bg-white hover:bg-targetiq-grey border border-[#c00] shadow-sm ml-1"
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleClose(); }}
        >
          ×
        </Button>
      </div>
     
      {/* End Enhanced Logo Header */}
      {/* Optionally, keep the rest of the header controls below the logo if needed */}
      <Header
        authed={isAuthenticated}
        user={isAuthenticated ? user : null}
        doLogout={isAuthenticated ? logout : () => {}}
        
      />
      <div className="pt-0 pb-2 px-0 h-[calc(100%-64px)] overflow-hidden rounded-br-2xl">
        {isAuthenticated ? (
          <ContentTabs
            state={state}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            linkedinSubTab={linkedinSubTab}
            setLinkedinSubTab={setLinkedinSubTab}
            linkedinComments={linkedinComments}
            linkedinReactions={linkedinReactions}
            highlight={highlight}
            progressMessages={progressMessages}
            scrapingState={scrapingState}
            serverLimit={serverLimit}
          />
        ) : (
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%'}}>
            <LoginForm login={login} />
          </div>
        )}
      </div>
      {/* Resize handles */}
      {/* Right edge for width */}
      <div
        className="absolute top-0 left-[-8px] w-2 h-full cursor-ew-resize z-[10000] select-none"
        onMouseDown={() => {
          setIsResizing(true);
          setResizeDir('width');
        }}
        title="Resize width"
      />
      {/* Bottom edge for height */}
      <div
        className="absolute bottom-[-8px] left-0 w-full h-2 cursor-ns-resize z-[10000] select-none"
        onMouseDown={() => {
          setIsResizing(true);
          setResizeDir('height');
        }}
        title="Resize height"
      />
    </Card>
  );
}

export default function SidebarPopupWithErrorBoundary() {
  return (
      <ErrorBoundary>
        <SidebarPopup />
      </ErrorBoundary>
  );
}
