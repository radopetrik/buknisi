<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

# Agent Instructions: Admin Mobile App

## Scope
- **Directory:** `/admin-mobile`
- **Context:** Mobile App for Service Providers

## Core Constraints
1. **Read Global Docs:**
   - Root `/AGENTS.md` (Monorepo context)
   - `/agents/supabase.md` (Database usage)
   - *Note: Next.js docs are NOT relevant here.*
2. **Database:**
   - **Source of Truth:** `/db` folder at repo root.
   - **Modifications:** Check schema in `/db` before querying. Save migrations to `/db`.
3. **Tech Stack:**
   - **Framework:** Expo + React Native + TypeScript.
   - **Routing:** Expo Router (`app/` directory).
   - **Styling:** NativeWind (Tailwind v3 compatible).
   - **Auth:** Supabase Auth (AsyncStorage).
   - **Libs:** TanStack Query, React Hook Form, Zod, date-fns.

## Workflow
- Focus on `app/` directory.
- Use NativeWind for styling.
- Consult `/db` for data models.
