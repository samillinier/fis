// Workroom geographic coordinates (latitude, longitude)
// Used for displaying workrooms on a map
// Generated from maps.xlsx (FIS WORKROOM & STORE MAP)

export interface WorkroomCoordinates {
  name: string
  lat: number
  lng: number
}

export const workroomCoordinates: WorkroomCoordinates[] = [
  { name: 'Albany', lat: 31.5785, lng: -84.1557 },
  { name: 'Dothan', lat: 31.2232, lng: -85.3905 },
  { name: 'Gainesville', lat: 29.6516, lng: -82.3248 },
  { name: 'Lakeland', lat: 28.0395, lng: -81.9498 },
  { name: 'Naples', lat: 26.142, lng: -81.7948 },
  { name: 'Ocala', lat: 28.8603, lng: -82.0365 },
  { name: 'Panama City', lat: 30.1588, lng: -85.6602 },
  { name: 'Sarasota', lat: 27.3364, lng: -82.5307 },
  { name: 'Tallahassee', lat: 30.4383, lng: -84.2807 },
  { name: 'Tampa', lat: 27.9506, lng: -82.4572 },
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
