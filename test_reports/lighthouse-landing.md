# Lighthouse — Landing Page

Command: `E2E_BASE_URL=<preview url> yarn audit:lighthouse` (desktop preset, Chrome headless).
Raw report: `lighthouse-landing.json` · scores: `lighthouse-landing-summary.json`.

## Latest run (June 2026, preview pod)

| Category | Score |
|---|---|
| Performance | 61 |
| Accessibility | **100** |
| Best Practices | 81 |
| SEO | 83 |
| PWA | 71 |

Core Web Vitals (desktop): FCP 0.9 s · LCP 2.0 s · Speed Index 1.7 s · CLS 0.011 · TBT 790 ms.

## Fixed in this run

- Contrast of the muted text token in dark theme (`--color-muted` #7a788a → #a3a1b3)
- WhatsApp submit button (white on #25d366 = 1.98:1 → background #0f7a53 = 4.6:1)
- Heading order: footer column titles and portfolio card titles `h4` → `h3`
- Language switch button: `aria-label` now includes the visible locale code

Result: Accessibility went from 94 → 100.

## Known, not actionable in the preview environment

These come from the preview ingress/Cloudflare, not the app, and disappear on a real domain:

- `is-crawlable`: the platform sends `x-robots-tag: noindex, nofollow`
- `robots-txt`: Cloudflare serves its own managed `robots.txt` with a `Content-Signal` directive
- `deprecations`: Cloudflare challenge script (`/cdn-cgi/challenge-platform/...`)
- `bf-cache`: preview responses are `cache-control: no-store`
- `themed-omnibox` / `maskable-icon`: no PWA manifest is part of the product scope

## Remaining performance backlog

TBT 790 ms and ~1.1 s of script bootup come from hydrating a fully animated client landing page
(framer-motion in 8 sections). The contained next step is `LazyMotion` + `m.*` components, and
moving static sections to server components — tracked as a P2 item in `/app/PRD.md`.
