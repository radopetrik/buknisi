Read 'agents/nextjs.md' and 'agents/supabase.md'

Database location: Save all database changes/migrations to folder 'db'

This repo contains two React apps:

1. **admin** (in folder `admin`)
   - **Stack:** Next.js 16 (App Router), React 19, Tailwind CSS 4, shadcn/ui.
   - **Structure:** Uses `src/` directory (e.g., `src/app`).
   - **Auth:** Supabase Auth.
   - **Key Libs:** React Hook Form, Zod, Recharts, date-fns.

2. **web** (in folder `web`)
   - **Stack:** Next.js 16 (App Router), React 19.
   - **Styling:** CSS Modules / Standard CSS (No Tailwind configured).
   - **Structure:** Direct `app/` directory (NO `src/` folder).
   - **Auth:** Supabase Auth integration present.
   - **Key Libs:** date-fns, react-day-picker.

**Shared Context:**
- Both use the **same Supabase database**. Structure is stored in `db` folder.
- Both apps are hosted on Vercel.

**Notes:**
- Folder `tasks` contains personal notes—no need to modify.
