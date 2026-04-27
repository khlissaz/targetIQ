import * as XLSX from 'xlsx';
import type { LeadI, ScrapingI } from '@/lib/types';

export type ExportField =
  | 'name' | 'title' | 'company' | 'location'
  | 'email' | 'phone' | 'website'
  | 'profileLink' | 'status' | 'enrichmentStatus'
  | 'qualificationStatus' | 'trustScore'
  | 'source' | 'collectionName' | 'notes'
  | 'picture' | 'createdAt';

export const ALL_EXPORT_FIELDS: ExportField[] = [
  'name', 'title', 'company', 'location',
  'email', 'phone', 'website',
  'profileLink', 'status', 'enrichmentStatus',
  'qualificationStatus', 'trustScore',
  'source', 'collectionName', 'notes',
  'picture', 'createdAt',
];

export const DEFAULT_EXPORT_FIELDS: ExportField[] = [
  'name', 'title', 'company', 'location',
  'email', 'phone', 'website',
  'profileLink', 'status', 'enrichmentStatus',
  'source', 'collectionName',
];

const FIELD_LABELS: Record<ExportField, string> = {
  name:                'Full Name',
  title:               'Job Title',
  company:             'Company',
  location:            'Location',
  email:               'Email',
  phone:               'Phone',
  website:             'Website',
  profileLink:         'LinkedIn URL',
  status:              'Status',
  enrichmentStatus:    'Enrichment Status',
  qualificationStatus: 'Qualification',
  trustScore:          'Trust Score',
  source:              'Source',
  collectionName:      'Collection',
  notes:               'Notes',
  picture:             'Picture URL',
  createdAt:           'Created At',
};

function safeStr(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function formatDate(value: unknown): string {
  if (!value) return '';
  const d = new Date(String(value));
  return isNaN(d.getTime()) ? safeStr(value) : d.toISOString().slice(0, 10);
}

function extractField(lead: LeadI, field: ExportField, collectionName?: string): string {
  switch (field) {
    case 'name':              return safeStr(lead.profile?.name);
    case 'title':             return safeStr(lead.profile?.job || lead.profile?.caption);
    case 'company':           return safeStr(lead.profile?.company);
    case 'location':          return safeStr(lead.profile?.location);
    case 'email':             return safeStr(lead.profile?.email);
    case 'phone':             return safeStr(lead.profile?.phone);
    case 'website':           return safeStr(
                                lead.profile?.website ||
                                (Array.isArray(lead.profile?.websites) ? lead.profile.websites[0] : '')
                              );
    case 'profileLink':       return safeStr(lead.profile?.profileLink);
    case 'status':            return safeStr(lead.status);
    case 'enrichmentStatus':  return safeStr((lead as any)?.enrichmentStatus || (lead.profile as any)?.enrichmentStatus);
    case 'qualificationStatus': return safeStr((lead as any)?.qualificationStatus || (lead.profile as any)?.qualificationStatus);
    case 'trustScore':        return safeStr((lead as any)?.trustScore ?? (lead.profile as any)?.trustScore);
    case 'source':            return lead.source ? safeStr(lead.source) : (lead.profile?.profileLink ? 'linkedin' : '');
    case 'collectionName':    return safeStr(collectionName);
    case 'notes':             return safeStr(lead.profile?.info);
    case 'picture':           return safeStr(lead.profile?.picture);
    case 'createdAt':         return formatDate((lead as any)?.createdAt);
    default:                  return '';
  }
}

export function buildExportRows(
  leads: LeadI[],
  fields: ExportField[],
  collectionName?: string,
): Record<string, string>[] {
  return leads.map((lead) => {
    const row: Record<string, string> = {};
    for (const field of fields) {
      row[FIELD_LABELS[field]] = extractField(lead, field, collectionName);
    }
    return row;
  });
}

export function exportLeadsXlsx(
  leads: LeadI[],
  fields: ExportField[] = DEFAULT_EXPORT_FIELDS,
  collectionName?: string,
  filename?: string,
): void {
  const rows = buildExportRows(leads, fields, collectionName);
  if (rows.length === 0) rows.push(Object.fromEntries(fields.map((f) => [FIELD_LABELS[f], ''])));

  const sheet = XLSX.utils.json_to_sheet(rows);

  // Auto-width columns
  const colWidths = fields.map((f) => ({
    wch: Math.max(
      FIELD_LABELS[f].length + 2,
      ...rows.map((r) => (r[FIELD_LABELS[f]] || '').length),
    ),
  }));
  sheet['!cols'] = colWidths;

  // Freeze header row
  sheet['!freeze'] = { xSplit: 0, ySplit: 1 };

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, 'Leads');
  XLSX.writeFile(wb, filename || `targetiq-leads-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportLeadsCsv(
  leads: LeadI[],
  fields: ExportField[] = DEFAULT_EXPORT_FIELDS,
  collectionName?: string,
  filename?: string,
): void {
  const rows = buildExportRows(leads, fields, collectionName);
  const headers = fields.map((f) => FIELD_LABELS[f]);

  const csvLines = [
    headers.map((h) => `"${h}"`).join(','),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const val = (row[h] || '').replace(/"/g, '""');
          return `"${val}"`;
        })
        .join(','),
    ),
  ];

  const blob = new Blob(['\uFEFF' + csvLines.join('\r\n')], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `targetiq-leads-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
