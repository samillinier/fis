'use client'

import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import {
  buildStoreHeatmap,
  compareStoreVolume,
  FULL_TIME_WEEKLY,
  PART_TIME_WEEKLY,
  type EstimatorRole,
  type HeatMetric,
  type StoreHeatPoint,
} from '@/lib/storeHeatmapData'
import { clusterColor, clusterEstimator } from '@/data/patternClusters'
import type { CycleTimeStoreRecord, CycleTimeVariant } from '@/lib/cycleTimeData'
import { MapPin, Users, Clock, TrendingUp, Store } from 'lucide-react'

const StoreHeatmapMap = dynamic(() => import('@/components/StoreHeatmapMap'), { ssr: false })
const StoreSatelliteView = dynamic(() => import('@/components/StoreSatelliteView'), { ssr: false })

interface StoreHeatmapProps {
  records: CycleTimeStoreRecord[]
  /** Other period for YoY (optional) */
  compareRecords?: CycleTimeStoreRecord[]
  periodLabel: string
  compareLabel?: string
  variant: CycleTimeVariant
}

const METRIC_OPTIONS: { id: HeatMetric; label: string; hint: string }[] = [
  { id: 'volume', label: 'Detail volume', hint: 'Completed measure appointments' },
  { id: 'cycleTime', label: 'Cycle time', hint: 'Details total days' },
  { id: 'performance', label: 'Store WPI', hint: 'Weighted cycle performance' },
  { id: 'backlog', label: 'Scheduling backlog', hint: 'RTS → Schedule days' },
  { id: 'soldRatio', label: 'Sold vs completed', hint: 'Jobs ÷ details' },
]

function fmt(n: number, d = 0) {
  return n.toLocaleString(undefined, { maximumFractionDigits: d, minimumFractionDigits: d })
}

function wpiTone(score: number) {
  if (score >= 85) return { bg: '#dcfce7', color: '#166534' }
  if (score >= 70) return { bg: '#fef9c3', color: '#854d0e' }
  return { bg: '#fee2e2', color: '#991b1b' }
}

