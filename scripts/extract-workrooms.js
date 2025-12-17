const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', '..', 'maps.xlsx');
const workbook = XLSX.readFile(filePath);
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

const workrooms = new Map();

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

console.log('Unique workrooms found:');
Array.from(workrooms.entries()).forEach(([name, addr]) => {
  console.log(`${name}: ${addr}`);
});

// Now geocode using a simple approach - we'll use known coordinates for major cities
// or the user can provide the actual coordinates
const knownCoords = {
  'Ocala': { lat: 29.1872, lng: -82.1401 },
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

const workroomCoords = [];
workrooms.forEach((addr, name) => {
  if (knownCoords[name]) {
    workroomCoords.push({ name, lat: knownCoords[name].lat, lng: knownCoords[name].lng, address: addr });
  } else {
    console.warn(`⚠️  No coordinates found for: ${name} (${addr})`);
  }
});

console.log(`\n✅ Found ${workroomCoords.length} workrooms with coordinates`);
