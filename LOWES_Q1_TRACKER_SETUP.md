# Lowes Q1 2026 Job Count Tracker Setup Guide

## Overview
This tracker allows you to monitor job count goals by district and category (CARPET, HSF, TILE, TOTAL) week-to-week for Q1 2026. It compares planned job counts from the goals Excel file with actual job counts received from Vendor Gateway.

## Database Setup

1. Run the database schema SQL file in your Supabase SQL Editor:
   ```sql
   -- File: database/lowes-q1-goals-schema.sql
   ```
   This creates two tables:
   - `lowes_q1_goals`: Stores planned job counts by district, week, and category
   - `lowes_weekly_job_counts`: Stores actual job counts from Vendor Gateway

## Initial Setup Steps

### 1. Upload Goals File
1. Navigate to the **Lowes Q1 Tracker** page (available in sidebar for admin users)
2. Click **"Upload Goals File"** button
3. Select the `Q1 2026 Goals FIS.xlsx` file from the project folder
4. The system will parse the file and extract:
   - District numbers
   - Week numbers (1-13 for Q1)
   - Categories (CARPET, HSF, TILE, TOTAL)
   - Planned job counts for each combination

### 2. Configure Vendor Gateway Integration
To receive job count data automatically from Vendor Gateway:

1. Set up an API key in your environment variables:
   ```
   VENDOR_GATEWAY_API_KEY=your-secret-api-key-here
   ```

2. Configure Vendor Gateway to send POST requests to:
   ```
   POST /api/lowes-weekly-counts
   Headers:
     x-api-key: your-secret-api-key-here
   Body:
     {
       "counts": [
         {
           "district": "868",
           "week_number": 1,
           "category": "CARPET",
           "actual_count": 14,
           "week_start_date": "2026-01-01",
           "week_end_date": "2026-01-07",
           "data_source": "vendor_gateway"
         },
         ...
       ]
     }
   ```

## Using the Tracker

### Viewing Data
- Navigate to **Lowes Q1 Tracker** from the sidebar
- Use filters to view specific:
  - Districts
  - Weeks (1-13)
  - Categories (CARPET, HSF, TILE, TOTAL)

### Understanding the Display
- **Planned**: Job count goals from the Excel file
- **Actual**: Job counts received from Vendor Gateway
- **Variance**: Difference between actual and planned (positive = ahead, negative = behind)
- **% Complete**: Percentage of planned jobs completed

### Summary Cards
The top of the page shows:
- Total Planned: Sum of all planned job counts
- Total Actual: Sum of all actual job counts
- Variance: Overall difference
- % Complete: Overall completion percentage

## Data Structure

### Goals Data Format
Each goal record contains:
- `district`: District number (e.g., "868", "1222")
- `provider`: Provider name (optional)
- `week_number`: Week number (1-13)
- `category`: CARPET, HSF, TILE, or TOTAL
- `planned_count`: Planned job count

### Weekly Counts Data Format
Each count record contains:
- `district`: District number
- `week_number`: Week number (1-13)
- `category`: CARPET, HSF, TILE, or TOTAL
- `actual_count`: Actual job count
- `week_start_date`: Start date of the week (optional)
- `week_end_date`: End date of the week (optional)
- `data_source`: "vendor_gateway" or "manual"

## Manual Data Entry
If Vendor Gateway integration is not available, you can manually add weekly counts by calling the API:

```javascript
POST /api/lowes-weekly-counts
Headers:
  Authorization: Bearer user-email@example.com
Body:
  {
    "counts": [
      {
        "district": "868",
        "week_number": 1,
        "category": "CARPET",
        "actual_count": 14,
        "data_source": "manual"
      }
    ]
  }
```

## Notes
- Q1 2026 started yesterday and runs for 13 weeks
- The tracker automatically calculates variances and completion percentages
- Data is organized by district, week, and category for easy filtering
- Only admin users can upload the goals file
- All users can view the tracker data
