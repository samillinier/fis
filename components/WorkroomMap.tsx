'use client'

import { useEffect, useMemo, useState, useRef } from 'react'
import dynamic from 'next/dynamic'
import { getWorkroomCoordinates, getMapCenter } from '@/data/workroomCoordinates'

// Dynamically import Leaflet to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false })

interface WorkroomMapData {
  name: string
  sales: number
  marginRate: number
  records: number
  totalCost: number
  margin: number
  weightedPerformanceScore: number
}

interface WorkroomMapProps {
  workrooms: WorkroomMapData[]
}

// Component to adjust map view when workrooms change
function MapController({ workrooms }: { workrooms: WorkroomMapData[] }) {
  const [MapControllerInner, setMapControllerInner] = useState<React.ComponentType<{ workrooms: WorkroomMapData[], stores?: Array<{ lat: number; lng: number }> }> | null>(null)
  
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    import('react-leaflet').then(mod => {
      const useMap = mod.useMap
      
      const Inner = ({ workrooms }: { workrooms: WorkroomMapData[] }) => {
        const map = useMap()
        
        useEffect(() => {
          if (!map) return
          
          // Small delay to ensure map is fully initialized
          const timeoutId = setTimeout(() => {
            const bounds: [number, number][] = []
            
            // Add workroom coordinates
            workrooms.forEach(w => {
              const coords = getWorkroomCoordinates(w.name)
              if (coords) {
                bounds.push([coords.lat, coords.lng])
              }
            })
            
            if (bounds.length > 0) {
              try {
                map.fitBounds(bounds, { padding: [50, 50] })
              } catch (error) {
                console.warn('Error fitting bounds:', error)
              }
            }
          }, 100)
          
          return () => clearTimeout(timeoutId)
        }, [workrooms, map])
        
        return null
      }
      
      setMapControllerInner(() => Inner)
    })
  }, [])
  
  if (!MapControllerInner) return null
  
  return <MapControllerInner workrooms={workrooms} />
}

// Create custom icon based on weighted performance score (same as heatmap)
function createPerformanceIcon(weightedPerformanceScore: number, L: any): any {
  if (!L) return null
  
  // Use same color scheme as heatmap: Green (>=85), Yellow (>=70), Red (<70)
  let color = '#ef4444' // Red - Critical
  let label = 'Critical'
  
  if (weightedPerformanceScore >= 85) {
    color = '#22c55e' // Green - Top Performing
    label = 'Top Performing'
  } else if (weightedPerformanceScore >= 70) {
    color = '#facc15' // Yellow - Moderate
    label = 'Moderate'
  }
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: 24px;
        height: 24px;
        background-color: ${color};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      " title="${label}"></div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  })
}



export default function WorkroomMap({ workrooms }: WorkroomMapProps) {
  const [isClient, setIsClient] = useState(false)
  const [L, setL] = useState<any>(null)
  const [mapKey, setMapKey] = useState(0)
  const mapInitialized = useRef(false)
  
  useEffect(() => {
    // Only initialize once on client side
    if (typeof window === 'undefined') return
    if (mapInitialized.current) return
    
    mapInitialized.current = true
    setIsClient(true)
    
    import('leaflet').then(leaflet => {
      // Fix for default marker icons in Next.js
      delete (leaflet.default.Icon.Default.prototype as any)._getIconUrl
      leaflet.default.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      })
      setL(leaflet.default)
      
      // Import Leaflet CSS only once
      if (typeof window !== 'undefined' && !document.querySelector('link[href*="leaflet.css"]')) {
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY='
        link.crossOrigin = ''
        document.head.appendChild(link)
      }
    })
    
    // Cleanup on unmount
    return () => {
      mapInitialized.current = false
    }
  }, [])
  
  const mapCenter = useMemo(() => getMapCenter(), [])
  
  // Filter workrooms that have coordinates
  const workroomsWithCoords = useMemo(() => {
    return workrooms
      .map(w => {
        const coords = getWorkroomCoordinates(w.name)
        if (!coords) return null
        return { ...w, ...coords }
      })
      .filter((w): w is WorkroomMapData & { lat: number; lng: number } => w !== null)
  }, [workrooms])
  
  
  const formatCurrency = (value: number) =>
    value === 0 ? '$0' : `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
  
  const formatPercent = (value: number) => `${value.toFixed(1)}%`
  
  if (!isClient || !L) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Geographic Map</h3>
        <div className="h-96 flex items-center justify-center text-gray-500">
          <p>Loading map...</p>
        </div>
      </div>
    )
  }
  
  if (workroomsWithCoords.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Geographic Map</h3>
        <div className="h-96 flex items-center justify-center text-gray-500">
          <p>No workroom location data available to display on map.</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Geographic Map - Workroom Performance</h3>
      </div>
      <div className="mb-4 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-green-600 border-2 border-white shadow" style={{ backgroundColor: '#22c55e' }}></div>
          <span>Top Performing (WPI ≥ 85)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full border-2 border-white shadow" style={{ backgroundColor: '#facc15' }}></div>
          <span>Moderate (WPI 70-84)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow" style={{ backgroundColor: '#ef4444' }}></div>
          <span>Critical (WPI &lt; 70)</span>
        </div>
      </div>
      <div 
        id="workroom-map-container"
        className="h-96 w-full rounded-lg overflow-hidden border border-gray-200"
      >
        <MapContainer
          key={`workroom-performance-map-${mapKey}`}
          center={[mapCenter.lat, mapCenter.lng]}
          zoom={7}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
          whenReady={() => {
            // Map is ready
          }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapController workrooms={workroomsWithCoords} />
          {workroomsWithCoords.map((workroom) => {
            // Determine performance label based on WPI score
            let performanceLabel = 'Critical'
            if (workroom.weightedPerformanceScore >= 85) {
              performanceLabel = 'Top Performing'
            } else if (workroom.weightedPerformanceScore >= 70) {
              performanceLabel = 'Moderate'
            }
            
            return (
              <Marker
                key={`workroom-${workroom.name}`}
                position={[workroom.lat, workroom.lng]}
                icon={createPerformanceIcon(workroom.weightedPerformanceScore, L)}
              >
                <Popup>
                  <div style={{ minWidth: '200px' }}>
                    <h4 style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: '1rem' }}>
                      {workroom.name} Workroom
                    </h4>
                    <div style={{ fontSize: '0.875rem', lineHeight: '1.6' }}>
                      <div style={{ marginBottom: '0.5rem', padding: '0.25rem 0.5rem', backgroundColor: '#f3f4f6', borderRadius: '4px' }}>
                        <strong>WPI Score:</strong> {workroom.weightedPerformanceScore.toFixed(1)}
                        <br />
                        <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{performanceLabel}</span>
                      </div>
                      <div style={{ marginBottom: '0.25rem' }}>
                        <strong>Sales:</strong> {formatCurrency(workroom.sales)}
                      </div>
                      <div style={{ marginBottom: '0.25rem' }}>
                        <strong>Total Cost:</strong> {formatCurrency(workroom.totalCost)}
                      </div>
                      <div>
                        <strong>Job Count:</strong> {workroom.records}
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            )
          })}
        </MapContainer>
      </div>
    </div>
  )
}



