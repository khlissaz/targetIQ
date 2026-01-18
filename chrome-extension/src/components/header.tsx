import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';
// Removed Radix DropdownMenu for custom dropdown logic
import { useLanguage } from '../contexts/LanguageContext';

interface HeaderProps {
  authed: boolean;
  user: any;
  doLogout: () => void;
}

export default function Header({ authed, user, doLogout }: HeaderProps) {
  const { t, lang, setLang } = useLanguage();
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const avatarRef = React.useRef<HTMLDivElement>(null);
  // Close dropdown on outside click
  React.useEffect(() => {
    if (!dropdownOpen) return;
    function handleClick(e: MouseEvent) {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [dropdownOpen]);
  return (
    <Card className="flex items-center justify-between w-full min-h-[64px] px-0 py-0 rounded-t-2xl border-b border-[var(--targetiq-grey,#F1F3F6)] shadow-md z-[10001] bg-white">
      {/* Left: TargetIQ Logo */}
      <a
        href="https://targetiq.io"
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center gap-3 min-w-0 pl-4 pr-2 no-underline"
        data-testid="targetiq-brand"
        aria-label="TargetIQ Home"
      >
        <span className="flex items-center font-extrabold font-sans text-[2.1rem] md:text-[2.3rem] text-targetiq-navy tracking-tight leading-none select-none" style={{letterSpacing: '-0.5px'}}>
          <span className="font-bold text-targetiq-navy mr-1">Target</span>
          <span className="font-extrabold text-targetiq-primary flex items-center relative">
            IQ
            <svg width="28" height="18" viewBox="0 0 28 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="ml-1 mt-1 inline-block align-middle drop-shadow-sm">
              <rect x="0" y="7" width="10" height="4" rx="2" fill="#FF6B00"/>
              <rect x="12" y="9" width="8" height="2" rx="1" fill="#FF6B00"/>
              <rect x="22" y="11" width="6" height="2" rx="1" fill="#FF6B00"/>
            </svg>
          </span>
        </span>
      </a>
      {/* Center: Language select and link */}
      <div className="flex-1 flex items-center justify-center gap-4 min-w-0">
        <select
          value={lang}
          onChange={e => setLang(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-1 text-base text-targetiq-navy bg-white font-semibold shadow-sm min-w-[60px]"
          aria-label={t('select_language')}
        >
          <option value="en">{t('lang_en')}</option>
          <option value="ar">{t('lang_ar')}</option>
        </select>
      </div>
      {/* Right: avatar if authed */}
      <div className="flex items-center gap-2 min-w-[48px] justify-end pr-4">
        {authed && user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} ref={avatarRef}>
            <div
              style={{ position: 'relative' }}
              tabIndex={0}
              onMouseEnter={e => {
                const tooltip = (e.currentTarget.querySelector('.avatar-tooltip') as HTMLElement);
                if (tooltip) tooltip.style.opacity = '1';
              }}
              onMouseLeave={e => {
                const tooltip = (e.currentTarget.querySelector('.avatar-tooltip') as HTMLElement);
                if (tooltip) tooltip.style.opacity = '0';
              }}
            >
              <img
                src={user.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.name || 'U') + '&background=FF6B00&color=fff&size=48'}
                alt="Profile"
                style={{ width: 38, height: 38, borderRadius: '50%', border: '2px solid #FF6B00', boxShadow: '0 1px 4px rgba(26,43,60,0.10)', background: '#fff', cursor: 'pointer' }}
                onClick={() => setDropdownOpen(v => !v)}
                aria-label={user.name || 'User'}
              />
              
              {/* Dropdown */}
              {dropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    marginTop: 8,
                    width: 140,
                    background: '#fff',
                    border: '1px solid #F1F3F6',
                    borderRadius: 12,
                    boxShadow: '0 2px 8px rgba(26,43,60,0.10)',
                    zIndex: 20,
                    animation: 'fadein 0.2s',
                  }}
                >
                  <Button
                    variant="ghost"
                    onClick={() => { setDropdownOpen(false); doLogout(); }}
                  >Logout</Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
	);
}
