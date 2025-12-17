const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Read the Excel file - try multiple possible locations
const possiblePaths = [
  path.join(__dirname, '..', 'maps.xlsx'),
  path.join(__dirname, '..', 'data', 'maps.xlsx'),
  path.join(process.cwd(), 'maps.xlsx'),
];

let filePath = null;
for (const p of possiblePaths) {
  if (fs.existsSync(p)) {
    filePath = p;
    break;
  }
}

if (!filePath) {
  console.error('Error: maps.xlsx not found. Tried:');
  possiblePaths.forEach(p => console.error('  -', p));
  console.error('\nPlease ensure maps.xlsx is in the project root or data folder.');
  process.exit(1);
}

console.log('Reading file from:', filePath);

const workbook = XLSX.readFile(filePath);
console.log('Available sheets:', workbook.SheetNames);

// Check all sheets for coordinate data
let sheetName = workbook.SheetNames[0];
let worksheet = workbook.Sheets[sheetName];

// Look for a sheet that might have coordinates
for (const name of workbook.SheetNames) {
  const sheet = workbook.Sheets[name];
  const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  
  // Check if this sheet has numeric data that looks like coordinates
  let hasCoords = false;
  for (let i = 0; i < Math.min(10, rawData.length); i++) {
    const row = rawData[i];
    for (let j = 0; j < row.length; j++) {
      const val = parseFloat(row[j]);
      if (!isNaN(val) && ((val >= 25 && val <= 31) || (val <= -80 && val >= -87))) {
        hasCoords = true;
        break;
      }
    }
    if (hasCoords) break;
  }
  
  if (hasCoords) {
    console.log(`Found sheet with coordinates: ${name}`);
    sheetName = name;
    worksheet = sheet;
    break;
  }
}

// Try reading with header row, and also without to see raw structure
const dataWithHeaders = XLSX.utils.sheet_to_json(worksheet, { header: 1 }); // Raw array format
const data = XLSX.utils.sheet_to_json(worksheet);

console.log('Found', data.length, 'rows');
console.log('\nFirst few rows (raw):');
dataWithHeaders.slice(0, 3).forEach((row, i) => {
  console.log(`Row ${i}:`, row.slice(0, 10).join(' | '));
});

console.log('\nFirst row (parsed):', data[0]);
console.log('\nColumn names:', Object.keys(data[0] || {}));

// Extract workroom coordinates
// The file has workroom addresses, not coordinates
// We'll extract unique workrooms and their addresses, then geocode them
const workrooms = [];
const seenWorkrooms = new Set();
const workroomAddresses = new Map(); // Map workroom name to address

// First, let's try to find the header row and identify columns
let headerRowIndex = 0;
let nameColIndex = -1;
let latColIndex = -1;
let lngColIndex = -1;

// Look for header row that might contain "name", "lat", "lng" or similar
for (let i = 0; i < Math.min(5, dataWithHeaders.length); i++) {
  const row = dataWithHeaders[i];
  for (let j = 0; j < row.length; j++) {
    const cell = String(row[j] || '').toLowerCase().trim();
    if (cell.includes('name') || cell.includes('workroom') || cell.includes('city')) {
      nameColIndex = j;
    }
    if (cell.includes('lat') || cell === 'latitude') {
      latColIndex = j;
    }
    if (cell.includes('lng') || cell.includes('long') || cell === 'longitude') {
      lngColIndex = j;
    }
  }
}

// If we found header indicators, use that row
if (nameColIndex >= 0 || latColIndex >= 0) {
  headerRowIndex = 0;
  console.log(`\nFound columns: name=${nameColIndex}, lat=${latColIndex}, lng=${lngColIndex}`);
}

// Try to extract from raw data
// Based on image description: Column A = ID, Column B = Name, Column C = Lat, Column D = Lng
// But the actual structure might be different, so let's try multiple approaches

