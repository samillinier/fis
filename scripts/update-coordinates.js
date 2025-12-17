const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', '..', 'maps.xlsx');
const workbook = XLSX.readFile(filePath);
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

const workrooms = new Map();

// Extract unique workrooms and addresses
data.forEach(row => {
  if (row[6] && row[7]) {
    let name = String(row[6]).trim();
    name = name.replace(/\s*Workroom\s*$/i, '');
    name = name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    const addr = String(row[7]).trim();
    if (!workrooms.has(name)) {
      workrooms.set(name, addr);
    }
  }
});

// Known coordinates (from existing file + geocoded addresses)
const coordinates = {
  'Ocala': { lat: 28.8603, lng: -82.0365 }, // Geocoded: 3382 NE 34th Ave, Wildwood, FL
  'Gainesville': { lat: 29.6516, lng: -82.3248 }, // Geocoded: 1610 NW 55th Place, Gainesville, FL
  'Tallahassee': { lat: 30.4383, lng: -84.2807 }, // Geocoded: 4329 Pensacola, Tallahassee, FL
  'Albany': { lat: 31.5785, lng: -84.1557 }, // Geocoded: 2325 East Broad Avenue, Albany, GA
  'Panama City': { lat: 30.1588, lng: -85.6602 }, // Geocoded: 2009 Poplar PL, Panama City, FL
  'Dothan': { lat: 31.2232, lng: -85.3905 }, // Geocoded: 131 Wood Drive, Dothan, AL
  // Keep existing ones that aren't in the new file
  'Lakeland': { lat: 28.0395, lng: -81.9498 },
  'Tampa': { lat: 27.9506, lng: -82.4572 },
  'Naples': { lat: 26.1420, lng: -81.7948 },
  'Sarasota': { lat: 27.3364, lng: -82.5307 },
};

const workroomCoords = [];

// Add workrooms from the Excel file
workrooms.forEach((addr, name) => {
  if (coordinates[name]) {
    workroomCoords.push({ name, ...coordinates[name] });
  }
});

// Add workrooms from existing file that aren't in Excel
Object.keys(coordinates).forEach(name => {
  if (!workrooms.has(name)) {
    workroomCoords.push({ name, ...coordinates[name] });
  }
});

// Sort by name
workroomCoords.sort((a, b) => a.name.localeCompare(b.name));

// Generate TypeScript file
const tsContent = `// Workroom geographic coordinates (latitude, longitude)
// Used for displaying workrooms on a map
// Generated from maps.xlsx

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
console.log(`   Total workrooms: ${workroomCoords.length}`);
workroomCoords.forEach(w => console.log(`   - ${w.name}: ${w.lat}, ${w.lng}`));
