'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import type { StoreHeatPoint } from '@/lib/storeHeatmapData'
import { clusterColor } from '@/data/patternClusters'

const MapContainer = dynamic(() => import('react-leaflet').then((m) => m.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then((m) => m.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then((m) => m.Marker), { ssr: false })

interface StoreSatelliteViewProps {
  store: StoreHeatPoint
  height?: number
  onClose?: () => void
}

function Recenter({ lat, lng, zoom }: { lat: number; lng: number; zoom: number }) {
  const [Inner, setInner] = useState<React.ComponentType<{
    lat: number
    lng: number
    zoom: number
  }> | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    import('react-leaflet').then((mod) => {
      const useMap = mod.useMap
      const Comp = ({ lat: la, lng: ln, zoom: z }: { lat: number; lng: number; zoom: number }) => {
        const map = useMap()
        useEffect(() => {
          map.setView([la, ln], z, { animate: true })
        }, [la, ln, z, map])
        return null
      }
      setInner(() => Comp)
    })
  }, [])

  if (!Inner) return null
  return <Inner lat={lat} lng={lng} zoom={zoom} />
}

function createStorePin(L: any, storeNumber: number, fill: string) {
  if (!L) return null
  const w = 36
  const h = 52
  return L.divIcon({
    className: 'store-satellite-marker',
    html: `
      <div style="
        width: ${w}px;
        height: ${h}px;
        filter: drop-shadow(0 3px 6px rgba(0,0,0,0.55));
        display: flex;
        flex-direction: column;
        align-items: center;
        line-height: 0;
      ">
        <div style="
          width: ${w}px;
          height: ${w}px;
          background: ${fill};
          border: 3px solid #111827;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          box-sizing: border-box;
        ">
          <span style="
            transform: rotate(45deg);
            color: #fff;
            font-size: 11px;
            font-weight: 800;
            font-family: system-ui, sans-serif;
            text-shadow: 0 1px 1px rgba(0,0,0,0.4);
          ">${storeNumber}</span>
        </div>
      </div>
    `,
    iconSize: [w, h],
    iconAnchor: [w / 2, h],
  })
}

export default function StoreSatelliteView({
  store,
  height = 480,
  onClose,
}: StoreSatelliteViewProps) {
  const [ready, setReady] = useState(false)
  const [L, setL] = useState<any>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!document.querySelector('link[href*="leaflet.css"]')) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }
    import('leaflet').then((leaflet) => {
      setL(leaflet.default)
      setReady(true)
    })
  }, [])

  if (store.lat == null || store.lng == null) {
    return (
      <div
        style={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#9ca3af',
          fontSize: 13,
          background: '#0f172a',
        }}
      >
        No coordinates for this store
      </div>
    )
  }

  if (!ready || !L) {
    return (
      <div
        style={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#9ca3af',
          fontSize: 13,
          background: '#0f172a',
        }}
      >
        Loading satellite…
      </div>
    )
  }

  const icon = createStorePin(L, store.location, clusterColor(store.clusterId))
  const place = store.city
    ? `${store.city}, ${store.state}`
    : store.storeName.replace(/^LOWE'?S OF /i, '')

  return (
    <div style={{ height, width: '100%', position: 'relative', overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          top: 10,
          left: 10,
          right: 10,
          zIndex: 1000,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 8,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.82)',
            color: '#fff',
            padding: '6px 10px',
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 600,
            maxWidth: '70%',
            lineHeight: 1.35,
            boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
            pointerEvents: 'auto',
          }}
        >
          <div>#{store.location} · Satellite</div>
          <div style={{ fontWeight: 500, opacity: 0.9, fontSize: 11 }}>{place}</div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close satellite view"
            style={{
              pointerEvents: 'auto',
              border: 'none',
              borderRadius: 6,
              padding: '8px 12px',
              background: '#fff',
              color: '#111827',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span style={{ fontSize: 14, lineHeight: 1 }}>×</span>
            Close
          </button>
        )}
      </div>

      <MapContainer
        key={`sat-${store.location}`}
        center={[store.lat, store.lng]}
        zoom={18}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom
        zoomControl
      >
        <TileLayer
          attribution="Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics"
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        />
        <TileLayer
          attribution=""
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
          opacity={0.85}
        />
        <Recenter lat={store.lat} lng={store.lng} zoom={18} />
        {icon && <Marker position={[store.lat, store.lng]} icon={icon} />}
      </MapContainer>

      <style jsx global>{`
        .store-satellite-marker {
          background: transparent !important;
          border: none !important;
        }
      `}</style>
    </div>
  )
}
