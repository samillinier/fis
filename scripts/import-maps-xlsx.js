const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Read the Excel file from project root
const filePath = path.join(__dirname, '..', '..', 'maps.xlsx');

if (!fs.existsSync(filePath)) {
  console.error(`Error: maps.xlsx not found at ${filePath}`);
  console.error('Please ensure maps.xlsx is in the project root folder.');
  process.exit(1);
}

console.log('Reading file from:', filePath);
const workbook = XLSX.readFile(filePath);
console.log('Available sheets:', workbook.SheetNames);

// Extract workrooms from both sheets
const workroomMap = new Map(); // name -> { lat, lng, address? }

// Function to extract workrooms from a sheet
function extractWorkroomsFromSheet(sheetName, worksheet) {
  console.log(`\n📋 Processing sheet: "${sheetName}"`);
  
  const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
  console.log(`   Found ${rawData.length} rows`);
  
  // Try to identify column structure
  // Look for header row
  let headerRowIndex = -1;
  let nameColIndex = -1;
  let latColIndex = -1;
  let lngColIndex = -1;
  let addressColIndex = -1;
  
  // Check first few rows for headers
  for (let i = 0; i < Math.min(5, rawData.length); i++) {
    const row = rawData[i];
    for (let j = 0; j < row.length; j++) {
      const cell = String(row[j] || '').toLowerCase().trim();
      if (cell.includes('name') || cell.includes('workroom') || cell.includes('city') || cell.includes('location')) {
        nameColIndex = j;
        headerRowIndex = i;
      }
      if (cell.includes('lat') || cell === 'latitude') {
        latColIndex = j;
        headerRowIndex = i;
      }
      if (cell.includes('lng') || cell.includes('long') || cell === 'longitude' || cell.includes('lon')) {
        lngColIndex = j;
        headerRowIndex = i;
      }
      if (cell.includes('address') || cell.includes('location')) {
        addressColIndex = j;
        headerRowIndex = i;
      }
    }
  }
  
  // If we found headers, log them
  if (headerRowIndex >= 0) {
    console.log(`   Header row: ${headerRowIndex}`);
    console.log(`   Columns: name=${nameColIndex}, lat=${latColIndex}, lng=${lngColIndex}, address=${addressColIndex}`);
  }
  
  // Process rows (skip header if found)
  const startRow = headerRowIndex >= 0 ? headerRowIndex + 1 : 0;
  let extractedCount = 0;
  
  for (let i = startRow; i < rawData.length; i++) {
    const row = rawData[i];
    if (!row || row.length === 0) continue;
    
    let name = null;
    let lat = null;
    let lng = null;
    let address = null;
    
    // Try to extract name
    if (nameColIndex >= 0 && nameColIndex < row.length) {
      name = String(row[nameColIndex] || '').trim();
    } else {
      // Try common positions: column B (index 1), column G (index 6)
      if (row.length > 1) {
        const potentialName = String(row[1] || '').trim();
        if (potentialName && potentialName.length > 1) {
          name = potentialName;
        }
      }
      if (!name && row.length > 6) {
        name = String(row[6] || '').trim();
      }
    }
    
    // Try to extract coordinates
    if (latColIndex >= 0 && latColIndex < row.length) {
      lat = parseFloat(row[latColIndex]);
    }
    if (lngColIndex >= 0 && lngColIndex < row.length) {
      lng = parseFloat(row[lngColIndex]);
    }
    
    // If coordinates not found in specific columns, search all numeric columns
    if (isNaN(lat) || isNaN(lng)) {
      for (let j = 0; j < row.length; j++) {
        const val = parseFloat(row[j]);
        if (!isNaN(val)) {
          // Latitude range for US (roughly 25-50)
          if (val >= 25 && val <= 50 && isNaN(lat)) {
            lat = val;
          }
          // Longitude range for US (roughly -125 to -65)
          if (val <= -65 && val >= -125 && isNaN(lng)) {
            lng = val;
          }
        }
      }
    }
    
    // Try to extract address
    if (addressColIndex >= 0 && addressColIndex < row.length) {
      address = String(row[addressColIndex] || '').trim();
    } else if (row.length > 7) {
      address = String(row[7] || '').trim();
    }
    
    // Clean up name
    if (name) {
      // Remove "Workroom" suffix
      name = name.replace(/\s*Workroom\s*$/i, '').trim();
      // Capitalize properly
      name = name.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join(' ');
    }
    
    // Add to map if we have valid data
    if (name && !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
      const key = name.toLowerCase();
      if (!workroomMap.has(key)) {
        workroomMap.set(key, { name, lat, lng, address: address || undefined });
        extractedCount++;
      } else {
        // If we already have this workroom but with missing coordinates, update it
        const existing = workroomMap.get(key);
        if (existing && (isNaN(existing.lat) || isNaN(existing.lng))) {
          workroomMap.set(key, { name, lat, lng, address: address || existing.address });
        }
      }
    } else if (name) {
      // Store workroom name even without coordinates for reference
      const key = name.toLowerCase();
      if (!workroomMap.has(key)) {
        workroomMap.set(key, { name, lat: null, lng: null, address: address || undefined });
      }
    }
  }
  
  console.log(`   ✅ Extracted ${extractedCount} workrooms from this sheet`);
  return extractedCount;
}

