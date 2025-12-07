# 📹 FIS Dashboard Tutorial Video Script

---

## INTRO (0:00 - 0:30)

**[SCREENSHOT: Dashboard homepage]**

"Welcome to this tutorial on the FIS Dashboard - a comprehensive Workroom Performance Analytics platform built for Floor Interior Service. 

In this video, I'll walk you through the key features, show you how to use it, and demonstrate how it transforms raw data into actionable business insights.

Let's get started!"

---

## WHAT IS IT? (0:30 - 1:00)

**[SCREENSHOT: Dashboard overview]**

"The FIS Dashboard is a web-based analytics platform that helps you visualize and analyze workroom performance data. 

It provides real-time insights into:
- Workroom performance metrics
- Sales and labor cost analysis
- Vendor debit tracking
- Store-level analytics
- Survey data and customer feedback

All built with modern web technologies and hosted securely in the cloud."

---

## GETTING STARTED - SIGN IN (1:00 - 1:30)

**[SCREENSHOT: Sign-in page]**

"First, let's sign in. The dashboard uses Microsoft authentication for secure access.

Simply click 'Sign in with Microsoft' and authenticate with your Microsoft account. This ensures only authorized users can access your data.

Once signed in, you'll see the main dashboard."

---

## UPLOADING DATA (1:30 - 2:30)

**[SCREENSHOT: File upload section]**

"Now, let's upload your data. The dashboard supports two types of data uploads:

First, **Visual Data** - This is your main workroom performance data from Excel files. Click 'Upload Visual Data' and select your Excel file. The system automatically parses columns like workroom name, store number, sales, labor PO, vendor debits, and more.

Second, **Survey Data** - Upload survey responses that include customer feedback, LTR scores, craft scores, and professional scores.

The system intelligently merges both datasets, matching records by store number and workroom name. Once uploaded, your data is securely stored in the cloud database and immediately available across all dashboard views."

---

## MAIN DASHBOARD - OVERVIEW (2:30 - 4:00)

**[SCREENSHOT: Main dashboard with heatmap]**

"Let's explore the main dashboard. The centerpiece is the **Comprehensive Workroom Analysis Dashboard** - a heatmap visualization showing store performance at a glance.

Green indicates stores that are carrying the company - performing well. Yellow shows inconsistent performance. Red highlights areas that need immediate attention - costing you money.

Each card displays:
- Store location name
- Number of different stores
- Sales performance
- Labor PO volume
- Vendor debit exposure
- Workroom Performance Index, or WPI score
- And operational metrics

You can click on cards with issues to see detailed 'Fix This Now' recommendations."

---

## WORKROOM PERFORMANCE INDEX (4:00 - 4:30)

**[SCREENSHOT: WPI section]**

"The Workroom Performance Index, or WPI, is a weighted score that combines:
- 50% from Labor PO performance
- 30% from Labor PO dollar volume
- 20% from Vendor Debit discipline

This gives you a single number to quickly identify your top-performing workrooms and those needing improvement."

---

## TOP PERFORMING WORKROOMS (4:30 - 5:00)

**[SCREENSHOT: Top Performing Workrooms table]**

"Scroll down to see the **Top Performing Workrooms** table. This ranks workrooms based on multiple factors:
- Store coverage
- LTR percentage
- Labor PO dollars
- Vendor debits
- WPI score

Use this to identify your best performers and understand what makes them successful."

---

## RESPONSIBLE WORKROOMS (5:00 - 5:30)

**[SCREENSHOT: Pie chart section]**

"Next, you'll see **Workrooms Most Responsible for Moving Your Business** - a colorful pie chart showing the top 4 workrooms by Labor PO dollar volume. This helps you identify which workrooms are driving your business forward."

---

## ANALYTICS SECTIONS (5:30 - 6:30)

**[SCREENSHOT: Analytics sections]**

"The dashboard includes several analytics sections:

**Average Labor PO by Workroom** - A bar chart showing labor costs across workrooms.

**Average Vendor Debits by Workroom** - Visualizes vendor debit exposure. Remember, negative numbers in green are good - those are credits!

**Workroom Performance Index by Workroom** - Shows WPI scores side-by-side with key metrics in an easy-to-read table format."

