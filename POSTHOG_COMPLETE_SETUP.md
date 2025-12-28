# Complete PostHog Setup Guide - From Scratch

This guide walks you through setting up PostHog from a brand new account to having analytics running on your deployed site.

---

## Part 1: PostHog Account Setup (5 minutes)

### Step 1.1: Log Into PostHog
1. Go to [posthog.com](https://posthog.com) and log in
2. If you just created an account, you should be on the onboarding screen

### Step 1.2: Create a Project (if needed)
1. PostHog may have already created a project for you, or you might need to create one
2. If you see "Create Project" or "New Project", click it
3. Name it something like "Archipedia" or "Archipedia MVP"
4. Choose your organization (should default to the one you created)
5. Click "Create Project"

### Step 1.3: Get Your Project API Key
1. In the PostHog dashboard, look for **Settings** in the left sidebar (gear icon ⚙️)
2. Click on **Settings** → **Project** (or "Project Settings")
3. Scroll down to find **Project API Key**
4. You'll see a key that starts with `phc_` (something like `phc_abc123xyz...`)
5. **Copy this key** - you'll need it in a moment
6. Keep this tab open or note the key somewhere safe

### Step 1.4: Note Your PostHog Instance
- **US Cloud** (default): `https://us.i.posthog.com`
- **EU Cloud**: `https://eu.i.posthog.com`
- **Self-hosted**: Your custom URL

Most accounts use US Cloud by default. You can see which one you're using in your PostHog URL when you're logged in.

---

## Part 2: Code Configuration (Already Done! ✅)

Good news - the code is already set up! The PostHog integration is already in your codebase:

- ✅ PostHog library installed (`posthog-js` in package.json)
- ✅ Analytics initialization code (`frontend/src/lib/analytics.ts`)
- ✅ PostHog initialized on app startup (`frontend/src/main.tsx`)
- ✅ Event tracking functions ready to use
- ✅ Custom events already being tracked throughout your app

**You don't need to change any code** - you just need to add the API key as an environment variable.

---

## Part 3: Configure Environment Variables in Render (10 minutes)

### Step 3.1: Go to Render Dashboard
1. Go to [render.com](https://render.com) and log in
2. Find your frontend service - it should be called `arch-circare-ui` (the static site)
3. Click on it to open the service dashboard

### Step 3.2: Add PostHog API Key
1. In the service dashboard, click on **Environment** in the left sidebar
2. You'll see a list of existing environment variables (like `VITE_API_BASE_URL`)
3. Click **+ Add Environment Variable** (or "Add Environment Variable" button)
4. Fill in:
   - **Key**: `VITE_POSTHOG_KEY`
   - **Value**: Paste your PostHog API key (the one that starts with `phc_`)
   - **Sync**: Leave unchecked (or leave as default)
5. Click **Save Changes**

### Step 3.3: (Optional) Add PostHog Host
If you're using EU Cloud or self-hosted, add this variable:

1. Click **+ Add Environment Variable** again
2. Fill in:
   - **Key**: `VITE_POSTHOG_HOST`
   - **Value**: `https://eu.i.posthog.com` (or your custom URL)
   - Only add this if you're NOT using the default US cloud
3. Click **Save Changes**

### Step 3.4: Redeploy
1. After adding the environment variable, you need to redeploy
2. Go to the **Manual Deploy** section (or look for "Deploy" button)
3. Click **Clear build cache & deploy** (or just "Deploy" if that option isn't available)
4. Wait for the deployment to complete (usually 2-5 minutes)

**Note**: Render should show "Deploying..." status. You can watch the logs if you want to see the build progress.

---

## Part 4: Verify It's Working (5 minutes)

### Step 4.1: Visit Your Site
1. Once deployment is complete, visit your deployed site
2. Navigate to a few different pages:
   - Home page (`/`)
   - Demo page (`/demo`)
   - Enterprise page (`/enterprise`)
3. Click a few buttons (like "Try Demo", "Book Demo", etc.)
4. Spend 30-60 seconds on the site to generate some activity

### Step 4.2: Check PostHog Activity Log
1. Go back to PostHog dashboard
2. In the left sidebar, look for **Activity** (or click on your project)
3. You should see an **Activity Log** or **Live Events** section
4. Within a few seconds, you should start seeing events appear:
   - `$pageview` events (each page visit)
   - `landing_try_demo_click` (when you clicked buttons)
   - Other custom events

**If you see events appearing**: 🎉 **Success! PostHog is working!**

**If you don't see events**:
- Wait a minute (events can take a few seconds to appear)
- Make sure you're looking at the correct project in PostHog
- Check the browser console for any errors (F12 → Console tab)
- Verify the environment variable was saved correctly in Render
- Make sure you redeployed after adding the variable

---

## Part 5: Set Up Your First Insights (10 minutes)

### Step 5.1: Create a Page Views Trend
1. In PostHog, click **Insights** in the left sidebar
2. Click **+ New Insight** button (top right)
3. Select **Trends** (should be the default)
4. In the "Event" dropdown, select `$pageview`
5. Click **Save** at the top
6. Name it "Page Views Over Time" and click **Save**

You should now see a chart showing page views over time!

### Step 5.2: Create a Conversion Funnel
Let's track how many visitors go from landing page → demo → booking:

1. Click **Insights** → **+ New Insight**
2. Select **Funnel** (instead of Trends)
3. Click **+ Add step**
4. First step:
   - Event: `$pageview`
   - You can optionally add a filter: Property → `$current_url` → Contains → `/` (to only count landing page views)
5. Click **+ Add step** for second step:
   - Event: `landing_try_demo_click`
6. Click **+ Add step** for third step:
   - Event: `$pageview`
   - Filter: Property → `$current_url` → Contains → `/demo`
7. Click **+ Add step** for fourth step:
   - Event: `landing_book_pilot_click`
8. At the top, set the conversion window to "30 minutes" (how long between steps)
9. Click **Save**
10. Name it "Landing to Booking Funnel" and click **Save**

You'll now see a funnel showing conversion rates at each step!

### Step 5.3: Create a Dashboard
Let's organize your insights:

1. Click **Dashboards** in the left sidebar
2. Click **+ New Dashboard**
3. Name it "Archipedia Overview" and click **Create**
4. Click **Add Insight**
5. Select the "Page Views Over Time" insight you just created
6. Click **Add Insight** again
7. Select the "Landing to Booking Funnel" insight
8. Click **Add Insight** → **New insight** to create more:
   - Add a "Top Pages" insight:
     - Type: **Table**
     - Event: `$pageview`
     - Breakdown by: `$current_url`
   - Add an "Event Count" insight:
     - Type: **Trends**
     - Event: Any event (like `landing_try_demo_click`)

You now have a dashboard with multiple insights! 📊

---

## Part 6: Explore Session Recordings (Optional, 5 minutes)

Session recordings let you watch actual user sessions like a video:

1. Click **Recordings** in the left sidebar
2. You should see a list of recorded sessions (if any)
3. Click on a session to watch it
4. You'll see the user's mouse movements, clicks, and page interactions

**Note**: Session recordings can use a lot of data. To configure:
- Go to **Settings** → **Project** → **Recordings**
- You can set sampling rates (e.g., only record 10% of sessions)
- You can set retention periods
- You can configure privacy settings (mask text, hide sensitive data)

---

## Part 7: Understanding What You're Tracking

### Automatic Events (No code needed)
These are captured automatically:
- **`$pageview`**: Every time someone visits a page
- **`$pageleave`**: When someone leaves a page (used to calculate session duration)
- **Sessions**: Automatically grouped (30 minutes of inactivity = new session)

### Custom Events (Already in your code)
These events are already being tracked when users interact with your site:

**Landing Page Events:**
- `landing_try_demo_click` - User clicks "Try Demo"
- `landing_book_pilot_click` - User clicks to book pilot
- `landing_calendly_click` - User clicks Calendly link
- `landing_contact_form_submit` - User submits contact form
- `landing_demo_page_view` - User views demo page
- `landing_demo_video_play` - User plays demo video
- `landing_try_live_demo_click` - User clicks "Try Live Demo"

**Enterprise Page Events:**
- `book_demo` - User books a demo
- `request_access` - User requests access
- `download_one_pager` - User downloads one-pager PDF

---

## Part 8: Quick Reference

### Where to Find Things in PostHog

- **Insights**: Create charts, funnels, trends, and analyze data
- **Dashboards**: Organize multiple insights together
- **Recordings**: Watch user session replays
- **Persons**: View individual users and their properties
- **Activity**: See live events as they happen
- **Settings**: Configure project, API keys, recordings, etc.

### Important URLs

- **Your PostHog Dashboard**: The URL you use to log in
- **Project Settings**: Dashboard → Settings → Project
- **API Key Location**: Settings → Project → Project API Key

### Environment Variables Summary

In Render (`arch-circare-ui` service):
- **Required**: `VITE_POSTHOG_KEY` = your API key (starts with `phc_`)
- **Optional**: `VITE_POSTHOG_HOST` = `https://us.i.posthog.com` (only if not using default)

---

## Troubleshooting

### Events Not Appearing?

1. **Check environment variable is set**:
   - Render → Your Service → Environment
   - Verify `VITE_POSTHOG_KEY` exists and has the correct value

2. **Verify you redeployed**:
   - After adding environment variables, you MUST redeploy
   - Check Render → Deployments to see recent deployments

3. **Check browser console**:
   - Open your site in a browser
   - Press F12 → Console tab
   - Look for errors or `[analytics]` debug messages
   - In development mode, you'll see debug logs for analytics events

4. **Verify API key is correct**:
   - Make sure you copied the full key (should start with `phc_`)
   - Make sure there are no extra spaces
   - Go to PostHog → Settings → Project to verify the key

5. **Check PostHog Activity Log**:
   - PostHog → Activity (or Live Events)
   - Events can take 10-30 seconds to appear
   - Make sure you're looking at the correct project

6. **Test locally** (optional):
   - Create a `.env` file in `frontend/` directory
   - Add: `VITE_POSTHOG_KEY=phc_your_key_here`
   - Run `npm run dev`
   - Check browser console and PostHog Activity Log

### Still Having Issues?

- Check that `posthog-js` is installed: `frontend/package.json` should have `"posthog-js": "^1.309.1"`
- Verify the code is initialized: Check `frontend/src/main.tsx` should call `initAnalytics()`
- Check network tab: F12 → Network → Filter by "posthog" to see if requests are being made

---

## Next Steps

Now that PostHog is set up, you can:

1. **Monitor regularly**: Check your dashboard weekly to see trends
2. **Create alerts**: Set up notifications for important events (e.g., "Demo clicks drop below X")
3. **Review recordings**: Watch session recordings to understand user behavior
4. **Create more insights**: Build insights specific to your business goals
5. **Add custom events**: Track additional user actions as your app grows

---

## Summary Checklist

- [ ] Created PostHog account and project
- [ ] Got Project API Key from PostHog Settings
- [ ] Added `VITE_POSTHOG_KEY` to Render environment variables
- [ ] Redeployed frontend in Render
- [ ] Verified events appear in PostHog Activity Log
- [ ] Created first insight (Page Views)
- [ ] Created conversion funnel
- [ ] Created dashboard with insights
- [ ] Explored session recordings (optional)

**You're all set! 🎉**

