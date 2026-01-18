import React, { useState } from 'react';
import {
	Table,
	TableHeader,
	TableBody,
	TableRow,
	TableHead,
	TableCell,
} from '@/components/ui/table';
import { useLanguage } from '../../../contexts/LanguageContext';
import { Card } from '@/components/ui/card';

export type Entry = {
	name: string;
	phone?: string;
	profileUrl?: string;
	platform: string;
	text?: string;
	timestamp: number;
};

interface ScraperTableProps {
	entries: Entry[];
	highlight?: string | null;
	progressMessages?: string[];
}

export function ScraperTable({ entries, highlight = null, progressMessages = [] }: ScraperTableProps) {
	const { t } = useLanguage();
	const [sortKey, setSortKey] = useState<'timestamp' | 'name' | 'platform'>('timestamp');
	const [sortAsc, setSortAsc] = useState(false);
	const [filter, setFilter] = useState('');
	const [page, setPage] = useState(1);
	const rowsPerPage = 10;
	const [expandedRows, setExpandedRows] = useState<{ [key: number]: boolean }>({});

	// Find all columns with data
	const columns = [
		{ key: 'name', label: t('scraperTable.name'), always: true },
		{ key: 'platform', label: t('scraperTable.platform'), always: true },
		{ key: 'phone', label: t('scraperTable.phone'), show: entries.some(e => !!e.phone) },
		{ key: 'profileUrl', label: t('scraperTable.profile'), show: entries.some(e => !!e.profileUrl) },
		{ key: 'text', label: t('scraperTable.text'), show: entries.some(e => !!e.text) },
		{ key: 'timestamp', label: t('scraperTable.timestamp'), always: true },
		{ key: 'delete', label: t('scraperTable.delete'), always: true },
	];
	const visibleColumns = columns.filter(col => col.always || col.show);

	if (!entries.length) {
		return <div className="text-gray-400 italic mt-4">{t('scraperTable.noData')}</div>;
	}

	// Filtering
	const filtered = entries.filter(e =>
		(e.name && e.name.toLowerCase().includes(filter.toLowerCase())) ||
		(e.phone && e.phone.toLowerCase().includes(filter.toLowerCase())) ||
		(e.platform && e.platform.toLowerCase().includes(filter.toLowerCase()))
	);

	// Sorting
	const sorted = [...filtered].sort((a, b) => {
		if (sortKey === 'timestamp') return sortAsc ? a.timestamp - b.timestamp : b.timestamp - a.timestamp;
		if (sortKey === 'name') return sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
		if (sortKey === 'platform') return sortAsc ? a.platform.localeCompare(b.platform) : b.platform.localeCompare(a.platform);
		return 0;
	});

	// Pagination
	const totalPages = Math.max(1, Math.ceil(sorted.length / rowsPerPage));
	const paginated = sorted.slice((page - 1) * rowsPerPage, page * rowsPerPage);

	// Expand/collapse text
	const toggleExpand = (idx: number) => {
		setExpandedRows(prev => ({ ...prev, [idx]: !prev[idx] }));
	};

	// Row deletion (stub)
	const handleDelete = (idx: number) => {
		// Implement row deletion logic if needed
	};

	return (
		<Card className="mt-3 p-5 w-full  bg-white rounded-2xl shadow-lg border border-gray-100">
			{progressMessages.length > 0 && (
				<div className="text-brand-orange font-semibold mb-2 text-base">{progressMessages[0]}</div>
			)}
			<div className="overflow-auto max-h-[70vh] max-w-[10]">
				<Table className="min-w-full max-w-[300px] table-auto">
					<TableHeader>
						<TableRow className="bg-brand-dark font-bold text-lg tracking-wide">
							{visibleColumns.map(col => (
								<TableHead
									key={col.key}
									className={col.key === 'name' || col.key === 'platform' ? 'cursor-pointer' : ''}
									onClick={col.key === 'name' ? () => { setSortKey('name'); setSortAsc(sortKey === 'name' ? !sortAsc : true); } : col.key === 'platform' ? () => { setSortKey('platform'); setSortAsc(sortKey === 'platform' ? !sortAsc : true); } : undefined}
								>
									{col.label}
									{sortKey === col.key && (sortAsc ? ' ▲' : ' ▼')}
								</TableHead>
							))}
						</TableRow>
					</TableHeader>
					<TableBody>
						{paginated.map((entry, idx) => {
							const key = entry.platform + '|' + (entry.phone || entry.name);
							const isHighlighted = highlight === key;
							return (
								<TableRow
									key={key + entry.timestamp}
									className={
										isHighlighted
											? 'bg-brand-orange/10 transition-colors border-b border-gray-200 h-16'
											: idx % 2 === 0
											? 'bg-gray-50 transition-colors border-b border-gray-200 h-16'
											: 'bg-white transition-colors border-b border-gray-200 h-16'
									}
								>
									{visibleColumns.map(col => {
										if (col.key === 'name') {
											return (
												<TableCell key="name" className="min-w-[160px] h-14 flex items-center gap-3">
													{entry.profileUrl ? (
														<img
															src={entry.profileUrl}
															alt="profile"
															className="w-10 h-10 rounded-full object-cover shadow-md border-2 border-gray-200 bg-gray-50 mr-2 inline-block align-middle"
														/>
													) : (
														<div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-lg mr-2">?</div>
													)}
													<span className="font-semibold text-base align-middle">{entry.name}</span>
												</TableCell>
											);
										}
										if (col.key === 'platform') {
											return <TableCell key="platform">{entry.platform}</TableCell>;
										}
										if (col.key === 'phone') {
											return <TableCell key="phone">{entry.phone ? <span>{entry.phone}</span> : <span className="text-gray-400">{t('scraperTable.na')}</span>}</TableCell>;
										}
										if (col.key === 'profileUrl') {
											return (
												<TableCell key="profileUrl">
													{entry.profileUrl ? (
														<a href={entry.profileUrl} target="_blank" rel="noopener noreferrer" className="text-brand-link underline">{t('scraperTable.profileLink')}</a>
													) : (
														<span className="text-gray-400">{t('scraperTable.na')}</span>
													)}
												</TableCell>
											);
										}
										if (col.key === 'text') {
											return (
												<TableCell key="text">
													{entry.text && entry.text.length > 20 ? (
														!expandedRows[idx] ? (
															<>
																{entry.text.slice(0, 20)}...
																<button className="text-brand-link bg-none border-none cursor-pointer text-xs ml-1" onClick={() => toggleExpand(idx)}>{t('scraperTable.readMore')}</button>
															</>
														) : (
															<>
																{entry.text}
																<button className="text-brand-orange bg-none border-none cursor-pointer text-xs ml-1" onClick={() => toggleExpand(idx)}>{t('scraperTable.showLess')}</button>
															</>
														)
													) : (
														entry.text || <span className="text-gray-400">{t('scraperTable.na')}</span>
													)}
												</TableCell>
											);
										}
										if (col.key === 'timestamp') {
											return <TableCell key="timestamp" className="text-xs text-gray-500">{new Date(entry.timestamp).toLocaleString()}</TableCell>;
										}
										if (col.key === 'delete') {
											return (
												<TableCell key="delete" className="text-center">
													<button onClick={() => handleDelete(idx)} className="bg-none border-none text-red-600 cursor-pointer text-lg" title={t('scraperTable.deleteRow')}>🗑️</button>
												</TableCell>
											);
										}
										return null;
									})}
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
			</div>
			<div className="flex justify-center items-center gap-2 mt-2">
				<button disabled={page === 1} onClick={() => setPage(page - 1)} className={`bg-gray-200 border-none rounded px-2 py-1 text-sm ${page === 1 ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>{t('scraperTable.prev')}</button>
				<span className="font-semibold text-brand-orange">{t('scraperTable.page')} {page} / {totalPages}</span>
				<button disabled={page === totalPages} onClick={() => setPage(page + 1)} className={`bg-gray-200 border-none rounded px-2 py-1 text-sm ${page === totalPages ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>{t('scraperTable.next')}</button>
			</div>
		</Card>
	);
}


