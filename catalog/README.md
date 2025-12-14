# Catalog App

Public-facing catalog for beauty and wellness companies powered by Next.js 16 and Supabase.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Configure the following environment variables:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL="<your-supabase-url>"
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="<your-supabase-anon-key>"
   SUPABASE_SERVICE_ROLE_KEY="<optional-service-role>"
   ```

   Only the public URL and publishable key are required for read-only catalog pages.

3. Run the development server:

   ```bash
   npm run dev
   ```

## Tech Stack

- Next.js 16 (App Router)
- React Server Components where possible
- Tailwind CSS v4
- Supabase for data access

## Project Structure

- `src/app` – Next.js routes and layouts
- `src/components` – Reusable UI building blocks
- `src/lib/supabase` – Server and browser clients
- `public` – Static assets (icons, images)

## Data

The schema lives in `../db/schema.sql`. Migrations for this app should be placed in `../db/` and kept in sync with the schema snapshot.
