
import { useLanguage } from '../contexts/LanguageContext';
import LinkedInTab from './popup/tabs/LinkedInTab';
import WhatsappTab from './popup/tabs/WhatsappTab';

const tabKeys = ['linkedin', 'whatsapp'];
const linkedinSubTabKeys = ['comments', 'reactions', 'reposts', 'followers', 'connections', 'searchPersons'];


import React, { useState, useEffect } from 'react';
import { TargetIQSubTabs, TargetIQTabs } from './ui/targetiq-tabs';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './ui/accordion';
import { Linkedin, MessageCircle } from 'lucide-react';

function ContentTabs(props: any) {
	const {
		state,
		activeTab: propActiveTab,
		setActiveTab: propSetActiveTab,
		linkedinSubTab,
		setLinkedinSubTab,
		linkedinComments,
		linkedinReactions,
		highlight,
		progressMessages,
		scrapingState,
		serverLimit,
		handleExportXLSX,
		handleSendToServer,
		handleStartScraping,
		handleStopScraping,
		handleRestartScraping,
	} = props;

	const { t, lang, setLang } = useLanguage();
	const isState = (s: string, value: string) => s === value;

	// Tab and subtab labels translated
	const tabs = [
		{ key: 'linkedin', label: t('tab_linkedin'), icon: <Linkedin className="w-6 h-6 text-targetiq-primary" /> },
		{ key: 'whatsapp', label: t('tab_whatsapp'), icon: <MessageCircle className="w-6 h-6 text-targetiq-primary" /> },
	];
	const linkedinSubTabs = [
		{ key: 'comments', label: t('subtab.comments') },
		{ key: 'reactions', label: t('subtab.reactions') },
		// { key: 'reposts', label: t('subtab.reposts') },
		// { key: 'followers', label: t('subtab.followers') },
		// { key: 'connections', label: t('subtab.connections')},
		// { key: 'searchPersons', label: t('subtab.searchPersons') },
	];

	// Determine default tab from URL
	const getDefaultTab = () => {
		if (typeof window !== 'undefined') {
			const url = window.location.href.toLowerCase();
			if (url.includes('whatsapp')) return 'whatsapp';
			if (url.includes('linkedin')) return 'linkedin';
		}
		return 'linkedin';
	};

	const [activeAccordion, setActiveAccordion] = propActiveTab !== undefined && propSetActiveTab !== undefined
		? [propActiveTab, propSetActiveTab]
		: useState(getDefaultTab());

	return (
		<div className="px-5 py-4">
			<Accordion type="single" value={activeAccordion} onValueChange={setActiveAccordion} collapsible className="targetiq-card mb-5 p-0 shadow-targetiq-card rounded-2xl">
				{tabs.map(tab => (
					<AccordionItem key={tab.key} value={tab.key} className="border-none">
						<AccordionTrigger className="bg-[var(--targetiq-bg,#F4F6F8)] px-4 py-3 rounded-xl shadow-sm font-bold text-lg flex items-center gap-2">
							{tab.icon}
							<span>{tab.label}</span>
						</AccordionTrigger>
						<AccordionContent className="bg-[var(--targetiq-card,#fff)] px-2 py-2 rounded-xl">
							{tab.key === 'linkedin' && (
								<>
									<TargetIQSubTabs
										tabs={linkedinSubTabs}
										activeTab={linkedinSubTab}
										onTabChange={setLinkedinSubTab}
									/>
									{linkedinSubTab === 'comments' && (
										<LinkedInTab
											activeSubTab={linkedinSubTab}
											linkedinComments={linkedinComments}
											highlight={highlight}
											progressMessages={progressMessages}
											scrapingState={scrapingState}
											serverLimit={serverLimit}
											handleStartScraping={handleStartScraping}
											handleStopScraping={handleStopScraping}
											handleRestartScraping={handleRestartScraping}
											handleExportXLSX={handleExportXLSX}
                                            handleSendToServer={handleSendToServer}
                                            t={t}
										/>
									)}
									{linkedinSubTab === 'reactions' && (
										<LinkedInTab
											activeSubTab={linkedinSubTab}
											linkedinReactions={linkedinReactions}
											highlight={highlight}
											progressMessages={progressMessages}
											scrapingState={scrapingState}
											serverLimit={serverLimit}
											handleStartScraping={handleStartScraping}
											handleStopScraping={handleStopScraping}
											handleRestartScraping={handleRestartScraping}
											handleExportXLSX={handleExportXLSX}
                                            handleSendToServer={handleSendToServer}
                                            t={t}
										/>
									)}
									{/* Add other subtab components as needed */}
								</>
							)}
							{tab.key === 'whatsapp' && <WhatsappTab t={t} />}
						</AccordionContent>
					</AccordionItem>
				))}
			</Accordion>
		</div>
	);
}

export default ContentTabs;
