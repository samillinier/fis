const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Simple geocoding using city/state lookup
// In production, you'd use Google Maps Geocoding API or similar
const cityCoordinates = {
  // Florida cities
  'Brooksville': { lat: 28.5556, lng: -82.3879 },
  'Leesburg': { lat: 28.8108, lng: -81.8779 },
  'Mt.Dora': { lat: 28.8025, lng: -81.6445 },
  'Wildwood': { lat: 28.8603, lng: -82.0365 },
  'Spring Hill': { lat: 28.4769, lng: -82.5254 },
  'LADY LAKE': { lat: 28.9175, lng: -81.9229 },
  'Inverness': { lat: 28.8358, lng: -82.3301 },
  'Gainesville': { lat: 29.6516, lng: -82.3248 },
  'Tallahassee': { lat: 30.4383, lng: -84.2807 },
  'Tampa': { lat: 27.9506, lng: -82.4572 },
  'Lakeland': { lat: 28.0395, lng: -81.9498 },
  'Naples': { lat: 26.1420, lng: -81.7948 },
  'Sarasota': { lat: 27.3364, lng: -82.5307 },
  'Panama City': { lat: 30.1588, lng: -85.6602 },
  'Ocala': { lat: 29.1872, lng: -82.1401 },
  // Georgia cities
  'Albany': { lat: 31.5785, lng: -84.1557 },
  // Alabama cities
  'Dothan': { lat: 31.2232, lng: -85.3905 },
};

function geocodeStore(store) {
  // Try to match by city name
  const cityKey = Object.keys(cityCoordinates).find(key => 
    store.city.toLowerCase().includes(key.toLowerCase()) || 
    key.toLowerCase().includes(store.city.toLowerCase())
  );
  
  if (cityKey) {
    return cityCoordinates[cityKey];
  }
  
  // Try to match by state and use a default location for that state
  if (store.state === 'FL') {
    return { lat: 28.5, lng: -82.0 }; // Central Florida default
  } else if (store.state === 'GA') {
    return { lat: 31.5785, lng: -84.1557 }; // Albany area default
  } else if (store.state === 'AL') {
    return { lat: 31.2232, lng: -85.3905 }; // Dothan area default
  }
  
  return null;
}

const filePath = path.join(__dirname, '..', '..', 'maps.xlsx');
const workbook = XLSX.readFile(filePath);
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

console.log('Geocoding stores from maps.xlsx...\n');

const stores = [];
const seenStoreNumbers = new Set(); // Track unique store numbers

rawData.forEach((row, index) => {
  if (!row || row.length < 8) return;
  
  const storeAddress = String(row[0] || '').trim();
  const city = String(row[1] || '').trim();
  const state = String(row[2] || '').trim();
  const zip = String(row[3] || '').trim();
  const storeName = String(row[4] || '').trim();
  const storeNumber = String(row[5] || '').trim();
  const workroomNameRaw = String(row[6] || '').trim();
  
  // Only add if we have valid data and haven't seen this store number before
  if (storeAddress && storeName && storeNumber && !seenStoreNumbers.has(storeNumber)) {
    seenStoreNumbers.add(storeNumber);
    const workroom = workroomNameRaw ? workroomNameRaw.replace(/\s*Workroom\s*$/i, '').trim() : '';
    const fullAddress = `${storeAddress}, ${city}, ${state} ${zip}`.trim();
    
    const coords = geocodeStore({ city, state, address: storeAddress });
    
    stores.push({
      address: storeAddress,
      city: city,
      state: state,
      zip: zip,
      name: storeName,
      number: storeNumber,
      workroom: workroom,
      fullAddress: fullAddress,
      lat: coords ? coords.lat : null,
      lng: coords ? coords.lng : null,
    });
  }
});

const geocodedCount = stores.filter(s => s.lat && s.lng).length;
const missingCount = stores.length - geocodedCount;

console.log(`✅ Geocoded ${geocodedCount} stores`);
if (missingCount > 0) {
  console.log(`⚠️  ${missingCount} stores need manual geocoding\n`);
}

// Generate store coordinates file
const storeTsContent = `// Lowe's Store locations with coordinates
// Generated from maps.xlsx (FIS WORKROOM & STORE MAP)

export interface StoreCoordinates {
  address: string
  city: string
  state: string
  zip: string
  name: string
  number: string
  workroom: string
  fullAddress: string
  lat: number | null
  lng: number | null
}

export const storeCoordinates: StoreCoordinates[] = [
${stores.map(s => `  {
    address: ${JSON.stringify(s.address)},
    city: ${JSON.stringify(s.city)},
    state: ${JSON.stringify(s.state)},
    zip: ${JSON.stringify(s.zip)},
    name: ${JSON.stringify(s.name)},
    number: ${JSON.stringify(s.number)},
    workroom: ${JSON.stringify(s.workroom)},
    fullAddress: ${JSON.stringify(s.fullAddress)},
    lat: ${s.lat !== null ? s.lat : 'null'},
    lng: ${s.lng !== null ? s.lng : 'null'}
  },`).join('\n')}
]

// Helper to get stores by workroom
export function getStoresByWorkroom(workroomName: string): StoreCoordinates[] {
  const normalized = workroomName.trim()
  return storeCoordinates.filter(s => s.workroom.toLowerCase() === normalized.toLowerCase())
}

// Get stores with valid coordinates
export function getStoresWithCoordinates(): StoreCoordinates[] {
  return storeCoordinates.filter(s => s.lat !== null && s.lng !== null)
}
`;

const storeOutputPath = path.join(__dirname, '..', 'data', 'storeCoordinates.ts');
fs.writeFileSync(storeOutputPath, storeTsContent, 'utf8');

console.log(`✅ Updated ${storeOutputPath}`);
console.log(`\n📊 Summary:`);
console.log(`   Total stores: ${stores.length}`);
console.log(`   With coordinates: ${geocodedCount}`);
console.log(`   Need geocoding: ${missingCount}`);

if (missingCount > 0) {
  console.log(`\n⚠️  Stores needing geocoding:`);
  stores.filter(s => !s.lat || !s.lng).slice(0, 10).forEach(s => {
    console.log(`   ${s.name} - ${s.fullAddress}`);
  });
  if (missingCount > 10) {
    console.log(`   ... and ${missingCount - 10} more`);
  }
}



