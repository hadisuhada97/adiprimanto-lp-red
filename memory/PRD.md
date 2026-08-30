# Product Requirements Document (PRD)
## CMS Portofolio — `adiprimanto-lp-red`

| Item | Detail |
|---|---|
| Nama Produk | Adiprimanto Portfolio CMS |
| Versi Dokumen | 1.0 |
| Tanggal | 2026-06 |
| Status | Draft — siap eksekusi |
| Repository Existing | `adiprimanto` (Next.js 16 landing page, red/dark theme) |

---

## 1. Ringkasan Eksekutif

Landing page portofolio `adiprimanto-lp-red` saat ini **100% statis** kecuali satu modul (Portfolio) yang membaca dari Supabase. Seluruh copywriting, statistik, layanan, testimoni, FAQ, dan kontak masih hardcoded di dalam file `app/lib/translations.ts` dan array konstanta di dalam komponen React.

Proyek ini membangun **Content Management System** berbasis Laravel 12 (API) + MySQL, dengan admin panel TailAdmin v2.3, sehingga seluruh konten landing page dapat dikelola tanpa deploy ulang. Supabase dihapus total dan digantikan Laravel Storage.

### Tujuan Bisnis
1. Owner dapat memperbarui konten (portofolio, testimoni, layanan, harga, FAQ) mandiri dalam < 2 menit per item.
2. Menghilangkan kebutuhan re-deploy untuk perubahan copywriting.
3. Mengelola lead dari form Contact di satu inbox (saat ini hilang karena langsung redirect WhatsApp).
4. Menjaga skor Lighthouse/SEO existing (Page Speed 98+) melalui ISR/SSG + revalidation.

### Non-Goals (di luar cakupan v1)
- Multi-tenant / multi-site.
- Blog & artikel (dicatat sebagai backlog P2).
- Payment gateway, e-commerce, invoicing.
- Mobile app admin.

---

## 2. Hasil Audit Codebase Existing

### 2.1 Stack Frontend Terpasang
| Komponen | Versi / Nilai |
|---|---|
| Next.js | 16.3.3 (App Router, Turbopack) |
| React | 19.2.3 |
| TypeScript | 5.x |
| Tailwind CSS | v4 (`@tailwindcss/postcss`) |
| Animasi | framer-motion 12 |
| Ikon | lucide-react, react-icons |
| Data source | `@supabase/supabase-js` 2.106 → **akan dihapus** |
| Theming | CSS variables + `data-theme="light"`, context di `app/lib/theme-context.tsx` |
| i18n | Context manual `app/lib/language-context.tsx`, locale `id` \| `en` |

### 2.2 Inventaris Section & Sumber Data Saat Ini

| # | Section | Komponen | Sumber Data Sekarang | Modul CMS Target |
|---|---|---|---|---|
| 01 | Navbar | `Navbar.tsx` | `translations.nav` | `NavigationMenu` + `SiteSetting` |
| 02 | Hero | `Hero.tsx` | `translations.hero` (badge, headline 3 bagian, CTA, trusted text, 3 metrics) | `HeroSection` |
| — | Happy Clients | `HappyClients.tsx` | Array `avatars` (Unsplash URL) + `brands` (5 brand, ikon lucide) | `Client` (brand/logo marquee) |
| 03 | About | `About.tsx` | `translations.about` (3 stats, 3 paragraf bio, lokasi, CTA) | `AboutSection` + `AboutStat` |
| — | Tech Stack | `TechStack.tsx` | Array `skillCategories` (6 kategori, ±25 skill, ikon `Si*`, warna hex) | `SkillCategory` + `Skill` |
| — | Pain Points | `PainPoints.tsx` | `translations.painPoints.points` (3 item) | `PainPoint` |
| 05 | Services | `Services.tsx` | `translations.services` (7 layanan + tags, 3 stats, CTA) | `Service` + `ServiceStat` |
| 04 | Portfolio | `Portfolio.tsx` | **Supabase** tabel `projects` (`id, title, description, tools, image_url, demo, github`); kategori diturunkan dari string `tools` | `Project` + `ProjectCategory` + `Technology` |
| 06 | Process | `Process.tsx` | `translations.process.steps` (4 langkah) | `ProcessStep` |
| 07 | Testimonial | `Testimonial.tsx` | Array `testimonials` (nama, role, project, image, feedback, rating, accentColor) | `Testimonial` |
| — | FAQ | `FAQ.tsx` | `translations.faq.items` (4 Q&A) | `Faq` + `FaqCategory` |
| 08 | Contact | `Contact.tsx` | Array `contactLinks` (WA/Email/IG); submit → `window.open(wa.me)` — **lead tidak tersimpan** | `ContactChannel` + `ContactMessage` (inbox) |
| — | Footer | `Footer.tsx` | `translations.footer.navLinks` + social | `NavigationMenu` + `SocialLink` |
| — | Floating WA | `WhatsAppButton.tsx` | Nomor hardcoded `6285727346620` | `SiteSetting` |
| — | SEO/Metadata | `layout.tsx` | Metadata + JSON-LD (Person, LocalBusiness, WebSite) hardcoded | `SeoSetting` + `SiteSetting` |
| — | Sitemap/Robots | `sitemap.ts`, `robots.ts` | Statis | Generated dari CMS |
| — | Halaman `/helda` | `helda/page.tsx` → `helda.tsx` (1.544 baris) | Statis, landing page terpisah | **Out of scope v1** (dibiarkan statis) |

