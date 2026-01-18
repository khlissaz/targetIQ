import React, { useEffect } from 'react';
import SidebarPopup from '@/components/SidebarPopup';
import { injectComponentByPageType } from './injections/injectCompanentByPageType';
import { TooltipProvider } from './components/ui/tooltip';

const App = () => {
  useEffect(() => {
    injectComponentByPageType();
  }, []);
  return <TooltipProvider> <SidebarPopup /> </TooltipProvider>;
};

export default App;
