# PRD — Adiprimanto CMS Portfolio

The full product requirements document lives at **`/app/PRD.md`** (Bahasa Indonesia, 780+ lines):
scope, personas, data model, 128 permissions, module specs (M-01…M-24), risks (R-01…R-12) and
the phase-by-phase implementation log.

## Status (June 2026)

- **Done**: F1 foundation · F2 auth + 2FA · F3 admin shell, Media Library, Portfolio ·
  F4 12 content modules (ID/EN) · F5 Inbox, Activity Log, Users, Roles, Dashboard ·
  F6 landing page fully driven by the CMS (Supabase removed) ·
  **F7a centralised Trash, Localization module, complete Media Library (folders, WebP +
  thumbnail variants, usage tracking), HTMLPurifier rich-text sanitisation, security headers/CSP**
- **Backlog (F7b)**: per-project image gallery, `content:import-legacy` command, Turnstile captcha
  (deferred by the user), nonce-based frontend CSP, daily DB backup + Lighthouse audit +
  committed Playwright E2E, `Accept-Language` middleware for admin routes.

Test credentials: `/app/memory/test_credentials.md`. Test reports: `/app/test_reports/`.
Pod reset recovery: `bash /app/scripts/bootstrap.sh` (recreates `.env`, DB, migrations, seeders).
