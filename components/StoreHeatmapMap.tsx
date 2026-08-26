'use client'

import { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { clusterColor, clusterEstimator } from '@/data/patternClusters'
import {
  type GeoCluster,
  type HeatMetric,
  type StoreHeatPoint,
} from '@/lib/storeHeatmapData'

const MapContainer = dynamic(() => import('react-leaflet').then((m) => m.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then((m) => m.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then((m) => m.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then((m) => m.Popup), { ssr: false })
const Polygon = dynamic(() => import('react-leaflet').then((m) => m.Polygon), { ssr: false })
const Tooltip = dynamic(() => import('react-leaflet').then((m) => m.Tooltip), { ssr: false })

function darkenHex(hex: string, amount = 0.22): string {
  const h = hex.replace('#', '')
  if (h.length !== 6) return hex
  const n = parseInt(h, 16)
  const r = Math.max(0, Math.round(((n >> 16) & 255) * (1 - amount)))
  const g = Math.max(0, Math.round(((n >> 8) & 255) * (1 - amount)))
  const b = Math.max(0, Math.round((n & 255) * (1 - amount)))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

type LatLng = [number, number]

/** Monotone-chain convex hull. Returns CCW ring (not closed). */
function convexHull(points: LatLng[]): LatLng[] {
  const pts = [...points].sort((a, b) => (a[1] === b[1] ? a[0] - b[0] : a[1] - b[1]))
  if (pts.length <= 2) return pts

  const cross = (o: LatLng, a: LatLng, b: LatLng) =>
    (a[1] - o[1]) * (b[0] - o[0]) - (a[0] - o[0]) * (b[1] - o[1])

  const lower: LatLng[] = []
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop()
    }
    lower.push(p)
  }
  const upper: LatLng[] = []
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i]
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop()
    }
    upper.push(p)
  }
  lower.pop()
  upper.pop()
  return lower.concat(upper)
}

/** Expand hull outward from centroid so pins sit inside the shape */
function padPolygon(ring: LatLng[], padDeg = 0.035): LatLng[] {
  if (ring.length === 0) return ring
  const cx = ring.reduce((s, p) => s + p[0], 0) / ring.length
  const cy = ring.reduce((s, p) => s + p[1], 0) / ring.length
  return ring.map(([lat, lng]) => {
    const dlat = lat - cx
    const dlng = lng - cy
    const dist = Math.sqrt(dlat * dlat + dlng * dlng) || 0.0001
    const scale = (dist + padDeg) / dist
    return [cx + dlat * scale, cy + dlng * scale] as LatLng
  })
}

/** Build a readable cluster footprint from member store coords */
function clusterShape(stores: { lat: number | null; lng: number | null }[]): LatLng[] | null {
  const pts = stores
    .filter((s) => s.lat != null && s.lng != null)
    .map((s) => [s.lat!, s.lng!] as LatLng)
  if (pts.length === 0) return null

  if (pts.length === 1) {
    const [lat, lng] = pts[0]
    const r = 0.06
    // hexagon around single store
    return Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 3) * i - Math.PI / 6
      return [lat + r * Math.cos(a), lng + r * Math.sin(a) * 1.15] as LatLng
    })
  }

  if (pts.length === 2) {
    const [a, b] = pts
    const mx = (a[0] + b[0]) / 2
    const my = (a[1] + b[1]) / 2
    const dx = b[0] - a[0]
    const dy = b[1] - a[1]
    const len = Math.sqrt(dx * dx + dy * dy) || 0.01
    const px = (-dy / len) * 0.05
    const py = (dx / len) * 0.05
    const ex = (dx / len) * 0.04
    const ey = (dy / len) * 0.04
    return [
      [a[0] - ex + px, a[1] - ey + py],
      [a[0] - ex - px, a[1] - ey - py],
      [b[0] + ex - px, b[1] + ey - py],
      [b[0] + ex + px, b[1] + ey + py],
    ]
  }

  return padPolygon(convexHull(pts), 0.04)
}

interface StoreHeatmapMapProps {
  stores: StoreHeatPoint[]
  clusters: GeoCluster[]
  metric: HeatMetric
  selectedClusterId: string | null
  selectedStoreId?: number | null
  onSelectCluster: (id: string | null) => void
  onSelectStore?: (store: StoreHeatPoint) => void
}

function FitBounds({ stores }: { stores: StoreHeatPoint[] }) {
  const [Inner, setInner] = useState<React.ComponentType<{ stores: StoreHeatPoint[] }> | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    import('react-leaflet').then((mod) => {
      const useMap = mod.useMap
      const Comp = ({ stores: pts }: { stores: StoreHeatPoint[] }) => {
        const map = useMap()
        useEffect(() => {
          const bounds = pts
            .filter((s) => s.lat != null && s.lng != null)
            .map((s) => [s.lat!, s.lng!] as [number, number])
          if (bounds.length === 0) return
          const t = setTimeout(() => {
            try {
              map.fitBounds(bounds, { padding: [40, 40] })
            } catch {
              /* ignore */
            }
          }, 80)
          return () => clearTimeout(t)
        }, [pts, map])
        return null
      }
      setInner(() => Comp)
    })
  }, [])

  if (!Inner) return null
  return <Inner stores={stores} />
}

