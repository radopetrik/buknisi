# Project Context

## Purpose
**Admin Mobile App for Service Providers**
This application is the mobile interface for service providers within the Buknisi platform. It enables providers to manage their business operations on the go, including appointment scheduling, client management, staff coordination, and profile settings. It is part of a monorepo that includes a web admin dashboard, a consumer website, and a consumer mobile app.

## Tech Stack
- **Framework:** Expo SDK 54, React Native 0.81
- **Language:** TypeScript 5.9
- **Routing:** Expo Router v6 (File-based routing, Typed Routes enabled)
- **Styling:** 
  - NativeWind v4 (Tailwind CSS v3 compatible)
  - Gluestack UI (Core components)
  - `clsx` & `tailwind-merge` for class manipulation
- **State Management & Data Fetching:** TanStack Query v5
- **Authentication:** Supabase Auth (Client-side with AsyncStorage)
- **Forms:** React Hook Form + Zod
- **Date Handling:** date-fns
- **Icons:** Lucide React Native
- **Animation:** React Native Reanimated, Legend Motion

## Project Conventions

### Code Style
- **Linting:** ESLint with `eslint-config-expo`.
- **Formatting:** Prettier with `prettier-plugin-tailwindcss`.
- **File Naming:** kebab-case for files and directories (e.g., `user-profile.tsx`).
- **Component Structure:** Functional components with TypeScript interfaces.
- **Imports:** Absolute imports via `babel-plugin-module-resolver` (alias `@/` usually maps to root).

### Architecture Patterns
- **Expo Router:** Uses the `app/` directory for navigation structure.
  - `(auth)`: Public authentication routes (Login).
  - `(protected)`: Authenticated routes (Dashboard, Calendar, etc.).
  - `_layout.tsx`: Handles navigation stacks and tabs.
- **Components:** Located in `components/`.
  - `components/ui`: Reusable UI primitives (often from Gluestack/Shadcn-like patterns).
- **Services/Lib:**
  - `lib/supabase.ts`: Supabase client initialization.
  - `lib/query-client.ts`: React Query client.
  - `lib/utils.ts`: Common helper functions.
- **Database:** Schema is defined in the monorepo root `/db` folder. **Do not modify schema from within this app without checking global compatibility.**

### Testing Strategy
- **Unit/Integration:** (Currently implicitly relying on manual testing or standard Expo testing setups if configured later).
- **Linting:** Run `npm run lint` to check code quality.

### Git Workflow
- **Monorepo:** Changes here should generally be scoped to `admin-mobile` unless a shared library or DB schema change is involved.
- **Commits:** Follow conventional commits (e.g., `feat: add calendar view`, `fix: login error`).

## Domain Context
- **Users:** Service Providers (Staff/Admins).
- **Key Entities:**
  - **Appointments:** Scheduling and management.
  - **Clients:** Customer database and history.
  - **Staff:** Team management.
  - **Profile/Menu:** Provider settings and configuration.

## Important Constraints
- **Source of Truth:** The `/db` folder at the monorepo root is the source of truth for the database schema.
- **Styling:** Must use NativeWind/Tailwind classes. Avoid inline styles where possible.
- **Navigation:** Must use Expo Router conventions (file-based routing).

## External Dependencies
- **Supabase:** Used for PostgreSQL database, Authentication, and Realtime features.
