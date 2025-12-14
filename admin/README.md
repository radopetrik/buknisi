# Admin app

Next.js 16 (App Router) admin workspace with Tailwind v4, shadcn-style UI, and Supabase email/password auth.

## Setup
1) Install deps: `npm install`
2) Add environment variables (e.g., `.env.local`):
```
NEXT_PUBLIC_SUPABASE_URL="https://lqrzqgyhlzzprhsloeuu.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="sb_publishable_Xgy6JJxeDi9OyP0P85rU9w_qmpGj732"
```
3) Run locally: `npm run dev`

## Auth
- `/login` is public; all other routes are gated by Supabase via middleware and server checks.
- Sidebar footer shows the signed-in user and provides a logout button that returns to `/login`.

## Layout
- Sidebar categories: Calendar, Billing, Clients, Staff Management, Profile, Settings.
- Dashboard includes welcome text and placeholders for each category page.
