import React, { useState } from 'react';
import CommentTab from './subtabs/CommentTab';
import ReactionTab from './subtabs/ReactionTab';
import RepostTab from './subtabs/RepostTab';
import FollowerTab from './subtabs/FollowerTab';
import ConnectionTab from './subtabs/ConnectionTab';
import SearchPersonsTab from './subtabs/SearchPersonsTab';
import { Card } from '../../ui/card';

import { sendScrapeLinkedInData } from '@/services/apiClient';
import { exportProfilesToExcel } from '@/services/linkedin/exportProfiles';

interface LinkedInTabProps {
  activeSubTab: string;
  setActiveSubTab?: (tab: string) => void;
  t: (key: string) => string;
  linkedinComments?: any[];
  linkedinReactions?: any[];
  serverLimit?: number;
  highlight?: string;
  progressMessages?: string[];
  scrapingState?: string;
  handleStartScraping?: () => void;
  handleStopScraping?: () => void;
  handleRestartScraping?: () => void;
  handleExportXLSX?: () => void;
  handleSendToServer?: () => void;
}

export default function LinkedInTab(props: LinkedInTabProps) {


  const { activeSubTab, setActiveSubTab, t, serverLimit, highlight, progressMessages, scrapingState, handleStartScraping, handleStopScraping, handleRestartScraping } = props;
  // LIFT STATE UP
  const [linkedinComments, setLinkedinComments] = useState<any[]>(props.linkedinComments || []);
  const [linkedinReactions, setLinkedinReactions] = useState<any[]>(props.linkedinReactions || []);

  // Shared export handler
  const handleExportXLSX = async (type: string) => {
    if (type === 'comments') {
      exportProfilesToExcel(linkedinComments);
    } else if (type === 'reactions') {
      exportProfilesToExcel(linkedinReactions);
    }
    // Add more types as needed
  };

  // Shared send handler
  const handleSendToServer = async (type: string) => {
    console.log("LinkedInTab props:", props);
    if (type === 'comments') {
      await sendScrapeLinkedInData({
        sourceType: 'comment',
        data: linkedinComments,
      });
    } else if (type === 'reactions') {
      await sendScrapeLinkedInData({
        sourceType: 'reaction',
        data: linkedinReactions,
      });
    }
    // Add more types as needed
  };

  // Handler to activate Comments subtab
  const activateCommentsTab = () => {
    if (setActiveSubTab) setActiveSubTab('comments');
  };

  switch (activeSubTab) {
    case 'comments':
      return (
        <Card>
          <CommentTab
            {...props}
            linkedinComments={linkedinComments}
            setLinkedinComments={setLinkedinComments}
            t={t}
            serverLimit={serverLimit}
            highlight={highlight}
            progressMessages={progressMessages}
            scrapingState={scrapingState}
            handleStartScraping={handleStartScraping}
            handleStopScraping={handleStopScraping}
            handleRestartScraping={handleRestartScraping}
            handleExportXLSX={() => handleExportXLSX('comments')}
            handleSendToServer={() => handleSendToServer('comments')}
          />
        </Card>
      );
    case 'reactions':
      return (
        <Card>
          <ReactionTab
            {...props}
            linkedinReactions={linkedinReactions}
            setLinkedinReactions={setLinkedinReactions}
            t={t}
            serverLimit={serverLimit}
            highlight={highlight}
            progressMessages={progressMessages}
            scrapingState={scrapingState}
            handleStartScraping={handleStartScraping}
            handleStopScraping={handleStopScraping}
            handleRestartScraping={handleRestartScraping}
            handleExportXLSX={() => handleExportXLSX('reactions')}
            handleSendToServer={() => handleSendToServer('reactions')}
          />
        </Card>
      );
    // case 'reposts':
    //   return <Card><RepostTab t={t} serverLimit={serverLimit} highlight={highlight} progressMessages={progressMessages} scrapingState={scrapingState} handleStartScraping={handleStartScraping} handleStopScraping={handleStopScraping} handleRestartScraping={handleRestartScraping} /></Card>;
    // case 'followers':
    //   return <Card><FollowerTab t={t} serverLimit={serverLimit} highlight={highlight} progressMessages={progressMessages} scrapingState={scrapingState} handleStartScraping={handleStartScraping} handleStopScraping={handleStopScraping} handleRestartScraping={handleRestartScraping} /></Card>;
    // case 'connections':
    //   return <Card><ConnectionTab t={t} serverLimit={serverLimit} highlight={highlight} progressMessages={progressMessages} scrapingState={scrapingState} handleStartScraping={handleStartScraping} handleStopScraping={handleStopScraping} handleRestartScraping={handleRestartScraping} /></Card>;
    // case 'searchPersons':
    //   return <Card><SearchPersonsTab t={t} serverLimit={serverLimit} highlight={highlight} progressMessages={progressMessages} scrapingState={scrapingState} handleStartScraping={handleStartScraping} handleStopScraping={handleStopScraping} handleRestartScraping={handleRestartScraping} /></Card>;
    default:
      return (
        <Card>
          <CommentTab
            {...props}
            linkedinComments={linkedinComments}
            setLinkedinComments={setLinkedinComments}
            t={t}
            serverLimit={serverLimit}
            highlight={highlight}
            progressMessages={progressMessages}
            scrapingState={scrapingState}
            handleStartScraping={handleStartScraping}
            handleStopScraping={handleStopScraping}
            handleRestartScraping={handleRestartScraping}
            handleExportXLSX={() => handleExportXLSX('comments')}
            handleSendToServer={() => handleSendToServer('comments')}
            activateCommentsTab={activateCommentsTab}
          />
        </Card>
      );
  }
}