// Approach 1: Use raw array data and assume columns by position
dataWithHeaders.forEach((row, index) => {
  if (index === 0 && headerRowIndex === 0) return; // Skip header if we found one
  
  let name = null;
  let lat = null;
  let lng = null;
  
  // Try to find name in columns that contain text (not numbers)
  // Column B (index 1) is often the name
  if (row.length > 1) {
    const potentialName = String(row[1] || '').trim();
    if (potentialName && isNaN(potentialName) && potentialName.length > 1) {
      name = potentialName;
    }
  }
  
  // Get workroom name from column 6 (index 6) - "Ocala Workroom", etc.
  if (row.length > 6 && row[6]) {
    name = String(row[6]).trim();
  }
  
  // Get workroom address from column 7 (index 7) - the central workroom address
  let workroomAddress = null;
  if (row.length > 7 && row[7]) {
    workroomAddress = String(row[7]).trim();
  }
  
  // Clean up name
  if (name) {
    name = name.trim().toUpperCase();
    // Remove "WORKROOM" suffix if present
    name = name.replace(/\s*WORKROOM\s*$/i, '');
    // Capitalize properly (first letter of each word)
    name = name.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  }
  
  // Store unique workroom and its address
  if (name && workroomAddress) {
    const key = name.toLowerCase();
    if (!workroomAddresses.has(key)) {
      workroomAddresses.set(key, workroomAddress);
    }
  }
  
  // Try to find coordinates in any numeric columns
  for (let i = 0; i < row.length; i++) {
    const val = parseFloat(row[i]);
    if (!isNaN(val)) {
      // Check if it looks like a latitude (25-31 for Florida)
      if (val >= 25 && val <= 31 && !lat) {
        lat = val;
      }
      // Check if it looks like a longitude (-80 to -87 for Florida)
      if (val <= -80 && val >= -87 && !lng) {
        lng = val;
      }
    }
  }
  
  // If we found coordinates, add the workroom
  if (name && !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
    const key = name.toLowerCase();
    if (!seenWorkrooms.has(key)) {
      workrooms.push({ name, lat, lng });
      seenWorkrooms.add(key);
    }
  }
});

// If we didn't find coordinates but have addresses, list them for manual geocoding
if (workrooms.length === 0 && workroomAddresses.size > 0) {
  console.log('\n⚠️  No coordinates found in file. Found workroom addresses:');
  workroomAddresses.forEach((address, name) => {
    console.log(`  ${name}: ${address}`);
  });
  console.log('\nPlease provide coordinates or I can help geocode these addresses.');
}

console.log('\nExtracted workrooms:');
workrooms.forEach(w => console.log(`  ${w.name}: ${w.lat}, ${w.lng}`));

// Generate TypeScript file content
const tsContent = `// Workroom geographic coordinates (latitude, longitude)
// Used for displaying workrooms on a map
// Generated from maps.xlsx

export interface WorkroomCoordinates {
  name: string
  lat: number
  lng: number
}

export const workroomCoordinates: WorkroomCoordinates[] = [
${workrooms.map(w => `  { name: '${w.name}', lat: ${w.lat}, lng: ${w.lng} },`).join('\n')}
]

// Helper function to get coordinates for a workroom name
export function getWorkroomCoordinates(workroomName: string): WorkroomCoordinates | null {
  const normalized = workroomName.trim()
  return workroomCoordinates.find(w => w.name === normalized) || null
}

// Get center point for all workrooms (for map initial view)
export function getMapCenter(): { lat: number; lng: number } {
  if (workroomCoordinates.length === 0) {
    return { lat: 28.5, lng: -82.0 } // Default to central Florida
  }
  
  const avgLat = workroomCoordinates.reduce((sum, w) => sum + w.lat, 0) / workroomCoordinates.length
  const avgLng = workroomCoordinates.reduce((sum, w) => sum + w.lng, 0) / workroomCoordinates.length
  
  return { lat: avgLat, lng: avgLng }
}
`;

// Write to file
const outputPath = path.join(__dirname, '..', 'data', 'workroomCoordinates.ts');
fs.writeFileSync(outputPath, tsContent, 'utf8');

console.log(`\n✅ Successfully updated ${outputPath}`);
console.log(`   Total workrooms: ${workrooms.length}`);
