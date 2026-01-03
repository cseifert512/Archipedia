# PostHog Analytics Setup Guide

This guide walks you through what PostHog can analyze, how to configure it in your code, and how to set it up in the PostHog dashboard.

## Part A: What Can PostHog Analyze / Glean from Users

PostHog is a product analytics platform that provides several powerful insights:

### 1. **Automatic Tracking (Already Configured)**
- **Page Views**: Every route/page visit is automatically tracked
- **Page Leaves**: Session duration and time on page
- **Sessions**: User sessions are automatically grouped
- **Session Recordings**: Video-like replays of user sessions (optional, currently enabled)

### 2. **Custom Events (Already Implemented)**

#### Landing Page Events (`trackLandingEvent`)
- `landing_try_demo_click` - When users click "Try Demo" button
- `landing_book_pilot_click` - When users click to book a pilot
- `landing_calendly_click` - When users click Calendly links
- `landing_contact_form_submit` - When contact forms are submitted
- `landing_demo_page_view` - When demo page is viewed
- `landing_demo_video_play` - When demo video is played
- `landing_try_live_demo_click` - When users click to try live demo

#### Enterprise Page Events (`trackEnterpriseEvent`)
- `book_demo` - When users book a demo
- `request_access` - When users request access
- `download_one_pager` - When users download the one-pager PDF

### 3. **What You Can Analyze in PostHog Dashboard**

#### User Metrics
- **Unique Visitors**: How many distinct users visited
- **Returning vs New Users**: User retention
- **User Properties**: Device, browser, OS, location, referrer
- **User Paths**: How users navigate through your site

#### Engagement Metrics
- **Page Views**: Most popular pages
- **Session Duration**: How long users stay
- **Bounce Rate**: Single-page sessions
- **Events per User**: Engagement level

#### Conversion Funnels
- Track user journeys from landing → demo → enterprise → conversion
- Identify drop-off points
- Measure conversion rates

#### Feature Adoption
- Which features are most used
- Feature usage over time
- User segments by feature usage

#### Session Recordings
- Watch actual user sessions
- See where users get stuck or confused
- Identify UX issues
- Replay bug reports

#### Insights You Can Create
- **Trends**: Event counts over time (e.g., "How many demo clicks this week?")
- **Funnels**: Multi-step conversion flows
- **Retention**: How many users return over time
- **Paths**: Common user navigation patterns
- **Stickiness**: Daily/weekly/monthly active users
- **Lifecycle**: User stage (new, returning, resurrected, dormant)

### 4. **Recommended Metrics to Track**

With the current implementation, you can analyze:
- Conversion rate: Landing page → Demo page → Enterprise page
- Engagement: Which CTAs (call-to-actions) perform best
- Content effectiveness: Which pages keep users engaged
- Drop-off points: Where users exit the funnel
- User behavior: Common paths through your site

---

## Part B: Code Configuration

### Current Status

PostHog is already integrated! The code is set up in `frontend/src/lib/analytics.ts` and initialized in `frontend/src/main.tsx`.

### Environment Variables Required

You need to set these environment variables:

1. **VITE_POSTHOG_KEY** (Required)
   - Your PostHog Project API Key
   - Get it from: PostHog Dashboard → Project Settings → Project API Key

2. **VITE_POSTHOG_HOST** (Optional, defaults to US)
   - Your PostHog instance URL
   - Default: `https://us.i.posthog.com`
   - If you're using EU: `https://eu.i.posthog.com`
   - If self-hosted: Your custom URL

### Setting Environment Variables

#### For Local Development

1. Create a `.env` file in the `frontend/` directory (or add to existing `.env`):
```env
VITE_POSTHOG_KEY=phc_your_project_api_key_here
VITE_POSTHOG_HOST=https://us.i.posthog.com
```

2. Restart your dev server

#### For Render Deployment

1. Go to Render Dashboard → Your Static Site (`arch-circare-ui`)
2. Go to Environment → Environment Variables
3. Add:
   - Key: `VITE_POSTHOG_KEY`
   - Value: Your PostHog Project API Key
   - Key: `VITE_POSTHOG_HOST` (optional, only if not using default US instance)
   - Value: `https://us.i.posthog.com` (or your instance URL)

4. Redeploy your site (or it will auto-deploy if auto-deploy is enabled)

### Current Implementation Details

The analytics system:
- ✅ Initializes PostHog on app startup
- ✅ Automatically tracks page views
- ✅ Automatically tracks page leaves (session duration)
- ✅ Respects Do Not Track (privacy)
- ✅ Has custom event tracking functions
- ✅ Supports user identification (for logged-in users)
- ✅ Has session recording enabled (you can disable if needed)

### Optional Enhancements

If you want to track additional events, you can:

1. **Track user searches**:
```typescript
import { trackLandingEvent } from "../lib/analytics";

// In your search component
trackLandingEvent("search_performed", { 
  query: searchQuery,
  search_type: "image" // or "text"
});
```

2. **Track feature usage**:
```typescript
posthog.capture("feature_used", {
  feature_name: "canvas_board",
  action: "created"
});
```