### 2.3 Temuan & Risiko Teknis
| Kode | Temuan | Dampak | Mitigasi |
|---|---|---|---|
| F-01 | Nomor WhatsApp & email tersebar di 3 file (`Contact.tsx`, `WhatsAppButton.tsx`, `layout.tsx`) | Inkonsistensi data | Sentralisasi ke `SiteSetting` |
| F-02 | Kategori portfolio dihitung dari substring `tools` (`getCategory()`) | Kategori salah/`Other` membengkak | Tabel `project_categories` eksplisit |
| F-03 | Avatar Happy Clients pakai URL Unsplash eksternal | Broken image, LCP buruk | Upload ke Media Library, self-host |
| F-04 | `translations.ts` monolitik 498 baris, dua bahasa dalam satu objek | Sulit dikelola, rawan desync ID/EN | Tabel `*_translations` per locale |
| F-05 | Ikon skill/brand berupa referensi komponen React (`SiReact`) | Tidak bisa dipilih dari DB | Simpan `icon_name` (string) + registry mapping di FE |
| F-06 | Form Contact tidak menyimpan data | Kehilangan lead | Endpoint `POST /api/v1/contact-messages` |
| F-07 | Warna aksen testimoni hardcoded (`accentColor`) | Tidak konsisten | Kolom `accent_color` (hex, validated) |
| F-08 | Supabase anon key di client bundle | Permukaan serangan | Dihapus total pada migrasi |

---

## 3. Tech Stack Target

### 3.1 Arsitektur (Headless / Decoupled)

```
┌────────────────────────┐     ┌─────────────────────────┐     ┌────────────┐
│ Next.js 16 (Public)    │     │ Laravel 12 REST API     │     │  MySQL 8   │
│ ISR / SSG + revalidate │────▶│ /api/v1/public/*  (open)│────▶│ UUID PK    │
│ adiprimanto.com        │     │ /api/v1/admin/*   (auth)│     │ InnoDB     │
└────────────────────────┘     └─────────────────────────┘     └────────────┘
          ▲                              │      │
          │ on-demand revalidate         │      └──▶ Laravel Storage (public disk / S3)
          └──────────────────────────────┘             media library, images
┌────────────────────────┐              │
│ Admin Panel            │              │
│ TailAdmin v2.3         │──────────────┘
│ /admin (Next.js route  │  Bearer token (Sanctum)
│  group atau SPA Vite)  │
└────────────────────────┘
```

### 3.2 Spesifikasi Wajib

| Layer | Teknologi | Catatan Wajib |
|---|---|---|
| Public Frontend | Next.js 16 (existing) | App Router, ISR, `revalidateTag` |
| Admin UI | TailAdmin **v2.3** | Tailwind-based; diintegrasikan sebagai route group `(admin)` pada Next.js yang sama |
| Backend | **Laravel 12** | PHP 8.3+, seluruh codebase **Bahasa Inggris** |
| Database | **MySQL 8** | **UUID sebagai Primary Key di SEMUA tabel** |
| Auth | Laravel Sanctum + **2FA OTP 6 digit via Email** | |
| Storage | Laravel Storage (`public` disk lokal, S3-ready driver) | Supabase dihapus |
| Queue | Laravel Queue (database driver) | Pengiriman email OTP & notifikasi |
| Cache | Laravel Cache (file/Redis-ready), tag-based invalidation | |
| Mail | SMTP (Laravel Mail) | OTP + notifikasi lead baru |
| Notifikasi UI | **Toast Message** (sukses/gagal) di seluruh aksi admin | |
| Testing | PHPUnit/Pest (backend), Playwright (E2E) | |

### 3.3 Aturan Coding Wajib (Non-Negotiable)

1. **Bahasa Inggris penuh**: nama tabel, kolom, model, controller, request, resource, route, variabel, key JSON, pesan error, dan komentar. Tidak ada Bahasa Indonesia di codebase (kecuali *nilai konten* yang diinput user).
2. **UUID Primary Key**: setiap tabel menggunakan `$table->uuid('id')->primary();`. Model memakai trait `HasUuids` (`public $incrementing = false; protected $keyType = 'string';`). Semua foreign key bertipe `uuid`/`foreignUuid`.
3. **Input Validation**: setiap endpoint yang menerima payload WAJIB memakai dedicated **Form Request** class (`StoreProjectRequest`, `UpdateProjectRequest`). Dilarang validasi inline di controller. Error response 422 dengan format standar.
4. **Soft Delete**: semua tabel konten memakai `$table->softDeletes()` + trait `SoftDeletes`. Tersedia menu **Trash** dengan aksi `restore` dan `forceDelete` (force delete hanya untuk role Super Admin).
5. **Toast Message**: setiap aksi create/update/delete/restore/publish di admin panel menampilkan toast sukses atau gagal, teks berasal dari `message` pada API response.
6. **API Resource**: response selalu via `JsonResource`, tidak pernah mengembalikan model mentah.
7. **Naming konvensi**: tabel `snake_case` plural; pivot `singular_singular`; kolom boolean berawalan `is_`/`has_`; timestamp berakhiran `_at`.

---

## 4. Modul CMS (Full Scope)

Semua modul mendukung: CRUD, soft delete + trash, `is_active` toggle, `sort_order` (drag & drop), dan konten multi-bahasa via tabel translations.