// Process both sheets
let totalExtracted = 0;

// Look for "FIS WORKROOM" sheet
const fisWorkroomSheet = workbook.SheetNames.find(name => 
  name.toLowerCase().includes('fis') && name.toLowerCase().includes('workroom')
);

// Look for "STORE MAP" sheet
const storeMapSheet = workbook.SheetNames.find(name => 
  name.toLowerCase().includes('store') && name.toLowerCase().includes('map')
);

// Process FIS WORKROOM sheet
if (fisWorkroomSheet) {
  const worksheet = workbook.Sheets[fisWorkroomSheet];
  totalExtracted += extractWorkroomsFromSheet(fisWorkroomSheet, worksheet);
} else {
  console.log('\n⚠️  "FIS WORKROOM" sheet not found. Available sheets:', workbook.SheetNames);
}

// Process STORE MAP sheet
if (storeMapSheet) {
  const worksheet = workbook.Sheets[storeMapSheet];
  totalExtracted += extractWorkroomsFromSheet(storeMapSheet, worksheet);
} else {
  console.log('\n⚠️  "STORE MAP" sheet not found. Available sheets:', workbook.SheetNames);
}

// If sheets not found by name, process all sheets
if (!fisWorkroomSheet && !storeMapSheet) {
  console.log('\n📋 Processing all sheets...');
  workbook.SheetNames.forEach(sheetName => {
    const worksheet = workbook.Sheets[sheetName];
    totalExtracted += extractWorkroomsFromSheet(sheetName, worksheet);
  });
}

// Convert map to array and sort
const workroomCoords = Array.from(workroomMap.values())
  .sort((a, b) => a.name.localeCompare(b.name));

console.log(`\n✅ Total unique workrooms extracted: ${workroomCoords.length}\n`);

// Display extracted workrooms
workroomCoords.forEach(w => {
  if (w.lat && w.lng) {
    console.log(`  ${w.name.padEnd(20)} lat: ${w.lat.toFixed(6).padStart(10)}, lng: ${w.lng.toFixed(6).padStart(11)}${w.address ? ` (${w.address})` : ''}`);
  } else {
    console.log(`  ${w.name.padEnd(20)} [coordinates missing]${w.address ? ` (${w.address})` : ''}`);
  }
});

// Generate TypeScript file
const tsContent = `// Workroom geographic coordinates (latitude, longitude)
// Used for displaying workrooms on a map
// Generated from maps.xlsx (FIS WORKROOM & STORE MAP)

export interface WorkroomCoordinates {
  name: string
  lat: number
  lng: number
}

export const workroomCoordinates: WorkroomCoordinates[] = [
${workroomCoords.filter(w => w.lat && w.lng).map(w => `  { name: '${w.name}', lat: ${w.lat}, lng: ${w.lng} },`).join('\n')}
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

const outputPath = path.join(__dirname, '..', 'data', 'workroomCoordinates.ts');
fs.writeFileSync(outputPath, tsContent, 'utf8');

console.log(`\n✅ Successfully updated ${outputPath}`);
console.log(`   Total workrooms: ${workroomCoords.length}`);

