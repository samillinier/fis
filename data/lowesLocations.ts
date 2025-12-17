// Lowe's Home Improvement store locations in Florida, Georgia, and Alabama

export interface LowesLocation {
  name: string
  city: string
  state: 'FL' | 'GA' | 'AL'
  lat: number
  lng: number
  address?: string
}

export const lowesLocations: LowesLocation[] = [
  // Florida locations
  { name: 'Lowe\'s - Tallahassee', city: 'Tallahassee', state: 'FL', lat: 30.4383, lng: -84.2807 },
  { name: 'Lowe\'s - Jacksonville', city: 'Jacksonville', state: 'FL', lat: 30.3322, lng: -81.6557 },
  { name: 'Lowe\'s - Orlando', city: 'Orlando', state: 'FL', lat: 28.5383, lng: -81.3792 },
  { name: 'Lowe\'s - Tampa', city: 'Tampa', state: 'FL', lat: 27.9506, lng: -82.4572 },
  { name: 'Lowe\'s - Lakeland', city: 'Lakeland', state: 'FL', lat: 28.0395, lng: -81.9498 },
  { name: 'Lowe\'s - Miami', city: 'Miami', state: 'FL', lat: 25.7617, lng: -80.1918 },
  { name: 'Lowe\'s - Fort Lauderdale', city: 'Fort Lauderdale', state: 'FL', lat: 26.1224, lng: -80.1373 },
  { name: 'Lowe\'s - West Palm Beach', city: 'West Palm Beach', state: 'FL', lat: 26.7153, lng: -80.0534 },
  { name: 'Lowe\'s - Gainesville', city: 'Gainesville', state: 'FL', lat: 29.6516, lng: -82.3248 },
  { name: 'Lowe\'s - Ocala', city: 'Ocala', state: 'FL', lat: 29.1872, lng: -82.1401 },
  { name: 'Lowe\'s - Pensacola', city: 'Pensacola', state: 'FL', lat: 30.4213, lng: -87.2169 },
  { name: 'Lowe\'s - Panama City', city: 'Panama City', state: 'FL', lat: 30.1588, lng: -85.6602 },
  { name: 'Lowe\'s - Fort Myers', city: 'Fort Myers', state: 'FL', lat: 26.6406, lng: -81.8723 },
  { name: 'Lowe\'s - Naples', city: 'Naples', state: 'FL', lat: 26.1420, lng: -81.7948 },
  { name: 'Lowe\'s - Sarasota', city: 'Sarasota', state: 'FL', lat: 27.3364, lng: -82.5307 },
  { name: 'Lowe\'s - Cape Coral', city: 'Cape Coral', state: 'FL', lat: 26.5629, lng: -81.9495 },
  { name: 'Lowe\'s - Port St. Lucie', city: 'Port St. Lucie', state: 'FL', lat: 27.2730, lng: -80.3582 },
  { name: 'Lowe\'s - Melbourne', city: 'Melbourne', state: 'FL', lat: 28.0836, lng: -80.6081 },
  { name: 'Lowe\'s - Daytona Beach', city: 'Daytona Beach', state: 'FL', lat: 29.2108, lng: -81.0228 },
  { name: 'Lowe\'s - St. Petersburg', city: 'St. Petersburg', state: 'FL', lat: 27.7676, lng: -82.6403 },
  
  // Georgia locations
  { name: 'Lowe\'s - Atlanta', city: 'Atlanta', state: 'GA', lat: 33.7490, lng: -84.3880 },
  { name: 'Lowe\'s - Savannah', city: 'Savannah', state: 'GA', lat: 32.0809, lng: -81.0912 },
  { name: 'Lowe\'s - Augusta', city: 'Augusta', state: 'GA', lat: 33.4735, lng: -82.0105 },
  { name: 'Lowe\'s - Columbus', city: 'Columbus', state: 'GA', lat: 32.4609, lng: -84.9877 },
  { name: 'Lowe\'s - Macon', city: 'Macon', state: 'GA', lat: 32.8407, lng: -83.6324 },
  { name: 'Lowe\'s - Athens', city: 'Athens', state: 'GA', lat: 33.9519, lng: -83.3576 },
  { name: 'Lowe\'s - Valdosta', city: 'Valdosta', state: 'GA', lat: 30.8327, lng: -83.2785 },
  { name: 'Lowe\'s - Albany', city: 'Albany', state: 'GA', lat: 31.5785, lng: -84.1557 },
  { name: 'Lowe\'s - Warner Robins', city: 'Warner Robins', state: 'GA', lat: 32.6130, lng: -83.6246 },
  { name: 'Lowe\'s - Roswell', city: 'Roswell', state: 'GA', lat: 34.0232, lng: -84.3616 },
  { name: 'Lowe\'s - Marietta', city: 'Marietta', state: 'GA', lat: 33.9526, lng: -84.5499 },
  { name: 'Lowe\'s - Alpharetta', city: 'Alpharetta', state: 'GA', lat: 34.0754, lng: -84.2941 },
  { name: 'Lowe\'s - Gainesville', city: 'Gainesville', state: 'GA', lat: 34.2979, lng: -83.8241 },
  { name: 'Lowe\'s - Rome', city: 'Rome', state: 'GA', lat: 34.2570, lng: -85.1647 },
  { name: 'Lowe\'s - Brunswick', city: 'Brunswick', state: 'GA', lat: 31.1500, lng: -81.4915 },
  
  // Alabama locations
  { name: 'Lowe\'s - Birmingham', city: 'Birmingham', state: 'AL', lat: 33.5207, lng: -86.8025 },
  { name: 'Lowe\'s - Mobile', city: 'Mobile', state: 'AL', lat: 30.6954, lng: -88.0399 },
  { name: 'Lowe\'s - Montgomery', city: 'Montgomery', state: 'AL', lat: 32.3668, lng: -86.3000 },
  { name: 'Lowe\'s - Huntsville', city: 'Huntsville', state: 'AL', lat: 34.7304, lng: -86.5861 },
  { name: 'Lowe\'s - Tuscaloosa', city: 'Tuscaloosa', state: 'AL', lat: 33.2098, lng: -87.5692 },
  { name: 'Lowe\'s - Auburn', city: 'Auburn', state: 'AL', lat: 32.6099, lng: -85.4808 },
  { name: 'Lowe\'s - Dothan', city: 'Dothan', state: 'AL', lat: 31.2232, lng: -85.3905 },
  { name: 'Lowe\'s - Decatur', city: 'Decatur', state: 'AL', lat: 34.6059, lng: -86.9833 },
  { name: 'Lowe\'s - Gadsden', city: 'Gadsden', state: 'AL', lat: 34.0143, lng: -86.0066 },
  { name: 'Lowe\'s - Florence', city: 'Florence', state: 'AL', lat: 34.7998, lng: -87.6773 },
  { name: 'Lowe\'s - Opelika', city: 'Opelika', state: 'AL', lat: 32.6454, lng: -85.3783 },
  { name: 'Lowe\'s - Phenix City', city: 'Phenix City', state: 'AL', lat: 32.4710, lng: -85.0008 },
]

export function getLowesLocationsByState(states: ('FL' | 'GA' | 'AL')[]): LowesLocation[] {
  return lowesLocations.filter(loc => states.includes(loc.state))
}

export function getAllLowesLocations(): LowesLocation[] {
  return lowesLocations
}
