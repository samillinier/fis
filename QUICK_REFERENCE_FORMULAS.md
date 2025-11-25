# Quick Reference: Formulas & Calculations

## Essential Metrics

### 1. LTR% (Labor-to-Revenue Ratio)
```
LTR% = (Labor PO $ ÷ Sales) × 100
```
**Lower is better** - Shows labor efficiency

### 2. Total Cost
```
Total Cost = Labor PO + Vendor Debit
```

### 3. Margin
```
Margin = Sales - Total Cost
```

### 4. Margin Rate
```
Margin Rate = (Margin ÷ Total Cost) × 100
```

### 5. Vendor Debit Ratio
```
Vendor Debit Ratio = |Vendor Debit| ÷ Total Cost
```
**Lower is better** - Shows cost control

---

## WPI Score Components

### WPI Formula (Weighted)
```
WPI = (LTR Score × 50%) + (Labor PO Score × 30%) + (Vendor Debit Score × 20%)
```

### Component 1: LTR Score (50%)

**If LTR% ≤ 20%:**
```
LTR Score = 100 - (LTR% / 20) × 30
```

**If 20% < LTR% ≤ 40%:**
```
LTR Score = 70 - ((LTR% - 20) / 20) × 70
```

**If LTR% > 40%:**
```
LTR Score = 0
```

### Component 2: Labor PO Score (30%)
```
maxLaborPO = Highest Labor PO across all workrooms
Labor PO Score = (Workroom Labor PO ÷ maxLaborPO) × 100
```

### Component 3: Vendor Debit Score (20%)
```
Vendor Debit Ratio = |Vendor Debit| ÷ Total Cost
Vendor Debit Score = 100 - (Ratio × 200)
```

---

## Average Calculations

### Average Labor PO per Record
```
Avg Labor PO = Total Labor PO ÷ Number of Records
```

### Average Vendor Debit per Record
```
Avg Vendor Debit = Total Vendor Debit ÷ Number of Records
```

### Average Cycle Time
```
Avg Cycle Time = Total Cycle Time ÷ Records with Cycle Time
```

### Cost per Record
```
Cost per Record = Total Cost ÷ Number of Records
```

---

## Performance Benchmarks

### LTR% Ratings
- < 15% = Excellent
- 15-25% = Good
- 25-35% = Moderate
- 35-45% = Poor
- > 45% = Critical

### WPI Score Ratings
- 70-100 = Carrying Company (Green)
- 50-69 = Inconsistent (Yellow)
- 40-49 = Warning (Orange)
- < 40 = Critical (Red)

### Vendor Debit Ratio Ratings
- < 10% = Excellent
- 10-20% = Good
- 20-30% = Moderate
- 30-40% = High
- > 40% = Critical

---

## Example Calculations

### Example 1: Calculate LTR%
```
Sales: $500,000
Labor PO: $75,000

LTR% = ($75,000 / $500,000) × 100 = 15%
```
**Result:** 15% = Good rating

### Example 2: Calculate WPI Score
```
Sales: $500,000
Labor PO: $75,000
Vendor Debit: $15,000
Max Labor PO (all workrooms): $100,000

Step 1: LTR%
LTR% = ($75,000 / $500,000) × 100 = 15%
LTR Score = 100 - (15/20) × 30 = 77.5 points

Step 2: Labor PO Score
Labor PO Score = ($75,000 / $100,000) × 100 = 75 points

Step 3: Vendor Debit Score
Total Cost = $75,000 + $15,000 = $90,000
Vendor Debit Ratio = $15,000 / $90,000 = 16.67%
Vendor Debit Score = 100 - (0.1667 × 200) = 66.67 points

Step 4: Final WPI
WPI = (77.5 × 0.50) + (75 × 0.30) + (66.67 × 0.20)
WPI = 38.75 + 22.5 + 13.33 = 74.58
```
**Result:** 74.6 = Carrying Company (Green)

### Example 3: Calculate Margin Rate
```
Sales: $500,000
Labor PO: $75,000
Vendor Debit: $15,000

Total Cost = $75,000 + $15,000 = $90,000
Margin = $500,000 - $90,000 = $410,000
Margin Rate = ($410,000 / $90,000) × 100 = 455.6%
```
**Result:** 455.6% margin rate = Very profitable

---

## Quick Tips

✅ **Lower LTR%** = More efficient = Better  
✅ **Higher WPI Score** = Better performance  
✅ **Lower Vendor Debit Ratio** = Better cost control  
✅ **Higher Margin Rate** = More profitable  
✅ **Negative Vendor Debit** = Credit/Refund (good!)

---

**For detailed explanations, see:** `COMPLETE_APP_DOCUMENTATION.md`

