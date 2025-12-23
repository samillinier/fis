const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const PROJECT_ROOT = path.join(__dirname, '..');
const OUTPUT_FILE = path.join(PROJECT_ROOT, 'data', 'workroomCoordinates.ts');

// Get Excel file path from command line argument or look for common names
let excelFileName = process.argv[2];
let excelFilePath;

if (excelFileName) {
  excelFilePath = path.join(PROJECT_ROOT, excelFileName);
} else {
  // Try to find any .xlsx file in project root
  const files = fs.readdirSync(PROJECT_ROOT);
  const xlsxFiles = files.filter(f => f.endsWith('.xlsx') || f.endsWith('.xls'));
  
  if (xlsxFiles.length === 0) {
    console.error(`❌ No Excel file found in project root: ${PROJECT_ROOT}`);
    console.log('\nPlease provide the Excel file path as an argument:');
    console.log('  node scripts/update-workroom-addresses.js your-file.xlsx');
    console.log('\nOr place an Excel file (.xlsx or .xls) in the project root');
    process.exit(1);
  } else if (xlsxFiles.length === 1) {
    excelFileName = xlsxFiles[0];
    excelFilePath = path.join(PROJECT_ROOT, excelFileName);
    console.log(`📁 Found Excel file: ${excelFileName}`);
  } else {
    console.log(`📁 Found ${xlsxFiles.length} Excel files:`);
    xlsxFiles.forEach((f, i) => console.log(`   ${i + 1}. ${f}`));
    console.log('\nPlease specify which file to use:');
    console.log('  node scripts/update-workroom-addresses.js your-file.xlsx');
    process.exit(1);
  }
}

if (!fs.existsSync(excelFilePath)) {
  console.error(`❌ Excel file not found: ${excelFilePath}`);
  process.exit(1);
}

console.log(`📖 Reading Excel file: ${excelFilePath}\n`);

