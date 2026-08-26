/**
 * Convert Excel percent cells to percentage points for display/scoring.
 *
 * Excel often stores 27% as 0.27. After conversion we store 27.
 * Call this ONCE at ingest only — never again when averaging or displaying,
 * or a true 1% (stored as 1) will be wrongly shown as 100%.
 */
export function excelPercentToPoints(value: number): number {
  if (isNaN(value) || value <= 0) return value
  // Fractions in (0, 1] → percentage points (0.27 → 27, 1 → 100)
  if (value <= 1) return value * 100
  return value
}
