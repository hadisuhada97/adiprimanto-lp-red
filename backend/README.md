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
- [ ] F2 — Auth & 2FA (email OTP)
- [ ] F3 — Core content modules
- [ ] F4 — Remaining content modules
- [ ] F5 — Inbox, audit log, users & roles UI, dashboard
- [ ] F6 — Next.js integration
- [ ] F7 — Legacy data migration & QA
