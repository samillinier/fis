This file is a placeholder indicating that `project_formulas.xlsx` should contain the project's formulas in an Excel workbook. Please generate or export a true `.xlsx` file with these sheets:

1) Visual Breakdown
   - LTR%: (Labor PO / Sales) * 100
   - Total Cost: Labor PO + Vendor Debit
   - Workroom Share: workroom records / total records (filtered)
   - Category Totals: Sum of Sales, Labor PO, Vendor Debit (filtered)
   - Store Totals: Per store, sum Sales, sum Total Cost, record count
   - WPI (with Sales):
     - Efficiency = Sales / Total Cost
     - MarginRate = (Sales – Total Cost) / Total Cost
     - CycleTimeFactor = max(0, 1 – CycleTime/30)
     - WPI = min(100, Efficiency * 10 * (0.7 + 0.3*CycleTimeFactor) * (1 + MarginRate))
     - If no cycle time: WPI = min(100, Efficiency * 10 * (1 + MarginRate))
   - WPI (no Sales):
     - AvgCostPerRecord = Total Cost / Records
     - CostEfficiency = clamp(0,100, 150 – (AvgCostPerRecord/100))
     - LaborBonus = (Labor PO / Total Cost) * 30
     - CycleTimeBonus = max(0, (30 – CycleTime)/2)
     - StoreBonus = min(#stores * 3, 20)
     - RecordBonus = min(records/10, 15)
     - WPI = min(100, 0.4*CostEfficiency + LaborBonus + CycleTimeBonus + StoreBonus + RecordBonus)

2) Performance Index
   - Total Cost: Labor PO + Vendor Debit
   - Efficiency: Sales / Total Cost (if total cost > 0)
   - Performance Index:
     - If excludeCycleTime or no cycle time: min(100, Efficiency * 10)
     - Else: min(100, Efficiency * 10 * (0.7 + 0.3 * (1 - CycleTime/30)))
   - Average Performance: mean of calculated indices across workrooms

3) Historical Analytics
   - Aggregates: sums Sales, Labor PO, Vendor Debit; counts records; averages LTR when present
   - Weekly view: averages per entry; Monthly/Yearly: totals
   - LTR average per workroom: sum(ltrScore)/count(ltrScore)

4) Upload Parsing
   - Visual fields: Workroom, Store/Location, Sales, Labor PO, Vendor Debit, Cycle Time
   - Survey fields: Workroom, Store, Survey Date/Comment, Labor Category, LTR/Craft/Prof scores, RHIS, Time To Complete, Project Value, Installer Knowledge
   - Sales parsing: strip currency/commas; numeric fallback

5) Auth & Roles
   - Allow-list check: email present AND isActive !== false
   - Roles: allow-list role; sbiru@fiscorponline.com always admin
   - Non-admins hidden/redirected from admin pages
   - Access requests stored when not allowed (email, name, source, timestamp)

6) Activity Log
   - Records: Updated dashboard data; Cleared dashboard data; Saved historical snapshot; Deleted historical entry; Cleared all historical data (with user email/name, timestamp)

