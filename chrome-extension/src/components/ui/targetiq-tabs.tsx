import * as React from 'react';
import { Card } from './card';

export interface TabsProps {
  tabs: { key: string; label: React.ReactNode; icon?: React.ReactNode }[];
  activeTab: string;
  onTabChange: (key: string) => void;
  className?: string;
}

export function TargetIQTabs({ tabs, activeTab, onTabChange, className }: TabsProps) {
  return (
    <Card className={`flex flex-wrap gap-2 px-3 py-2 sm:px-6 sm:py-3 border-b border-targetiq-grey bg-gradient-to-r from-[#fff] via-[#FFF7F0] to-[#F4F6F8] rounded-2xl shadow-[0_8px_36px_0_rgba(26,43,60,0.13)] mb-0 font-sans items-center ${className || ''}`}>
      <nav className="flex flex-1 gap-1 sm:gap-2 min-w-0" role="tablist">
        {tabs.map((tab) => (
          <div
            key={tab.key}
            role="tab"
            aria-selected={activeTab === tab.key}
            aria-controls={`sidebar-tabpanel-${tab.key}`}
            tabIndex={activeTab === tab.key ? 0 : -1}
            onClick={() => onTabChange(tab.key)}
            onKeyDown={e => { if ((e.key === 'Enter' || e.key === ' ') && activeTab !== tab.key) onTabChange(tab.key); }}
            className={`flex-1 min-w-[90px] sm:min-w-[120px] max-w-[140px] sm:max-w-[220px] py-2 px-1 sm:px-0 rounded-xl font-extrabold text-[15px] sm:text-[18px] flex items-center justify-center gap-1 sm:gap-2 transition-all duration-200 border-2 cursor-pointer select-none uppercase tracking-wide outline-none focus-visible:ring-2 focus-visible:ring-targetiq-primary focus-visible:ring-offset-2 ${activeTab === tab.key
              ? 'bg-gradient-to-r from-targetiq-primary via-[#FF8C1A] to-[#FF6B00] text-white border-targetiq-primary shadow-2xl scale-105 ring-2 ring-targetiq-primary'
              : 'bg-white text-targetiq-navy border-targetiq-grey hover:bg-gradient-to-r hover:from-[#FFF7F0] hover:to-[#F4F6F8] hover:text-targetiq-primary hover:border-targetiq-primary/60 hover:scale-105'}
            `}
            style={{boxShadow: activeTab === tab.key ? '0 12px 32px 0 rgba(255,107,0,0.18)' : undefined, letterSpacing: 1.1}}
          >
            {tab.icon && <span className="text-lg sm:text-xl mr-1 drop-shadow-md">{tab.icon}</span>}
            <span className="tracking-tight drop-shadow-md">{tab.label}</span>
          </div>
        ))}
      </nav>
    </Card>
  );
}

export interface SubTabsProps {
  tabs: { key: string; label: React.ReactNode }[];
  activeTab: string;
  onTabChange: (key: string) => void;
  className?: string;
}

export function TargetIQSubTabs({ tabs, activeTab, onTabChange, className }: SubTabsProps) {
  return (
    <div className={`flex flex-wrap gap-1 sm:gap-2 mb-4 ${className || ''}`} role="tablist">
      {tabs.map(subTab => (
        <div
          key={subTab.key}
          role="tab"
          aria-selected={subTab.key === activeTab}
          tabIndex={subTab.key === activeTab ? 0 : -1}
          onClick={() => onTabChange(subTab.key)}
          onKeyDown={e => { if ((e.key === 'Enter' || e.key === ' ') && activeTab !== subTab.key) onTabChange(subTab.key); }}
          className={`flex-1 min-w-[70px] sm:min-w-[100px] max-w-[120px] sm:max-w-[180px] py-1 px-0 sm:py-1.5 rounded-lg font-semibold text-[13px] sm:text-[15px] flex items-center justify-center gap-1 transition-all duration-200 border cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-targetiq-primary focus-visible:ring-offset-2 ${subTab.key === activeTab
            ? 'bg-gradient-to-r from-[#FFF7F0] via-[#FFECDB] to-[#FFF7F0] text-targetiq-primary border-targetiq-primary shadow-lg scale-100'
            : 'bg-targetiq-grey text-targetiq-navy border-transparent hover:bg-gradient-to-r hover:from-[#f1f3f6] hover:to-[#FFF7F0] hover:text-targetiq-primary hover:border-targetiq-primary/30 hover:scale-100'}
          `}
          style={{ fontWeight: subTab.key === activeTab ? 600 : 500, boxShadow: subTab.key === activeTab ? '0 4px 12px 0 rgba(255,107,0,0.10)' : undefined, letterSpacing: 0.2 }}
        >
          <span className="tracking-tight drop-shadow-md">{subTab.label}</span>
        </div>
      ))}
    </div>
  );
}
