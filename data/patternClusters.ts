/**
 * Manual estimator clusters from whiteboard photos (14 groups).
 * Store numbers corrected to known Lowe's IDs where handwriting was ambiguous
 * (e.g. 2381→2361, 2380→2360, 1624→1629, 1933→1935, 1885→1685).
 */

export interface PatternClusterDef {
  id: string
  label: string
  stores: number[]
  /** Distinct map / list color for this measuring zone */
  color: string
  /** Assigned estimator(s) for this cluster */
  estimator?: string
}

/** Fallback for leftover / Other groups */
export const OTHER_CLUSTER_COLOR = '#64748b'

export const PATTERN_CLUSTERS: PatternClusterDef[] = [
  {
    id: 'cluster-01-naples',
    label: 'Cluster 1 · Naples',
    estimator: 'Gerald Kernohan',
    stores: [2261, 613, 2362, 2221],
    color: '#0f766e', // deep teal
  },
  {
    id: 'cluster-02-fort-myers',
    label: 'Cluster 2 · Fort Myers / Cape Coral',
    stores: [582, 592, 2361],
    color: '#c2410c', // burnt orange
  },
  {
    id: 'cluster-03-dothan-albany',
    label: 'Cluster 3 · Dothan / Albany',
    estimator: 'William Kennett · Justin Wells',
    stores: [606, 2884, 281, 2212, 491, 2621, 1564],
    color: '#854d0e', // brown
  },
  {
    id: 'cluster-04-pasco',
    label: "Cluster 4 · Port Richey / Land O'Lakes",
    estimator: 'Gabriel Gardner',
    stores: [724, 2238, 3477, 1854, 1003],
    color: '#0369a1', // sky / steel blue
  },
  {
    id: 'cluster-05-panama-tally',
    label: 'Cluster 5 · Panama City / Tallahassee',
    estimator: 'Charles Lanier',
    stores: [448, 2367, 1924, 2886, 417, 716],
    color: '#6d28d9', // purple
  },
  {
    id: 'cluster-06-bradenton',
    label: 'Cluster 6 · Bradenton / Parrish',
    estimator: 'John Johnson',
    stores: [772, 1843, 3453],
    color: '#be123c', // crimson
  },
  {
    id: 'cluster-07-tampa',
    label: 'Cluster 7 · Tampa',
    estimator: 'Juan Olivares · Sasha Pulido',
    stores: [1911, 573, 2282, 2360, 564, 2639, 1629],
    color: '#f59e0b', // amber / yellow-orange (not red)
  },
  {
    id: 'cluster-08-ocala',
    label: 'Cluster 8 · Ocala',
    estimator: 'Angel Meulener',
    stores: [1605, 1853, 2753, 440, 1855, 1827],
    color: '#15803d', // forest green
  },
  {
    id: 'cluster-09-gainesville',
    label: 'Cluster 9 · Gainesville',
    estimator: 'Michelle',
    stores: [3278, 2365, 2984, 179, 2462],
    color: '#a21caf', // magenta
  },
  {
    id: 'cluster-10-kissimmee',
    label: 'Cluster 10 · Lake Wales / Kissimmee',
    estimator: 'Christopher Moss',
    stores: [2224, 2240, 2438, 1652, 2363, 2702],
    color: '#ca8a04', // gold
  },
  {
    id: 'cluster-11-pinellas',
    label: 'Cluster 11 · Pinellas / Clearwater',
    estimator: 'Theron Gentille',
    stores: [1190, 1701, 1714, 771, 740, 2777],
    color: '#1e3a8a', // navy
  },
  {
    id: 'cluster-12-north-central',
    label: 'Cluster 12 · Leesburg / Mt. Dora',
    estimator: 'Alberto Cabrera',
    stores: [2577, 569, 3351, 1685],
    color: '#4d7c0f', // olive
  },
  {
    id: 'cluster-13-sarasota',
    label: 'Cluster 13 · Sarasota',
    estimator: 'Scott Eastwood',
    stores: [1683, 2727, 2933, 1935, 1732],
    color: '#db2777', // hot pink
  },
  {
    id: 'cluster-14-lakeland',
    label: 'Cluster 14 · Lakeland',
    stores: [2531, 2253, 783, 1592, 1079, 2457],
    color: '#0e7490', // cyan-teal (distinct from Naples & Pasco)
  },
]

/** Store number → cluster id */
export const STORE_TO_PATTERN: Record<number, string> = Object.fromEntries(
  PATTERN_CLUSTERS.flatMap((c) => c.stores.map((n) => [n, c.id]))
)

const COLOR_BY_ID: Record<string, string> = Object.fromEntries(
  PATTERN_CLUSTERS.map((c) => [c.id, c.color])
)

export function patternClusterById(id: string): PatternClusterDef | undefined {
  return PATTERN_CLUSTERS.find((c) => c.id === id)
}

/** Map / UI color for a cluster id (whiteboard or Other) */
export function clusterColor(clusterId: string): string {
  if (COLOR_BY_ID[clusterId]) return COLOR_BY_ID[clusterId]
  return OTHER_CLUSTER_COLOR
}

export function clusterEstimator(clusterId: string): string | undefined {
  return patternClusterById(clusterId)?.estimator
}
