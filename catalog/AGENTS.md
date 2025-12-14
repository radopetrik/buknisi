# Catalog App Guidelines

- Follow styles defined in `src/app/globals.css` and use Tailwind utility classes for all layout and typography.
- Use Playfair Display for display headings and Lato for body text via the font variables in `layout.tsx`.
- Prefer React Server Components for pages and data fetching; import client components only when interactivity is required.
- Fetch data exclusively through the helper in `src/lib/supabase/server.ts` to keep cookie handling consistent.
- When listing companies, always filter by both city and category slugs to match the SEO-friendly routing structure.
- Keep public pages accessible (aria labels, focus states) and avoid inline styles or script tags.
