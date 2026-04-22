@AGENTS.md

# Fitness App — Project Intelligence

## What this app is

A full-stack fitness tracking app with two modes:

- **Nutrition** — calorie and macro tracking, food logging, barcode scanning, AI meal analysis. Think MyFitnessPal.
- **Training** — workout logging, exercise library, routines, strength progression, rest timer. Think Hevy/Strong.

The AI layer (Claude API) is the differentiator — it sees both nutrition and training data and gives unified coaching insights neither standalone app can.

## Tech stack

- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript
- **Styling:** Tailwind CSS v4
- **Auth:** Supabase Auth (SSR setup via `@supabase/ssr`)
- **Database:** Supabase Postgres, accessed via Drizzle ORM
- **ORM:** Drizzle (`drizzle-orm` + `drizzle-kit`)
- **DB driver:** `postgres` (node-postgres)
- **Linter/Formatter:** Biome (not ESLint, not Prettier — never add them)
- **Barcode scanning:** `barcode-detector` polyfill + native `BarcodeDetector` API
- **Food data:** Open Food Facts API (no key needed)
- **3D body model:** `@react-three/fiber` + `@react-three/drei` (planned)
- **Charts:** Recharts (planned)

## Project structure

## Database

- Supabase Postgres is the database
- All queries go through **Drizzle ORM** — never use the Supabase JS client for data queries
- Supabase client is used **only for auth** (session, user, sign in/out)
- Schema files live in `src/db/schema/`
- Run migrations with `drizzle-kit push` (dev) or `drizzle-kit migrate` (prod)
- `user_profiles` links to Supabase `auth.users` via `userId uuid` — never duplicate auth data

## Schema domains

- `user_profiles` — fitness goals, stats, macro targets
- `food_items` — cached food database (from Open Food Facts, keyed by barcode)
- `food_logs` — user food entries per day (references food_items)
- `weight_logs` — daily body weight entries
- `exercises` — exercise library (seeded, not user-generated)
- `routines` — user's saved workout programs
- `routine_exercises` — exercises within a routine (ordered)
- `workout_sessions` — completed training sessions
- `workout_sets` — individual sets within a session (weight, reps, RPE)

## Key conventions

- Use **server components** by default; only add `"use client"` when you need interactivity or browser APIs
- Drizzle queries belong in `src/lib/` or server components/route handlers — never in client components
- Food lookups: always check `food_items` table first (cache), only hit Open Food Facts on cache miss
- Barcode flow: scan → get EAN/UPC code → check cache → query Open Food Facts on miss → cache result in `food_items` → log
- TDEE is calculated server-side using Mifflin-St Jeor formula from `user_profiles` data
- Muscle group → exercise mappings live in a static config file, not the DB
- Active workout session state (sets being added in real time) is client-side only (Zustand, planned)

## What NOT to do

- Don't use Supabase JS client for database queries — use Drizzle
- Don't install ESLint or Prettier — Biome handles both
- Don't use `any` types
- Don't build your own food nutrition database — cache from Open Food Facts
- Don't put Drizzle queries in client components
- Don't create a `users` table — reference `auth.users` via UUID in `user_profiles`
- **Never remove `// biome-ignore` comments** — they are intentional lint suppressions, preserve them exactly as-is
