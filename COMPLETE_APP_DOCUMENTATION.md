# FIS Dashboard - Complete Application Documentation
## Brick by Brick Guide

**Version:** 1.0.0  
**Description:** Workroom Performance Analytics Dashboard for Floor Interior Service  
**Technology Stack:** Next.js 14, React 18, TypeScript, Tailwind CSS, Recharts

---

## Table of Contents

1. [Application Overview](#1-application-overview)
2. [Architecture & Structure](#2-architecture--structure)
3. [Core Data Structures](#3-core-data-structures)
4. [Pages & Routes](#4-pages--routes)
5. [Metrics & Formulas](#5-metrics--formulas)
6. [Components Breakdown](#6-components-breakdown)
7. [Data Flow](#7-data-flow)
8. [Features Explained](#8-features-explained)
9. [Calculations Reference](#9-calculations-reference)

---

## 1. Application Overview

### What This App Does

The FIS Dashboard is a comprehensive analytics platform that:
- **Analyzes workroom performance** across multiple locations
- **Tracks financial metrics** (Sales, Labor PO, Vendor Debits)
- **Calculates performance indices** (WPI, LTR%, Margin rates)
- **Visualizes data** through charts, tables, and heatmaps
- **Identifies problem areas** and operational risks
- **Provides actionable insights** for business improvement

### Key Capabilities

✅ Upload Excel/CSV/JSON data files  
✅ Real-time data visualization  
✅ Multi-dimensional analytics (by workroom, category, store)  
✅ Performance scoring and ranking  
✅ Risk identification and alerts  
✅ PDF report generation  
✅ User authentication and data persistence  

---

## 2. Architecture & Structure

### Technology Stack

```
Frontend Framework: Next.js 14 (App Router)
UI Library: React 18
Language: TypeScript
Styling: Tailwind CSS + Custom CSS
Charts: Recharts
File Parsing: xlsx (Excel), native JSON/CSV
PDF Generation: jsPDF + html2canvas
Animations: Vanta.js (waves background)
State Management: React Context API
Data Persistence: localStorage (client-side)
```

### Project Structure

```
FIS/
├── app/                          # Next.js App Router pages
│   ├── page.tsx                 # Main dashboard (Visual Breakdown)
│   ├── sales/page.tsx           # Sales by Workroom page
│   ├── labor/page.tsx           # Labor PO & Vendor Debit page
│   ├── performance/page.tsx     # Performance Index page
│   ├── store/page.tsx           # Store Overview page
│   ├── workroom-summary/page.tsx # Workroom Summary page
│   ├── signin/page.tsx          # Sign-in page
│   ├── signup/page.tsx          # Sign-up page
│   ├── layout.tsx               # Root layout
│   └── globals.css              # Global styles
│
├── components/                   # React components
│   ├── Layout.tsx               # Main layout wrapper
│   ├── Sidebar.tsx              # Navigation sidebar
│   ├── VisualBreakdown.tsx      # Main dashboard analytics
│   ├── SummaryPanel.tsx         # Overall summary cards
│   ├── SalesByWorkroom.tsx      # Sales analytics
│   ├── LaborVendorReport.tsx    # Labor & Vendor analytics
│   ├── PerformanceIndex.tsx     # Performance metrics
│   ├── StoreOverview.tsx        # Store-level analytics
│   ├── WorkroomSummary.tsx      # Detailed workroom summary
│   ├── FileUpload.tsx           # File upload handler
│   ├── ExportButton.tsx         # PDF export functionality
│   ├── AuthContext.tsx          # Authentication state
│   ├── DataContext.tsx          # Global data state
│   ├── FilterContext.tsx        # Filter state
│   └── ... (other components)
│
├── context/                      # React Context providers
│   └── DataContext.tsx          # Core data structures
│
├── data/                         # Static data
│   ├── workroomStoreData.ts     # Store-to-workroom mapping
│   └── mockData.ts              # Initial mock data
│
└── types/                        # TypeScript definitions
    └── vanta.d.ts               # Vanta.js type definitions
```

---

## 3. Core Data Structures

### WorkroomData Interface

```typescript
interface WorkroomData {
  name: string              // Workroom name (e.g., "Tampa", "Lakeland")
  store: string | number    // Store number/identifier
  sales?: number           // Total sales revenue ($)
  laborPO?: number         // Labor Purchase Order amount ($)
  vendorDebit?: number     // Vendor debit amount ($, negative = credit)
  category?: string        // Job category (optional)
  cycleTime?: number       // Job cycle time in days (optional)
  [key: string]: any       // Additional dynamic fields
}
```

### DashboardData Interface

```typescript
interface DashboardData {
  workrooms: WorkroomData[]  // Array of all workroom records
}
```

### Key Data Points

- **Sales**: Revenue generated from workroom jobs
- **Labor PO**: Labor costs (Purchase Orders)
- **Vendor Debit**: Vendor-related costs (negative = refunds/credits)
- **Cycle Time**: Days to complete a job
- **Store**: Store number where work was performed
- **Category**: Type of work/job category

---

## 4. Pages & Routes

### 4.1 Main Dashboard (`/`)

**Component:** `VisualBreakdown.tsx`

**What it shows:**
- Heatmap Visualization (workroom performance cards)
- Operational Metrics box
- Top Performing Workrooms table
- Workrooms Most Responsible for Moving Your Business (pie chart)
- Comprehensive Workroom Analysis Dashboard
- Workroom Performance Index (WPI) by workroom
- Average Labour PO $ by workroom
- Average Vendor Debits $ by workroom

**Purpose:** Primary analytics dashboard with comprehensive overview

---

### 4.2 Sales by Workroom (`/sales`)

**Component:** `SalesByWorkroom.tsx`

**What it shows:**
- Bar chart: Sales by workroom (top performers)
- Sales distribution visualization

**Purpose:** Analyze sales performance across workrooms

---

### 4.3 Labor PO & Vendor Debit (`/labor`)

**Component:** `LaborVendorReport.tsx`

**What it shows:**
- Labor PO amounts by workroom
- Vendor Debit amounts by workroom
- Side-by-side comparison charts

**Purpose:** Track labor and vendor costs

---

### 4.4 Performance Index (`/performance`)

**Component:** `PerformanceIndex.tsx`

**What it shows:**
- Performance Index scores by workroom
- Bar chart visualization
- Option to exclude cycle time from calculation

**Purpose:** Overall performance scoring and ranking

---

### 4.5 Store Overview (`/store`)

**Component:** `StoreOverview.tsx`

**What it shows:**
- Table of all stores
- Workroom assignment
- Sales, Labor PO, Vendor Debit per store
- Total Cost and Margin calculations

**Purpose:** Store-level performance analysis

---

### 4.6 Workroom Summary (`/workroom-summary`)

**Component:** `WorkroomSummary.tsx`

**What it shows:**
- Summary cards (Total Workrooms, Sales, Cost, Margin)
- Sales vs Cost chart (top 15 workrooms)
- Detailed table with all metrics per workroom

**Purpose:** Comprehensive workroom-level details

---

### 4.7 Authentication Pages

**Sign In (`/signin`)** & **Sign Up (`/signup`)**
- User authentication
- Vanta.js waves background animation
- Session management via localStorage

---

## 5. Metrics & Formulas

### 5.1 LTR% (Labor-to-Revenue Ratio)

**Formula:**
```
LTR% = (Labor PO $ ÷ Sales) × 100
```

**What it measures:** Efficiency - how much labor cost per dollar of sales

**Interpretation:**
- Lower LTR% = Better (more efficient)
- Higher LTR% = Worse (less efficient)

**Performance Benchmarks:**
| LTR% Range | Rating | Meaning |
|------------|--------|---------|
| < 15% | Excellent | Highly efficient |
| 15-25% | Good | Efficient |
| 25-35% | Moderate | Needs improvement |
| 35-45% | Poor | Low efficiency |
| > 45% | Critical | Very inefficient |

**Example:**
```
Sales = $500,000
Labor PO = $75,000
LTR% = ($75,000 / $500,000) × 100 = 15%
```
Meaning: 15 cents of labor cost for every $1 of sales

---

### 5.2 WPI Score (Workroom Performance Index)

**Formula (Weighted):**
```
WPI = (LTR Score × 50%) + (Labor PO Score × 30%) + (Vendor Debit Score × 20%)
```

#### Component 1: LTR Score (50% Weight)

**Calculation:**
```
LTR% = (Labor PO ÷ Sales) × 100

If LTR% ≤ 20%:
  LTR Score = 100 - (LTR% / 20) × 30  // Range: 100-70 points

If 20% < LTR% ≤ 40%:
  LTR Score = 70 - ((LTR% - 20) / 20) × 70  // Range: 70-0 points

If LTR% > 40%:
  LTR Score = 0

If no sales data:
  LTR Score = 50 (neutral)
```

**Examples:**
- LTR% = 10% → Score = 85 points
- LTR% = 20% → Score = 70 points
- LTR% = 30% → Score = 35 points
- LTR% = 45% → Score = 0 points

#### Component 2: Labor PO Score (30% Weight)

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

#### Component 3: Vendor Debit Score (20% Weight)

**Calculation:**
```
Total Cost = Labor PO + Vendor Debit
Vendor Debit Ratio = |Vendor Debit| ÷ Total Cost
Vendor Debit Score = 100 - (Ratio × 200)
Minimum Score = 0
```

**Examples:**
- Ratio = 0% → Score = 100 points (perfect)
- Ratio = 10% → Score = 80 points
- Ratio = 25% → Score = 50 points
- Ratio = 50% → Score = 0 points

#### Complete WPI Example

**Workroom: Sarasota**
- Sales: $500,000
- Labor PO: $75,000
- Vendor Debit: $15,000
- Max Labor PO (all workrooms): $100,000

**Step 1: LTR Score**
```
LTR% = ($75,000 / $500,000) × 100 = 15%
LTR Score = 100 - (15 / 20) × 30 = 77.5 points
```

**Step 2: Labor PO Score**
```
Labor PO Score = ($75,000 / $100,000) × 100 = 75 points
```

**Step 3: Vendor Debit Score**
```
Total Cost = $75,000 + $15,000 = $90,000
Vendor Debit Ratio = $15,000 / $90,000 = 16.67%
Vendor Debit Score = 100 - (0.1667 × 200) = 66.67 points
```

**Step 4: Final WPI**
```
WPI = (77.5 × 0.50) + (75 × 0.30) + (66.67 × 0.20)
WPI = 38.75 + 22.5 + 13.33
WPI = 74.58 (rounded to 74.6)
```

**WPI Score Interpretation:**
| WPI Range | Status | Color | Meaning |
|-----------|--------|-------|---------|
| 70-100 | Carrying Company | Green | Excellent performance |
| 50-69 | Inconsistent | Yellow | Needs improvement |
| 40-49 | Warning | Orange | Requires attention |
| < 40 | Critical Issues | Red | Immediate action needed |

---

### 5.3 Margin & Margin Rate

**Formulas:**
```
Total Cost = Labor PO + Vendor Debit
Margin = Sales - Total Cost
Margin Rate = (Margin ÷ Total Cost) × 100
```

**Example:**
```
Sales = $500,000
Labor PO = $75,000
Vendor Debit = $15,000

Total Cost = $75,000 + $15,000 = $90,000
Margin = $500,000 - $90,000 = $410,000
Margin Rate = ($410,000 / $90,000) × 100 = 455.6%
```

**Interpretation:**
- Higher Margin Rate = More profitable
- Margin Rate shows profit as percentage of cost

---

### 5.4 Average Labor PO per Record

**Formula:**
```
Avg Labor PO = Total Labor PO ÷ Number of Records
```

**Example:**
```
Total Labor PO = $46,870
Records = 10

Avg Labor PO = $46,870 / 10 = $4,687 per record
```

---

### 5.5 Average Vendor Debit per Record

**Formula:**
```
Avg Vendor Debit = Total Vendor Debit ÷ Number of Records
```

**Example:**
```
Total Vendor Debit = -$2,436 (negative = credit)
Records = 10

Avg Vendor Debit = -$2,436 / 10 = -$243.60 per record
```

---

### 5.6 Vendor Debit Ratio

**Formula:**
```
Total Cost = Labor PO + Vendor Debit
Vendor Debit Ratio = |Vendor Debit| ÷ Total Cost
```

**Example:**
```
Labor PO = $46,870
Vendor Debit = -$2,436

Total Cost = $46,870 + (-$2,436) = $44,434
Vendor Debit Ratio = $2,436 / $44,434 = 5.5%
```

**Interpretation:**
- Lower ratio = Better (less vendor debit exposure)
- Higher ratio = Worse (more vendor debit exposure)

---

### 5.7 Average Cycle Time

**Formula:**
```
Avg Cycle Time = Total Cycle Time ÷ Number of Records with Cycle Time
```

**Example:**
```
Total Cycle Time = 250 days
Records with Cycle Time = 10

Avg Cycle Time = 250 / 10 = 25 days
```

---

### 5.8 Cost per Record

**Formula:**
```
Cost per Record = Total Cost ÷ Number of Records
```

**Example:**
```
Total Cost = $90,000
Records = 15

Cost per Record = $90,000 / 15 = $6,000 per record
```

---

## 6. Components Breakdown

### 6.1 Layout Component

**File:** `components/Layout.tsx`

**Purpose:** Main wrapper providing consistent structure

**Contains:**
- Header with logo and user info
- Sidebar navigation
- Main content area
- Footer
- Notification container

**Features:**
- User authentication display
- Logout button (appears on hover over user name)
- Responsive layout

---

### 6.2 Sidebar Component

**File:** `components/Sidebar.tsx`

**Purpose:** Navigation and filters

**Contains:**
- Navigation links to all pages
- Workroom filter dropdown
- Export PDF button
- File upload button (at bottom)

**Features:**
- Active page highlighting
- Filter by workroom
- Cycle time exclusion toggle (Performance page only)

---

### 6.3 VisualBreakdown Component

**File:** `components/VisualBreakdown.tsx`

**Purpose:** Main dashboard analytics display

**Key Sections:**

1. **Heatmap Visualization**
   - Color-coded workroom cards
   - Green = Carrying Company (WPI ≥ 70)
   - Yellow = Inconsistent (WPI 50-69)
   - Orange = Warning (WPI 40-49)
   - Red = Critical (WPI < 40)

2. **Operational Metrics Box**
   - Jobs completed, pending, return/redo
   - Installation Quality score
   - Customer Satisfaction score
   - Average labor hours
   - On-time completion rate

3. **Top Performing Workrooms Table**
   - Ranked by WPI Score
   - Shows: Rank, Workroom, Stores, LTR%, Labor PO $, Vendor Debits, WPI Score

4. **Workrooms Most Responsible for Moving Your Business**
   - Pie chart showing top 4 workrooms by average Labor PO $

5. **Comprehensive Workroom Analysis Dashboard**
   - Detailed table with:
     - Store mix
     - LTR performance
     - Labor PO volume
     - Vendor debit exposure
     - Weighted performance score
     - Operational risks
     - Financial risk rating
     - "Fix this now" bullets

6. **Workroom Performance Index (WPI) by Workroom**
   - Bar chart and table showing WPI scores

7. **Average Labour PO $ by Workroom**
   - Bar chart visualization

8. **Average Vendor Debits $ by Workroom**
   - Bar chart visualization

---

### 6.4 SummaryPanel Component

**File:** `components/SummaryPanel.tsx`

**Purpose:** Overall summary statistics

**Displays:**
- Total Workrooms (count)
- Different Stores (unique store count)
- Total Labor PO (sum)
- Total Vendor Debits (sum)
- Total Sales (sum)
- Average Cycle Time (days)

**Features:**
- Filtered by selected workroom
- Excludes invalid workroom names

---

### 6.5 FileUpload Component

**File:** `components/FileUpload.tsx`

**Purpose:** Handle file uploads and data parsing

**Supported Formats:**
- Excel (.xlsx, .xls)
- CSV (.csv)
- JSON (.json)

**Features:**
- Auto-detects file format
- Maps Lowe's T1/T2 scorecard columns
- Maps workroom names from store numbers
- Validates data structure
- Shows upload progress
- Displays success/error notifications

**Column Mapping (Excel):**
- Workroom name detection
- Store number detection
- Sales column detection
- Labor PO detection
- Vendor Debit detection
- Cycle time detection
- Category detection

---

### 6.6 ExportButton Component

**File:** `components/ExportButton.tsx`

**Purpose:** Generate PDF reports

**Features:**
- Exports current page to PDF
- Includes logo in header
- Shows page title and generation date
- Captures charts and tables
- Professional formatting

---

### 6.7 CountUpNumber Component

**File:** `components/CountUpNumber.tsx`

**Purpose:** Animated number counting

**Features:**
- Smooth animation from 0 to target value
- Customizable duration
- Support for decimals, prefixes, suffixes
- Custom formatters

**Usage:**
```typescript
<CountUpNumber 
  value={1234.56} 
  duration={1500} 
  decimals={2} 
  prefix="$" 
/>
```

---

## 7. Data Flow

### 7.1 Upload Flow

```
1. User uploads file (Excel/CSV/JSON)
   ↓
2. FileUpload component parses file
   ↓
3. Data is mapped and transformed
   ↓
4. Store numbers mapped to workroom names
   ↓
5. Data saved to DataContext
   ↓
6. Data persisted to localStorage
   ↓
7. All components re-render with new data
```

### 7.2 State Management

```
DataContext (Global)
  ├── workrooms: WorkroomData[]
  ├── setData: (data: DashboardData) => void
  └── Persists to localStorage

FilterContext (Global)
  ├── selectedWorkroom: string
  ├── excludeCycleTime: boolean
  └── Filter functions

AuthContext (Global)
  ├── isAuthenticated: boolean
  ├── user: User | null
  ├── login: (email, password) => Promise<boolean>
  ├── signup: (email, password, name) => Promise<boolean>
  └── logout: () => void
```

### 7.3 Data Persistence

- **Storage:** localStorage (browser)
- **Key:** `fis-dashboard-data`
- **Format:** JSON stringified DashboardData
- **Lifecycle:** Persists across page refreshes until new file uploaded

---

## 8. Features Explained

### 8.1 Heatmap Visualization

**Purpose:** Quick visual identification of workroom performance

**Color Coding:**
- 🟢 **Green** = WPI Score ≥ 70 (Carrying Company)
- 🟡 **Yellow** = WPI Score 50-69 (Inconsistent)
- 🟠 **Orange** = WPI Score 40-49 (Warning)
- 🔴 **Red** = WPI Score < 40 (Critical Issues)

**Card Contents:**
- Workroom name (large, bold)
- Status label
- WPI Score
- Number of stores
- Risk level
- Clickable "X issue(s) to fix" (for problematic workrooms)

**Calculation:**
Uses weighted WPI formula with three components (LTR, Labor PO, Vendor Debit)

---

### 8.2 Top Performing Workrooms

**Purpose:** Rank workrooms by overall performance

**Ranking Method:** Sorted by WPI Score (highest first)

**Displays:**
- Rank number (#1, #2, etc.)
- Workroom name
- Number of stores
- LTR% (with color badge)
- Labor PO $ amount
- Vendor Debits amount
- WPI Score (with color badge)

**Badge Colors:**
- Green = WPI > 70 or LTR% < 20
- Yellow = WPI 40-70 or LTR% 20-40
- Orange = WPI < 40 or LTR% > 40

---

### 8.3 Comprehensive Workroom Analysis

**Purpose:** Detailed breakdown of each workroom's metrics

**Columns:**
1. **Workroom** - Name
2. **Store Mix** - Number of stores, rating
3. **LTR Performance** - LTR%, rating (Excellent/Good/Moderate/Poor/Critical)
4. **Labor PO Volume** - Amount, contribution %, rating
5. **Vendor Debit Exposure** - Amount, ratio, rating
6. **Weighted Score** - WPI Score
7. **Operational Risks** - List of identified risks
8. **Financial Risk** - Low/Moderate/High/Critical
9. **Fix This Now** - Actionable items

**Risk Identification:**
- Limited store coverage (< 3 stores)
- Low record volume (< 5 records)
- High cost per record (> $10,000)
- Extended cycle time (> 30 days)
- High Labor PO per store (> $5,000)
- High vendor debit ratio (> 30%)
- High LTR% (> 35%)

---

### 8.4 Operational Metrics

**Purpose:** Real-time operational KPIs

**Metrics Calculated:**
1. **Jobs Completed** = Total number of records
2. **Jobs Pending** = Estimated 12% of total (calculated)
3. **Return/Redo Jobs** = Estimated 4% of total (calculated)
4. **Installation Quality** = Based on cycle time (lower = better)
5. **Customer Satisfaction** = Based on margin rate
6. **Average Labor Hours** = Calculated from Labor PO data
7. **On-Time Completion Rate** = Based on cycle time vs. target (30 days)

**Calculation Examples:**

**Installation Quality:**
```
Avg Cycle Time = Total Cycle Time / Records
Quality Score = max(75, 95 - (Avg Cycle Time / 2))
```

**Customer Satisfaction:**
```
Margin Rate = (Sales - Total Cost) / Total Cost
Satisfaction Score = min(100, max(75, 82 + (Margin Rate / 5)))
```

---

### 8.5 Authentication System

**Purpose:** Secure access to dashboard

**Features:**
- Sign up with email, password, name
- Sign in with email and password
- Session persistence via localStorage
- Protected routes (redirects to sign-in if not authenticated)
- User display in header
- Logout functionality

**Storage:**
- User data stored in localStorage
- Session persists across browser refreshes
- No backend authentication (demo implementation)

---

### 8.6 PDF Export

**Purpose:** Generate professional reports

**Features:**
- Exports current page as PDF
- Includes logo in header
- Shows page title
- Includes generation timestamp
- Captures all charts and tables
- Professional formatting

**Process:**
1. Hide sidebar, header, footer
2. Capture main content with html2canvas
3. Create PDF with jsPDF
4. Add header with logo
5. Add content as image
6. Save file with timestamp
7. Restore UI elements

---

## 9. Calculations Reference

### Quick Reference Card

#### Financial Metrics

| Metric | Formula |
|--------|---------|
| **LTR%** | `(Labor PO ÷ Sales) × 100` |
| **Total Cost** | `Labor PO + Vendor Debit` |
| **Margin** | `Sales - Total Cost` |
| **Margin Rate** | `(Margin ÷ Total Cost) × 100` |
| **Vendor Debit Ratio** | `|Vendor Debit| ÷ Total Cost` |

#### Performance Metrics

| Metric | Formula |
|--------|---------|
| **WPI Score** | `(LTR Score × 50%) + (Labor PO Score × 30%) + (Vendor Debit Score × 20%)` |
| **LTR Score** | See Section 5.2 |
| **Labor PO Score** | `(Workroom Labor PO ÷ maxLaborPO) × 100` |
| **Vendor Debit Score** | `100 - (Vendor Debit Ratio × 200)` |

#### Averages

| Metric | Formula |
|--------|---------|
| **Avg Labor PO** | `Total Labor PO ÷ Records` |
| **Avg Vendor Debit** | `Total Vendor Debit ÷ Records` |
| **Avg Cycle Time** | `Total Cycle Time ÷ Records with Cycle Time` |
| **Cost per Record** | `Total Cost ÷ Records` |

---

## 10. Data Validation & Filtering

### Invalid Workroom Names

The system filters out invalid workroom names:
- "Location #"
- "location"
- Empty strings
- Names containing "location #"

### Data Quality Checks

- Sales must be positive number (if provided)
- Labor PO should be positive (negative treated as credit)
- Vendor Debit can be negative (represents credit/refund)
- Cycle Time should be positive number of days
- Store numbers are validated against workroom mapping

---

## 11. Color Coding System

### Performance Colors

- 🟢 **Green** = Excellent/Good performance
- 🟡 **Yellow** = Moderate/Needs attention
- 🟠 **Orange** = Warning/Requires action
- 🔴 **Red** = Critical/Immediate action needed

### Status Badges

**WPI Score Badges:**
- Green: Score > 70
- Yellow: Score 40-70
- Orange: Score < 40

**LTR% Badges:**
- Green: LTR% < 20%
- Yellow: LTR% 20-40%
- Orange: LTR% > 40%

**Financial Risk:**
- Low = Green
- Moderate = Yellow
- High = Orange
- Critical = Red

---

## 12. Performance Benchmarks

### LTR% Benchmarks

| LTR% | Rating | Action |
|------|--------|--------|
| < 15% | Excellent | Maintain |
| 15-25% | Good | Monitor |
| 25-35% | Moderate | Improve |
| 35-45% | Poor | Prioritize improvement |
| > 45% | Critical | Urgent action needed |

### WPI Score Benchmarks

| WPI Score | Status | Action |
|-----------|--------|--------|
| 70-100 | Carrying Company | Learn from best practices |
| 50-69 | Inconsistent | Review and optimize |
| 40-49 | Warning | Investigate issues |
| < 40 | Critical | Immediate intervention |

### Vendor Debit Ratio Benchmarks

| Ratio | Rating | Action |
|-------|--------|--------|
| < 10% | Excellent | Maintain |
| 10-20% | Good | Monitor |
| 20-30% | Moderate | Review vendor relationships |
| 30-40% | High | Prioritize vendor management |
| > 40% | Critical | Urgent vendor review |

---

## 13. Troubleshooting

### Common Issues

**1. LTR% shows 0.0%**
- **Cause:** Missing sales data in uploaded file
- **Solution:** Include sales column in upload file

**2. WPI Score is 0.0**
- **Cause:** Negative total costs or calculation errors
- **Solution:** Check data quality, ensure costs are valid

**3. Data not persisting**
- **Cause:** Browser localStorage disabled or cleared
- **Solution:** Enable localStorage, don't clear browser data

**4. Charts not displaying**
- **Cause:** No data uploaded or all data filtered out
- **Solution:** Upload data file, check filters

**5. Export PDF fails**
- **Cause:** Browser compatibility or content too large
- **Solution:** Try different browser, reduce page content

---

## 14. Future Enhancements

### Potential Improvements

- [ ] Backend API integration
- [ ] Database storage (PostgreSQL/MongoDB)
- [ ] Real-time data updates
- [ ] Email report scheduling
- [ ] Advanced filtering options
- [ ] Custom date range selection
- [ ] Comparative analytics (time periods)
- [ ] Export to Excel format
- [ ] Multi-user access with roles
- [ ] Data import from API endpoints

---

## 15. Glossary

**LTR%** - Labor-to-Revenue ratio, measures labor efficiency  
**WPI** - Workroom Performance Index, composite performance score  
**Labor PO** - Labor Purchase Order, labor costs  
**Vendor Debit** - Vendor-related costs (negative = credit/refund)  
**Cycle Time** - Days to complete a job  
**Margin** - Profit (Sales - Total Cost)  
**Margin Rate** - Profit as percentage of cost  
**Store Mix** - Distribution of stores served by workroom  
**Operational Risks** - Identified issues affecting operations  
**Financial Risk** - Risk level based on financial metrics  

---

## 16. Technical Notes

### Browser Support

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile browsers: Responsive design supported

### Performance Considerations

- Large datasets (>1000 records) may slow rendering
- Charts render efficiently with Recharts
- localStorage has ~5-10MB limit
- PDF export may take time for large pages

### Security Notes

- Authentication is client-side only (demo)
- No sensitive data encryption (demo)
- For production: implement backend authentication
- Use HTTPS in production

---

**End of Documentation**

For questions or issues, refer to the code comments or contact the development team.

**Last Updated:** 2024  
**Version:** 1.0.0

