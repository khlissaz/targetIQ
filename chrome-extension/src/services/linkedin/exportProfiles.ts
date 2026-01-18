
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export function exportProfilesToExcel(data: any[]) {
  if (data.length === 0) {
    alert('No profiles to export yet.');
    return;
  }

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Profiles');
  const blob = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  saveAs(new Blob([blob]), 'LinkedIn_Profiles.xlsx');
}
