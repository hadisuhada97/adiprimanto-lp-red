# Adiprimanto CMS — Backend (Laravel 12)

REST API for the `adiprimanto-lp-red` portfolio CMS. See `/app/PRD.md` for the full
specification.

## Requirements

- PHP 8.2+ with `mysql`, `mbstring`, `xml`, `curl`, `zip`, `bcmath`, `gd`, `intl`
- Composer 2
- MySQL 8 / MariaDB 10.11+

## Setup

```bash
composer install
cp .env.example .env          # then fill in DB + mail credentials
php artisan key:generate
php artisan migrate --seed
php artisan serve --host=0.0.0.0 --port=8001
```

## Non-negotiable conventions

1. **English only** — tables, columns, models, controllers, routes, variables, JSON keys
   and error messages. Indonesian appears only inside *content values* entered by users.
2. **UUID v7 primary keys on every application table.** Models extend `App\Models\BaseModel`
   (or `BaseTranslationModel` for `*_translations` tables), which applies Laravel 12's
   `HasUuids` trait (UUID v7, index-friendly). Pivot tables use dedicated pivot models in
   `App\Models\Pivots` so that `attach()`/`sync()` also generate UUIDs.
   Framework infrastructure tables (`cache`, `cache_locks`, `jobs`, `job_batches`,
   `failed_jobs`, `sessions`, `password_reset_tokens`, `migrations`) keep their stock schema.
3. **Input validation** — every request with a payload must have its own Form Request class
   extending `App\Http\Requests\BaseFormRequest`. No inline validation in controllers.
4. **Soft delete** — every content table has `deleted_at`; `BaseModel` applies `SoftDeletes`.
5. **Standard response envelope** — always return through `App\Support\ApiResponse` or the
   helpers on `BaseApiController`.

## Foundation building blocks

| Path | Purpose |
|---|---|
| `app/Models/BaseModel.php` | UUID v7 + soft deletes + blameable + audit log |
| `app/Models/BaseTranslationModel.php` | Base for `*_translations` tables |
| `app/Models/Concerns/HasTranslations.php` | One row per locale, fallback to default locale, `syncTranslations()` |
| `app/Models/Concerns/HasSortOrder.php` | `ordered()` / `active()` scopes, `applyOrder()` for drag & drop |
| `app/Models/Concerns/LogsActivity.php` | Writes `activity_logs` on create/update/delete/restore |
| `app/Models/Concerns/Blameable.php` | Fills `created_by` / `updated_by` |
| `app/Support/ApiResponse.php` | `success` / `created` / `error` / `paginated` envelopes |
| `app/Support/ApiExceptionRenderer.php` | Maps exceptions to the standard JSON error shape |
| `app/Http/Middleware/CheckPermission.php` | `permission:projects.create` route middleware |
| `app/Http/Middleware/ForceJsonResponse.php` | Forces `Accept: application/json` on the API |
| `app/Http/Requests/BaseFormRequest.php` | Parent class for all Form Requests |
| `app/Http/Controllers/Api/V1/BaseApiController.php` | Response + pagination helpers |
| `app/Enums/ModuleKey.php`, `PermissionAction.php`, `RoleSlug.php` | Permission matrix source of truth |
| `config/two_factor.php` | OTP length/TTL/attempts and login lockout settings |

## Response shape

Success:
```json
{ "success": true, "message": "…", "data": {}, "meta": {} }
```

Validation error (422):
```json
{ "success": false, "message": "The given data was invalid.", "errors": { "title": ["…"] } }
```

## Permissions

Slug format `{module}.{action}` — e.g. `projects.create`, `contact_messages.view`.
Generated from `ModuleKey` × `PermissionAction` by `PermissionSeeder` (128 permissions).
Guard routes with `->middleware('permission:projects.create')`.

## Phase status

- [x] **F1 — Foundation**: project setup, UUID base migrations, traits, base controller /
      form request, API envelope, exception renderer, CORS, permission middleware,
      role / permission / locale / setting / admin seeders, health endpoint
- [x] **F2 — Auth & 2FA**: credential check with account lockout, 6-digit email OTP challenge,
      Sanctum tokens with UUID PKs and 8 hour expiry, session endpoints, named rate limiters,
      auth audit trail
- [ ] F3 — Core content modules
- [ ] F4 — Remaining content modules
- [ ] F5 — Inbox, audit log, users & roles UI, dashboard
- [ ] F6 — Next.js integration
- [ ] F7 — Legacy data migration & QA

## Authentication

Two-step sign-in. Step 1 never returns an access token.

| Method | Path | Middleware |
|---|---|---|
| POST | `/api/v1/auth/login` | `throttle:auth-login` (5/min per email+IP) |
| POST | `/api/v1/auth/two-factor/verify` | `throttle:auth-two-factor` (10/min) |
| POST | `/api/v1/auth/two-factor/resend` | `throttle:auth-two-factor-resend` (3/min) |
| GET | `/api/v1/auth/me` | `auth:sanctum` |
| POST | `/api/v1/auth/logout` | `auth:sanctum` |
| POST | `/api/v1/auth/logout-all` | `auth:sanctum` |

Tunables live in `config/two_factor.php` (OTP length, TTL, attempts, resend limit and
cooldown, login max attempts, lockout minutes).

| Concern | Implementation |
|---|---|
| OTP storage | bcrypt hash in `two_factor_codes.code_hash`, never the plain code |
| Single use | `consumed_at` is stamped on success; replays are rejected |
| Attempts | `attempts` counter; challenge destroyed once `max_attempts` is reached |
| Resend | `resend_count` + `last_sent_at` enforce the limit and cooldown |
| Lockout | `users.failed_login_attempts` / `locked_until`, HTTP 423 while locked |
| Enumeration | Unknown emails still run a bcrypt comparison against a dummy hash |
| Delivery | `TwoFactorCodeNotification` is queued — the queue worker must be running |
| Audit | Every event is written to `activity_logs` with an `auth.*` action (see `AuthEvent`) |

### Environment gotchas

- `trustProxies(at: '*')` is enabled in `bootstrap/app.php`. The platform ingress forwards
  requests from rotating proxy IPs, so without it rate limiter keys and audit-log IP addresses
  are wrong.
- `ApiExceptionRenderer` deliberately returns `null` for `HttpResponseException` so that the
  throttle middleware's own 429 response is used instead of being reported as a 500.
- Quote any `.env` value containing `#`, otherwise everything after it is treated as a comment.

