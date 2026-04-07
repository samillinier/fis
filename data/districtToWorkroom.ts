// District number to workroom name mapping
// This maps Lowes district numbers to FIS workroom names
// A district can have multiple workrooms, so each district maps to an array of workroom names
export const districtToWorkroom: Record<string, string[]> = {
  '868': ['GAINESVILLE', 'OCALA'],
  '1222': ['ALBANY', 'DOTHAN', 'PANAMA CITY', 'TALLAHASSEE'],
  '1226': ['LAKELAND', 'NAPLES', 'SARASOTA'],
  '1270': ['TAMPA'],
  '1297': ['LAKELAND'],
  '1385': ['LAKELAND', 'SARASOTA', 'TAMPA'],
}

// Reverse mapping: workroom name to district numbers (one workroom can have multiple districts)
export const workroomToDistricts: Record<string, string[]> = {
  'ALBANY': ['1222'],
  'DOTHAN': ['1222'],
  'GAINESVILLE': ['868'],
  'LAKELAND': ['1226', '1297', '1385'],
  'NAPLES': ['1226'],
  'OCALA': ['868'],
  'PANAMA CITY': ['1222'],
  'SARASOTA': ['1226', '1385'],
  'TALLAHASSEE': ['1222'],
  'TAMPA': ['1270', '1385'],
}

// Get all workroom names for a district number
export function getWorkroomsForDistrict(district: string): string[] {
  return districtToWorkroom[district] || []
}

// Get the first workroom name for a district number (for backward compatibility)
// Use this when you only need to display a single workroom
export function getWorkroomForDistrict(district: string): string | null {
  const workrooms = districtToWorkroom[district]
  return workrooms && workrooms.length > 0 ? workrooms[0] : null
}

// Get all workroom names for a district as a formatted string
export function getWorkroomsForDistrictAsString(district: string, separator: string = ', '): string | null {
  const workrooms = districtToWorkroom[district]
  return workrooms && workrooms.length > 0 ? workrooms.join(separator) : null
}

// Get district numbers for a workroom name
export function getDistrictsForWorkroom(workroom: string): string[] {
  return workroomToDistricts[workroom] || []
}

// Get workroom for a specific store number
// This uses storeLocations data to find the workroom for a store
export function getWorkroomForStore(store: string | number): string | null {
  // Import storeLocations dynamically to avoid circular dependencies
  // Store number can be string or number, so normalize it
  const storeNum = typeof store === 'string' ? store : String(store)
  
  // Try to find in storeLocations - we'll import it in the component instead
  // This function signature is here for consistency, but actual implementation
  // should be done in components that have access to storeLocations
  return null
}
