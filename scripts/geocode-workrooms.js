const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Known coordinates for workrooms (from addresses or previous data)
// Includes workrooms from Excel file and any additional workrooms that might be in the system
const knownCoordinates = {
  'Ocala': { lat: 28.8603, lng: -82.0365 }, // 3382 NE 34th Ave, Wildwood, FL 34785
  'Gainesville': { lat: 29.6516, lng: -82.3248 }, // 1610 NW 55th Place, Gainesville, FL
  'Tallahassee': { lat: 30.4383, lng: -84.2807 }, // 4329 Pensacola, Tallahassee, FL
  'Albany': { lat: 31.5785, lng: -84.1557 }, // 2325 East Broad Avenue, Albany, GA
  'Panama City': { lat: 30.1588, lng: -85.6602 }, // 2009 Poplar PL, Panama City, FL
  'Dothan': { lat: 31.2232, lng: -85.3905 }, // 131 Wood Drive, Dothan, AL
  // Additional workrooms that might be in the system
  'Lakeland': { lat: 28.0395, lng: -81.9498 },
  'Tampa': { lat: 27.9506, lng: -82.4572 },
  'Naples': { lat: 26.1420, lng: -81.7948 },
  'Sarasota': { lat: 27.3364, lng: -82.5307 },
};

// Geocoding function - matches workroom names to known coordinates
function geocodeAddress(address, workroomName) {
  // First try to match by workroom name
  if (knownCoordinates[workroomName]) {
    return knownCoordinates[workroomName];
  }
  
  // Try to match by city in address
  const addressLower = address.toLowerCase();
  for (const [name, coords] of Object.entries(knownCoordinates)) {
    if (addressLower.includes(name.toLowerCase())) {
      return coords;
    }
  }
  
  return null;
}

const filePath = path.join(__dirname, '..', '..', 'maps.xlsx');
const workbook = XLSX.readFile(filePath);
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

console.log('Extracting workrooms from maps.xlsx...\n');

const workroomMap = new Map(); // name -> { lat, lng, address }

// Process all rows
rawData.forEach((row, index) => {
  if (!row || row.length < 8) return;
  
  // Column G (index 6) = Workroom name
  // Column H (index 7) = Workroom address
  const workroomNameRaw = String(row[6] || '').trim();
  const workroomAddress = String(row[7] || '').trim();
  
  if (!workroomNameRaw || !workroomAddress) return;
  
  // Clean workroom name
  let workroomName = workroomNameRaw.replace(/\s*Workroom\s*$/i, '').trim();
  workroomName = workroomName.split(' ').map(w => 
    w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
  ).join(' ');
  
  // Store unique workroom with its address
  const key = workroomName.toLowerCase();
  if (!workroomMap.has(key)) {
    workroomMap.set(key, { name: workroomName, address: workroomAddress });
  }
});

console.log(`Found ${workroomMap.size} unique workrooms:\n`);

// Geocode addresses
const workroomCoords = [];

for (const [key, workroom] of workroomMap.entries()) {
  // Try to geocode
  const coords = geocodeAddress(workroom.address, workroom.name);
  
  if (coords) {
    workroomCoords.push({
      name: workroom.name,
      lat: coords.lat,
      lng: coords.lng,
      address: workroom.address
    });
    console.log(`✅ ${workroom.name.padEnd(20)} ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`);
  } else {
    console.log(`⚠️  ${workroom.name.padEnd(20)} [needs geocoding] ${workroom.address}`);
    // Still add it but we'll need to geocode manually
    workroomCoords.push({
      name: workroom.name,
      lat: null,
      lng: null,
      address: workroom.address
    });
  }
}

// Add any additional known workrooms that weren't in the Excel file
// (e.g., workrooms that exist in the system but weren't in this particular Excel file)
const additionalWorkrooms = ['Lakeland', 'Tampa', 'Naples', 'Sarasota'];
additionalWorkrooms.forEach(name => {
  const key = name.toLowerCase();
  if (!workroomMap.has(key) && knownCoordinates[name]) {
    workroomCoords.push({
      name: name,
      lat: knownCoordinates[name].lat,
      lng: knownCoordinates[name].lng,
      address: undefined
    });
    console.log(`➕ Added ${name.padEnd(20)} ${knownCoordinates[name].lat.toFixed(6)}, ${knownCoordinates[name].lng.toFixed(6)} (not in Excel)`);
  }
});

// Sort alphabetically
workroomCoords.sort((a, b) => a.name.localeCompare(b.name));

console.log(`\n✅ Extracted ${workroomCoords.filter(w => w.lat && w.lng).length} workrooms with coordinates`);
console.log(`⚠️  ${workroomCoords.filter(w => !w.lat || !w.lng).length} workrooms need manual geocoding\n`);

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

console.log(`✅ Successfully updated ${outputPath}`);

// List workrooms that need geocoding
const needsGeocoding = workroomCoords.filter(w => !w.lat || !w.lng);
if (needsGeocoding.length > 0) {
  console.log(`\n⚠️  Workrooms that need coordinates:`);
  needsGeocoding.forEach(w => {
    console.log(`  ${w.name}: ${w.address}`);
  });
}

