export function escapeCsvCell(val) {
  if (val === null || val === undefined) {
    return '';
  }
  let str = String(val);
  
  // Neutralize CSV formula injection
  if (/^[=+\-@]/.test(str)) {
    str = "'" + str;
  }
  
  // Escape quotes and newlines/commas
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    str = `"${str.replace(/"/g, '""')}"`;
  }
  
  return str;
}

export function generateCsv(headers, rows) {
  const BOM = '\uFEFF';
  const headerLine = headers.map(h => escapeCsvCell(h)).join(',');
  const rowLines = rows.map(row => row.map(cell => escapeCsvCell(cell)).join(','));
  return BOM + [headerLine, ...rowLines].join('\n');
}