3. **Identify logged-in users** (if you add authentication):
```typescript
import { identifyUser } from "../lib/analytics";

// When user logs in
identifyUser(userId, {
  email: userEmail,
  plan: "enterprise"
});
```

4. **Track custom properties on page views**:
PostHog automatically captures page views, but you can add context:
```typescript
posthog.capture("$pageview", {
  page_category: "enterprise",
  section: "pricing"
});
```

---

## Part C: PostHog Dashboard Configuration

### Step 1: Get Your API Key

1. Log into your PostHog account
2. Go to **Project Settings** (gear icon in sidebar or Project → Settings)
3. Find **Project API Key** (looks like `phc_xxxxxxxxxxxxx`)
4. Copy this key - you'll need it for the environment variable

### Step 2: Verify Your PostHog Instance URL

- **US Cloud**: `https://us.i.posthog.com` (default)
- **EU Cloud**: `https://eu.i.posthog.com`
- **Self-hosted**: Your custom domain

### Step 3: Configure Session Recordings (Optional)

Session recordings are currently enabled. To configure:

1. Go to **Recordings** in PostHog sidebar
2. You can:
   - Set recording retention period
   - Configure privacy settings (mask text, hide sensitive data)
   - Set recording conditions (which pages to record)

**Note**: Session recordings can use a lot of data. You may want to:
- Only record specific pages
- Set a sampling rate (e.g., 10% of sessions)
- Disable recordings entirely by setting `disable_session_recording: true` in analytics.ts

### Step 4: Create Your First Insight

1. Go to **Insights** in the sidebar
2. Click **+ New Insight**
3. Choose **Trends** to see event counts over time
4. Select an event like `landing_try_demo_click`
5. Click **Save** and give it a name

### Step 5: Create a Funnel

Track conversions from landing → demo → enterprise:

1. Go to **Insights** → **+ New Insight** → **Funnel**
2. Add steps:
   - Step 1: Event `$pageview` where URL contains `/`
   - Step 2: Event `landing_try_demo_click`
   - Step 3: Event `$pageview` where URL contains `/demo`
   - Step 4: Event `landing_book_pilot_click` or `landing_contact_form_submit`
3. Set time window (e.g., 30 minutes between steps)
4. Save as "Landing to Demo Conversion"

### Step 6: Set Up Dashboards

1. Go to **Dashboards** → **+ New Dashboard**
2. Add insights:
   - Total page views (trend)
   - Demo click conversion rate (funnel)
   - Top pages (table)
   - Active users (stickiness)
3. Name it "Product Overview" and save

### Step 7: Configure User Properties (Optional)

If you want to identify users with additional context:

1. Go to **Persons** to see individual users
2. You can add properties manually or they'll be set via `identifyUser()` calls
3. Use properties to segment users (e.g., "users from enterprise page")

### Step 8: Set Up Alerts (Optional)

Get notified about important events:

1. Go to **Insights** → Your Insight → **Actions** → **Set up alert**
2. Set condition (e.g., "Demo clicks drop below 10/day")
3. Configure notification channel (email, Slack, etc.)

### Step 9: Privacy & Compliance

1. Go to **Settings** → **Project** → **Data management**
2. Configure:
   - Data retention period
   - Anonymize IP addresses
   - Auto-delete old data
3. Ensure GDPR/privacy compliance for your region

### Quick Start Checklist

- [ ] Get PostHog API Key from Project Settings
- [ ] Add `VITE_POSTHOG_KEY` to Render environment variables
- [ ] (Optional) Add `VITE_POSTHOG_HOST` if using EU or self-hosted
- [ ] Redeploy frontend
- [ ] Verify events are appearing in PostHog → Activity Log
- [ ] Create first insight (trend of page views)
- [ ] Create conversion funnel
- [ ] Configure session recordings (optional)
- [ ] Set up dashboard with key metrics

---

## Troubleshooting

### Events Not Appearing

1. **Check environment variables are set**:
   - In Render: Go to Environment tab and verify `VITE_POSTHOG_KEY` exists
   - Redeploy after adding environment variables

2. **Check browser console**:
   - Open DevTools → Console
   - Look for `[analytics]` debug logs in development
   - Check for PostHog initialization errors

3. **Verify PostHog connection**:
   - In PostHog: Go to Activity Log
   - You should see events appearing within seconds
   - Check Network tab in DevTools for requests to PostHog

4. **Check PostHog API Key**:
   - Ensure the key starts with `phc_`
   - Make sure it's the Project API Key, not Personal API Key

### Session Recordings Not Working

- Check that `disable_session_recording: false` in analytics.ts
- Verify PostHog plan includes session recordings (some free plans don't)
- Check browser console for recording errors

### Too Many Events / Need to Filter

- Use PostHog's event filters in Insights
- Consider disabling auto-capture for specific pages
- Set up event filtering in PostHog settings

---

## Next Steps

1. **Deploy with environment variables** and verify events flow
2. **Watch live activity** in PostHog Activity Log
3. **Create insights** for metrics you care about
4. **Set up dashboards** for weekly reviews
5. **Review session recordings** to understand user behavior
6. **Iterate**: Add more custom events as you identify what to track