| # | Modul | Tipe | Deskripsi |
|---|---|---|---|
| M-01 | **Authentication & 2FA** | Sistem | Login email+password → OTP 6 digit via email → session token. |
| M-02 | **Role & Permission** | Sistem | Super Admin, Admin, Editor. Permission granular per modul (`view/create/update/delete/publish`). |
| M-03 | **Activity / Audit Log** | Sistem | Rekam actor, action, model, before/after diff, IP, user agent. Read-only + filter. |
| M-04 | **Media Library** | Sistem | Upload terpusat, folder, alt text, konversi WebP, thumbnail, usage tracking. |
| M-05 | **Dashboard** | Sistem | Ringkasan: total project, testimoni, pesan belum dibaca, aktivitas terbaru, quick actions. |
| M-06 | **Site Settings** | Konten | Nama brand, tagline, logo, favicon, nomor WhatsApp, email, alamat, jam operasional, CV file, default locale, default theme, toggle per section. |
| M-07 | **SEO Settings** | Konten | Meta title/description/keywords per locale, OG image, Twitter card, canonical, robots directive, JSON-LD (Person + LocalBusiness + WebSite) editable. |
| M-08 | **Navigation Menu** | Konten | Item menu untuk `header` & `footer`, label per locale, target anchor/URL, urutan. |
| M-09 | **Hero Section** | Konten | Badge, role, headline (line1 / highlight[] / stroke), deskripsi (prefix/strong/suffix), 2 tombol CTA, trusted text, 3 metric (label + value). |
| M-10 | **Clients & Brands** | Konten | Logo/brand marquee, avatar happy clients, counter label ("99+ Happy clients"). |
| M-11 | **About Section** | Konten | Eyebrow, lokasi, headline, 3 paragraf bio (rich text), foto profil, 3 stat (value/label/sub), 2 CTA. |
| M-12 | **Skills / Tech Stack** | Konten | Kategori (nama, eyebrow, urutan) → Skill (nama, `icon_name`, warna hex, level opsional). |
| M-13 | **Pain Points** | Konten | Eyebrow, heading, sub, N item (title + description + icon). |
| M-14 | **Services** | Konten | 7+ layanan: title, description, tags[], icon, harga opsional, urutan. Plus 3 service stat & CTA. |
| M-15 | **Portfolio / Projects** | Konten | Title, slug, description, konten panjang, cover, gallery[], kategori (relasi), technologies (many-to-many), demo URL, GitHub URL, client, tahun, `is_featured`, status publish. |
| M-16 | **Project Categories** | Konten | Menggantikan `getCategory()`: Next/Nuxt, React, Vue, PHP/Laravel, Other — dapat ditambah. |
| M-17 | **Technologies / Tags** | Konten | Master data tag teknologi (menggantikan string `tools` yang di-split koma). |
| M-18 | **Process Steps** | Konten | 4+ langkah: title, description, urutan, icon. |
| M-19 | **Testimonials** | Konten | Nama, role, perusahaan, project terkait (relasi opsional), foto/screenshot, feedback, rating 1–5, accent color, `is_featured`. |
| M-20 | **FAQ** | Konten | Kategori + item (question, answer rich text, urutan). |
| M-21 | **Contact Channels** | Konten | WhatsApp / Email / Instagram / dst: label, value, URL, icon, warna. |
| M-22 | **Contact Messages (Inbox)** | Data | Lead masuk dari form: nama, email, telepon, pesan, status (`new`/`read`/`replied`/`archived`/`spam`), catatan internal, IP, sumber. Notifikasi email + rate limit + honeypot/captcha. |
| M-23 | **Language / Locale** | Sistem | Kelola locale aktif (`id`, `en`), default, dan indikator kelengkapan terjemahan. |
| M-24 | **Trash / Recycle Bin** | Sistem | Daftar terpusat item soft-deleted, restore & force delete. |

---

## 5. Desain Database (MySQL, UUID PK)

### 5.1 Konvensi Global

```php
Schema::create('projects', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->foreignUuid('category_id')->nullable()->constrained('project_categories')->nullOnDelete();
    $table->string('slug')->unique();
    $table->boolean('is_active')->default(true);
    $table->unsignedInteger('sort_order')->default(0);
    $table->foreignUuid('created_by')->nullable()->constrained('users')->nullOnDelete();
    $table->foreignUuid('updated_by')->nullable()->constrained('users')->nullOnDelete();
    $table->timestamps();
    $table->softDeletes();
});
```

Pola translation (dipilih: **tabel translations terpisah, 1 baris per locale**):

```php
Schema::create('project_translations', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->foreignUuid('project_id')->constrained()->cascadeOnDelete();
    $table->string('locale', 5);            // 'id' | 'en'
    $table->string('title');
    $table->text('description')->nullable();
    $table->longText('content')->nullable();
    $table->timestamps();
    $table->unique(['project_id', 'locale']);
});
```

### 5.2 Daftar Tabel

**Sistem & Auth**
| Tabel | Kolom Utama |
|---|---|
| `users` | `id`, `name`, `email` (unique), `password`, `avatar_path`, `is_two_factor_enabled`, `last_login_at`, `last_login_ip`, `failed_login_attempts`, `locked_until`, timestamps, softDeletes |
| `two_factor_codes` | `id`, `user_id`, `code_hash`, `channel` (`email`), `expires_at`, `consumed_at`, `attempts`, `ip_address` |
| `roles` | `id`, `name`, `slug`, `description` |
| `permissions` | `id`, `name`, `slug`, `module`, `action` |
| `role_permission` | `id`, `role_id`, `permission_id` |
| `role_user` | `id`, `role_id`, `user_id` |
| `personal_access_tokens` | Sanctum, `tokenable_id` sebagai `uuid` (custom migration) |
| `activity_logs` | `id`, `user_id`, `action`, `subject_type`, `subject_id` (uuid), `old_values` (json), `new_values` (json), `description`, `ip_address`, `user_agent`, `created_at` |
| `media` | `id`, `folder_id`, `disk`, `path`, `file_name`, `original_name`, `mime_type`, `extension`, `size`, `width`, `height`, `alt_text`, `caption`, `uploaded_by`, timestamps, softDeletes |
| `media_folders` | `id`, `parent_id`, `name`, `slug` |
| `locales` | `id`, `code` (unique), `name`, `native_name`, `is_default`, `is_active`, `sort_order` |
| `settings` | `id`, `group`, `key` (unique per group), `value` (json), `type` (`string`/`text`/`boolean`/`json`/`media`), `is_public` |
| `setting_translations` | `id`, `setting_id`, `locale`, `value` |

