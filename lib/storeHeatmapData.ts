import { storeCoordinates, type StoreCoordinates } from '@/data/storeCoordinates'
import { PATTERN_CLUSTERS, STORE_TO_PATTERN } from '@/data/patternClusters'
import storePhones from '@/data/storePhones.json'
import type { CycleTimeStoreRecord, CycleTimeVariant } from '@/lib/cycleTimeData'

const phoneByStore = storePhones as Record<string, string>

/** Max miles from cluster hub before a store starts a new geo cluster */
export const CLUSTER_RADIUS_MILES = 55
/** Average road speed for drive-time estimates */
export const AVG_DRIVE_MPH = 35
export const WEEKS_PER_YEAR = 52

/** Manager guidance: details (measures) per week */
export const FULL_TIME_WEEKLY = { min: 30, max: 40, mid: 35 }
export const PART_TIME_WEEKLY = { min: 15, max: 20, mid: 17.5 }

export type EstimatorRole = 'fullTime' | 'partTime'

/** @deprecated alias — prefer capacityForPeriod */
export const DETAILS_PER_ESTIMATOR = FULL_TIME_WEEKLY.mid * WEEKS_PER_YEAR
export const DETAILS_PER_ESTIMATOR_FALLBACK = DETAILS_PER_ESTIMATOR

export type HeatMetric =
  | 'volume'
  | 'cycleTime'
  | 'performance'
  | 'backlog'
  | 'soldRatio'

export interface StoreHeatPoint {
  location: number
  storeName: string
  workroom: string
  district: number | null
  city: string
  state: string
  lat: number | null
  lng: number | null
  /** Public store phone (directory / Google listing) */
  phone: string | null
  detailsCompleted: number
  jobsCompleted: number
  woCompleted: number
  detailsTotal: number | null
  jobsTotal: number | null
  woTotal: number | null
  /** RTS → Schedule days — backlog / scheduling delay proxy */
  detailsRtsSch: number | null
  /** jobs / details — sold conversion proxy */
  soldRatio: number | null
  wpi: number
  hasCycleData: boolean
  clusterId: string
}

export interface GeoCluster {
  id: string
  label: string
  district: number | null
  hubStore: number
  hubName: string
  lat: number
  lng: number
  stores: StoreHeatPoint[]
  storeCount: number
  detailsCompleted: number
  jobsCompleted: number
  woCompleted: number
  avgDetailsCycle: number | null
  avgJobsCycle: number | null
  avgWoCycle: number | null
  avgWpi: number
  avgBacklogDays: number | null
  soldRatio: number | null
  /** Max haversine miles from hub to a member store */
  spanMiles: number
  /** Mean pairwise miles among stores with coords */
  avgPairMiles: number
  /** Estimated one-way drive minutes hub → farthest store */
  maxDriveMinutes: number
  estimatorsNeeded: number
  detailsPerEstimator: number
}

export interface DistrictSummary {
  district: number | null
  label: string
  storeCount: number
  detailsCompleted: number
  jobsCompleted: number
  avgDetailsCycle: number | null
  avgWpi: number
  clusters: GeoCluster[]
  estimatorsNeeded: number
}

function scoreDetailsCycle(days: number | null): number {
  if (days == null || days <= 0) return 50
  if (days <= 5) return 100
  if (days <= 10) return 60
  if (days <= 15) return 40
  if (days <= 20) return 30
  return 20
}

function scoreJobsCycle(days: number | null): number {
  if (days == null || days <= 0) return 50
  if (days <= 5) return 100
  if (days <= 10) return 80
  if (days <= 15) return 60
  if (days <= 20) return 40
  return 20
}

function scoreWorkOrderCycle(days: number | null): number {
  if (days == null || days <= 0) return 50
  if (days <= 15) return 100
  if (days <= 25) return 80
  if (days <= 35) return 60
  if (days <= 45) return 40
  return 20
}