export default function StoreHeatmap({
  records,
  compareRecords = [],
  periodLabel,
  compareLabel = 'LY',
  variant,
}: StoreHeatmapProps) {
  const [metric, setMetric] = useState<HeatMetric>('volume')
  const [role, setRole] = useState<EstimatorRole>('fullTime')
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null)
  const [selectedStore, setSelectedStore] = useState<StoreHeatPoint | null>(null)
  const [districtFilter, setDistrictFilter] = useState<string>('all')

  const model = useMemo(
    () => buildStoreHeatmap(records, { variant, compareRecords, role }),
    [records, compareRecords, variant, role]
  )

  const filteredClusters = useMemo(() => {
    if (districtFilter === 'all') return model.clusters
    if (districtFilter === 'unknown') return model.clusters.filter((c) => c.district == null)
    return model.clusters.filter((c) => String(c.district) === districtFilter)
  }, [model.clusters, districtFilter])

  const filteredStores = useMemo(() => {
    const ids = new Set(filteredClusters.map((c) => c.id))
    return model.stores.filter((s) => ids.has(s.clusterId))
  }, [model.stores, filteredClusters])

  const selectedCluster = useMemo(
    () => model.clusters.find((c) => c.id === selectedClusterId) || null,
    [model.clusters, selectedClusterId]
  )

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '0.75rem',
        }}
      >
        {[
          {
            icon: Store,
            label: 'Stores',
            value: `${model.totals.withData}/${model.totals.storeCount}`,
            sub: 'with cycle data',
          },
          {
            icon: TrendingUp,
            label: 'Details completed',
            value: fmt(model.totals.detailsCompleted),
            sub: periodLabel,
          },
          {
            icon: Clock,
            label: 'Avg detail CT',
            value:
              model.totals.avgDetailsCycle != null
                ? `${model.totals.avgDetailsCycle.toFixed(1)}d`
                : '—',
            sub: `WPI ${model.totals.avgWpi.toFixed(1)}`,
          },
          {
            icon: Users,
            label: 'Est. estimators',
            value: String(model.totals.estimatorsNeeded),
            sub:
              role === 'fullTime'
                ? `${FULL_TIME_WEEKLY.min}–${FULL_TIME_WEEKLY.max}/wk · ${model.weeks} wks`
                : `${PART_TIME_WEEKLY.min}–${PART_TIME_WEEKLY.max}/wk · ${model.weeks} wks`,
          },
          {
            icon: MapPin,
            label: 'Clusters',
            value: String(model.clusters.filter((c) => c.id.startsWith('cluster-')).length),
            sub: `${model.clusters.length} total groups`,
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="compact-section"
            style={{ margin: 0, padding: '0.85rem 1rem' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6b7280', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <kpi.icon size={13} />
              {kpi.label}
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 700, marginTop: 4, color: '#111827' }}>
              {kpi.value}
            </div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
        <div className="inline-flex rounded-md border border-gray-200 bg-white p-0.5">
          {(
            [
              { id: 'fullTime' as const, label: 'Full-time' },
              { id: 'partTime' as const, label: 'Part-time' },
            ] as const
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setRole(opt.id)}
              className="rounded px-2.5 py-1.5 text-xs font-medium"
              style={{
                background: role === opt.id ? '#111827' : 'transparent',
                color: role === opt.id ? '#fff' : '#4b5563',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {METRIC_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              title={opt.hint}
              onClick={() => setMetric(opt.id)}
              className="inline-flex items-center rounded-md px-2.5 py-1.5 text-xs font-medium border"
              style={{
                background: metric === opt.id ? '#111827' : '#fff',
                color: metric === opt.id ? '#fff' : '#374151',
                borderColor: metric === opt.id ? '#111827' : '#e5e7eb',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <select
          value={districtFilter}
          onChange={(e) => {
            setDistrictFilter(e.target.value)
            setSelectedClusterId(null)
          }}
          className="border border-gray-300 rounded-md px-2 py-1.5 text-sm bg-white"
        >
          <option value="all">All districts</option>
          {model.districts.map((d) => (
            <option
              key={d.district ?? 'unknown'}
              value={d.district != null ? String(d.district) : 'unknown'}
            >
              {d.label} ({d.storeCount})
            </option>
          ))}
        </select>
      </div>

      {/* Map + cluster panel */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,1fr)]">
        <section className="compact-section" style={{ margin: 0, padding: 0, overflow: 'hidden' }}>
          <div className="compact-section-header" style={{ padding: '0.75rem 1rem', marginBottom: 0 }}>
            <div>
              <h3 className="compact-section-title" style={{ margin: 0 }}>
                Store heat map · {METRIC_OPTIONS.find((m) => m.id === metric)?.label}
                {selectedStore ? ' · Satellite split' : ''}
              </h3>
              <p style={{ margin: '0.25rem 0 0', fontSize: 12, color: '#9ca3af' }}>
                {selectedStore
                  ? `Left: clusters · Right: satellite for #${selectedStore.location}`
                  : 'Blue shapes = clusters · open a pin and tap Show store for satellite'}
              </p>
            </div>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: selectedStore?.lat != null ? '1fr 1fr' : '1fr',
              minHeight: 480,
            }}
          >
            <div style={{ minWidth: 0, borderRight: selectedStore?.lat != null ? '1px solid #e5e7eb' : undefined }}>
              <StoreHeatmapMap
                stores={filteredStores}
                clusters={filteredClusters}
                metric={metric}
                selectedClusterId={selectedClusterId}
                selectedStoreId={selectedStore?.location ?? null}
                onSelectCluster={setSelectedClusterId}
                onSelectStore={setSelectedStore}
              />
            </div>
            {selectedStore?.lat != null && (
              <div style={{ minWidth: 0 }}>
                <StoreSatelliteView
                  store={selectedStore}
                  height={480}
                  onClose={() => setSelectedStore(null)}
                />
              </div>
            )}
          </div>
        </section>

        <section className="compact-section" style={{ margin: 0, maxHeight: 560, overflow: 'auto' }}>
          <div className="compact-section-header" style={{ marginBottom: '0.75rem' }}>
            <h3 className="compact-section-title" style={{ margin: 0 }}>
              {selectedCluster ? selectedCluster.label : 'Clusters'}
            </h3>
            <p style={{ margin: '0.25rem 0 0', fontSize: 12, color: '#9ca3af' }}>
              {selectedCluster && clusterEstimator(selectedCluster.id)
                ? `${clusterEstimator(selectedCluster.id)} · `
                : ''}
              Capacity ~{model.baseCapacity} details/{role === 'fullTime' ? 'FT' : 'PT'} estimator
              {' '}({model.weekly}/wk × {model.weeks} wks)
            </p>
          </div>

          {selectedCluster ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 8,
                  fontSize: 12,
                }}
              >
                <Stat label="Stores" value={String(selectedCluster.storeCount)} />
                <Stat label="Estimators" value={String(selectedCluster.estimatorsNeeded)} accent />
                <Stat label="Details" value={fmt(selectedCluster.detailsCompleted)} />
                <Stat label="Jobs" value={fmt(selectedCluster.jobsCompleted)} />
                <Stat
                  label="Avg detail CT"
                  value={
                    selectedCluster.avgDetailsCycle != null
                      ? `${selectedCluster.avgDetailsCycle.toFixed(1)}d`
                      : '—'
                  }
                />
                <Stat label="Avg WPI" value={selectedCluster.avgWpi.toFixed(1)} />
                <Stat label="Cluster span" value={`${selectedCluster.spanMiles.toFixed(0)} mi`} />
                <Stat
                  label="Max drive"
                  value={`${Math.round(selectedCluster.maxDriveMinutes)} min`}
                />
                <Stat
                  label="Backlog (RTS→Sch)"
                  value={
                    selectedCluster.avgBacklogDays != null
                      ? `${selectedCluster.avgBacklogDays.toFixed(1)}d`
                      : '—'
                  }
                />
                <Stat
                  label="Sold ratio"
                  value={
                    selectedCluster.soldRatio != null
                      ? `${(selectedCluster.soldRatio * 100).toFixed(0)}%`
                      : '—'
                  }
                />
              </div>
              <div style={{ fontSize: 11, color: '#6b7280' }}>
                Hub: #{selectedCluster.hubStore} {selectedCluster.hubName.replace(/^LOWE'?S OF /i, '')}
                {' · '}
                {fmt(selectedCluster.detailsPerEstimator, 0)} details / estimator
              </div>
              <button
                type="button"
                onClick={() => setSelectedClusterId(null)}
                className="text-xs text-gray-500 hover:text-gray-800 underline self-start"
              >
                Show all clusters
              </button>
              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 8 }}>
                {selectedCluster.stores
                  .slice()
                  .sort((a, b) => b.detailsCompleted - a.detailsCompleted)
                  .map((s) => (
                    <StoreRow
                      key={s.location}
                      store={s}
                      compare={
                        compareRecords.length
                          ? compareStoreVolume(records, compareRecords, s.location)
                          : null
                      }
                      compareLabel={compareLabel}
                      onShowStore={() => setSelectedStore(s)}
                      active={selectedStore?.location === s.location}
                    />
                  ))}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filteredClusters.map((c) => {
                const tone = wpiTone(c.avgWpi)
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedClusterId(c.id)}
                    style={{
                      textAlign: 'left',
                      border: '1px solid #e5e7eb',
                      borderRadius: 8,
                      padding: '0.65rem 0.75rem',
                      background: '#fff',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                        <span
                          aria-hidden
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: 999,
                            background: clusterColor(c.id),
                            flexShrink: 0,
                            boxShadow: `0 0 0 2px ${clusterColor(c.id)}33`,
                          }}
                        />
                        <div style={{ fontWeight: 600, fontSize: 13, color: '#111827' }}>{c.label}</div>
                        {clusterEstimator(c.id) && (
                          <div style={{ fontSize: 11, color: '#1d4ed8', fontWeight: 600, marginTop: 1 }}>
                            {clusterEstimator(c.id)}
                          </div>
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: 4,
                          background: clusterColor(c.id),
                          color: '#fff',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {c.estimatorsNeeded} est
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>
                      {c.storeCount} stores · {fmt(c.detailsCompleted)} details · span{' '}
                      {c.spanMiles.toFixed(0)} mi · ~{Math.round(c.maxDriveMinutes)} min drive
                    </div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 6, alignItems: 'center' }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          padding: '1px 6px',
                          borderRadius: 4,
                          background: tone.bg,
                          color: tone.color,
                        }}
                      >
                        WPI {c.avgWpi.toFixed(1)}
                      </span>
                      <span style={{ fontSize: 10, color: '#9ca3af' }}>
                        CT{' '}
                        {c.avgDetailsCycle != null ? `${c.avgDetailsCycle.toFixed(1)}d` : '—'}
                        {c.soldRatio != null
                          ? ` · sold ${(c.soldRatio * 100).toFixed(0)}%`
                          : ''}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </section>
      </div>

      {/* District table */}
      <section className="compact-section">
        <div className="compact-section-header">
          <h3 className="compact-section-title">District performance</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e7eb', textAlign: 'left', color: '#6b7280', fontSize: 11 }}>
                <th style={{ padding: '8px 10px' }}>District</th>
                <th style={{ padding: '8px 10px' }}>Stores</th>
                <th style={{ padding: '8px 10px' }}>Clusters</th>
                <th style={{ padding: '8px 10px' }}>Details</th>
                <th style={{ padding: '8px 10px' }}>Jobs</th>
                <th style={{ padding: '8px 10px' }}>Avg CT</th>
                <th style={{ padding: '8px 10px' }}>WPI</th>
                <th style={{ padding: '8px 10px' }}>Estimators</th>
              </tr>
            </thead>
            <tbody>
              {model.districts.map((d) => (
                <tr
                  key={d.district ?? 'unknown'}
                  style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }}
                  onClick={() =>
                    setDistrictFilter(d.district != null ? String(d.district) : 'unknown')
                  }
                >
                  <td style={{ padding: '8px 10px', fontWeight: 600 }}>{d.label}</td>
                  <td style={{ padding: '8px 10px' }}>{d.storeCount}</td>
                  <td style={{ padding: '8px 10px' }}>{d.clusters.length}</td>
                  <td style={{ padding: '8px 10px' }}>{fmt(d.detailsCompleted)}</td>
                  <td style={{ padding: '8px 10px' }}>{fmt(d.jobsCompleted)}</td>
                  <td style={{ padding: '8px 10px' }}>
                    {d.avgDetailsCycle != null ? `${d.avgDetailsCycle.toFixed(1)}d` : '—'}
                  </td>
                  <td style={{ padding: '8px 10px' }}>
                    <span
                      style={{
                        ...wpiTone(d.avgWpi),
                        padding: '2px 6px',
                        borderRadius: 4,
                        fontWeight: 600,
                        fontSize: 12,
                      }}
                    >
                      {d.avgWpi.toFixed(1)}
                    </span>
                  </td>
                  <td style={{ padding: '8px 10px', fontWeight: 700 }}>{d.estimatorsNeeded}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Store table */}
      <section className="compact-section">
        <div className="compact-section-header">
          <h3 className="compact-section-title">All stores · {periodLabel}</h3>
        </div>
        <div style={{ overflowX: 'auto', maxHeight: 420 }}>
          <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, background: '#fff' }}>
              <tr style={{ borderBottom: '1px solid #e5e7eb', textAlign: 'left', color: '#6b7280', fontSize: 11 }}>
                <th style={{ padding: '8px 10px' }}>Store</th>
                <th style={{ padding: '8px 10px' }}>District</th>
                <th style={{ padding: '8px 10px' }}>City</th>
                <th style={{ padding: '8px 10px' }}>Details</th>
                <th style={{ padding: '8px 10px' }}>Jobs</th>
                <th style={{ padding: '8px 10px' }}>Sold %</th>
                <th style={{ padding: '8px 10px' }}>Detail CT</th>
                <th style={{ padding: '8px 10px' }}>Backlog</th>
                <th style={{ padding: '8px 10px' }}>WPI</th>
                {compareRecords.length > 0 && (
                  <th style={{ padding: '8px 10px' }}>vs {compareLabel}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredStores
                .slice()
                .sort((a, b) => b.detailsCompleted - a.detailsCompleted)
                .map((s) => {
                  const yoy =
                    compareRecords.length > 0
                      ? compareStoreVolume(records, compareRecords, s.location)
                      : null
                  return (
                    <tr
                      key={s.location}
                      style={{
                        borderBottom: '1px solid #f3f4f6',
                        opacity: s.hasCycleData ? 1 : 0.55,
                        background:
                          selectedStore?.location === s.location ? '#f8fafc' : undefined,
                      }}
                    >
                      <td style={{ padding: '8px 10px' }}>
                        <div style={{ fontWeight: 600 }}>#{s.location}</div>
                        <div style={{ fontSize: 11, color: '#9ca3af', maxWidth: 180 }} className="truncate">
                          {s.storeName.replace(/^LOWE'?S OF /i, '')}
                        </div>
                        {(s.lat != null || s.phone) && (
                          <div
                            style={{
                              marginTop: 3,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              flexWrap: 'wrap',
                            }}
                          >
                            {s.lat != null && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedClusterId(s.clusterId)
                                  setSelectedStore(s)
                                }}
                                style={{
                                  border: 'none',
                                  borderRadius: 3,
                                  padding: '2px 6px',
                                  background: '#16a34a',
                                  color: '#fff',
                                  fontSize: 10,
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  lineHeight: 1.3,
                                }}
                              >
                                Show store
                              </button>
                            )}
                            {s.phone && (
                              <a
                                href={`tel:${s.phone.replace(/\D/g, '')}`}
                                style={{
                                  fontSize: 11,
                                  fontWeight: 600,
                                  color: '#1d4ed8',
                                  textDecoration: 'none',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {s.phone}
                              </a>
                            )}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '8px 10px' }}>{s.district ?? '—'}</td>
                      <td style={{ padding: '8px 10px' }}>{s.city || '—'}</td>
                      <td style={{ padding: '8px 10px' }}>{fmt(s.detailsCompleted)}</td>
                      <td style={{ padding: '8px 10px' }}>{fmt(s.jobsCompleted)}</td>
                      <td style={{ padding: '8px 10px' }}>
                        {s.soldRatio != null ? `${(s.soldRatio * 100).toFixed(0)}%` : '—'}
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        {s.detailsTotal != null ? `${s.detailsTotal.toFixed(1)}d` : '—'}
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        {s.detailsRtsSch != null ? `${s.detailsRtsSch.toFixed(1)}d` : '—'}
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        {s.hasCycleData ? (
                          <span
                            style={{
                              ...wpiTone(s.wpi),
                              padding: '2px 6px',
                              borderRadius: 4,
                              fontWeight: 600,
                              fontSize: 12,
                            }}
                          >
                            {s.wpi.toFixed(1)}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      {yoy && (
                        <td
                          style={{
                            padding: '8px 10px',
                            color: yoy.delta > 0 ? '#166534' : yoy.delta < 0 ? '#991b1b' : '#6b7280',
                            fontWeight: 600,
                            fontSize: 12,
                          }}
                        >
                          {yoy.delta > 0 ? '+' : ''}
                          {yoy.delta}
                          {yoy.deltaPct != null ? ` (${yoy.deltaPct > 0 ? '+' : ''}${yoy.deltaPct.toFixed(0)}%)` : ''}
                        </td>
                      )}
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div
      style={{
        background: accent ? '#111827' : '#f9fafb',
        color: accent ? '#fff' : '#111827',
        borderRadius: 6,
        padding: '0.5rem 0.6rem',
      }}
    >
      <div style={{ fontSize: 10, opacity: 0.7, fontWeight: 600, textTransform: 'uppercase' }}>
        {label}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, marginTop: 2 }}>{value}</div>
    </div>
  )
}

function StoreRow({
  store,
  compare,
  compareLabel,
  onShowStore,
  active,
}: {
  store: StoreHeatPoint
  compare: { ytd: number; ly: number; delta: number; deltaPct: number | null } | null
  compareLabel: string
  onShowStore: () => void
  active: boolean
}) {
  return (
    <div
      style={{
        width: '100%',
        textAlign: 'left',
        padding: '6px 4px',
        borderBottom: '1px solid #f3f4f6',
        background: active ? '#f1f5f9' : 'transparent',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, gap: 8 }}>
        <span style={{ fontWeight: 600 }}>
          #{store.location}{' '}
          <span style={{ fontWeight: 400, color: '#6b7280' }}>
            {store.city || store.storeName.replace(/^LOWE'?S OF /i, '').slice(0, 22)}
          </span>
        </span>
        <span style={{ fontWeight: 600 }}>{store.detailsCompleted}</span>
      </div>
      {compare && (
        <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>
          vs {compareLabel}: {compare.ly} → {compare.ytd}{' '}
          <span style={{ color: compare.delta >= 0 ? '#166534' : '#991b1b' }}>
            ({compare.delta >= 0 ? '+' : ''}
            {compare.delta})
          </span>
        </div>
      )}
      {(store.lat != null || store.phone) && (
        <div
          style={{
            marginTop: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            flexWrap: 'wrap',
          }}
        >
          {store.lat != null && (
            <button
              type="button"
              onClick={onShowStore}
              style={{
                border: 'none',
                borderRadius: 3,
                padding: '2px 6px',
                background: '#16a34a',
                color: '#fff',
                fontSize: 10,
                fontWeight: 600,
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
      )}
    </div>
  )
}
