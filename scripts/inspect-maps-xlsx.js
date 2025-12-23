const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', '..', 'maps.xlsx');
const workbook = XLSX.readFile(filePath);

console.log('Available sheets:', workbook.SheetNames);
console.log('\n');

workbook.SheetNames.forEach(sheetName => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Sheet: "${sheetName}"`);
  console.log('='.repeat(60));
  
  const worksheet = workbook.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
  
  console.log(`Total rows: ${rawData.length}`);
  console.log(`\nFirst 15 rows (showing all columns):`);
  
  // Show first 15 rows
  for (let i = 0; i < Math.min(15, rawData.length); i++) {
    const row = rawData[i];
    console.log(`\nRow ${i}:`);
    row.forEach((cell, colIndex) => {
      if (cell !== '' && cell !== null && cell !== undefined) {
        const cellStr = String(cell).substring(0, 50); // Truncate long values
        console.log(`  Col ${String.fromCharCode(65 + colIndex)} (${colIndex}): ${cellStr}`);
      }
    });
  }
  
  // Look for numeric values that could be coordinates
  console.log(`\n\nSearching for potential coordinates (lat: 25-50, lng: -125 to -65)...`);
  const potentialCoords = [];
  
  for (let i = 0; i < rawData.length; i++) {
    const row = rawData[i];
    for (let j = 0; j < row.length; j++) {
      const val = parseFloat(row[j]);
      if (!isNaN(val)) {
        if (val >= 25 && val <= 50) {
          potentialCoords.push({ row: i, col: j, type: 'lat', value: val });
        }
        if (val <= -65 && val >= -125) {
          potentialCoords.push({ row: i, col: j, type: 'lng', value: val });
        }
      }
    }
  }
  
  if (potentialCoords.length > 0) {
    console.log(`Found ${potentialCoords.length} potential coordinate values:`);
    potentialCoords.slice(0, 20).forEach(coord => {
      console.log(`  Row ${coord.row}, Col ${String.fromCharCode(65 + coord.col)} (${coord.col}): ${coord.type} = ${coord.value}`);
    });
  } else {
    console.log('  No coordinates found in numeric format');
  }
});



