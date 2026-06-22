# Upgrade Plan Tracker

## Phase 1 (Security + Performance) 
- [x] Update leaderboard fetch on home page (`src/app/page.tsx`) to use `res.json()` with proper error handling.
- [x] Review and modernize avatar upload flow (`src/app/api/user/me/route.ts` + `src/app/settings/page.tsx`) to avoid base64 bloat.
- [x] Run lint/build and smoke test affected pages.

## Phase 2 (Rewards integrity)
- [ ] Locate Google review claim implementation / API endpoints.
- [ ] Implement/verify “claim 50 points” end-to-end.
- [ ] Add basic validation + persistence.

## Phase 3 (Modernization / i18n)
- [ ] Assess language handling across pages.
- [ ] Introduce consistent i18n usage and persist language preference.
- [ ] Verify RTL handling and translation coverage.