**Konten** (semua + `is_active`, `sort_order`, `softDeletes`, `created_by`, `updated_by`)
| Tabel | Kolom Spesifik | Tabel Translation |
|---|---|---|
| `sections` | `key` (`hero`,`about`,`services`,…), `is_visible`, `sort_order` | `section_translations` (`eyebrow`, `heading`, `heading_highlight`, `subheading`) |
| `hero_sections` | `badge_icon`, `profile_media_id`, `primary_cta_url`, `secondary_cta_url`, `cv_media_id` | `hero_section_translations` (`badge`, `role`, `headline_line_1`, `headline_highlight`, `headline_stroke`, `description_prefix`, `description_strong`, `description_suffix`, `primary_cta_label`, `secondary_cta_label`, `trusted_prefix`, `trusted_strong`, `trusted_suffix`) |
| `hero_metrics` | `value`, `icon_name` | `hero_metric_translations` (`label`) |
| `about_sections` | `photo_media_id`, `location_lat`, `location_lng`, `primary_cta_url`, `secondary_cta_url` | `about_section_translations` (`location`, `headline`, `headline_highlight`, `bio_paragraph_1..3`, CTA labels) |
| `about_stats` | `value`, `icon_name` | `about_stat_translations` (`label`, `sublabel`) |
| `clients` | `name`, `logo_media_id`, `website_url`, `icon_name`, `font_class`, `is_featured` | `client_translations` (`description`) |
| `skill_categories` | `eyebrow`, `icon_name` | `skill_category_translations` (`name`) |
| `skills` | `category_id`, `name`, `icon_name`, `color_hex`, `proficiency` | — (nama teknis, tidak diterjemahkan) |
| `pain_points` | `icon_name` | `pain_point_translations` (`title`, `description`) |
| `services` | `icon_name`, `price_from`, `price_currency`, `duration_days`, `is_featured` | `service_translations` (`title`, `description`, `tags` json) |
| `service_stats` | `value`, `icon_name` | `service_stat_translations` (`unit`, `label`) |
| `project_categories` | `slug`, `color_hex` | `project_category_translations` (`name`) |
| `technologies` | `name`, `slug`, `icon_name`, `color_hex` | — |
| `projects` | `category_id`, `slug`, `cover_media_id`, `demo_url`, `github_url`, `client_name`, `year`, `is_featured`, `status` (`draft`/`published`), `published_at` | `project_translations` (`title`, `description`, `content`) |
| `project_technology` | `id`, `project_id`, `technology_id` | — |
| `project_media` | `id`, `project_id`, `media_id`, `sort_order` | — |
| `process_steps` | `icon_name`, `step_number` | `process_step_translations` (`title`, `description`) |
| `testimonials` | `project_id` (nullable), `avatar_media_id`, `screenshot_media_id`, `rating` (1–5), `accent_color`, `is_featured`, `source` (`whatsapp`/`email`/`manual`) | `testimonial_translations` (`name`, `role`, `company`, `project_label`, `feedback`) |
| `faq_categories` | `slug` | `faq_category_translations` (`name`) |
| `faqs` | `category_id` | `faq_translations` (`question`, `answer`) |
| `contact_channels` | `type` (`whatsapp`/`email`/`instagram`/`linkedin`/`github`/`custom`), `value`, `url`, `icon_name`, `color_hex` | `contact_channel_translations` (`label`) |
| `social_links` | `platform`, `url`, `icon_name`, `color_hex` | — |
| `navigation_menus` | `location` (`header`/`footer`), `parent_id`, `url`, `anchor`, `target` | `navigation_menu_translations` (`label`) |
| `contact_messages` | `name`, `email`, `phone`, `subject`, `message`, `status`, `internal_note`, `ip_address`, `user_agent`, `referrer`, `read_at`, `replied_at`, `handled_by` | — |
| `seo_settings` | `page_key`, `og_image_media_id`, `robots_directive`, `structured_data` (json) | `seo_setting_translations` (`meta_title`, `meta_description`, `meta_keywords`) |

### 5.3 Indexing & Performa
- Index pada `(is_active, sort_order)` untuk semua tabel konten.
- Index pada `(locale)` di semua tabel translations, unique `(parent_id, locale)`.
- Index `status, published_at` pada `projects`.
- Index `status, created_at` pada `contact_messages`.
- UUID disimpan sebagai `CHAR(36)`; gunakan **UUID v7 (ordered)** melalui `HasUuids` Laravel 12 agar index B-Tree tidak terfragmentasi.

---

## 6. Autentikasi & Keamanan

### 6.1 Alur Login 2FA (OTP 6 Digit via Email)

```
1. POST /api/v1/auth/login            { email, password }
   → validasi kredensial, cek lock
   → generate OTP 6 digit, simpan HASH (bcrypt) + expires_at (+10 menit)
   → kirim email (queued)
   → 200 { challenge_token, expires_at, masked_email }   [BELUM ada access token]

2. POST /api/v1/auth/two-factor/verify { challenge_token, code }
   → cek expired, cek attempts (max 5), hash_check
   → tandai consumed_at, reset failed attempts
   → 200 { access_token, token_type: "Bearer", user, permissions }

3. POST /api/v1/auth/two-factor/resend { challenge_token }
   → throttle: 1 request / 60 detik, max 3 kali per challenge

4. POST /api/v1/auth/logout           → revoke token
```

