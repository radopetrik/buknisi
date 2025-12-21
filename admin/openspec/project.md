# Project Context

## Purpose
Web Admin Dashboard for the Buknisi platform. It serves as the management interface for service providers to handle bookings, clients, billing, staff, and general settings. It is designed to be a comprehensive tool for managing business operations.

## Tech Stack
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript 5+
- **Library:** React 19
- **Styling:** Tailwind CSS 4 (via `@tailwindcss/postcss`)
- **UI Components:** shadcn/ui (Radix UI primitives)
- **Icons:** Lucide React
- **Backend/Auth:** Supabase (Auth, Database)
- **State Management:** URL state (Next.js), React Context (where needed)
- **Form Handling:** React Hook Form + Zod
- **Date Handling:** date-fns
- **Data Visualization:** Recharts

## Project Conventions

### Code Style
- **Formatting:** Prettier (standard).
- **Linting:** ESLint with `eslint-config-next`.
- **Naming:** 
  - Files: `kebab-case.tsx` (e.g., `login-form.tsx`).
  - Components: `PascalCase` (e.g., `LoginForm`).
  - Functions/Variables: `camelCase`.
- **Imports:** Absolute imports using `@/*` alias pointing to `./src/*`.
- **Directives:** Use `"use client"` at the top of components requiring client-side interactivity.

### Architecture Patterns
- **Directory Structure:**
  - `src/app`: App Router pages and layouts.
  - `src/components`: Reusable UI components (`ui/` for shadcn, `domain/` for feature-specific).
  - `src/lib`: Utilities, Supabase client, helpers.
- **Data Fetching:** Server Components for initial data fetching where possible.
- **Styling:** Tailwind CSS 4 with CSS variables for theming (defined in `src/app/globals.css`).

### Testing Strategy
- **Unit/Integration:** (To be configured - standard Jest/Vitest recommended)
- **E2E:** (To be configured - Playwright recommended)

### Git Workflow
- **Branching:** Feature branches from `main`.
- **Commits:** Conventional Commits (e.g., `feat: add login page`, `fix: resolve auth issue`).

## Domain Context
- **Bookings:** Calendar management, appointments, scheduling.
- **Clients:** Customer profiles, history, management.
- **Staff:** Provider profiles, roles, permissions.
- **Billing:** Invoices, payments, financial tracking.
- **Services:** Service catalog, pricing, duration.

## Important Constraints
- **Database:** Changes must align with the shared Supabase schema in the root `/db` folder.
- **Monorepo:** Be aware of shared resources and other applications (`web`, `mobile`, `admin-mobile`) in the monorepo.
- **Auth:** Supabase Auth is the single source of truth for user identity.

## External Dependencies
- **Supabase:** Database and Authentication.
- **Unsplash:** Used for background images (as seen in `globals.css`).
