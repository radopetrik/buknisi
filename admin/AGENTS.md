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

# Agent Instructions: Admin Web App

## Scope
- **Directory:** `/admin`
- **Context:** Web Admin Dashboard

## Core Constraints
1. **Read Global Docs:**
   - Root `/AGENTS.md` (Monorepo context)
   - `/agents/nextjs.md` (Next.js best practices)
   - `/agents/supabase.md` (Database usage)
2. **Database:**
   - **Source of Truth:** `/db` folder at repo root.
   - **Modifications:** Check schema in `/db` before querying. Save migrations to `/db`.
3. **Tech Stack:**
   - **Framework:** Next.js 16 (App Router) + React 19.
   - **Structure:** `src/app` (Uses `src` folder).
   - **Styling:** Tailwind CSS 4 + shadcn/ui.
   - **Auth:** Supabase Auth.
   - **Libs:** React Hook Form, Zod, Recharts, date-fns.

## Workflow
- Focus on `src/` directory.
- Use Tailwind 4 conventions.
- Consult `/db` for data models.