### 6.2 Kontrol Keamanan Wajib

| Kontrol | Implementasi |
|---|---|
| Input Validation | Form Request class per endpoint; `sometimes` untuk update; sanitasi HTML rich text via allowlist (`HTMLPurifier`) |
| Soft Delete | Trait `SoftDeletes` seluruh tabel konten + `Trash` UI |
| Password | `bcrypt` cost 12, minimal 12 karakter, cek `Password::defaults()->uncompromised()` |
| OTP | 6 digit numerik, disimpan sebagai hash, TTL 10 menit, single-use, max 5 percobaan |
| Rate Limit | Login 5/menit/IP, OTP verify 5/challenge, resend 3/challenge, contact form 3/jam/IP |
| Brute Force Lock | 5 kegagalan → `locked_until` +15 menit, notifikasi email |
| Token | Sanctum, expiry 8 jam, refresh via re-login; revoke saat ganti password |
| CORS | Whitelist domain frontend saja (`adiprimanto.com`, preview domain) |
| Headers | HSTS, `X-Content-Type-Options`, `X-Frame-Options: DENY`, CSP |
| Upload | Validasi MIME nyata (`finfo`), max 5 MB, ekstensi allowlist (`jpg,jpeg,png,webp,pdf,svg`), rename UUID, SVG disanitasi |
| Audit | Semua aksi mutasi tercatat di `activity_logs` |
| Contact Form | Honeypot field + hCaptcha/Turnstile + rate limit |
| Secret | Semua kredensial via `.env`, tanpa nilai default fallback |

### 6.3 Role & Permission Default

| Role | Kemampuan |
|---|---|
| **Super Admin** | Semua modul, kelola user & role, force delete, lihat audit log |
| **Admin** | Semua modul konten + inbox, tanpa kelola user/role/force delete |
| **Editor** | Create/update konten, tanpa delete & tanpa publish |

Format permission: `{module}.{action}` — contoh `projects.create`, `contact_messages.view`, `settings.update`.

---

## 7. Kontrak API

### 7.1 Konvensi
- Base path: `/api/v1`
- Public (tanpa auth, cacheable): `/api/v1/public/*`
- Admin (Bearer token): `/api/v1/admin/*`
- Locale: header `Accept-Language: id|en` atau query `?locale=id`
- Semua response snake_case, **Bahasa Inggris**.

**Sukses**
```json
{
  "success": true,
  "message": "Project created successfully.",
  "data": { "id": "0192f3c1-...", "title": "Sentraoto" },
  "meta": { "current_page": 1, "per_page": 15, "total": 42 }
}
```

**Validation Error (422)**
```json
{
  "success": false,
  "message": "The given data was invalid.",
  "errors": { "title": ["The title field is required."] }
}
```

### 7.2 Endpoint Publik (dikonsumsi Next.js)
| Method | Path | Keterangan |
|---|---|---|
| GET | `/public/landing` | **Agregat** seluruh data landing page dalam satu request (dipakai ISR) |
| GET | `/public/settings` | Site settings + contact channels + social links |
| GET | `/public/navigation?location=header` | Menu |
| GET | `/public/projects?category=&page=&per_page=` | List project published |
| GET | `/public/projects/{slug}` | Detail project |
| GET | `/public/testimonials` | Testimoni aktif |
| GET | `/public/services` · `/public/faqs` · `/public/skills` · `/public/process-steps` · `/public/clients` | Per-section |
| GET | `/public/seo/{page_key}` | Metadata + JSON-LD |
| POST | `/public/contact-messages` | Submit form kontak (rate-limited + captcha) |

### 7.3 Endpoint Admin (pola konsisten per modul)
| Method | Path |
|---|---|
| GET | `/admin/{module}` — list + search, filter, sort, paginate |
| POST | `/admin/{module}` |
| GET | `/admin/{module}/{id}` |
| PUT/PATCH | `/admin/{module}/{id}` |
| DELETE | `/admin/{module}/{id}` — soft delete |
| GET | `/admin/{module}/trashed` |
| POST | `/admin/{module}/{id}/restore` |
| DELETE | `/admin/{module}/{id}/force` — Super Admin |
| POST | `/admin/{module}/reorder` — payload `[{id, sort_order}]` |
| PATCH | `/admin/{module}/{id}/toggle-active` |

Modul tambahan: `/admin/dashboard/statistics`, `/admin/media`, `/admin/activity-logs`, `/admin/users`, `/admin/roles`, `/admin/contact-messages/{id}/status`.

### 7.4 Sinkronisasi Cache Frontend
Setiap mutasi konten yang berhasil memicu webhook ke Next.js:
```
POST {NEXT_REVALIDATE_URL}/api/revalidate
Header: X-Revalidate-Secret: <shared secret>
Body:   { "tags": ["landing", "projects"] }
```
Next.js memakai `fetch(..., { next: { tags: ['projects'], revalidate: 3600 } })` + `revalidateTag()`.

---

## 8. Admin Panel (TailAdmin v2.3)

### 8.1 Struktur Menu Sidebar
```
Dashboard
Content
 ├─ Hero Section          ├─ Pain Points
 ├─ About                 ├─ Services
 ├─ Skills & Tech Stack   ├─ Process Steps
 ├─ Portfolio ▸ Projects / Categories / Technologies
 ├─ Testimonials          ├─ FAQ ▸ Items / Categories
 └─ Clients & Brands
Inbox            (badge: jumlah pesan baru)
Media Library
Appearance ▸ Navigation Menu / Contact Channels / Social Links
Settings   ▸ General / SEO / Localization
System     ▸ Users / Roles & Permissions / Activity Log / Trash
```

