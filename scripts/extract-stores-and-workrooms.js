const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Known coordinates for workrooms
const knownWorkroomCoordinates = {
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
const workbook = XLSX.readFile(filePath);
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

console.log('Extracting workrooms and stores from maps.xlsx...\n');

// Extract workrooms (unique)
const workroomMap = new Map();
const stores = [];

// Process all rows
rawData.forEach((row, index) => {
  if (!row || row.length < 8) return;
  
  // Column A (0) = Store address
  // Column B (1) = City
  // Column C (2) = State
  // Column D (3) = Zip
  // Column E (4) = Store name
  // Column F (5) = Store number
  // Column G (6) = Workroom name
  // Column H (7) = Workroom address
  
  const storeAddress = String(row[0] || '').trim();
  const city = String(row[1] || '').trim();
  const state = String(row[2] || '').trim();
  const zip = String(row[3] || '').trim();
  const storeName = String(row[4] || '').trim();
  const storeNumber = String(row[5] || '').trim();
  const workroomNameRaw = String(row[6] || '').trim();
  const workroomAddress = String(row[7] || '').trim();
  
  // Extract workroom
  if (workroomNameRaw && workroomAddress) {
    let workroomName = workroomNameRaw.replace(/\s*Workroom\s*$/i, '').trim();
    workroomName = workroomName.split(' ').map(w => 
      w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
    ).join(' ');
    
    const key = workroomName.toLowerCase();
    if (!workroomMap.has(key)) {
      workroomMap.set(key, { name: workroomName, address: workroomAddress });
    }
  }
  
  // Extract store
  if (storeAddress && storeName && storeNumber) {
    stores.push({
      address: storeAddress,
      city: city,
      state: state,
      zip: zip,
      name: storeName,
      number: storeNumber,
      workroom: workroomNameRaw ? workroomNameRaw.replace(/\s*Workroom\s*$/i, '').trim() : '',
      fullAddress: `${storeAddress}, ${city}, ${state} ${zip}`.trim()
    });
  }
});

console.log(`Found ${workroomMap.size} unique workrooms`);
console.log(`Found ${stores.length} stores\n`);

// Process workrooms
const workroomCoords = [];

for (const [key, workroom] of workroomMap.entries()) {
  const coords = knownWorkroomCoordinates[workroom.name];
  if (coords) {
    workroomCoords.push({
      name: workroom.name,
      lat: coords.lat,
      lng: coords.lng,
      address: workroom.address
    });
    console.log(`✅ Workroom: ${workroom.name.padEnd(20)} ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`);
  }
}

// Add additional workrooms not in Excel
const additionalWorkrooms = ['Lakeland', 'Tampa', 'Naples', 'Sarasota'];
additionalWorkrooms.forEach(name => {
  const key = name.toLowerCase();
  if (!workroomMap.has(key) && knownWorkroomCoordinates[name]) {
    workroomCoords.push({
      name: name,
      lat: knownWorkroomCoordinates[name].lat,
      lng: knownWorkroomCoordinates[name].lng,
      address: undefined
    });
    console.log(`➕ Workroom: ${name.padEnd(20)} ${knownWorkroomCoordinates[name].lat.toFixed(6)}, ${knownWorkroomCoordinates[name].lng.toFixed(6)} (not in Excel)`);
  }
});

workroomCoords.sort((a, b) => a.name.localeCompare(b.name));

console.log(`\n📦 Processing ${stores.length} stores...`);
console.log(`⚠️  Note: Store coordinates will need to be geocoded. For now, stores are listed with addresses.\n`);

// Generate workroom coordinates file
const workroomTsContent = `// Workroom geographic coordinates (latitude, longitude)
// Used for displaying workrooms on a map
// Generated from maps.xlsx (FIS WORKROOM & STORE MAP)

export interface WorkroomCoordinates {
  name: string
  lat: number
  lng: number
}

export const workroomCoordinates: WorkroomCoordinates[] = [
${workroomCoords.map(w => `  { name: '${w.name}', lat: ${w.lat}, lng: ${w.lng} },`).join('\n')}
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

// Generate store data file
const storeTsContent = `// Lowe's Store locations from maps.xlsx
// Stores need to be geocoded to get coordinates

export interface StoreLocation {
  address: string
  city: string
  state: string
  zip: string
  name: string
  number: string
  workroom: string
  fullAddress: string
}

export const storeLocations: StoreLocation[] = [
${stores.map(s => `  {
    address: ${JSON.stringify(s.address)},
    city: ${JSON.stringify(s.city)},
    state: ${JSON.stringify(s.state)},
    zip: ${JSON.stringify(s.zip)},
    name: ${JSON.stringify(s.name)},
    number: ${JSON.stringify(s.number)},
    workroom: ${JSON.stringify(s.workroom)},
    fullAddress: ${JSON.stringify(s.fullAddress)}
  },`).join('\n')}
]

// Helper to get stores by workroom
export function getStoresByWorkroom(workroomName: string): StoreLocation[] {
  const normalized = workroomName.trim()
  return storeLocations.filter(s => s.workroom.toLowerCase() === normalized.toLowerCase())
}
`;

const workroomOutputPath = path.join(__dirname, '..', 'data', 'workroomCoordinates.ts');
const storeOutputPath = path.join(__dirname, '..', 'data', 'storeLocations.ts');

fs.writeFileSync(workroomOutputPath, workroomTsContent, 'utf8');
fs.writeFileSync(storeOutputPath, storeTsContent, 'utf8');

console.log(`✅ Updated ${workroomOutputPath}`);
console.log(`✅ Created ${storeOutputPath}`);
console.log(`\n📊 Summary:`);
console.log(`   Workrooms: ${workroomCoords.length}`);
console.log(`   Stores: ${stores.length}`);
console.log(`\n⚠️  Next step: Geocode store addresses to get coordinates for map display.`);

