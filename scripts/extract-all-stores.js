const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Import workroom store data to get all stores
const workroomStoreDataContent = fs.readFileSync(
  path.join(__dirname, '..', 'data', 'workroomStoreData.ts'),
  'utf8'
);

// Extract store numbers and workrooms from workroomStoreData.ts
const storeWorkroomMap = new Map();
const storeMatches = workroomStoreDataContent.matchAll(/workroom: '([^']+)',\s*store: (\d+)/g);
for (const match of storeMatches) {
  const workroom = match[1];
  const storeNum = match[2];
  if (!storeWorkroomMap.has(storeNum)) {
    storeWorkroomMap.set(storeNum, workroom);
  }
}

console.log(`Found ${storeWorkroomMap.size} unique stores from workroomStoreData.ts\n`);

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

// City coordinates for geocoding
const cityCoordinates = {
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
  'Albany': { lat: 31.5785, lng: -84.1557 },
  'Dothan': { lat: 31.2232, lng: -85.3905 },
};

// Read Excel file to get store addresses
const filePath = path.join(__dirname, '..', '..', 'maps.xlsx');
const workbook = XLSX.readFile(filePath);
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

// Map store numbers to Excel data
const excelStoreMap = new Map();
rawData.forEach((row) => {
  if (!row || row.length < 8) return;
  
  const storeNumber = String(row[5] || '').trim();
  if (storeNumber) {
    excelStoreMap.set(storeNumber, {
      address: String(row[0] || '').trim(),
      city: String(row[1] || '').trim(),
      state: String(row[2] || '').trim(),
      zip: String(row[3] || '').trim(),
      name: String(row[4] || '').trim(),
    });
  }
});

console.log(`Found ${excelStoreMap.size} stores in Excel file\n`);

// Build complete store list
const stores = [];

storeWorkroomMap.forEach((workroom, storeNumber) => {
  const excelData = excelStoreMap.get(storeNumber);
  const workroomCoords = knownWorkroomCoordinates[workroom];
  
  let lat = null;
  let lng = null;
  let address = '';
  let city = '';
  let state = '';
  let zip = '';
  let name = `Lowe's Store #${storeNumber}`;
  
  // Use Excel data if available
  if (excelData) {
    address = excelData.address;
    city = excelData.city;
    state = excelData.state;
    zip = excelData.zip;
    name = excelData.name || name;
    
    // Geocode from city
    const cityKey = Object.keys(cityCoordinates).find(key => 
      city.toLowerCase().includes(key.toLowerCase()) || 
      key.toLowerCase().includes(city.toLowerCase())
    );
    if (cityKey) {
      lat = cityCoordinates[cityKey].lat;
      lng = cityCoordinates[cityKey].lng;
    }
  }
  
  // Fallback to workroom coordinates if no city match
  if ((!lat || !lng) && workroomCoords) {
    lat = workroomCoords.lat;
    lng = workroomCoords.lng;
  }
  
  // Final fallback by state
  if (!lat || !lng) {
    if (state === 'FL') {
      lat = 28.5;
      lng = -82.0;
    } else if (state === 'GA') {
      lat = 31.5785;
      lng = -84.1557;
    } else if (state === 'AL') {
      lat = 31.2232;
      lng = -85.3905;
    } else if (workroomCoords) {
      lat = workroomCoords.lat;
      lng = workroomCoords.lng;
    }
  }
  
  const fullAddress = address 
    ? `${address}, ${city}, ${state} ${zip}`.trim()
    : `${workroom} Area`;
  
  stores.push({
    address: address,
    city: city,
    state: state,
    zip: zip,
    name: name,
    number: storeNumber,
    workroom: workroom,
    fullAddress: fullAddress,
    lat: lat,
    lng: lng,
  });
});

// Sort by store number
stores.sort((a, b) => parseInt(a.number) - parseInt(b.number));

const geocodedCount = stores.filter(s => s.lat && s.lng).length;

console.log(`✅ Processed ${stores.length} stores`);
console.log(`✅ ${geocodedCount} stores have coordinates`);
console.log(`⚠️  ${stores.length - geocodedCount} stores need manual coordinates\n`);

// Generate store coordinates file
const storeTsContent = `// Lowe's Store locations with coordinates
// Generated from workroomStoreData.ts and maps.xlsx (FIS WORKROOM & STORE MAP)
// Total: ${stores.length} stores

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
console.log(`   From Excel: ${excelStoreMap.size}`);
console.log(`   From workroomStoreData: ${storeWorkroomMap.size}`);