### 8.2 Pola UI Standar
- **List page**: search bar, filter (status/kategori/locale), kolom sortable, drag handle untuk `sort_order`, toggle `is_active`, aksi row (Edit / Duplicate / Delete), bulk action, pagination, empty state, skeleton loading.
- **Form page**: tab per locale (ID | EN) dengan indikator kelengkapan, section field ter-grouping, media picker modal, validasi inline (mirror aturan Form Request), unsaved-changes guard, tombol Save / Save & Publish.
- **Toast Message** (wajib): posisi top-right, auto-dismiss 4s, varian `success` / `error` / `warning` / `info`, teks diambil dari `message` API. Delete memakai confirm dialog terlebih dahulu.
- **Dark mode** mengikuti TailAdmin, selaras dengan tema merah/gelap landing page.
- Setiap elemen interaktif memiliki `data-testid` (mis. `project-form-submit-button`).

### 8.3 Halaman Login
Langkah 1 (email + password) → Langkah 2 (6 input OTP dengan auto-focus & paste support, countdown expired, tombol Resend disabled 60s) → redirect Dashboard.

---

## 9. Perubahan pada Frontend Next.js

| Aksi | Detail |
|---|---|
| Hapus | `@supabase/supabase-js`, `app/lib/supabase.ts`, env `NEXT_PUBLIC_SUPABASE_*` |
| Tambah | `app/lib/api/client.ts` (typed fetch wrapper), `app/lib/api/types.ts` (generated dari API resource) |
| Refactor | `translations.ts` menjadi hanya *UI label statis*; semua konten diambil dari API dan diteruskan sebagai props |
| Refactor | `Portfolio.tsx` — `getCategory()` dihapus, kategori dari relasi DB; tags dari `technologies[]` |
| Refactor | `Contact.tsx` — submit ke `POST /api/v1/public/contact-messages` lalu (opsional) buka WhatsApp; tampilkan toast |
| Refactor | `layout.tsx` — `generateMetadata()` + JSON-LD dari `/public/seo/home` |
| Refactor | `sitemap.ts`, `robots.ts` — generate dari API |
| Tambah | Route group `(admin)` untuk TailAdmin, `middleware.ts` proteksi `/admin` |
| Tambah | `app/api/revalidate/route.ts` — on-demand revalidation |
| Rendering | Landing page = SSG + ISR (`revalidate: 3600`) + on-demand tag revalidation. Admin = CSR penuh. |
| Migrasi Data | Script Laravel `php artisan content:import-legacy` — seed dari `translations.ts` + array komponen + dump tabel Supabase `projects`; gambar dari `/public/portfolio`, `/public/testimoni`, avatar Unsplash → Media Library |
| Out of scope | `app/helda.tsx` & `/helda` tetap statis |

---

## 10. Roadmap & Milestone

| Fase | Cakupan | Estimasi |
|---|---|---|
| **F1 — Fondasi** | Setup Laravel 12, MySQL, base migration UUID + trait, `BaseModel`, `BaseController`, ApiResponse trait, exception handler, CORS, seeder role/permission/locale, skeleton TailAdmin + layout | 5 hari |
| **F2 — Auth & 2FA** | Login, OTP email, throttle, lock, Sanctum, role guard, halaman login 2 langkah, middleware `/admin` | 4 hari |
| **F3 — Core Content** | Media Library, Site Settings, Projects + Categories + Technologies, Testimonials, Services, FAQ (CRUD + trash + reorder + i18n tabs) | 8 hari |
| **F4 — Remaining Content** | Hero, About + Stats, Skills, Pain Points, Process, Clients, Navigation, Contact Channels, Social Links, SEO Settings | 6 hari |
| **F5 — Inbox & Audit** | Contact Messages inbox + notifikasi email + captcha, Activity Log, Users & Roles UI, Dashboard statistik | 5 hari |
| **F6 — Integrasi Frontend** | Hapus Supabase, API client, refactor 13 komponen, ISR + revalidate, metadata & JSON-LD dinamis, sitemap | 6 hari |
| **F7 — Migrasi & QA** | Import data legacy, uji regresi visual, Lighthouse, security review, E2E Playwright, dokumentasi & handover | 5 hari |

**Total estimasi: ± 39 hari kerja (≈ 8 minggu).**

---

## 11. Kriteria Penerimaan (Acceptance Criteria)

### Global
- [ ] Semua tabel memakai UUID sebagai Primary Key; tidak ada auto-increment.
- [ ] Seluruh identifier codebase dalam Bahasa Inggris (diverifikasi review + linter).
- [ ] Setiap endpoint mutasi memiliki Form Request class tersendiri; payload invalid mengembalikan 422 berformat standar.
- [ ] Semua tabel konten soft-deletable; item terhapus muncul di Trash dan dapat direstore.
- [ ] Setiap aksi admin menampilkan toast sukses/gagal.

### Autentikasi
- [ ] Login tanpa OTP tidak menghasilkan access token.
- [ ] OTP 6 digit kedaluwarsa dalam 10 menit dan hanya bisa dipakai sekali.
- [ ] 5 kegagalan login mengunci akun 15 menit.
- [ ] Editor tidak dapat mengakses endpoint delete (403).

### Konten & Frontend
- [ ] Semua 13 section landing page ter-render dari database, tanpa teks hardcoded.
- [ ] Perubahan konten di admin tampil di landing page < 60 detik (revalidate).
- [ ] Konten ID & EN dapat diedit independen; locale tanpa terjemahan fallback ke locale default.
- [ ] Lighthouse Performance ≥ 90 dan SEO ≥ 95 pada mobile.
- [ ] Submit form Contact tersimpan di Inbox + notifikasi email terkirim.
- [ ] Semua gambar dilayani dari Laravel Storage; tidak ada referensi Supabase/Unsplash yang tersisa.

