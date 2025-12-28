# Squad Game

A mobile app for private friend-groups that runs ONE daily game event with time pressure, leaderboards, and anti-cheat "truth" resolution.

## Features

- **Daily Events**: One event opens at a random time (08:00-22:00) with a 5-minute participation window
- **Event Types**:
  - **Live Selfie**: Capture a live selfie with a countdown timer and micro-poll
  - **Pressure Tap**: Reflex game - tap exactly at 0.00 seconds
  - **Daily Poll**: Vote on fun questions with your squad
- **Squads**: Create or join private friend groups with invite codes
- **Leaderboard**: Weekly points and lifetime streak tracking
- **Judge System**: Anti-cheat mechanism with community challenges
- **Push Notifications**: Get notified when events open

## Tech Stack

- **Frontend**: React Native (Expo), TypeScript, expo-router
- **State Management**: Zustand
- **Data Fetching**: TanStack React Query
- **Backend**: Supabase (Auth, Postgres, Storage, Realtime, Edge Functions)
- **Push Notifications**: Expo Notifications

## Project Structure

```
squad-game/
├── app/                    # Expo Router screens
│   ├── (auth)/            # Authentication screens
│   ├── (tabs)/            # Main tab navigation
│   ├── events/            # Event gameplay screens
│   └── results/           # Results screens
├── src/
│   ├── components/        # Reusable UI components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Supabase client, query client
│   ├── services/          # Push notifications
│   ├── store/             # Zustand stores
│   └── types/             # TypeScript types
├── database/
│   ├── schema.sql         # Database schema
│   └── seed.sql           # Poll bank seed data
├── supabase/
│   └── functions/         # Edge Functions
│       ├── generate-daily-events/
│       ├── open-events/
│       ├── close-events/
│       └── weekly-reset/
└── assets/                # App icons and images
```

## Setup Instructions

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Supabase account

### 1. Clone and Install

```bash
cd squad-game
npm install
```

### 2. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)

2. Run the database schema:
   - Go to SQL Editor in Supabase Dashboard
   - Copy and run `database/schema.sql`
   - Copy and run `database/seed.sql`

3. Create Storage bucket:
   - Go to Storage in Supabase Dashboard
   - Create bucket named `event-media`
   - Set to private (not public)
   - File size limit: 5MB
   - Allowed MIME types: `image/jpeg, image/png`

4. Enable required extensions:
   - Go to Database > Extensions
   - Enable `pg_cron` (for scheduled jobs)
   - Enable `pg_net` (for HTTP calls from cron)

### 3. Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Fill in your Supabase credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
EXPO_PUBLIC_PROJECT_ID=your-expo-project-id
```

### 4. Deploy Edge Functions

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Deploy functions
supabase functions deploy generate-daily-events
supabase functions deploy open-events
supabase functions deploy close-events
supabase functions deploy weekly-reset

# Set function secrets
supabase secrets set CRON_SECRET=your-secure-secret
```

### 5. Set Up Cron Jobs

In Supabase SQL Editor, run:

```sql
-- Enable extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Generate daily events at 1 AM UTC
SELECT cron.schedule(
  'generate-daily-events',
  '0 1 * * *',
  $$SELECT net.http_post(
    url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/generate-daily-events',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_CRON_SECRET"}'::jsonb,
    body:='{}'::jsonb
  )$$
);

-- Check for events to open every minute
SELECT cron.schedule(
  'open-events',
  '* * * * *',
  $$SELECT net.http_post(
    url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/open-events',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_CRON_SECRET"}'::jsonb,
    body:='{}'::jsonb
  )$$
);

-- Check for events to close every minute
SELECT cron.schedule(
  'close-events',
  '* * * * *',
  $$SELECT net.http_post(
    url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/close-events',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_CRON_SECRET"}'::jsonb,
    body:='{}'::jsonb
  )$$
);

-- Weekly reset every Monday at midnight UTC
SELECT cron.schedule(
  'weekly-reset',
  '0 0 * * 1',
  $$SELECT net.http_post(
    url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/weekly-reset',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_CRON_SECRET"}'::jsonb,
    body:='{}'::jsonb
  )$$
);
```

Replace `YOUR_PROJECT_REF` and `YOUR_CRON_SECRET` with your actual values.

### 6. Run the App

```bash
# Start Expo development server
npm start

# Run on iOS Simulator
npm run ios

# Run on Android Emulator
npm run android
```

## Local Development (Without Cron Jobs)

For local testing without setting up cron jobs, you can manually trigger events:

```bash
# Generate today's events
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/generate-daily-events \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"

# Open events (if any are scheduled)
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/open-events \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"

# Close events (if any are open)
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/close-events \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

Or insert a test event directly:

```sql
INSERT INTO daily_events (squad_id, date, event_type, opens_at, closes_at, status)
VALUES (
  'your-squad-id',
  CURRENT_DATE,
  'PRESSURE_TAP',
  NOW(),
  NOW() + INTERVAL '5 minutes',
  'open'
);
```

## Scoring System

| Action | Points |
|--------|--------|
| Participate in event | +10 |
| Fast submission bonus (Live Selfie) | +0 to +10 |
| Pressure Tap - 1st place | +20 |
| Pressure Tap - 2nd place | +15 |
| Pressure Tap - 3rd place | +10 |
| Pressure Tap - 4th+ place | +5 |
| Poll participation | +10 |
| Missed event | -15 + 1 strike |
| Judge approved outcome | +10 |
| Judge overturned outcome | -10 |

## Judge System

1. One squad member is randomly selected as Judge each day
2. After the event closes, the Judge can finalize the outcome
3. Other members can challenge within 1 hour
4. If >50% of members challenge, the outcome is overturned
5. Judge earns +10 points if approved, -10 if overturned

## License

MIT
