import React from 'react';
import type { Entry } from '../App';

export function ScraperTable({ entries, highlight }: { entries: Entry[]; highlight: string | null }) {
  return (
    <div className="bg-white rounded shadow p-2 overflow-auto h-64">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#1A2B3C] text-white">
            <th className="p-2">Name</th>
            <th className="p-2">Platform</th>
            <th className="p-2">Details</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => {
            const key = entry.platform + '|' + (entry.phone || entry.name);
            return (
              <tr
                key={key + entry.timestamp}
                className={
                  highlight === key
                    ? 'bg-[#FF6B00]/20 transition-colors'
                    : ''
                }
              >
                <td className="p-2 flex items-center gap-2">
                  {entry.profileUrl && (
                    <img src={entry.profileUrl} alt="profile" className="w-6 h-6 rounded-full" />
                  )}
                  {entry.name}
                </td>
                <td className="p-2">{entry.platform}</td>
                <td className="p-2">
                  {entry.phone && <span>{entry.phone}</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