/** Nudge stores that share the same lat/lng so pins don't stack */
function spreadOverlapping(stores: StoreHeatPoint[]): Array<StoreHeatPoint & { mapLat: number; mapLng: number }> {
  const groups = new Map<string, StoreHeatPoint[]>()
  for (const s of stores) {
    if (s.lat == null || s.lng == null) continue
    const key = `${s.lat.toFixed(4)},${s.lng.toFixed(4)}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(s)
  }

  const out: Array<StoreHeatPoint & { mapLat: number; mapLng: number }> = []
  for (const group of Array.from(groups.values())) {
    if (group.length === 1) {
      out.push({ ...group[0], mapLat: group[0].lat!, mapLng: group[0].lng! })
      continue
    }
    const radius = 0.018
    group.forEach((s, i) => {
      const angle = (2 * Math.PI * i) / group.length - Math.PI / 2
      out.push({
        ...s,
        mapLat: s.lat! + radius * Math.cos(angle),
        mapLng: s.lng! + radius * Math.sin(angle),
      })
    })
  }
  return out
}

function iconSizeForVolume(details: number, maxDetails: number): number {
  if (maxDetails <= 0) return 28
  const t = Math.sqrt(details / maxDetails)
  return Math.round(24 + t * 14)
}

/** Solid classic map pin */
function createPinIcon(
  L: any,
  color: string,
  selected: boolean,
  size: number,
  storeNumber: number,
  muted: boolean,
  storeSelected = false,
  /** Not on whiteboard — gray instead of heat / selection green */
  isOther = false
) {
  if (!L) return null
  const w = storeSelected ? size + 6 : size
  const h = Math.round(w * 1.45)
  const stroke = storeSelected
    ? isOther
      ? '#374151'
      : '#0f172a'
    : selected
      ? '#0f172a'
      : '#111827'
  const fill = storeSelected ? (isOther ? '#6b7280' : darkenHex(color, 0.15)) : color
  const opacity = muted && !storeSelected ? 0.45 : 1
  const fontSize = Math.max(8, Math.round(w * 0.3))

  return L.divIcon({
    className: 'store-map-marker',
    html: `
      <div style="
        width: ${w}px;
        height: ${h}px;
        opacity: ${opacity};
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.45));
        display: flex;
        flex-direction: column;
        align-items: center;
        line-height: 0;
      ">
        <div style="
          width: ${w}px;
          height: ${w}px;
          background: ${fill};
          border: ${storeSelected ? 3 : 2.5}px solid ${stroke};
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
            font-size: ${fontSize}px;
            font-weight: 800;
            font-family: system-ui, sans-serif;
            text-shadow: 0 1px 1px rgba(0,0,0,0.35);
          ">${storeNumber}</span>
        </div>
      </div>
    `,
    iconSize: [w, h],
    iconAnchor: [w / 2, h],
    popupAnchor: [0, -h + 4],
  })
}

type MapBasemap = 'street' | 'satellite'

export default function StoreHeatmapMap({
  stores,
  clusters,
  metric,
  selectedClusterId,
  selectedStoreId = null,
  onSelectCluster,
  onSelectStore,
}: StoreHeatmapMapProps) {
  const [ready, setReady] = useState(false)
  const [basemap, setBasemap] = useState<MapBasemap>('street')
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

  const maxDetails = useMemo(
    () => Math.max(1, ...stores.map((s) => s.detailsCompleted)),
    [stores]
  )

  const mapped = useMemo(() => {
    const withCoords = stores.filter((s) => s.lat != null && s.lng != null)
    return spreadOverlapping(withCoords)
  }, [stores])

  if (!ready || !L) {
    return (
      <div
        style={{
          height: 480,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#9ca3af',
          fontSize: '0.875rem',
        }}
      >
        Loading map…
      </div>
    )
  }

  return (
    <div style={{ height: 480, width: '100%', borderRadius: '0.5rem', overflow: 'hidden', position: 'relative' }}>
      <div
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          zIndex: 1000,
          display: 'inline-flex',
          borderRadius: 6,
          overflow: 'hidden',
          border: '1px solid #e5e7eb',
          background: '#fff',
          boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
        }}
      >
        {(
          [
            { id: 'street' as const, label: 'Map' },
            { id: 'satellite' as const, label: 'Satellite' },
          ] as const
        ).map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setBasemap(opt.id)}
            style={{
              border: 'none',
              padding: '6px 10px',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              background: basemap === opt.id ? '#111827' : '#fff',
              color: basemap === opt.id ? '#fff' : '#374151',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <MapContainer
        center={[28.8, -82.4]}
        zoom={7}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom
      >
        {basemap === 'street' ? (
          <TileLayer
            key="street"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        ) : (
          <>
            <TileLayer
              key="satellite"
              attribution='Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
            <TileLayer
              key="satellite-labels"
              attribution=""
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
              opacity={0.9}
            />
          </>
        )}
        <FitBounds stores={stores.filter((s) => s.lat != null && s.lng != null)} />

        {clusters.map((c) => {
          const shape = clusterShape(c.stores)
          if (!shape) return null
          const selected = selectedClusterId === c.id
          const dimmed = selectedClusterId != null && !selected
          const base = clusterColor(c.id)
          const color = selected ? darkenHex(base, 0.18) : base
          const shortLabel = c.label
            .replace(/^Cluster \d+ · /, '')
            .replace(/^Other · /, 'Other: ')
          return (
            <Polygon
              key={`shape-${c.id}`}
              positions={shape}
              pathOptions={{
                color: selected ? '#0f172a' : color,
                weight: selected ? 3.5 : 2.25,
                dashArray: selected ? undefined : '2 10',
                lineCap: 'round',
                lineJoin: 'round',
                fillColor: color,
                fillOpacity: dimmed ? 0.05 : selected ? 0.34 : 0.22,
                opacity: dimmed ? 0.35 : 0.95,
              }}
              eventHandlers={{
                click: () => onSelectCluster(selected ? null : c.id),
              }}
            >
              <Tooltip direction="center" permanent={selected} opacity={0.95}>
                <span style={{ fontWeight: 700, color: color }}>
                  {shortLabel}
                  {clusterEstimator(c.id) ? ` — ${clusterEstimator(c.id)}` : ''}
                </span>
                {' · '}
                {c.estimatorsNeeded} est · {c.storeCount} stores · {c.detailsCompleted} details
              </Tooltip>
            </Polygon>
          )
        })}

        {mapped.map((store) => {
          const onWhiteboard = store.clusterId.startsWith('cluster-')
          const color = clusterColor(store.clusterId)
          const selected = selectedClusterId === store.clusterId
          const storeSelected = selectedStoreId === store.location
          const dimmed =
            (selectedClusterId != null && !selected) ||
            (selectedStoreId != null && !storeSelected)
          const size = iconSizeForVolume(store.detailsCompleted, maxDetails)
          const icon = createPinIcon(
            L,
            color,
            selected,
            size,
            store.location,
            dimmed,
            storeSelected,
            !onWhiteboard
          )
          if (!icon) return null

          return (
            <Marker
              key={store.location}
              position={[store.mapLat, store.mapLng]}
              icon={icon}
              zIndexOffset={storeSelected ? 1200 : selected ? 800 : 200 + store.detailsCompleted}
              opacity={1}
              eventHandlers={{
                click: () => {
                  onSelectCluster(store.clusterId)
                },
              }}
            >
              <Popup>
                <div style={{ minWidth: 190, fontSize: 12, lineHeight: 1.45 }}>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>
                    #{store.location} · {store.storeName.replace(/^LOWE'?S OF /i, '')}
                  </div>
                  <div style={{ color: '#64748b' }}>
                    {store.city ? `${store.city}, ${store.state}` : store.workroom}
                    {store.district != null ? ` · Dist ${store.district}` : ''}
                  </div>
                  <div style={{ marginTop: 6, color: '#1d4ed8', fontWeight: 600 }}>
                    {clusters.find((c) => c.id === store.clusterId)?.label || 'Cluster'}
                    {clusterEstimator(store.clusterId) ? (
                      <span style={{ fontWeight: 500 }}>
                        {' — '}
                        {clusterEstimator(store.clusterId)}
                      </span>
                    ) : null}
                  </div>
                  <div style={{ marginTop: 6 }}>
                    Details: <strong>{store.detailsCompleted}</strong>
                    {' · '}
                    Jobs: <strong>{store.jobsCompleted}</strong>
                  </div>
                  <div>
                    Detail CT:{' '}
                    <strong>{store.detailsTotal != null ? `${store.detailsTotal.toFixed(1)}d` : '—'}</strong>
                    {' · '}
                    WPI: <strong>{store.wpi.toFixed(1)}</strong>
                  </div>
                  {(store.lat != null && store.lng != null) || store.phone ? (
                    <div
                      style={{
                        marginTop: 8,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        flexWrap: 'wrap',
                      }}
                    >
                      {store.lat != null && store.lng != null && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            onSelectStore?.(store)
                          }}
                          style={{
                            border: 'none',
                            borderRadius: 4,
                            padding: '3px 8px',
                            background: '#16a34a',
                            color: '#fff',
                            fontWeight: 600,
                            fontSize: 10,
                            cursor: 'pointer',
                            lineHeight: 1.3,
                          }}
                        >
                          Show store
                        </button>
                      )}
                      {store.phone && (
                        <a
                          href={`tel:${store.phone.replace(/\D/g, '')}`}
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: '#1d4ed8',
                            textDecoration: 'none',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {store.phone}
                        </a>
                      )}
                    </div>
                  ) : null}
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>

      <style jsx global>{`
        .store-map-marker {
          background: transparent !important;
          border: none !important;
        }
      `}</style>
    </div>
  )
}
