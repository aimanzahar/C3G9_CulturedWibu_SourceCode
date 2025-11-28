# Air Exposure Passport (Next.js + Convex self-hosted)

AI-guided mobile + desktop web app that fuses live OpenAQ readings with commute recommendations, streak-based rewards, and SDG 3 health framing.

## Quick start

```bash
# 1) Install deps
npm install

# 2) Start Convex against your self-hosted cluster (uses .env.local)
CONVEX_SELF_HOSTED_URL=https://convex.zahar.my \
CONVEX_SELF_HOSTED_ADMIN_KEY="<admin key>" \
npx convex dev

# 3) Run the app
npm run dev
# open http://localhost:3000
```

### Required environment
Create `.env.local` (already populated) with:

```
NEXT_PUBLIC_CONVEX_URL=https://convex.zahar.my
CONVEX_SELF_HOSTED_URL=https://convex.zahar.my
CONVEX_SELF_HOSTED_ADMIN_KEY=convex-self-hosted|01aa37dca8761f218e328bb57efe735dbf5d738bd7cf93f859ab99b3bcb2afb9f9ee57adf0
```

## How it works

- **Frontend (Next.js app router)** in `src/app/page.tsx` is a client component that:
  - Captures GPS (falls back to Kuala Lumpur), calls `/api/openaq` for PM2.5/NO₂/CO near the user, and computes a 0–100 exposure score.
  - Shows responsive cards (mobile-first) for live air quality, smart move suggestions (avoid peak traffic, switch to metro, indoor exercise alerts), and SDG‑3 playbook items.
  - Logs commutes via Convex to earn points, streaks, and badges; displays the latest passport entries and 7‑day trends.
- **API proxy** `src/app/api/openaq/route.ts` forwards coordinates to the public OpenAQ API and normalizes the payload.
- **Convex self-hosted backend**:
  - Component `convex/air` (schema + functions) namespaced via `convex/air/convex.config.ts`.
  - Schema (`convex/air/schema.ts`): `profiles` table (userKey, streak, points) and `exposures` table (lat/lon, pollutants, score, tips).
  - Business logic (`convex/air/passport.ts`): risk scoring, streak + points, and trend aggregation.
  - Public wrappers (`convex/passport.ts`) expose the component to the client using `ctx.runQuery/ctx.runMutation`.

## Primary flows

1) User opens the app → GPS → `/api/openaq` → exposure score rendered.
2) `ensureProfile` mutation auto-creates a profile keyed by a device-local `nanoid`.
3) “Save this commute” → `logExposure` mutation stores pollutants, updates streak/bestStreak/points, and returns tips.
4) Passport & insights queries surface latest entries + 7‑day averages for the dashboard.

## Design & UX notes

- Uses Space Grotesk + Manrope, glassy cards, and gradient backdrop; verified for mobile + desktop with responsive grids.
- No purple bias; accent palette uses sky/emerald/orange.
- Buttons and pills are finger-friendly; key stats stay above the fold on small screens.

## Additional ideas / next steps

- Add OpenStreetMap traffic density to steer routes automatically.
- Trigger push alerts when local PM2.5 > 35 µg/m³ or NO₂ > 40 ppb.
- Map clinic/ER access gaps by overlaying DOE Malaysia AQI with WHO urban health data.

## Testing

- `npm run lint` (passes)
- Manual smoke: load home page, allow location, hit “Save this commute”, confirm streak/points update and entry appears in Passport list.