---

## 12. Rekomendasi Perbaikan Arsitektur (Saran Tambahan)

| # | Rekomendasi | Alasan |
|---|---|---|
| R-01 | **UUID v7 (ordered)**, bukan v4 | Menghindari fragmentasi index B-Tree MySQL akibat UUID acak — dampak nyata pada tabel bervolume tinggi seperti `activity_logs` |
| R-02 | Endpoint agregat `GET /public/landing` | 13 section = 13 request menghancurkan TTFB; satu payload cached jauh lebih cepat |
| R-03 | Pola `settings` key-value + cast type | Menghindari migrasi setiap kali muncul field konfigurasi baru |
| R-04 | Simpan `icon_name` (string) + icon registry di frontend | Ikon berupa komponen React (`SiReact`, `lucide`) tidak bisa disimpan di DB; registry menjaga type-safety |
| R-05 | Fallback locale otomatis | Mencegah section kosong bila terjemahan EN belum lengkap |
| R-06 | `status` (`draft`/`published`) + `published_at`, bukan hanya `is_active` | Memungkinkan menyiapkan konten lebih dulu dan penjadwalan tayang |
| R-07 | Simpan `media_id` sebagai FK, bukan URL string | Mencegah broken image dan memungkinkan usage tracking sebelum hapus |
| R-08 | Konversi WebP + varian ukuran saat upload | Portfolio penuh gambar; ini penentu utama skor LCP |
| R-09 | Sanitasi rich text di sisi server (allowlist) | Field answer FAQ & bio adalah vektor XSS tersimpan |
| R-10 | Admin panel sebagai route group Next.js `(admin)` | Satu repo, satu deployment, satu design token; TailAdmin sudah berbasis Tailwind |
| R-11 | Rate limit + honeypot + Turnstile pada form kontak | Form publik tanpa proteksi akan dibanjiri spam bot dalam hitungan hari |
| R-12 | Backup MySQL harian + retensi 7 hari (`spatie/laravel-backup`) | Soft delete tidak melindungi dari kegagalan schema/server |

### Butuh Keputusan Lanjutan (Optional / Backlog P2)
1. **Modul Blog/Artikel** — signifikan untuk SEO organik, namun menambah ± 5 hari kerja.
2. **Preview Mode** — melihat draft di landing page sebelum publish (Next.js Draft Mode).
3. **Halaman `/helda`** — apakah nantinya juga dijadikan CMS-driven (saat ini out of scope, statis 1.544 baris).
4. **Analytics Dashboard** — integrasi Umami/Plausible untuk metrik kunjungan di dashboard admin.
5. **Notifikasi WhatsApp** untuk lead baru (via WhatsApp Cloud API) sebagai pelengkap email.

---

## 13. Struktur Direktori Target

```
adiprimanto-cms/
├─ backend/                          # Laravel 12
│  ├─ app/
│  │  ├─ Enums/                      # ProjectStatus, MessageStatus, MediaType
│  │  ├─ Http/
│  │  │  ├─ Controllers/Api/V1/
│  │  │  │  ├─ Admin/                # ProjectController, TestimonialController, ...
│  │  │  │  ├─ Auth/                 # LoginController, TwoFactorController
│  │  │  │  └─ Public/               # LandingController, ContactMessageController
│  │  │  ├─ Middleware/              # EnsureTwoFactorVerified, CheckPermission
│  │  │  ├─ Requests/                # StoreProjectRequest, UpdateProjectRequest, ...
│  │  │  └─ Resources/               # ProjectResource, TestimonialResource, ...
│  │  ├─ Models/                     # BaseModel (HasUuids + SoftDeletes + Translatable)
│  │  ├─ Models/Concerns/            # HasTranslations, HasSortOrder, LogsActivity
│  │  ├─ Services/                   # ProjectService, MediaService, TwoFactorService
│  │  ├─ Notifications/              # TwoFactorCodeNotification, NewContactMessage
│  │  └─ Support/                    # ApiResponse, RevalidateFrontend
│  ├─ database/migrations/
│  ├─ database/seeders/              # RoleSeeder, LocaleSeeder, LegacyContentSeeder
│  └─ routes/api.php
└─ frontend/                         # Next.js 16 (repo existing)
   ├─ app/
   │  ├─ (public)/                   # landing page existing
   │  ├─ (admin)/                    # TailAdmin v2.3
   │  ├─ api/revalidate/route.ts
   │  └─ lib/api/                    # client.ts, types.ts, endpoints.ts
   └─ components/ui/                 # Toast, MediaPicker, DataTable, LocaleTabs
```

---

## 14. Variabel Environment

**backend/.env**
```
APP_URL=
DB_CONNECTION=mysql
DB_HOST=
DB_PORT=
DB_DATABASE=
DB_USERNAME=
DB_PASSWORD=
MAIL_MAILER=smtp
MAIL_HOST=
MAIL_PORT=
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_FROM_ADDRESS=
TWO_FACTOR_CODE_TTL=600
TWO_FACTOR_MAX_ATTEMPTS=5
FILESYSTEM_DISK=public
SANCTUM_STATEFUL_DOMAINS=
FRONTEND_URL=
NEXT_REVALIDATE_URL=
NEXT_REVALIDATE_SECRET=
TURNSTILE_SECRET_KEY=
```

**frontend/.env**
```
NEXT_PUBLIC_API_BASE_URL=
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
REVALIDATE_SECRET=
```

---

*Dokumen ini adalah sumber kebenaran tunggal untuk pengembangan CMS. Setiap perubahan cakupan harus tercatat pada riwayat revisi.*

