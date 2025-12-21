# Change: Update Main Menu Structure

## Why
Users need a dedicated "Home" landing screen to access key features quickly, separate from the "Explore" search functionality. The menu needs to be reorganized to support this workflow.

## What Changes
- Add a new "Home" (Domov) tab as the first item.
- Rename/Keep "Search" as "Explore" (Prehliadať).
- Ensure "Appointments" (Rezervácie) and "Profile" (Profil) remain accessible.
- Final menu structure: Home, Explore, Appointments, Profile.

## Impact
- Affected specs: `navigation`
- Affected code: 
  - `app/(tabs)/_layout.tsx` (Menu configuration)
  - `app/(tabs)/home.tsx` (New screen to be created)
