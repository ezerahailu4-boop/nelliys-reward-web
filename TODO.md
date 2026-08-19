# Upgrade Plan Tracker

## Phase 1 (Security + Performance) 
- [x] Update leaderboard fetch on home page (`src/app/page.tsx`) to use `res.json()` with proper error handling.
- [x] Review and modernize avatar upload flow (`src/app/api/user/me/route.ts` + `src/app/settings/page.tsx`) to avoid base64 bloat.
- [x] Run lint/build and smoke test affected pages.

## Phase 2 (Rewards integrity & Review Bonus)
- [x] Located Google review claim implementation / API endpoint (`/api/reviews/claim`).
- [x] Implemented/verified “claim 50 points” end-to-end with Google Maps link & modal on Dashboard and Rewards page.
- [x] Added validation, anti-abuse checks + persistence in `Transaction` table.

## Phase 3 (Modernization & i18n)
- [x] Extended comprehensive translations (English, Amharic, Afaan Oromo) in `src/lib/i18n.ts`.
- [x] Added interactive Language Switcher on Dashboard header that persists to `localStorage` and `user.language` in database.
- [x] Added In-App Notifications Drawer with unread count badge, "Mark all as read" button, and auto-dismiss.
- [x] Added dedicated Receipts History tab on `/history` with status badges (Approved, Pending, Flagged, Rejected) and explicit rejection feedback.
