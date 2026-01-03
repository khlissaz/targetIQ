import React from 'react';

interface LogoProps {
  className?: string;
  showTagline?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = '', showTagline = true }) => {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="flex items-center gap-1">
        <span className="text-4xl font-bold text-[#1A2B3C]">Target</span>
        <span className="text-4xl font-bold text-[#FF6B00]">IQ</span>
        <div className="flex flex-col gap-0.5 ml-1">
          <div className="w-2 h-0.5 bg-[#FF6B00]"></div>
          <div className="w-2 h-0.5 bg-[#FF6B00]"></div>
          <div className="w-2 h-0.5 bg-[#FF6B00]"></div>
        </div>
      </div>
      {showTagline && (
        <p className="text-sm text-gray-600 mt-1">Lead Generation System</p>
      )}
    </div>
  );
};

export const LogoSmall: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <span className="text-2xl font-bold text-[#1A2B3C]">Target</span>
      <span className="text-2xl font-bold text-[#FF6B00]">IQ</span>
      <div className="flex flex-col gap-0.5">
        <div className="w-1.5 h-0.5 bg-[#FF6B00]"></div>
        <div className="w-1.5 h-0.5 bg-[#FF6B00]"></div>
        <div className="w-1.5 h-0.5 bg-[#FF6B00]"></div>
      </div>
    </div>
  );
};
