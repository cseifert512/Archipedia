# PostHog Charts Guide: Page Views by Location and Duration

This guide shows you how to create charts in PostHog that combine page views, location, and duration data.

---

## Option 1: Table View (Best for Detailed Data)

A table is the most straightforward way to see page views by location with duration metrics.

### Steps:
1. Go to **Insights** → **+ New Insight**
2. Select **Table** (or "Data Table")
3. Configure:
   - **Event**: `$pageview`
   - **Breakdown by**: Choose one:
     - `$current_url` (page location/URL)
     - `$geoip_country_name` (geographic country)
     - `$geoip_city_name` (geographic city)
     - Custom property (if you've set one)
4. **Add Metric**: Click **+ Add metric** and add:
   - **Average time on page**: This shows duration per page
   - Or **Total page views**: To see count
5. **Sort by**: Duration (descending) to see longest pages first
6. Click **Save** and name it (e.g., "Page Views by Location with Duration")

**Result**: A table showing each page/location with its average duration and view count.

---

## Option 2: Trend Chart with Location Breakdown

Show page views over time, broken down by location.

### Steps:
1. Go to **Insights** → **+ New Insight** → **Trends**
2. Configure:
   - **Event**: `$pageview`
   - **Breakdown by**: `$current_url` (or geographic location)
   - **Chart type**: Line chart or Stacked area
3. **Add additional metrics**:
   - Click **+ Add metric**
   - Select **Average time on page** or **Average session duration**
4. You can toggle between:
   - **Value** (count of page views)
   - **Duration** (time metrics)
5. Click **Save**

**Result**: A line chart showing page views over time, with different lines/colors for each location, plus duration data.

---

## Option 3: Funnel with Location and Duration

Track user flow through pages with location and duration context.

### Steps:
1. Go to **Insights** → **+ New Insight** → **Funnel**
2. Add steps:
   - Step 1: `$pageview` where `$current_url` contains `/`
   - Step 2: `$pageview` where `$current_url` contains `/demo`
   - Step 3: `$pageview` where `$current_url` contains `/enterprise`
3. **Breakdown by**: `$geoip_country_name` (or page URL)
4. **Add metric**: Average time between steps
5. Click **Save**

**Result**: A funnel showing conversion rates by location, with duration between steps.

---

## Option 4: Custom Dashboard with Multiple Charts

Create a dashboard that shows location and duration side-by-side.

### Steps:
1. Create a **Dashboard** (Dashboards → + New Dashboard)
2. **Add Insight 1**: Table showing page views by URL with duration
   - Type: Table
   - Event: `$pageview`
   - Breakdown: `$current_url`
   - Metric: Average time on page
3. **Add Insight 2**: Geographic breakdown
   - Type: Table or Pie chart
   - Event: `$pageview`
   - Breakdown: `$geoip_country_name`
   - Metric: Total page views
4. **Add Insight 3**: Duration trends
   - Type: Trends
   - Event: `$pageview`
   - Metric: Average time on page
   - Breakdown: `$current_url` (optional)
5. Arrange them on the dashboard

**Result**: A comprehensive view with location, duration, and page data all visible.

---

## Understanding Location Properties

PostHog automatically captures several location-related properties:

### Geographic Location (from IP)
- `$geoip_country_name` - Country name
- `$geoip_city_name` - City name
- `$geoip_country_code` - Country code (US, GB, etc.)
- `$geoip_continent_name` - Continent

### Page Location (URL)
- `$current_url` - Full URL
- `$pathname` - Path only (e.g., `/demo`)
- `$host` - Domain name

### Custom Location Properties
You can also add custom properties in your code:
```typescript
posthog.capture('$pageview', {
  page_section: 'hero',
  page_category: 'landing'
});
```

---

## Understanding Duration Properties

PostHog captures several duration-related metrics:

### Automatic Duration Metrics
- **Time on page**: Calculated from `$pageview` to `$pageleave`
- **Session duration**: Time from first to last event in a session
- **Time between events**: In funnels, shows time between steps

### Custom Duration Tracking
You can track custom durations:
```typescript
const startTime = Date.now();
// ... user does something ...
const duration = Date.now() - startTime;
posthog.capture('task_completed', {
  duration_ms: duration,
  duration_seconds: duration / 1000
});
```

---

## Recommended Setup: Comprehensive Page Analytics

Here's a complete dashboard setup for page views by location and duration:

### Dashboard: "Page Performance"

**Chart 1: Top Pages by Views and Duration**
- Type: **Table**
- Event: `$pageview`
- Breakdown: `$current_url`
- Metrics:
  - Total page views
  - Average time on page
  - Unique visitors
- Sort by: Total page views (descending)

**Chart 2: Geographic Distribution**
- Type: **Table** or **Pie Chart**
- Event: `$pageview`
- Breakdown: `$geoip_country_name`
- Metric: Total page views
- Shows: Where your visitors are coming from

**Chart 3: Duration Trends Over Time**
- Type: **Trends** (Line chart)
- Event: `$pageview`
- Metric: Average time on page
- Breakdown: `$current_url` (optional, to see per-page trends)
- Shows: How duration changes over time

**Chart 4: Page Performance Heatmap**
- Type: **Table**
- Event: `$pageview`
- Breakdown: `$current_url`
- Metrics:
  - Total views
  - Average duration
  - Bounce rate (if available)
- Color-code by duration (longer = better engagement)

---

## Advanced: Using Formulas

PostHog supports formulas for calculated metrics:

1. In an insight, click **+ Add metric**
2. Select **Formula**
3. Create formulas like:
   - `views / duration` = Engagement rate
   - `duration / views` = Average duration per view
   - Custom calculations combining multiple metrics

---

## Tips for Better Visualizations

1. **Use Filters**: Filter by date range, specific pages, or user properties
2. **Compare Periods**: Use "Compare to previous period" to see trends
3. **Group Similar Pages**: Use URL patterns to group pages (e.g., all `/search/*` pages)
4. **Set Up Alerts**: Get notified if duration drops or views spike
5. **Export Data**: Download tables as CSV for further analysis

---

## Quick Example: "Page Views by URL with Average Duration"

Here's the exact steps for the most common use case:

1. **Insights** → **+ New Insight**
2. Select **Table**
3. **Event**: `$pageview`
4. **Breakdown**: `$current_url`
5. **Metrics**:
   - Click **+ Add metric** → Select **Total** (count of page views)
   - Click **+ Add metric** → Select **Average time on page**
6. **Filters** (optional):
   - Date range: Last 30 days
   - Exclude specific URLs if needed
7. **Sort by**: Total (descending) or Average time on page (descending)
8. **Save** as "Page Views by URL with Duration"

This gives you a table with columns:
- URL (location)
- Total page views
- Average duration
- Other metrics you add

---

## Troubleshooting

**Duration shows as 0 or very low:**
- Make sure `capture_pageleave: true` is enabled (it is in your code)
- Users need to actually leave the page for duration to be calculated
- Single-page sessions won't have duration data

**Location not showing:**
- Geographic location requires IP geolocation (enabled by default in PostHog)
- Some users may have location blocked
- VPN users will show VPN server location, not actual location

**Too many URL variations:**
- Use URL patterns/filters to group similar pages
- Consider using `$pathname` instead of `$current_url` to ignore query parameters
- Use PostHog's URL grouping feature

---

## Next Steps

1. Create the table view first (easiest to understand)
2. Experiment with different breakdowns (URL vs geographic)
3. Add the chart to a dashboard
4. Set up alerts for important metrics
5. Review regularly to identify high/low performing pages