export function storeWpi(record: Pick<CycleTimeStoreRecord, 'detailsTotal' | 'jobsTotal' | 'woTotal'>): number {
  const detailsScore = scoreDetailsCycle(record.detailsTotal)
  const jobsScore = scoreJobsCycle(record.jobsTotal)
  const woScore = scoreWorkOrderCycle(record.woTotal)
  return detailsScore * (5 / 32) + jobsScore * (13 / 32) + woScore * (14 / 32)
}

export function haversineMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const R = 3958.8
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)))
}

export function driveMinutes(miles: number): number {
  return (miles / AVG_DRIVE_MPH) * 60
}

function avg(nums: number[]): number | null {
  if (nums.length === 0) return null
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

/**
 * Capacity from manager rates:
 *  - Full-time: 30–40 details/week (use mid 35)
 *  - Part-time: 15–20 details/week (use mid 17.5)
 * Converted to the selected period (LY ≈ 52 weeks; YTD ≈ share of year from YTD/LY volume).
 */
export function weeklyRate(role: EstimatorRole): number {
  return role === 'fullTime' ? FULL_TIME_WEEKLY.mid : PART_TIME_WEEKLY.mid
}

export function estimatePeriodWeeks(
  variant: CycleTimeVariant,
  records: CycleTimeStoreRecord[],
  compareRecords: CycleTimeStoreRecord[] = []
): number {
  if (variant === 'ly') return WEEKS_PER_YEAR

  const ytdTotal = records.reduce((s, r) => s + (r.detailsCompleted || 0), 0)
  const lyTotal = compareRecords.reduce((s, r) => s + (r.detailsCompleted || 0), 0)
  if (lyTotal > 0 && ytdTotal > 0) {
    const weeks = Math.round((ytdTotal / lyTotal) * WEEKS_PER_YEAR)
    return Math.min(WEEKS_PER_YEAR, Math.max(8, weeks))
  }
  // Fallback ~42% of year from current YTD vs LY file ratio
  return 22
}

export function capacityForPeriod(
  role: EstimatorRole,
  variant: CycleTimeVariant,
  records: CycleTimeStoreRecord[],
  compareRecords: CycleTimeStoreRecord[] = []
): { capacity: number; weeks: number; weekly: number } {
  const weekly = weeklyRate(role)
  const weeks = estimatePeriodWeeks(variant, records, compareRecords)
  return { capacity: Math.round(weekly * weeks), weeks, weekly }
}

/** @deprecated — use capacityForPeriod */
export function capacityFromRecords(records: CycleTimeStoreRecord[]): number {
  return capacityForPeriod('fullTime', 'ytd', records).capacity
}

function travelAdjustedCapacity(baseCapacity: number, spanMiles: number): number {
  let capacity = baseCapacity
  if (spanMiles > 60) capacity *= 0.85
  else if (spanMiles > 40) capacity *= 0.92
  return Math.max(Math.floor(baseCapacity * 0.5), Math.round(capacity))
}

export function recommendEstimators(
  detailsCompleted: number,
  spanMiles: number,
  baseCapacity: number = DETAILS_PER_ESTIMATOR_FALLBACK
): {
  estimatorsNeeded: number
  detailsPerEstimator: number
  capacityUsed: number
} {
  const capacity = travelAdjustedCapacity(baseCapacity, spanMiles)
  if (detailsCompleted <= 0) {
    return { estimatorsNeeded: 0, detailsPerEstimator: capacity, capacityUsed: capacity }
  }
  const estimatorsNeeded = Math.max(1, Math.ceil(detailsCompleted / capacity))
  return {
    estimatorsNeeded,
    detailsPerEstimator: detailsCompleted / estimatorsNeeded,
    capacityUsed: capacity,
  }
}

function buildClusterFromMembers(
  id: string,
  label: string,
  members: Omit<StoreHeatPoint, 'clusterId'>[],
  baseCapacity: number,
  storeClusterMap: Map<number, string>
): GeoCluster {
  const sorted = [...members].sort((a, b) => b.detailsCompleted - a.detailsCompleted)
  const hub = sorted[0] || members[0]
  const hubLat = hub?.lat ?? null
  const hubLng = hub?.lng ?? null

  const coordMembers = members.filter((m) => m.lat != null && m.lng != null)
  let spanMiles = 0
  const pairMiles: number[] = []
  for (const m of coordMembers) {
    if (hubLat != null && hubLng != null) {
      spanMiles = Math.max(spanMiles, haversineMiles(hubLat, hubLng, m.lat!, m.lng!))
    }
  }
  for (let i = 0; i < coordMembers.length; i++) {
    for (let j = i + 1; j < coordMembers.length; j++) {
      pairMiles.push(
        haversineMiles(
          coordMembers[i].lat!,
          coordMembers[i].lng!,
          coordMembers[j].lat!,
          coordMembers[j].lng!
        )
      )
    }
  }

  const detailsCompleted = members.reduce((s, m) => s + m.detailsCompleted, 0)
  const jobsCompleted = members.reduce((s, m) => s + m.jobsCompleted, 0)
  const woCompleted = members.reduce((s, m) => s + m.woCompleted, 0)
  const { estimatorsNeeded, detailsPerEstimator } = recommendEstimators(
    detailsCompleted,
    spanMiles,
    baseCapacity
  )

  const districtCounts = new Map<number, number>()
  for (const m of members) {
    if (m.district != null) {
      districtCounts.set(m.district, (districtCounts.get(m.district) || 0) + 1)
    }
  }
  let district: number | null = null
  let best = 0
  for (const [d, n] of Array.from(districtCounts.entries())) {
    if (n > best) {
      best = n
      district = d
    }
  }

  for (const m of members) {
    storeClusterMap.set(m.location, id)
  }

  return {
    id,
    label,
    district,
    hubStore: hub?.location ?? 0,
    hubName: hub?.storeName ?? 'Cluster',
    lat: hubLat ?? 28.5,
    lng: hubLng ?? -82.5,
    stores: [],
    storeCount: members.length,
    detailsCompleted,
    jobsCompleted,
    woCompleted,
    avgDetailsCycle: avg(
      members.map((m) => m.detailsTotal).filter((v): v is number => v != null && v > 0)
    ),
    avgJobsCycle: avg(
      members.map((m) => m.jobsTotal).filter((v): v is number => v != null && v > 0)
    ),
    avgWoCycle: avg(members.map((m) => m.woTotal).filter((v): v is number => v != null && v > 0)),
    avgWpi: avg(members.filter((m) => m.hasCycleData).map((m) => m.wpi)) ?? 50,
    avgBacklogDays: avg(
      members.map((m) => m.detailsRtsSch).filter((v): v is number => v != null && v > 0)
    ),
    soldRatio: detailsCompleted > 0 ? jobsCompleted / detailsCompleted : jobsCompleted > 0 ? 1 : null,
    spanMiles,
    avgPairMiles: avg(pairMiles) ?? 0,
    maxDriveMinutes: driveMinutes(spanMiles),
    estimatorsNeeded,
    detailsPerEstimator,
  }
}

/**
 * Build store heat points for all known Lowe's stores, joined to cycle-time rows.
 * Clusters follow the 13 manual whiteboard groups (plus leftover "Other" groups).
 */
export function buildStoreHeatmap(
  records: CycleTimeStoreRecord[],
  options: {
    variant?: CycleTimeVariant
    compareRecords?: CycleTimeStoreRecord[]
    role?: EstimatorRole
  } = {}
): {
  stores: StoreHeatPoint[]
  clusters: GeoCluster[]
  districts: DistrictSummary[]
  baseCapacity: number
  weeks: number
  weekly: number
  role: EstimatorRole
  totals: {
    storeCount: number
    withData: number
    detailsCompleted: number
    jobsCompleted: number
    avgWpi: number
    estimatorsNeeded: number
    avgDetailsCycle: number | null
  }
} {
  const variant = options.variant ?? 'ytd'
  const role = options.role ?? 'fullTime'
  const compareRecords = options.compareRecords ?? []
  const { capacity: baseCapacity, weeks, weekly } = capacityForPeriod(
    role,
    variant,
    records,
    compareRecords
  )
  const byLocation = new Map<number, CycleTimeStoreRecord>()
  for (const r of records) {
    byLocation.set(r.location, r)
  }

  const metaByNumber = new Map<string, StoreCoordinates>()
  for (const s of storeCoordinates) {
    metaByNumber.set(String(s.number), s)
  }

  // Union of mapped stores + any CT locations not in the 73 list
  const locationIds = new Set<number>()
  for (const s of storeCoordinates) locationIds.add(Number(s.number))
  for (const r of records) locationIds.add(r.location)

  const rawStores: Omit<StoreHeatPoint, 'clusterId'>[] = []
  for (const loc of Array.from(locationIds).sort((a, b) => a - b)) {
    const meta = metaByNumber.get(String(loc))
    const ct = byLocation.get(loc)
    const detailsCompleted = ct?.detailsCompleted ?? 0
    const jobsCompleted = ct?.jobsCompleted ?? 0
    rawStores.push({
      location: loc,
      storeName: ct?.storeName || meta?.name || `Store #${loc}`,
      workroom: ct?.workroom || meta?.workroom || 'Unassigned',
      district: ct?.district ?? null,
      city: meta?.city || '',
      state: meta?.state || '',
      lat: meta?.lat ?? null,
      lng: meta?.lng ?? null,
      phone: phoneByStore[String(loc)] ?? null,
      detailsCompleted,
      jobsCompleted,
      woCompleted: ct?.woCompleted ?? 0,
      detailsTotal: ct?.detailsTotal ?? null,
      jobsTotal: ct?.jobsTotal ?? null,
      woTotal: ct?.woTotal ?? null,
      detailsRtsSch: ct?.detailsRtsSch ?? null,
      soldRatio:
        detailsCompleted > 0 ? jobsCompleted / detailsCompleted : jobsCompleted > 0 ? 1 : null,
      wpi: ct ? storeWpi(ct) : 50,
      hasCycleData: Boolean(ct),
    })
  }

  // Manual whiteboard clusters (13 groups), then leftover "Other" by workroom
  const clusters: GeoCluster[] = []
  const storeClusterMap = new Map<number, string>()
  const byLocationRaw = new Map(rawStores.map((s) => [s.location, s]))
  const assigned = new Set<number>()

  for (const def of PATTERN_CLUSTERS) {
    const members = def.stores
      .map((n) => byLocationRaw.get(n))
      .filter((s): s is (typeof rawStores)[0] => Boolean(s))
    if (members.length === 0) continue
    for (const m of members) assigned.add(m.location)
    clusters.push(
      buildClusterFromMembers(def.id, def.label, members, baseCapacity, storeClusterMap)
    )
  }

  const leftovers = rawStores.filter((s) => !assigned.has(s.location))
  const byWorkroom = new Map<string, typeof rawStores>()
  for (const s of leftovers) {
    const key = s.workroom || 'Unassigned'
    if (!byWorkroom.has(key)) byWorkroom.set(key, [])
    byWorkroom.get(key)!.push(s)
  }
  let otherIdx = 1
  for (const [workroom, members] of Array.from(byWorkroom.entries())) {
    const id = `other-${otherIdx++}-${workroom.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
    clusters.push(
      buildClusterFromMembers(
        id,
        `Other · ${workroom}`,
        members,
        baseCapacity,
        storeClusterMap
      )
    )
  }

  const stores: StoreHeatPoint[] = rawStores.map((s) => ({
    ...s,
    clusterId: storeClusterMap.get(s.location) || STORE_TO_PATTERN[s.location] || 'none',
  }))

  for (const c of clusters) {
    c.stores = stores.filter((s) => s.clusterId === c.id)
  }

  // Keep whiteboard cluster order first, then others by volume
  const clusterOrder = new Map(PATTERN_CLUSTERS.map((p, i) => [p.id, i]))
  clusters.sort((a, b) => {
    const ai = clusterOrder.has(a.id) ? clusterOrder.get(a.id)! : 1000
    const bi = clusterOrder.has(b.id) ? clusterOrder.get(b.id)! : 1000
    if (ai !== bi) return ai - bi
    return b.detailsCompleted - a.detailsCompleted
  })

  // District rollups
  const districtMap = new Map<string, GeoCluster[]>()
  for (const c of clusters) {
    const key = c.district != null ? String(c.district) : 'unknown'
    if (!districtMap.has(key)) districtMap.set(key, [])
    districtMap.get(key)!.push(c)
  }

  const districts: DistrictSummary[] = Array.from(districtMap.entries())
    .map(([key, dClusters]) => {
      const district = key === 'unknown' ? null : Number(key)
      const storeCount = dClusters.reduce((s, c) => s + c.storeCount, 0)
      const detailsCompleted = dClusters.reduce((s, c) => s + c.detailsCompleted, 0)
      const jobsCompleted = dClusters.reduce((s, c) => s + c.jobsCompleted, 0)
      const wpiVals = dClusters.map((c) => c.avgWpi)
      const cycleVals = dClusters
        .map((c) => c.avgDetailsCycle)
        .filter((v): v is number => v != null)
      return {
        district,
        label: district != null ? `District ${district}` : 'Unassigned',
        storeCount,
        detailsCompleted,
        jobsCompleted,
        avgDetailsCycle: avg(cycleVals),
        avgWpi: avg(wpiVals) ?? 50,
        clusters: dClusters,
        estimatorsNeeded: dClusters.reduce((s, c) => s + c.estimatorsNeeded, 0),
      }
    })
    .sort((a, b) => b.detailsCompleted - a.detailsCompleted)

  const withData = stores.filter((s) => s.hasCycleData)
  const totals = {
    storeCount: stores.length,
    withData: withData.length,
    detailsCompleted: stores.reduce((s, x) => s + x.detailsCompleted, 0),
    jobsCompleted: stores.reduce((s, x) => s + x.jobsCompleted, 0),
    avgWpi: avg(withData.map((s) => s.wpi)) ?? 50,
    estimatorsNeeded: clusters.reduce((s, c) => s + c.estimatorsNeeded, 0),
    avgDetailsCycle: avg(
      withData.map((s) => s.detailsTotal).filter((v): v is number => v != null && v > 0)
    ),
  }

  return { stores, clusters, districts, baseCapacity, weeks, weekly, role, totals }
}

export function heatColor(value: number, metric: HeatMetric): string {
  if (metric === 'cycleTime' || metric === 'backlog') {
    // lower is better
    if (value <= 5) return '#22c55e'
    if (value <= 10) return '#84cc16'
    if (value <= 15) return '#facc15'
    if (value <= 25) return '#f97316'
    return '#ef4444'
  }
  if (metric === 'performance' || metric === 'soldRatio') {
    const v = metric === 'soldRatio' ? value * 100 : value
    if (v >= 85) return '#22c55e'
    if (v >= 70) return '#facc15'
    if (v >= 50) return '#f97316'
    return '#ef4444'
  }
  // volume — relative handled by caller; absolute bands
  if (value >= 80) return '#22c55e'
  if (value >= 40) return '#84cc16'
  if (value >= 15) return '#facc15'
  if (value > 0) return '#f97316'
  return '#9ca3af'
}

export function metricValue(store: StoreHeatPoint, metric: HeatMetric): number {
  switch (metric) {
    case 'volume':
      return store.detailsCompleted
    case 'cycleTime':
      return store.detailsTotal ?? 0
    case 'performance':
      return store.wpi
    case 'backlog':
      return store.detailsRtsSch ?? 0
    case 'soldRatio':
      return store.soldRatio ?? 0
    default:
      return 0
  }
}

/** YoY compare helper when both periods are available */
export function compareStoreVolume(
  ytd: CycleTimeStoreRecord[],
  ly: CycleTimeStoreRecord[],
  location: number
): { ytd: number; ly: number; delta: number; deltaPct: number | null } {
  const a = ytd.find((r) => r.location === location)?.detailsCompleted ?? 0
  const b = ly.find((r) => r.location === location)?.detailsCompleted ?? 0
  const delta = a - b
  const deltaPct = b > 0 ? (delta / b) * 100 : null
  return { ytd: a, ly: b, delta, deltaPct }
}
