# Change: Timeline calendar views + staff filter

## Why
Aktuálna obrazovka `Kalendár` v admin-mobile zobrazuje iba rezervácie pre jeden vybraný deň. Pre reálne používanie v prevádzke potrebujeme rýchly prehľad dopredu (agenda), aj detailnú prácu s časom (day/week timeline) a možnosť filtrovať podľa zamestnanca.

## What Changes
- Pridať zobrazenie **Agenda**: nekonečný zoznam rezervácií od dneška do budúcnosti, zoskupený podľa dní (sticky nadpisy dní).
- Pridať zobrazenia **Day / Week / Month**:
  - Day/Week: časová mriežka (timeline) s podporou zobrazenia podľa staff (resources).
  - Month: mesačný prehľad s výberom dňa (a indikáciou existujúcich rezervácií).
- Pridať **filter bookings** (default): `Moje bookings / Všetko / konkrétny staff / Nepriradené`.
  - `Moje bookings` = bookings vytvorené prihláseným userom (`bookings.user_id = auth.uid()`).
- Zjednotiť načítanie dát tak, aby všetky view používali rovnaký dátový model a filtre.

## Impact
- Affected specs: (nová capability) `calendar`.
- Affected code:
  - `admin-mobile/app/(protected)/calendar/index.tsx`
  - nové UI/queries utily podľa potreby (scoped do `admin-mobile`)
- Dependencies (pravdepodobne):
  - `@howljs/calendar-kit` pre timeline (day/week + resources)
  - `react-native-calendars` pre month grid (ak timeline kit nepokrýva month view)

## Non-Goals
- Tvorba/editácia rezervácií cez drag & drop v timeline.
- Realtime sync (Supabase realtime) – riešiť až po základnej funkcionalite.
