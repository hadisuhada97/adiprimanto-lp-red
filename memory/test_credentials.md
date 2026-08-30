# Test Credentials — Adiprimanto CMS

> Updated: 2026-06 (Phase F1 — Foundation)

## Admin Panel / API (Laravel backend)

| Field | Value |
|---|---|
| Email | `admin@adiprimanto.com` |
| Password | `AdiPrimanto#2026` |
| Role | Super Admin (all 128 permissions) |
| 2FA | Enabled on the account, but the login endpoints are **not implemented yet** (Phase F2) |

Seeded idempotently by `database/seeders/AdminUserSeeder.php` from `ADMIN_EMAIL` /
`ADMIN_PASSWORD` in `/app/backend/.env`. Re-running `php artisan db:seed` keeps the
password in sync with the env file.

## Database (MySQL / MariaDB, local)

| Field | Value |
|---|---|
| Host | `127.0.0.1:3306` |
| Database | `adiprimanto_cms` |
| Username | `cms_user` |
| Password | `cms_secret_2026` |

## Roles Seeded

| Role | Slug | Permissions |
|---|---|---|
| Super Admin | `super-admin` | 128 (all) |
| Admin | `admin` | 97 (no users/roles, no force delete) |
| Editor | `editor` | 54 (view/create/update on content only) |

## Endpoints Available Now

| Method | Path | Auth |
|---|---|---|
| GET | `/api/v1/health` | none |

Auth endpoints (`/api/v1/auth/login`, `/api/v1/auth/two-factor/verify`,
`/api/v1/auth/two-factor/resend`, `/api/v1/auth/logout`) arrive in Phase F2.

## Notes

- `MAIL_MAILER=log` in this environment: OTP emails will be written to
  `/app/backend/storage/logs/laravel.log` instead of being sent.
