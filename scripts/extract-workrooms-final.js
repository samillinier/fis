const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', '..', 'maps.xlsx');
const workbook = XLSX.readFile(filePath);
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

console.log('Extracting workrooms from FIS WORKROOM & STORE MAP...\n');

// Extract unique workrooms and their addresses
const workroomMap = new Map();

data.forEach((row, index) => {
  if (!row || row.length < 8) return;
  
  // Column G (index 6) = Workroom name
  // Column H (index 7) = Workroom address
  const workroomNameRaw = String(row[6] || '').trim();
  const workroomAddress = String(row[7] || '').trim();
  
  if (!workroomNameRaw || !workroomAddress) return;
  
  // Clean workroom name: remove "Workroom" suffix and format properly
  let workroomName = workroomNameRaw.replace(/\s*Workroom\s*$/i, '').trim();
  workroomName = workroomName.split(' ').map(w => 
    w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
  ).join(' ');
  
  // Store unique workroom with its address
  if (!workroomMap.has(workroomName)) {
    workroomMap.set(workroomName, workroomAddress);
  }
});

console.log(`Found ${workroomMap.size} unique workrooms:\n`);
workroomMap.forEach((address, name) => {
  console.log(`  ${name}: ${address}`);
});

// Geocode addresses to get coordinates
// Using known coordinates for major cities + geocoded addresses
const geocodedCoords = {
  // From the workroom addresses in the file
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

const workroomCoords = [];

// Add workrooms from the Excel file
workroomMap.forEach((address, name) => {
  if (geocodedCoords[name]) {
    workroomCoords.push({ name, ...geocodedCoords[name], address });
  } else {
    console.warn(`\n⚠️  No coordinates found for: ${name} (${address})`);
    console.warn(`   Please provide coordinates for this workroom.`);
  }
});

// Add any additional workrooms from the system that aren't in Excel
Object.keys(geocodedCoords).forEach(name => {
  if (!workroomMap.has(name)) {
    workroomCoords.push({ name, ...geocodedCoords[name] });
  }
});

// Sort alphabetically
workroomCoords.sort((a, b) => a.name.localeCompare(b.name));

console.log(`\n✅ Extracted ${workroomCoords.length} workrooms with coordinates\n`);

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

const outputPath = path.join(__dirname, '..', 'data', 'workroomCoordinates.ts');
fs.writeFileSync(outputPath, tsContent, 'utf8');

console.log(`✅ Updated ${outputPath}`);
console.log(`\nWorkroom coordinates:`);
workroomCoords.forEach(w => {
  console.log(`  ${w.name.padEnd(15)} lat: ${w.lat.toFixed(4).padStart(9)}, lng: ${w.lng.toFixed(4).padStart(10)}`);
});
