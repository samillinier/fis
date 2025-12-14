# Performance Forms Summary

## Total Forms Created: **4 Active Forms**

All forms are separate pages that can be opened independently. Each form has its own route and saves to the same `performance_forms` table in Supabase.

---

## 1. Reschedule Rate Accountability Report

**Route**: `/reschedule-rate-form`  
**Component**: `RescheduleRateForm.tsx`  
**Page**: `app/reschedule-rate-form/page.tsx`  
**Metric Type**: `reschedule_rate`  
**Trigger**: Notification when Reschedule Rate > 20%  
**Access**: Click "Fix Now" on Reschedule Rate notification

**Form Sections**:
- Workroom Information
- Reschedule Category Breakdown
- Top 3 Reschedule Cases
- Immediate Corrective Actions
- Preventative Actions
- Installer Accountability Review
- Store & Material Impact Review
- Customer Impact
- GM Commitment Statement

---

## 2. LTR Workroom Performance Report

**Route**: `/ltr-form`  
**Component**: `LTRForm.tsx`  
**Page**: `app/ltr-form/page.tsx`  
**Metric Type**: `ltr`  
**Trigger**: Notification when LTR < 85%  
**Access**: Click "Fix Now" on LTR notification

**Form Sections**:
- Workroom Information
- Root Cause Identification
- Top 3 Impact Jobs
- Immediate Corrective Actions
- Preventative Actions
- Installer Accountability Review
- Customer Follow-Up Status
- GM Commitment Statement

---

## 3. Work Cycle Time Corrective Report

**Route**: `/work-cycle-time-form`  
**Component**: `WorkCycleTimeForm.tsx`  
**Page**: `app/work-cycle-time-form/page.tsx`  
**Metric Type**: `cycle_time`  
**Trigger**: Notification when Work Order Cycle Time or Details Cycle Time exceeds threshold  
**Access**: Click "Fix Now" on Cycle Time notification

**Form Sections**:
- Workroom Information
- Cycle Time by Category (Carpet, Vinyl, Laminate, LVP, Hardwood, Tile, Other)
- Root Cause Identification
- Top 3 Jobs Impacting Cycle Time
- Immediate Corrective Actions
- Preventative Actions
- Installer Accountability Review
- Store & Inventory Issues
- GM Commitment Statement

---

## 4. Vendor Debit Accountability Report

**Route**: `/vendor-debit-form`  
**Component**: `VendorDebitForm.tsx`  
**Page**: `app/vendor-debit-form/page.tsx`  
**Metric Type**: `vendor_debit`  
**Trigger**: Notification when Vendor Debit ratio is high  
**Access**: Click "Fix Now" on Vendor Debit notification

**Form Sections**:
- Workroom Information
- Vendor Debit Details (supports multiple debits)
- Installer Accountability Review
- GM Operational Review
- Prevention Plan
- Customer Impact Review
- GM Commitment Statement

---

## Database Storage

**Table**: `performance_forms`  
**All forms save to the same table** with different `metric_type` values:
- `reschedule_rate`
- `ltr`
- `cycle_time`
- `vendor_debit`

**Unique Constraint**: One form per user/workroom/metric/week

---

## How Forms Are Accessed

1. **Via Notifications** (Primary Method):
   - When a metric triggers a low score notification
   - Click "Fix Now" link in notification
   - Form opens with workroom pre-filled

2. **Direct URL Access**:
   - Navigate to `/reschedule-rate-form?workroom=WorkroomName`
   - Navigate to `/ltr-form?workroom=WorkroomName`
   - Navigate to `/work-cycle-time-form?workroom=WorkroomName`
   - Navigate to `/vendor-debit-form?workroom=WorkroomName`

3. **From Dashboard** (Future):
   - Could add links/buttons on dashboard
   - Could add to navigation menu

---

## Form Features

✅ All forms have:
- Workroom pre-filling from notification
- Week ending date auto-calculation
- Signature field with cursive font
- Form validation
- Success/error notifications
- Navigation back to dashboard
- Save to Supabase `performance_forms` table

---

## Files Structure

```
fis/
├── app/
│   ├── reschedule-rate-form/page.tsx
│   ├── ltr-form/page.tsx
│   ├── work-cycle-time-form/page.tsx
│   └── vendor-debit-form/page.tsx
├── components/
│   ├── RescheduleRateForm.tsx
│   ├── LTRForm.tsx
│   ├── WorkCycleTimeForm.tsx
│   └── VendorDebitForm.tsx
└── database/
    └── add-performance-forms.sql
```

---

## Summary

- **4 separate forms** (each opens in its own page)
- **4 different routes** (each accessible independently)
- **1 database table** (all forms save to `performance_forms`)
- **4 metric types** (stored in `metric_type` column)
- **All connected to Supabase** ✅