// Read Excel file
const workbook = XLSX.readFile(excelFilePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

console.log(`Found ${rawData.length} rows in sheet "${sheetName}"\n`);

// Extract workroom names and addresses
// Column A (index 0) = Address
// Column G (index 6) = Workroom Name (e.g., "Ocala Workroom", "Tampa Workroom")
const workroomAddressMap = new Map(); // Map workroom name to first address found

rawData.forEach((row, index) => {
  if (row && row.length > 6) {
    const address = String(row[0] || '').trim();
    const workroomNameRaw = String(row[6] || '').trim();
    
    if (address && address.length > 5 && workroomNameRaw) {
      // Clean workroom name: remove "Workroom" suffix and normalize
      let workroomName = workroomNameRaw
        .replace(/\s*Workroom\s*$/i, '')
        .trim();
      
      // Only store if we haven't seen this workroom yet (use first address)
      if (workroomName && !workroomAddressMap.has(workroomName)) {
        workroomAddressMap.set(workroomName, {
          row: index + 1,
          address: address,
          workroomName: workroomName
        });
      }
    }
  }
});

console.log(`Found ${workroomAddressMap.size} unique workrooms:\n`);
workroomAddressMap.forEach((item, workroomName) => {
  console.log(`  ${workroomName}: ${item.address} (Row ${item.row})`);
});

// Geocoding function using Nominatim (OpenStreetMap) - free, no API key needed
function geocodeAddress(address) {
  return new Promise((resolve, reject) => {
    const encodedAddress = encodeURIComponent(address);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`;
    
    https.get(url, {
      headers: {
        'User-Agent': 'FIS-Workroom-Map-Updater/1.0'
      }
    }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const results = JSON.parse(data);
          if (results && results.length > 0) {
            resolve({
              lat: parseFloat(results[0].lat),
              lng: parseFloat(results[0].lon)
            });
          } else {
            resolve(null);
          }
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
    
    // Add delay to respect rate limits (1 request per second)
    setTimeout(() => {}, 1000);
  });
}

// No longer needed - we get workroom name directly from column G

// Process addresses and geocode
async function processAddresses() {
  console.log('\n🌍 Geocoding addresses...\n');
  console.log('⚠️  Note: This may take a while due to rate limiting (1 request/second)\n');
  
  const workroomCoords = [];
  const knownCoordinates = {
    'Albany': { lat: 31.5785, lng: -84.1557 },
    'Dothan': { lat: 31.2232, lng: -85.3905 },
    'Gainesville': { lat: 29.6516, lng: -82.3248 },
    'Lakeland': { lat: 28.0395, lng: -81.9498 },
    'Naples': { lat: 26.142, lng: -81.7948 },
    'Ocala': { lat: 28.8603, lng: -82.0365 },
    'Panama City': { lat: 30.1588, lng: -85.6602 },
    'Sarasota': { lat: 27.3364, lng: -82.5307 },
    'Tallahassee': { lat: 30.4383, lng: -84.2807 },
    'Tampa': { lat: 27.9506, lng: -82.4572 },
  };
  
  // Process each unique workroom
  for (const [workroomName, item] of workroomAddressMap.entries()) {
    // Check if we already have coordinates for this workroom
    if (knownCoordinates[workroomName]) {
      workroomCoords.push({
        name: workroomName,
        lat: knownCoordinates[workroomName].lat,
        lng: knownCoordinates[workroomName].lng,
        address: item.address,
        source: 'known'
      });
      console.log(`✅ ${workroomName.padEnd(20)} ${knownCoordinates[workroomName].lat.toFixed(6)}, ${knownCoordinates[workroomName].lng.toFixed(6)} (known)`);
    } else {
      // Try to geocode
      try {
        console.log(`🌍 Geocoding ${workroomName}...`);
        const coords = await geocodeAddress(item.address);
        
        if (coords) {
          workroomCoords.push({
            name: workroomName,
            lat: coords.lat,
            lng: coords.lng,
            address: item.address,
            source: 'geocoded'
          });
          console.log(`✅ ${workroomName.padEnd(20)} ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)} (geocoded)`);
        } else {
          console.log(`❌ ${workroomName.padEnd(20)} Could not geocode: ${item.address}`);
        }
        
        // Rate limiting delay
        await new Promise(resolve => setTimeout(resolve, 1100));
      } catch (error) {
        console.log(`❌ ${workroomName.padEnd(20)} Error: ${error.message}`);
      }
    }
  }
  
  // Remove duplicates (keep first occurrence)
  const uniqueWorkrooms = new Map();
  workroomCoords.forEach(w => {
    if (!uniqueWorkrooms.has(w.name)) {
      uniqueWorkrooms.set(w.name, w);
    }
  });
  
  const finalWorkrooms = Array.from(uniqueWorkrooms.values());
  
  // Sort alphabetically
  finalWorkrooms.sort((a, b) => a.name.localeCompare(b.name));
  
  console.log(`\n✅ Processed ${finalWorkrooms.length} unique workrooms`);
  
  // Generate TypeScript file
  const tsContent = `// Workroom geographic coordinates (latitude, longitude)
// Used for displaying workrooms on a map
// Generated from ${excelFileName} - addresses from column A
// Last updated: ${new Date().toISOString()}

export interface WorkroomCoordinates {
  name: string
  lat: number
  lng: number
}

export const workroomCoordinates: WorkroomCoordinates[] = [
${finalWorkrooms.map(w => `  { name: '${w.name}', lat: ${w.lat}, lng: ${w.lng} },`).join('\n')}
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

  fs.writeFileSync(OUTPUT_FILE, tsContent, 'utf8');
  
  console.log(`\n✅ Successfully updated ${OUTPUT_FILE}`);
  console.log(`\n📊 Summary:`);
  console.log(`   Total workrooms: ${finalWorkrooms.length}`);
  finalWorkrooms.forEach(w => {
    console.log(`   - ${w.name}: ${w.lat.toFixed(6)}, ${w.lng.toFixed(6)}`);
  });
}

// Run the script
processAddresses().catch(error => {
  console.error('❌ Error processing addresses:', error);
  process.exit(1);
});
