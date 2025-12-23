const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Known coordinates for workrooms
const knownCoordinates = {
  'Ocala': { lat: 28.8603, lng: -82.0365 },
  'Gainesville': { lat: 29.6516, lng: -82.3248 },
  'Tallahassee': { lat: 30.4383, lng: -84.2807 },
  'Albany': { lat: 31.5785, lng: -84.1557 },
  'Panama City': { lat: 30.1588, lng: -85.6602 },
  'Dothan': { lat: 31.2232, lng: -85.3905 },
  'Lakeland': { lat: 28.0395, lng: -81.9498 },
  'Tampa': { lat: 27.9506, lng: -82.4572 },
  'Naples': { lat: 26.1420, lng: -81.7948 },
  'Sarasota': { lat: 27.3364, lng: -82.5307 },
};

const filePath = path.join(__dirname, '..', '..', 'maps.xlsx');
if (!fs.existsSync(filePath)) {
  console.error(`❌ Excel file not found: ${filePath}`);
  process.exit(1);
}

console.log(`📖 Reading Excel file: ${filePath}\n`);

const workbook = XLSX.readFile(filePath);
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

console.log(`Found ${rawData.length} rows\n`);

// Extract unique workrooms from column G (index 6)
// Use first store address for each workroom as reference
const workroomMap = new Map(); // workroom name -> { address, city, state }

rawData.forEach((row, index) => {
  if (!row || row.length < 7) return;
  
  // Column G (index 6) = Workroom name
  const workroomNameRaw = String(row[6] || '').trim();
  if (!workroomNameRaw) return;
  
  // Clean workroom name (remove "Workroom" suffix)
  let workroomName = workroomNameRaw.replace(/\s*Workroom\s*$/i, '').trim();
  workroomName = workroomName.split(' ').map(w => 
    w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
  ).join(' ');
  
  // Get store address info (columns A, B, C = address, city, state)
  const storeAddress = String(row[0] || '').trim();
  const city = String(row[1] || '').trim();
  const state = String(row[2] || '').trim();
  
  // Store first occurrence of each workroom with its reference address
  const key = workroomName.toLowerCase();
  if (!workroomMap.has(key)) {
    workroomMap.set(key, {
      name: workroomName,
      address: storeAddress,
      city: city,
      state: state,
      fullAddress: `${storeAddress}, ${city}, ${state}`.trim()
    });
  }
});

console.log(`Found ${workroomMap.size} unique workrooms:\n`);

// Process workrooms and get coordinates
const workroomCoords = [];

workroomMap.forEach((workroom, key) => {
  // Check if we have known coordinates
  if (knownCoordinates[workroom.name]) {
    workroomCoords.push({
      name: workroom.name,
      lat: knownCoordinates[workroom.name].lat,
      lng: knownCoordinates[workroom.name].lng,
    });
    console.log(`✅ ${workroom.name.padEnd(20)} ${knownCoordinates[workroom.name].lat.toFixed(6)}, ${knownCoordinates[workroom.name].lng.toFixed(6)} (known)`);
  } else {
    // Try to match by city name
    const cityLower = workroom.city.toLowerCase();
    let found = false;
    for (const [name, coords] of Object.entries(knownCoordinates)) {
      if (cityLower.includes(name.toLowerCase())) {
        workroomCoords.push({
          name: workroom.name,
          lat: coords.lat,
          lng: coords.lng,
        });
        console.log(`✅ ${workroom.name.padEnd(20)} ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)} (matched by city: ${name})`);
        found = true;
        break;
      }
    }
    
    if (!found) {
      console.log(`⚠️  ${workroom.name.padEnd(20)} [needs coordinates] ${workroom.fullAddress}`);
      // Still add with null coordinates - will need manual update
      workroomCoords.push({
        name: workroom.name,
        lat: null,
        lng: null,
      });
    }
  }
});

// Sort alphabetically
workroomCoords.sort((a, b) => a.name.localeCompare(b.name));

const validCoords = workroomCoords.filter(w => w.lat && w.lng);
console.log(`\n✅ Extracted ${validCoords.length} workrooms with coordinates`);
console.log(`⚠️  ${workroomCoords.length - validCoords.length} workrooms need manual coordinates\n`);

// Generate TypeScript file
const tsContent = `// Workroom geographic coordinates (latitude, longitude)
// Used for displaying workrooms on a map
// Generated from maps.xlsx - workrooms extracted from column G
// Last updated: ${new Date().toISOString()}

export interface WorkroomCoordinates {
  name: string
  lat: number
  lng: number
}

export const workroomCoordinates: WorkroomCoordinates[] = [
${validCoords.map(w => `  { name: '${w.name}', lat: ${w.lat}, lng: ${w.lng} },`).join('\n')}
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

console.log(`✅ Successfully updated ${outputPath}`);

// List workrooms that need coordinates
const needsCoords = workroomCoords.filter(w => !w.lat || !w.lng);
if (needsCoords.length > 0) {
  console.log(`\n⚠️  Workrooms that need coordinates:`);
  workroomMap.forEach((w, key) => {
    const needs = needsCoords.find(nc => nc.name.toLowerCase() === key);
    if (needs) {
      console.log(`  ${w.name}: ${w.fullAddress}`);
    }
  });
}
