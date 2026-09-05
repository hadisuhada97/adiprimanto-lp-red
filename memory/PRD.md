# PRD — Adiprimanto CMS Portfolio

The full product requirements document lives at **`/app/PRD.md`** (Bahasa Indonesia, 830+ lines):
scope, personas, data model, 128 permissions, module specs (M-01…M-24), risks (R-01…R-12) and
the phase-by-phase implementation log.

## Status (June 2026)

- **Done**: F1 foundation · F2 auth + 2FA · F3 admin shell, Media Library, Portfolio ·
  F4 12 content modules (ID/EN) · F5 Inbox, Activity Log, Users, Roles, Dashboard ·
  F6 landing page fully driven by the CMS (Supabase removed) ·
  F7a Trash, Localization, full Media Library (folders, WebP + thumbnails, usage tracking),
  HTMLPurifier sanitisation, security headers/CSP ·
  **F7b `content:import-legacy` + `content:export-snapshot`, committed Playwright E2E
  (`yarn e2e`, 10/10), Lighthouse audit (`yarn audit:lighthouse`, accessibility 100)**
- **Backlog**: per-project image gallery (P1) · Turnstile captcha (deferred by the user) ·
  landing TBT/LazyMotion performance work · nonce-based CSP · daily DB backup ·
  undecided ideas: Blog module, draft Preview Mode, `/helda` in the CMS, analytics,
  WhatsApp notifications.

## Handy commands

```bash
bash /app/scripts/bootstrap.sh                  # recover the pod after a reset
cd /app/backend && php artisan content:import-legacy --dry-run
cd /app/backend && php artisan content:export-snapshot
cd /app/frontend && E2E_BASE_URL=<preview url> yarn e2e
cd /app/frontend && E2E_BASE_URL=<preview url> yarn audit:lighthouse
```

Test credentials: `/app/memory/test_credentials.md`. Reports: `/app/test_reports/`
(`iteration_*.json`, `playwright-e2e.json`, `lighthouse-landing.md`).
