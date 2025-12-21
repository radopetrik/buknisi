# Project Context

## Purpose
Consumer-facing mobile application for Buknisi, allowing users to browse services, companies, and make bookings.

## Tech Stack
- **Framework:** Expo (SDK 54), React Native (0.81.5)
- **Routing:** Expo Router (v6)
- **Language:** TypeScript
- **UI/Styling:** NativeWind v4 (Tailwind CSS v3), Gluestack UI
- **State/Data:** Supabase Client
- **Icons:** Lucide React Native

## Project Conventions

### Code Style
- **Formatting:** Prettier (standard)
- **Styling:** Utility-first using NativeWind. Custom theme colors defined in `tailwind.config.js` (primary: #d4a373, background: #fcfcfc, etc.).
- **Imports:** Absolute imports using `@/` alias (e.g., `@/components/ui/...`).

### Architecture Patterns
- **Routing:** File-based routing in `app/` directory (Expo Router).
- **Screens:** Located in `app/`. Grouped by feature/tabs.
- **Components:** Reusable UI components in `components/ui/` (Gluestack/custom).
- **Constants:** Theme and configuration in `constants/`.

### Testing Strategy
- **Unit Tests:** `react-test-renderer` is present in devDependencies.
- **Directories:** `__tests__` folders co-located with components.

### Git Workflow
- Standard feature branch workflow.

## Domain Context
- **Buknisi:** A booking platform.
- **Entities:** Cities, Companies, Services, Bookings.
- **User Roles:** End-users (Customers).

## Important Constraints
- **Platform:** iOS and Android (mobile).
- **Navigation:** Deep linking supported via Expo Router.

## External Dependencies
- **Supabase:** Backend (Database & Auth).
- **Expo:** Build and development ecosystem.
