# WPI (Workroom Performance Index) Scoring Explanation

## Overview
WPI is a composite score (0-100) that measures overall workroom performance using three weighted components.

## Formula
```
WPI = (LTR Score × 50%) + (Labor PO Score × 30%) + (Vendor Debit Score × 20%)
```

---

## Component 1: LTR Score (50% Weight)

**What it measures:** Labor efficiency - how much labor cost relative to sales revenue

**LTR% Calculation:**
```
LTR% = (Labor PO $ ÷ Sales) × 100
```

**Scoring Logic (Lower LTR% = Better):**

| LTR% Range | Score Range | Formula |
|------------|-------------|---------|
| 0-20% | 100-70 points | `100 - (LTR% / 20) × 30` |
| 20-40% | 70-0 points | `70 - ((LTR% - 20) / 20) × 70` |
| >40% | 0 points | Always 0 |
| No Sales Data | 50 points | Neutral score |

**Examples:**
- LTR% = 10% → Score = 85 points
- LTR% = 20% → Score = 70 points  
- LTR% = 30% → Score = 35 points
- LTR% = 45% → Score = 0 points

**Why 50% Weight:** LTR directly impacts profitability - it's the most critical metric.

---

## Component 2: Labor PO $ Score (30% Weight)

**What it measures:** Volume contribution - how much business volume this workroom generates

**Calculation:**
```
maxLaborPO = Highest Labor PO $ across all workrooms
Labor PO Score = (Workroom Labor PO $ ÷ maxLaborPO) × 100
```

**Examples:**
- If max Labor PO = $100,000:
  - Workroom with $100,000 → 100 points
  - Workroom with $50,000 → 50 points
  - Workroom with $10,000 → 10 points

**Why 30% Weight:** Higher volume indicates scale and importance, but efficiency (LTR) matters more.

---

## Component 3: Vendor Debit Discipline Score (20% Weight)

**What it measures:** Cost control - how well the workroom manages vendor debit costs

**Calculation:**
```
Vendor Debit Ratio = |Vendor Debit $| ÷ Total Cost
Vendor Debit Score = 100 - (Ratio × 200)
Minimum Score = 0
```

**Examples:**
- Ratio = 0% → Score = 100 points (perfect discipline)
- Ratio = 10% → Score = 80 points
- Ratio = 25% → Score = 50 points
- Ratio = 50% → Score = 0 points

**Why 20% Weight:** Important for cost control, but less critical than efficiency and volume.

---

## Complete Example Calculation

**Workroom: Sarasota**

**Input Data:**
- Sales: $500,000
- Labor PO: $75,000
- Vendor Debit: $15,000
- Max Labor PO (across all workrooms): $100,000

**Step 1: Calculate LTR Score**
```
LTR% = ($75,000 / $500,000) × 100 = 15%
LTR Score = 100 - (15 / 20) × 30 = 77.5 points
```

**Step 2: Calculate Labor PO Score**
```
Labor PO Score = ($75,000 / $100,000) × 100 = 75 points
```

**Step 3: Calculate Vendor Debit Score**
```
Total Cost = $75,000 + $15,000 = $90,000
Vendor Debit Ratio = $15,000 / $90,000 = 16.67%
Vendor Debit Score = 100 - (0.1667 × 200) = 66.67 points
```

**Step 4: Calculate Final WPI**
```
WPI = (77.5 × 0.50) + (75 × 0.30) + (66.67 × 0.20)
WPI = 38.75 + 22.5 + 13.33
WPI = 74.58 (rounded to 74.6)
```

---

## Score Interpretation

| WPI Range | Status | Color | Meaning |
|-----------|--------|-------|---------|
| 70-100 | Carrying Company | Green | Excellent performance |
| 50-69 | Inconsistent | Yellow | Needs improvement |
| 40-49 | Warning | Orange | Requires attention |
| <40 | Critical Issues | Red | Immediate action needed |

---

## Design Rationale

1. **LTR gets highest weight (50%)** - It directly measures profitability efficiency
2. **Labor PO volume gets 30%** - Higher volume = more important business
3. **Vendor Debit gets 20%** - Cost control matters but less critical than efficiency

The scoring system rewards:
- ✅ Efficient labor usage (low LTR%)
- ✅ High business volume (high Labor PO $)
- ✅ Good cost control (low vendor debit ratio)

---

## Notes

- Scores are normalized to 0-100 scale before weighting
- All three components contribute to final score
- Missing data gets neutral scores (50 for LTR, 0 for others)
- The system is relative - Labor PO scores compare to the highest performing workroom

