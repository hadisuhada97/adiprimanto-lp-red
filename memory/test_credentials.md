# Test Credentials — Adiprimanto CMS

> Updated: 2026-06 (Phase F7a — Trash, Localization, Media Library, security headers)
>
> Preview base URL of the current pod:
> `https://48e55004-a428-40e8-81e3-39a7fa80d283.preview.emergentagent.com`
>
> After a pod reset run `bash /app/scripts/bootstrap.sh`, then recreate the two non-2FA
> test accounts below (they are not part of the seeders).

## Non-2FA test accounts (preferred for UI/API automation)

| Field | Super Admin (test) | Editor (test) |
|---|---|---|
| Email | `shell.test@adiprimanto.com` | `editor.test@adiprimanto.com` |
| Password | `ShellTester#2026` | `EditorTest#2026` |
| Role | Super Admin | Editor |
| 2FA | Disabled — login returns the access token in one step | Disabled |

Recreate them with:

```bash
cd /app/backend && php artisan tinker --execute="
foreach ([['shell.test@adiprimanto.com','Shell Tester','ShellTester#2026','super-admin'],['editor.test@adiprimanto.com','Editor Tester','EditorTest#2026','editor']] as [\$email,\$name,\$pass,\$role]) {
\$u = App\Models\User::withTrashed()->firstOrNew(['email' => \$email]);
\$u->name = \$name; \$u->password = bcrypt(\$pass); \$u->is_active = true; \$u->is_two_factor_enabled = false; \$u->deleted_at = null; \$u->save();
\$u->roles()->sync([App\Models\Role::where('slug',\$role)->value('id')]); }"
```

## Admin Panel / API accounts (seeded, 2FA on)

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
BASE=https://content-hub-1887.preview.emergentagent.com

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
| Any module (placeholder) | `/admin/portfolio/projects`, `/admin/inbox`, `/admin/settings/seo`, … |

The access token is stored in the non-httpOnly cookie `admin_access_token` so the Next.js
middleware can guard `/admin/*`. Signing in requires the OTP from the mail log (see above).

### UI test accounts without 2FA

| Email | Password | Role |
|---|---|---|
| `shell.test@adiprimanto.com` | `ShellTester#2026` | Super Admin |
| `editor.test@adiprimanto.com` | `EditorTest#2026` | Editor |

Both have `is_two_factor_enabled = false`, so `POST /auth/login` returns an access token
immediately and browser tests can reach the dashboard without reading the mail log. The Editor
account is used to assert 403 responses on delete/force-delete endpoints.

> Created manually via tinker for the preview environment only. They are **not** part of any
> seeder and must never exist in production. Recreate them with:
>
> ```bash
> cd /app/backend && php artisan tinker --execute="
> \$u = App\Models\User::firstOrNew(['email' => 'shell.test@adiprimanto.com']);
> \$u->name = 'Shell Tester'; \$u->password = bcrypt('ShellTester#2026');
> \$u->is_active = true; \$u->is_two_factor_enabled = false; \$u->save();
> \$u->roles()->sync([App\Models\Role::where('slug','super-admin')->value('id')]);"
> ```

## Rebuilding the environment after a pod reset

Everything outside `/app` and `/root` is ephemeral. Run `bash /app/scripts/bootstrap.sh` to
reinstall PHP, MariaDB, Composer, dependencies, the supervisor programs and the database, then
recreate the accounts above. The frontend runs a **production build** (`yarn start`), so after any
frontend change run `yarn build` and `sudo supervisorctl restart frontend`.

## Phase F3c endpoints (admin, Bearer token)

| Module | Base path |
|---|---|
| Projects | `/api/v1/admin/projects` + `/reorder`, `/{id}/toggle-active`, `/{id}/restore`, `/{id}/force` |
| Project categories | `/api/v1/admin/project-categories` (same action set) |
| Technologies | `/api/v1/admin/technologies` (same action set) |
| Media | `/api/v1/admin/media` + `/{id}/restore`, `/{id}/force` |
| File serving | `GET /api/storage/{path}` (public, no auth) |

List endpoints accept `search`, `trashed=1`, `per_page`, and — for projects — `status` and
`category_id`.

## Notes

- If a test locks an account, clear it with:
  `php artisan tinker --execute="App\Models\User::where('email','...')->first()->forceFill(['failed_login_attempts'=>0,'locked_until'=>null])->save();"`
- All authentication events are written to the `activity_logs` table with actions prefixed `auth.`.
