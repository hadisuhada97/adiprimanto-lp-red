# Test Credentials — Adiprimanto CMS

> Updated: 2026-06 (Phase F2 — Authentication & 2FA)

## Admin Panel / API accounts

| Field | Super Admin | Editor (test) |
|---|---|---|
| Email | `admin@adiprimanto.com` | `editor.test@adiprimanto.com` |
| Password | `AdiPrimanto#2026` | `EditorTest#2026` |
| Role | Super Admin (128 permissions) | Editor (54 permissions) |
| 2FA | Enabled | Enabled |

The Super Admin is seeded idempotently by `database/seeders/AdminUserSeeder.php` from
`ADMIN_EMAIL` / `ADMIN_PASSWORD` in `/app/backend/.env`. The password is quoted in `.env`
because it contains `#`.

## Database (MariaDB, local)

| Field | Value |
|---|---|
| Host | `127.0.0.1:3306` |
| Database | `adiprimanto_cms` |
| Username | `cms_user` |
| Password | `cms_secret_2026` |

`mysql -u root adiprimanto_cms` also works through the local socket without a password.

## Sign-in flow (two steps — an access token is never returned by step 1)

```bash
BASE=https://f0003dca-8c80-420a-8483-8aa28d35c0fc.preview.emergentagent.com

# 1. credentials -> challenge_token
curl -X POST $BASE/api/v1/auth/login -H "Content-Type: application/json" \
  -d '{"email":"admin@adiprimanto.com","password":"AdiPrimanto#2026"}'

# 2. read the 6-digit OTP from the mail log (MAIL_MAILER=log in this environment)
grep -oE '\*\*[0-9]{6}\*\*' /app/backend/storage/logs/laravel.log | head -1 | tr -d '*'

# 3. challenge_token + code -> Bearer access token (valid 8 hours)
curl -X POST $BASE/api/v1/auth/two-factor/verify -H "Content-Type: application/json" \
  -d '{"challenge_token":"<TOKEN>","code":"<CODE>"}'
```

The OTP email is delivered through the queue, so the `laravel-queue` supervisor worker must
be running. Allow ~2 seconds between step 1 and reading the log.

## Endpoints available

| Method | Path | Auth | Throttle ||---|---|---|---|
| GET | `/api/v1/health` | none | 120/min |
| POST | `/api/v1/auth/login` | none | 5/min per email+IP |
| POST | `/api/v1/auth/two-factor/verify` | none | 10/min per challenge+IP |
| POST | `/api/v1/auth/two-factor/resend` | none | 3/min per challenge+IP |
| GET | `/api/v1/auth/me` | Bearer | 120/min |
| POST | `/api/v1/auth/logout` | Bearer | 120/min |
| POST | `/api/v1/auth/logout-all` | Bearer | 120/min |

## Security limits in force

| Rule | Value |
|---|---|
| OTP length / TTL | 6 digits / 10 minutes, single use, stored as bcrypt hash |
| OTP attempts | 5 per challenge, then the challenge is destroyed |
| OTP resend | max 3 per challenge, 60 second cooldown |
| Login lockout | 5 failed passwords → account locked 15 minutes |
| Access token | Sanctum PAT, expires after 8 hours (`SANCTUM_TOKEN_EXPIRATION`) |

## Admin panel URLs

| Page | URL |
|---|---|
| Sign in (2 steps) | `/admin/login` |
| Dashboard (protected) | `/admin/dashboard` |

The access token is stored in the non-httpOnly cookie `admin_access_token` so the Next.js
middleware can guard `/admin/*`. Signing in requires the OTP from the mail log (see above).

## Notes

- If a test locks an account, clear it with:
  `php artisan tinker --execute="App\Models\User::where('email','...')->first()->forceFill(['failed_login_attempts'=>0,'locked_until'=>null])->save();"`
- All authentication events are written to the `activity_logs` table with actions prefixed `auth.`.
