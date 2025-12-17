const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', '..', 'maps.xlsx');
const workbook = XLSX.readFile(filePath);
const worksheet = workbook.Sheets[workbook.SheetNames[0]];

// Get raw data to see all columns
const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

console.log('Total rows:', rawData.length);
console.log('\nFirst 5 rows (all columns):');
rawData.slice(0, 5).forEach((row, i) => {
  console.log(`\nRow ${i}:`);
  row.forEach((cell, j) => {
    const val = String(cell || '').trim();
    if (val) {
      console.log(`  Column ${String.fromCharCode(65 + j)} (${j}): "${val}"`);
    }
  });
});

// Look for numeric columns that could be coordinates
console.log('\n\nAnalyzing numeric columns for coordinates...');
const numericColumns = {};

rawData.forEach((row, rowIndex) => {
  row.forEach((cell, colIndex) => {
    const val = parseFloat(cell);
    if (!isNaN(val) && val !== 0) {
      if (!numericColumns[colIndex]) {
        numericColumns[colIndex] = { values: [], column: String.fromCharCode(65 + colIndex) };
      }
      numericColumns[colIndex].values.push(val);
    }
  });
});

Object.keys(numericColumns).forEach(colIndex => {
  const col = numericColumns[colIndex];
  const values = col.values;
  const min = Math.min(...values);
  const max = Math.max(...values);
  
  // Check if values look like lat (25-31 for Florida) or lng (-80 to -87 for Florida)
  const looksLikeLat = min >= 20 && max <= 35;
  const looksLikeLng = min >= -90 && max <= -75;
  
  if (looksLikeLat || looksLikeLng) {
    console.log(`\nColumn ${col.column} (${colIndex}):`);
    console.log(`  Range: ${min} to ${max}`);
    console.log(`  Looks like: ${looksLikeLat ? 'LATITUDE' : looksLikeLng ? 'LONGITUDE' : 'UNKNOWN'}`);
    console.log(`  Sample values: ${values.slice(0, 5).join(', ')}`);
  }
});

// Also check if there's a header row with "lat", "lng", "latitude", "longitude"
console.log('\n\nChecking for header row with coordinate labels...');
rawData.slice(0, 10).forEach((row, i) => {
  row.forEach((cell, j) => {
    const val = String(cell || '').toLowerCase().trim();
    if (val.includes('lat') || val.includes('lng') || val.includes('longitude') || val.includes('coordinate')) {
      console.log(`Row ${i}, Column ${String.fromCharCode(65 + j)} (${j}): "${cell}"`);
    }
  });
});
