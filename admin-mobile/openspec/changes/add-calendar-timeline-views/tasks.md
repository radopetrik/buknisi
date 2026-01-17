## 1. Implementation

- [x] 1.1 Refactor calendar data queries to support date ranges and bookings filter (Supabase query: company_id + date range + `mine|all|staff|unassigned`)
- [x] 1.2 Implement Agenda view (SectionList with day headers + infinite loading with TanStack `useInfiniteQuery`)
- [x] 1.3 Implement bookings filter UI (Moje bookings [default] / Všetko / staff list / Nepriradené)
- [x] 1.4 Implement Day/Week timeline view using a timeline calendar component (evaluate `@howljs/calendar-kit` resources support)
- [x] 1.5 Implement Month view date picker + booking indicators (evaluate `react-native-calendars`)
- [x] 1.6 Ensure all views share state: activeDate, viewMode, staffFilter
- [x] 1.7 Add empty/loading states and pull-to-refresh where applicable
- [x] 1.8 Run `admin-mobile` lint (`npm run lint`) and fix any violations

## 2. Acceptance Checks

- [ ] 2.1 Agenda loads from today into future (paged)
- [ ] 2.2 Agenda shows bookings grouped by day header
- [ ] 2.3 Bookings filter affects agenda/day/week/month consistently
- [ ] 2.4 Day/week render bookings on time grid
- [ ] 2.5 Month indicates days with bookings and allows selecting date
