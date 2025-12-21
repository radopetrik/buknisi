# Monorepo Instructions & Global Context

## 1. Global Setup & Core Rules
- **Read:** `agents/nextjs.md` (for web projects) and `agents/supabase.md` (for all projects).
- **Database:** Shared Supabase instance.
  - **Schema/Migrations:** All changes MUST be saved to the `db` folder.
  - **Authority:** The `db` folder is the source of truth for the database schema.
  - **Impact:** Changing the DB affects ALL apps. Verify compatibility across `admin`, `web`, `admin-mobile`, and `mobile` when modifying schema.
- **Scope:** By default, restrict work to the specific app directory you are assigned to. Do not modify other apps unless explicitly required for a shared feature or refactor.


## 2. Monorepo Map & App Stacks

### 1. admin (`/admin`)
- **Type:** Web Admin Dashboard
- **Stack:** Next.js 16 (App Router), React 19, Tailwind CSS 4, shadcn/ui.
- **Structure:** Uses `src/` directory (e.g., `src/app`).
- **Auth:** Supabase Auth.
- **Key Libs:** React Hook Form, Zod, Recharts, date-fns.

### 2. web (`/web`)
- **Type:** Public User Website
- **Stack:** Next.js 16 (App Router), React 19.
- **Styling:** CSS Modules / Standard CSS (**NO** Tailwind configured).
- **Structure:** Direct `app/` directory (**NO** `src/` folder).
- **Auth:** Supabase Auth integration.
- **Key Libs:** date-fns, react-day-picker.
- **Hosting:** Vercel.

### 3. admin-mobile (`/admin-mobile`)
- **Type:** Mobile App for Service Providers (iOS/Android)
- **Stack:** Expo, React Native, TypeScript.
- **Styling:** NativeWind (Tailwind CSS v3 compatible).
- **Structure:** Uses `app/` directory (Expo Router).
- **Auth:** Supabase Auth (Client-side with AsyncStorage).
- **Key Libs:** TanStack Query, React Hook Form, Zod, date-fns.

### 4. mobile (`/mobile`)
- **Type:** Client Mobile App
- **Stack:** Expo (v54), React Native (0.81), TypeScript.
- **Routing:** Expo Router (v6).
- **Styling:** NativeWind (Tailwind v3 compatible) + Gluestack UI.
- **Structure:** Uses `app/` directory.
- **Auth:** Supabase Auth.
- **Key Libs:** date-fns, lucide-react-native, tailwind-merge.

## 3. Shared Resources
- **Database:** `/db` folder contains SQL migrations and seeds.
- **Agents:** `/agents` folder contains shared documentation (`nextjs.md`, `supabase.md`).

---
*Note: Always check the local `AGENTS.md` in each app folder for specific constraints.*
