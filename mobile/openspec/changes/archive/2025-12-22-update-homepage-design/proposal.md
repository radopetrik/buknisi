# Change: Update Homepage Design

## Why
The current homepage is a placeholder. The user requests a modern, discovery-oriented interface similar to "Booksy" to improve user engagement and service discovery.

## What Changes
- Replace the current simple "Welcome" screen with a rich discovery interface.
- Add a **Search Bar** at the top for services or businesses.
- Add a **Category Rail** for quick access to service types (Barber, Hair, Massage, etc.).
- Add a **Special Offers** section horizontally scrolling.
- Add a **Recommended** section horizontally scrolling.
- Use mock data for now as the backend is not fully integrated for recommendation logic.

## Impact
- Affected specs: `home` (new capability)
- Affected code:
    - `app/(tabs)/index.tsx`: Complete rewrite.
    - `components/home/`: New directory for home-specific components.
    - `assets/images/`: Need placeholders for categories/businesses.
