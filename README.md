# Air Exposure Passport

Mobile-first web app that tracks air quality, provides commute recommendations, and rewards healthy choices with streaks and points.

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Environment

Create `.env.local`:

```
NEXT_PUBLIC_CONVEX_URL=https://convex.zahar.my
CONVEX_SELF_HOSTED_URL=https://convex.zahar.my
CONVEX_SELF_HOSTED_ADMIN_KEY=<your-key>
```

## Features

- Real-time air quality data from OpenAQ
- Location-based exposure scoring
- Smart commute recommendations
- Streak tracking and gamification
- 7-day trend analysis

## Tech Stack

- Next.js (App Router)
- Convex (self-hosted backend)
- Tailwind CSS
