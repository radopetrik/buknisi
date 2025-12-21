# Project Context

## Purpose
**Buknisi Web** is the client-facing web application for a service booking platform (likely targeting the Slovak/Czech market). It allows customers to discover service providers (companies) in various cities, view their offerings (services, amenities, staff), and likely make bookings. It operates alongside an Admin portal and a Mobile Admin app.

## Tech Stack
-   **Framework:** Next.js 16 (App Router)
-   **Language:** TypeScript
-   **UI Library:** React 19
-   **Styling:** CSS Modules / Standard CSS (No Tailwind CSS configured)
-   **Auth:** Supabase Auth (`@supabase/ssr`, `@supabase/supabase-js`)
-   **State/Data:** React Server Components, Server Actions
-   **Key Libraries:**
    -   `date-fns` (Date manipulation)
    -   `react-day-picker` (Date picking)
    -   `lucide-react` (Icons)

## Project Conventions

### Code Style
-   **Formatting:** Prettier (implied by standard Next.js setup), ESLint.
-   **Naming:**
    -   Components: PascalCase (e.g., `Button.tsx`)
    -   Utilities/Hooks: camelCase (e.g., `useAuth.ts`)
    -   Folders: kebab-case (Next.js App Router convention).
-   **Imports:** Use path aliases `@/*` pointing to `./*`.

### Architecture Patterns
-   **Next.js App Router:** Uses `app/` directory (Directly in root, NO `src/` folder).
-   **Server-First:** heavy reliance on React Server Components (RSC) and Server Actions for data fetching and mutations.
-   **Supabase Integration:**
    -   Strict adherence to `@supabase/ssr` patterns.
    -   **Middleware:** Uses a `proxy.ts` (or similar middleware pattern) to refresh auth tokens.
    -   **Clients:** Distinct Browser and Server clients for Supabase.

### Testing Strategy
-   *To be defined.* (Currently no specific test runner like Jest/Vitest configured in `package.json` scripts, only `lint`).

### Git Workflow
-   **Branching:** `main` is the primary branch. Feature branches should be used for development.
-   **Database Migrations:**
    -   Stored in `db/` folder (shared repo root).
    -   Format: `XXX_description.sql`.
    -   Must be appended to `db/schema.sql` to maintain a schema snapshot.

## Domain Context
-   **Core Entities:**
    -   **Companies:** Service providers.
    -   **Services:** Offerings by companies.
    -   **Staff:** Employees performing services.
    -   **Amenities:** Features offered by companies.
    -   **Cities:** Locations where services are available.
-   **Shared Ecosystem:** This app shares a Supabase database with the `admin` (web) and `admin-mobile` (React Native) applications. Changes to the DB must consider all three clients.

## Important Constraints
-   **Styling:** DO NOT use Tailwind CSS for this specific application (`web`). Use CSS Modules.
-   **Database:** Do not break existing queries used by `admin` or `admin-mobile` apps.
-   **Auth:** STRICTLY follow the `@supabase/ssr` implementation guide in `agents/supabase.md`. NEVER use `auth-helpers-nextjs`.

## External Dependencies
-   **Supabase:** Authentication, PostgreSQL Database, Storage.
-   **Vercel:** Hosting platform.