---

## 15. Riwayat Implementasi

### Fase F1 — Fondasi ✅ SELESAI (2026-06)

**Environment**: PHP 8.2.33, Composer 2.10, Laravel 12.68, MariaDB 10.11 (database `adiprimanto_cms`).

**Restrukturisasi repo**: Next.js dipindah dari `/app` ke `/app/frontend`; Laravel dibuat di `/app/backend`.
Dua import `react-icons` yang sudah usang diperbaiki (`SiCss3` → `SiCss`, `SiNuxtdotjs` → `SiNuxt`)
agar `next build` lolos.

**Yang dibangun**:
- `BaseModel` (UUID v7 + SoftDeletes + Blameable + LogsActivity) dan `BaseTranslationModel`
- Trait `HasTranslations` (1 baris per locale + fallback), `HasSortOrder`, `LogsActivity`, `Blameable`
- Pivot model UUID (`RolePermission`, `RoleUser`) agar `sync()`/`attach()` tetap menghasilkan UUID
- `ApiResponse` (envelope success/created/error/paginated) + `ApiExceptionRenderer` (422/401/403/404/500)
- `BaseApiController`, `BaseFormRequest`, middleware `CheckPermission` & `ForceJsonResponse`, `config/cors.php`
- Enum `ModuleKey`, `PermissionAction`, `RoleSlug` sebagai sumber kebenaran matriks permission
- Migrasi: users, roles, permissions, role_permission, role_user, two_factor_codes, activity_logs,
  locales, settings, setting_translations, personal_access_tokens (uuidMorphs)
- Seeder: 128 permission, 3 role (super-admin 128 / admin 97 / editor 54), 2 locale (default `id`),
  15 setting, 1 admin Super Admin — semuanya idempoten
- Endpoint `GET /api/v1/health`
- Supervisor: program `laravel` (port 8001) + `mariadb`

**Pengecualian terdokumentasi**: tabel infrastruktur framework (`cache`, `cache_locks`, `jobs`,
`job_batches`, `failed_jobs`, `sessions`, `password_reset_tokens`, `migrations`) tetap memakai
skema bawaan Laravel tanpa UUID.

**Hasil pengujian**: 32 test case, 100% lolos, tanpa temuan (`/app/test_reports/iteration_1.json`).

**Catatan untuk F4**: `setting_translations` masih kosong; terjemahan default id/en akan diisi
saat modul Site Settings dibangun.

### Fase F2 — Autentikasi & 2FA ✅ SELESAI (2026-06)

**Alur login dua langkah** (langkah 1 tidak pernah mengembalikan access token):

| Method | Path | Throttle |
|---|---|---|
| POST | `/api/v1/auth/login` | 5/menit per email+IP |
| POST | `/api/v1/auth/two-factor/verify` | 10/menit per challenge+IP |
| POST | `/api/v1/auth/two-factor/resend` | 3/menit per challenge+IP |
| GET | `/api/v1/auth/me` | `auth:sanctum` |
| POST | `/api/v1/auth/logout` | `auth:sanctum` |
| POST | `/api/v1/auth/logout-all` | `auth:sanctum` |

**Kontrol keamanan yang aktif**:
- OTP 6 digit disimpan sebagai bcrypt hash, TTL 10 menit, sekali pakai (`consumed_at`)
- Maksimal 5 percobaan OTP per challenge; challenge dihancurkan setelah habis
- Resend maksimal 3 kali dengan cooldown 60 detik; `challenge_token` tetap sama, kode dirotasi
- Penguncian akun otomatis: 5 password salah → terkunci 15 menit (HTTP 423), password benar
  pun tetap ditolak selama terkunci; counter direset setelah password benar
- Proteksi account enumeration: email tidak dikenal tetap melewati bcrypt dummy hash dan
  mengembalikan pesan generik yang sama
- Akun non-aktif ditolak 403; token Sanctum PK UUID dengan masa berlaku 8 jam
- Seluruh event auth tercatat di `activity_logs` dengan prefix `auth.*` (enum `AuthEvent`)

**Berkas kunci**: `AuthenticationService`, `TwoFactorService`, `TwoFactorCode`,
`LoginController` / `TwoFactorController` / `SessionController`, 3 Form Request di
`app/Http/Requests/Auth`, `AuthenticationFailedException`, `AuthActivityLogger`,
`TwoFactorCodeNotification` (queued), `config/two_factor.php`, rate limiter bernama di
`AppServiceProvider`.

**Perbaikan yang diperlukan selama fase ini**:
1. `ADMIN_PASSWORD` di `.env` wajib dikutip karena mengandung `#` (tanpa kutip nilainya terpotong
   dan password hasil seed jadi salah).
2. Signature callback rate limiter Laravel 12 adalah `fn (Request, array $headers)`, bukan integer —
   sebelumnya menyebabkan HTTP 500 alih-alih 429.
3. `ApiExceptionRenderer` harus meneruskan `HttpResponseException` ke framework, jika tidak
   respons 429 dari throttle akan tertangkap sebagai 500.
4. `trustProxies(at: '*')` wajib diaktifkan: tanpa itu ingress platform mengirim IP proxy yang
   berubah-ubah sehingga rate limiter dan audit log mencatat IP yang salah.

**Infrastruktur**: supervisor program `laravel-queue` ditambahkan untuk memproses pengiriman
email OTP (`MAIL_MAILER=log` di lingkungan preview, kode tampil di `storage/logs/laravel.log`).

**Hasil pengujian**: 18/18 test case F2 lolos + 32/32 regresi F1
(`/app/test_reports/iteration_2.json`, `backend/tests/pytest/test_phase_f2_auth.py`).