---

## OPERATIONAL METRICS (6:30 - 7:00)

**[SCREENSHOT: Operational Metrics box]**

"Below the heatmap, you'll find the **Operational Metrics** dashboard with animated counters showing:
- Jobs completed
- Jobs pending
- Return and redo jobs
- Installation quality scores
- Customer satisfaction scores
- Average labor hours
- On-time completion rates

These numbers update in real-time as you upload new data."

---

## SURVEY MISC PAGE (7:00 - 8:00)

**[SCREENSHOT: Survey Misc page]**

"Let's navigate to the **Survey Misc** page using the sidebar. This page provides detailed survey analytics.

At the top, you'll see dashboard cards showing:
- Total surveys across all workrooms
- Average LTR score
- Average Craft score
- Average Professional score

Use the filters to view data by:
- Workroom
- Labor category - like floor carpet or floor vinyl
- Metric view - choose to see all metrics, or just LTR, Craft, or Professional scores

The bar chart visualizes these scores by workroom with color coding: Blue for LTR, Green for Craft, Red for Professional.

Below, a detailed table shows survey data grouped by Store Number, Workroom, and Labor Category. Click any row to see all individual survey details, including comments and specific scores."

---

## WORKROOM DATA - HISTORICAL ANALYTICS (8:00 - 9:00)

**[SCREENSHOT: Workroom Data page]**

"The **Workroom Data** page, previously called Historical Analytics, lets you track performance over time.

Use the period filter to view:
- **Weekly** - Individual weekly snapshots
- **Monthly** - Aggregated monthly views
- **Yearly** - Yearly trends

Filter by specific months and years to drill down into historical data.

The Historical Summary dashboard at the top shows:
- LTR trends
- Jobs completed
- Labor PO dollars
- Vendor debits
- WPI scores

All animated to count up when the page loads.

Below, you'll see a bar chart showing trends over time, and a comprehensive workroom analysis table with detailed metrics for each workroom."

---

## UPLOADING HISTORICAL DATA (9:00 - 9:30)

**[SCREENSHOT: Upload wizard]**

"To upload historical data, click 'Start Upload Process'. The system will guide you through a simple wizard:

Step 1: Select the date for this data snapshot
Step 2: Choose the data type - Visual, Survey, or Both
Step 3: Upload your files

This creates time-stamped entries that you can filter and analyze later."

---

## EXPORT TO PDF (9:30 - 10:00)

**[SCREENSHOT: Export button]**

"Need to share reports? Use the **Export** button in the sidebar. This generates a professional PDF of the current page, complete with your logo and all charts and tables.

Perfect for presentations, reports, or sharing with stakeholders."

---

## TECHNICAL HIGHLIGHTS (10:00 - 10:30)

**[SCREENSHOT: Code or architecture]**

"This dashboard is built with:
- Next.js for fast, responsive performance
- React for dynamic user interfaces
- Vercel Postgres for secure, scalable data storage
- Microsoft Authentication for enterprise-grade security
- Recharts for beautiful data visualizations

All hosted on Vercel for reliability and automatic scaling."

---

## SUMMARY (10:30 - 11:00)

**[SCREENSHOT: Dashboard overview]**

"So to summarize, the FIS Dashboard provides:

✅ Real-time workroom performance analytics
✅ Visual heatmaps for quick insights
✅ Historical trend analysis
✅ Survey data integration
✅ Secure cloud storage
✅ Professional PDF exports
✅ And much more

It transforms raw Excel data into actionable business intelligence, helping you make data-driven decisions about workroom performance, costs, and customer satisfaction."

---

## OUTRO (11:00 - 11:15)

"That's a complete walkthrough of the FIS Dashboard. If you have questions or need help, check the documentation or reach out to your administrator.

Thanks for watching, and happy analyzing!"

---

**END OF SCRIPT**

**Total Runtime: Approximately 11 minutes**

**Tips for Recording:**
- Use screen recording software (OBS, Loom, or similar)
- Record at 1080p or higher
- Speak clearly and pause between sections
- Show actual data uploads and interactions
- Add captions/subtitles for accessibility
- Include chapter markers if uploading to YouTube

