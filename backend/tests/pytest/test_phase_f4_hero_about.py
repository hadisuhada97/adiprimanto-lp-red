"""Phase F4 part 1 backend tests — Hero section + metrics, About section + stats,
public hero/about API and Editor permission boundaries.
"""

import os

import pytest
import requests
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
raw = os.environ.get("NEXT_PUBLIC_API_BASE_URL") or frontend_env.get("NEXT_PUBLIC_API_BASE_URL")
if not raw:
    raise RuntimeError("NEXT_PUBLIC_API_BASE_URL missing from /app/frontend/.env")
API = raw.rstrip("/")

SUPER_ADMIN = ("shell.test@adiprimanto.com", "ShellTester#2026")
EDITOR = ("editor.test@adiprimanto.com", "EditorTest#2026")


# ---------------------------------------------------------------- helpers
def _login(email, password):
    s = requests.Session()
    s.headers.update({"Accept": "application/json"})
    r = s.post(f"{API}/auth/login", json={"email": email, "password": password}, timeout=30)
    assert r.status_code == 200, f"login {email} -> {r.status_code} {r.text[:300]}"
    data = r.json().get("data", {})
    token = data.get("token") or data.get("access_token")
    assert token, f"no access token for {email}: {r.text[:300]}"
    s.headers.update({"Authorization": f"Bearer {token}"})
    return s


@pytest.fixture(scope="session")
def admin():
    return _login(*SUPER_ADMIN)


@pytest.fixture(scope="session")
def editor():
    return _login(*EDITOR)


@pytest.fixture(scope="session")
def anon():
    s = requests.Session()
    s.headers.update({"Accept": "application/json"})
    return s


def data_of(response):
    body = response.json()
    assert body.get("success") is not False, body
    return body["data"]


# ---------------------------------------------------------------- Hero section (singleton)
class TestHeroSection:
    def test_show_seeded_content(self, admin):
        r = admin.get(f"{API}/admin/hero", timeout=30)
        assert r.status_code == 200, r.text[:300]
        hero = data_of(r)
        assert "_id" not in hero
        for key in ("id", "badge_icon", "primary_cta_url", "secondary_cta_url",
                    "is_active", "content", "translations"):
            assert key in hero, f"missing {key}"
        assert hero["translations"]["id"]["badge"] == "Jasa Website & Mobile App"
        assert hero["translations"]["en"]["badge"] == "Website & Mobile App Services"
        # default locale is id
        assert hero["content"]["badge"] == hero["translations"]["id"]["badge"]

    def test_update_en_only_keeps_id_copy(self, admin):
        before = data_of(admin.get(f"{API}/admin/hero", timeout=30))
        id_badge = before["translations"]["id"]["badge"]

        r = admin.put(f"{API}/admin/hero", json={
            "translations": {"en": {"badge": "TEST_EN Badge F4"}},
        }, timeout=30)
        assert r.status_code == 200, r.text[:400]
        after = data_of(r)
        assert after["translations"]["en"]["badge"] == "TEST_EN Badge F4"
        assert after["translations"]["id"]["badge"] == id_badge, "ID copy was lost when saving EN only"

        # persisted?
        again = data_of(admin.get(f"{API}/admin/hero", timeout=30))
        assert again["translations"]["en"]["badge"] == "TEST_EN Badge F4"
        assert again["translations"]["id"]["badge"] == id_badge

        # restore seeded EN value
        admin.put(f"{API}/admin/hero", json={
            "translations": {"en": {"badge": before["translations"]["en"]["badge"]}},
        }, timeout=30)

    def test_update_media_links_and_visibility(self, admin):
        before = data_of(admin.get(f"{API}/admin/hero", timeout=30))
        payload = {
            "badge_icon": "Rocket",
            "primary_cta_url": "https://example.test/cv.pdf",
            "secondary_cta_url": "https://example.test/contact",
            "is_active": False,
        }
        r = admin.put(f"{API}/admin/hero", json=payload, timeout=30)
        assert r.status_code == 200, r.text[:400]
        after = data_of(r)
        for k, v in payload.items():
            assert after[k] == v, f"{k} not saved: {after[k]!r}"

        again = data_of(admin.get(f"{API}/admin/hero", timeout=30))
        for k, v in payload.items():
            assert again[k] == v, f"{k} not persisted"

        restore = {k: before[k] for k in payload}
        restore["is_active"] = True
        r = admin.put(f"{API}/admin/hero", json=restore, timeout=30)
        assert r.status_code == 200
        assert data_of(r)["is_active"] is True

    def test_invalid_profile_media_id(self, admin):
        r = admin.put(f"{API}/admin/hero", json={"profile_media_id": "not-a-uuid"}, timeout=30)
        assert r.status_code == 422, f"{r.status_code} {r.text[:300]}"
        assert "profile_media_id" in r.json().get("errors", {})


# ---------------------------------------------------------------- Hero metrics
class TestHeroMetrics:
    created_id = None

    def test_list_seeded(self, admin):
        r = admin.get(f"{API}/admin/hero-metrics", timeout=30)
        assert r.status_code == 200, r.text[:300]
        items = data_of(r)
        assert len(items) >= 3, f"expected >=3 seeded metrics, got {len(items)}"
        values = [i["value"] for i in items]
        for expected in ("98+", "↑ 32%", "A"):
            assert expected in values, f"seeded metric {expected} missing from {values}"
        first = items[0]
        for key in ("id", "value", "icon_name", "color_hex", "label", "translations",
                    "is_active", "sort_order"):
            assert key in first
        assert items == sorted(items, key=lambda i: i["sort_order"]), "not returned in sort order"

    def test_validation_empty_payload(self, admin):
        r = admin.post(f"{API}/admin/hero-metrics", json={}, timeout=30)
        assert r.status_code == 422, f"{r.status_code} {r.text[:300]}"
        errors = r.json().get("errors", {})
        assert "value" in errors and "translations" in errors, errors

    def test_validation_bad_color(self, admin):
        r = admin.post(f"{API}/admin/hero-metrics", json={
            "value": "10", "color_hex": "red",
            "translations": {"id": {"label": "TEST_Label"}},
        }, timeout=30)
        assert r.status_code == 422, f"{r.status_code} {r.text[:300]}"
        msg = str(r.json().get("errors", {}).get("color_hex"))
        assert "hex value" in msg, msg

    def test_create(self, admin):
        r = admin.post(f"{API}/admin/hero-metrics", json={
            "value": "TEST_42",
            "icon_name": "Gauge",
            "color_hex": "#22c55e",
            "translations": {
                "id": {"label": "TEST_Metrik Baru"},
                "en": {"label": "TEST_New Metric"},
            },
        }, timeout=30)
        assert r.status_code == 201, f"{r.status_code} {r.text[:400]}"
        metric = data_of(r)
        TestHeroMetrics.created_id = metric["id"]
        assert metric["value"] == "TEST_42"
        assert metric["color_hex"] == "#22c55e"
        assert metric["translations"]["id"]["label"] == "TEST_Metrik Baru"
        assert metric["translations"]["en"]["label"] == "TEST_New Metric"
        assert metric["is_active"] is True

        listed = data_of(admin.get(f"{API}/admin/hero-metrics", timeout=30))
        assert metric["id"] in [i["id"] for i in listed]

    def test_update(self, admin):
        mid = TestHeroMetrics.created_id
        assert mid, "create test must run first"
        r = admin.put(f"{API}/admin/hero-metrics/{mid}", json={
            "value": "TEST_99",
            "icon_name": "Zap",
            "color_hex": "#eab308",
            "translations": {"id": {"label": "TEST_Metrik Ubah"}, "en": {"label": "TEST_Edited"}},
        }, timeout=30)
        assert r.status_code == 200, r.text[:400]
        updated = data_of(r)
        assert updated["value"] == "TEST_99"
        assert updated["translations"]["en"]["label"] == "TEST_Edited"

        listed = data_of(admin.get(f"{API}/admin/hero-metrics", timeout=30))
        found = next(i for i in listed if i["id"] == mid)
        assert found["value"] == "TEST_99"
        assert found["color_hex"] == "#eab308"

    def test_toggle_active(self, admin):
        mid = TestHeroMetrics.created_id
        r = admin.patch(f"{API}/admin/hero-metrics/{mid}/toggle-active", timeout=30)
        assert r.status_code == 200, r.text[:300]
        assert data_of(r)["is_active"] is False
        listed = data_of(admin.get(f"{API}/admin/hero-metrics", timeout=30))
        assert next(i for i in listed if i["id"] == mid)["is_active"] is False
        # inactive metric must be hidden from public API
        pub = data_of(requests.get(f"{API}/public/hero", timeout=30))
        assert mid not in [m["id"] for m in pub["metrics"]], "inactive metric exposed publicly"
        admin.patch(f"{API}/admin/hero-metrics/{mid}/toggle-active", timeout=30)

    def test_reorder(self, admin):
        items = data_of(admin.get(f"{API}/admin/hero-metrics", timeout=30))
        assert len(items) >= 2
        ids = [i["id"] for i in items]
        swapped = [ids[1], ids[0]] + ids[2:]
        r = admin.post(f"{API}/admin/hero-metrics/reorder", json={
            "items": [{"id": i, "sort_order": idx} for idx, i in enumerate(swapped)],
        }, timeout=30)
        assert r.status_code == 200, r.text[:300]
        after = [i["id"] for i in data_of(admin.get(f"{API}/admin/hero-metrics", timeout=30))]
        assert after == swapped, f"order not persisted: {after} != {swapped}"
        # restore
        admin.post(f"{API}/admin/hero-metrics/reorder", json={
            "items": [{"id": i, "sort_order": idx} for idx, i in enumerate(ids)],
        }, timeout=30)

    def test_trash_restore_force(self, admin):
        mid = TestHeroMetrics.created_id
        r = admin.delete(f"{API}/admin/hero-metrics/{mid}", timeout=30)
        assert r.status_code == 200, r.text[:300]
        active = [i["id"] for i in data_of(admin.get(f"{API}/admin/hero-metrics", timeout=30))]
        assert mid not in active
        trashed = data_of(admin.get(f"{API}/admin/hero-metrics", params={"trashed": 1}, timeout=30))
        assert mid in [i["id"] for i in trashed]

        r = admin.post(f"{API}/admin/hero-metrics/{mid}/restore", timeout=30)
        assert r.status_code == 200, r.text[:300]
        assert mid in [i["id"] for i in data_of(admin.get(f"{API}/admin/hero-metrics", timeout=30))]

        # trash again + force delete (cleanup)
        admin.delete(f"{API}/admin/hero-metrics/{mid}", timeout=30)
        r = admin.delete(f"{API}/admin/hero-metrics/{mid}/force", timeout=30)
        assert r.status_code == 200, r.text[:300]
        trashed = data_of(admin.get(f"{API}/admin/hero-metrics", params={"trashed": 1}, timeout=30))
        assert mid not in [i["id"] for i in trashed], "force delete did not remove the metric"


# ---------------------------------------------------------------- About section (singleton)
class TestAboutSection:
    def test_show_seeded_content(self, admin):
        r = admin.get(f"{API}/admin/about", timeout=30)
        assert r.status_code == 200, r.text[:300]
        about = data_of(r)
        assert "_id" not in about
        for key in ("id", "location_lat", "location_lng", "primary_cta_url",
                    "secondary_cta_url", "is_active", "content", "translations"):
            assert key in about
        assert about["translations"]["id"]["eyebrow"] == "TENTANG SAYA"
        assert about["translations"]["en"]["eyebrow"] == "ABOUT ME"
        for field in ("bio_paragraph_1", "bio_paragraph_2", "bio_paragraph_3"):
            assert about["translations"]["id"][field], f"seeded {field} empty"
        assert about["content"]["headline"] == about["translations"]["id"]["headline"]

    def test_update_and_persist(self, admin):
        before = data_of(admin.get(f"{API}/admin/about", timeout=30))
        payload = {
            "location_lat": -6.2,
            "location_lng": 106.81,
            "primary_cta_url": "https://example.test/contact",
            "secondary_cta_url": "https://example.test/portfolio",
            "is_active": False,
            "translations": {"id": {"eyebrow": "TEST_TENTANG"}},
        }
        r = admin.put(f"{API}/admin/about", json=payload, timeout=30)
        assert r.status_code == 200, r.text[:400]
        after = data_of(r)
        assert float(after["location_lat"]) == -6.2
        assert float(after["location_lng"]) == 106.81
        assert after["primary_cta_url"] == payload["primary_cta_url"]
        assert after["is_active"] is False
        assert after["translations"]["id"]["eyebrow"] == "TEST_TENTANG"
        assert after["translations"]["en"]["eyebrow"] == "ABOUT ME", "EN copy lost"

        again = data_of(admin.get(f"{API}/admin/about", timeout=30))
        assert again["translations"]["id"]["eyebrow"] == "TEST_TENTANG"
        assert again["is_active"] is False

        # restore
        r = admin.put(f"{API}/admin/about", json={
            "location_lat": before["location_lat"],
            "location_lng": before["location_lng"],
            "primary_cta_url": before["primary_cta_url"],
            "secondary_cta_url": before["secondary_cta_url"],
            "is_active": True,
            "translations": {"id": {"eyebrow": before["translations"]["id"]["eyebrow"]}},
        }, timeout=30)
        assert r.status_code == 200
        assert data_of(r)["is_active"] is True

    def test_invalid_latitude(self, admin):
        r = admin.put(f"{API}/admin/about", json={"location_lat": 200}, timeout=30)
        assert r.status_code == 422, f"{r.status_code} {r.text[:300]}"
        assert "location_lat" in r.json().get("errors", {})

    def test_invalid_longitude(self, admin):
        r = admin.put(f"{API}/admin/about", json={"location_lng": -500}, timeout=30)
        assert r.status_code == 422, f"{r.status_code} {r.text[:300]}"
        assert "location_lng" in r.json().get("errors", {})


# ---------------------------------------------------------------- About stats
class TestAboutStats:
    created_id = None

    def test_list_seeded(self, admin):
        r = admin.get(f"{API}/admin/about-stats", timeout=30)
        assert r.status_code == 200, r.text[:300]
        items = data_of(r)
        assert len(items) >= 3, f"expected >=3 seeded stats, got {len(items)}"
        values = [i["value"] for i in items]
        for expected in ("5+", "30+", "100%"):
            assert expected in values, f"{expected} missing from {values}"
        first = items[0]
        for key in ("id", "value", "label", "sublabel", "translations", "is_active", "sort_order"):
            assert key in first, f"missing {key}"
        assert items == sorted(items, key=lambda i: i["sort_order"])

    def test_validation_empty_payload(self, admin):
        r = admin.post(f"{API}/admin/about-stats", json={}, timeout=30)
        assert r.status_code == 422, f"{r.status_code} {r.text[:300]}"
        errors = r.json().get("errors", {})
        assert "value" in errors and "translations" in errors, errors

    def test_create(self, admin):
        r = admin.post(f"{API}/admin/about-stats", json={
            "value": "TEST_7+",
            "icon_name": "Award",
            "translations": {
                "id": {"label": "TEST_Penghargaan", "sublabel": "TEST_sub id"},
                "en": {"label": "TEST_Awards", "sublabel": "TEST_sub en"},
            },
        }, timeout=30)
        assert r.status_code == 201, f"{r.status_code} {r.text[:400]}"
        stat = data_of(r)
        TestAboutStats.created_id = stat["id"]
        assert stat["value"] == "TEST_7+"
        assert stat["translations"]["en"]["label"] == "TEST_Awards"
        assert stat["translations"]["id"]["sublabel"] == "TEST_sub id"

    def test_update(self, admin):
        sid = TestAboutStats.created_id
        assert sid
        r = admin.put(f"{API}/admin/about-stats/{sid}", json={
            "value": "TEST_8+",
            "translations": {"id": {"label": "TEST_Ubah", "sublabel": "TEST_ubah sub"}},
        }, timeout=30)
        assert r.status_code == 200, r.text[:400]
        assert data_of(r)["value"] == "TEST_8+"
        listed = data_of(admin.get(f"{API}/admin/about-stats", timeout=30))
        assert next(i for i in listed if i["id"] == sid)["value"] == "TEST_8+"

    def test_toggle_active_and_public_visibility(self, admin):
        sid = TestAboutStats.created_id
        r = admin.patch(f"{API}/admin/about-stats/{sid}/toggle-active", timeout=30)
        assert r.status_code == 200, r.text[:300]
        assert data_of(r)["is_active"] is False
        pub = data_of(requests.get(f"{API}/public/about", timeout=30))
        assert sid not in [s["id"] for s in pub["stats"]], "inactive stat exposed publicly"
        admin.patch(f"{API}/admin/about-stats/{sid}/toggle-active", timeout=30)

    def test_reorder(self, admin):
        items = data_of(admin.get(f"{API}/admin/about-stats", timeout=30))
        ids = [i["id"] for i in items]
        swapped = [ids[1], ids[0]] + ids[2:]
        r = admin.post(f"{API}/admin/about-stats/reorder", json={
            "items": [{"id": i, "sort_order": idx} for idx, i in enumerate(swapped)],
        }, timeout=30)
        assert r.status_code == 200, r.text[:300]
        after = [i["id"] for i in data_of(admin.get(f"{API}/admin/about-stats", timeout=30))]
        assert after == swapped
        admin.post(f"{API}/admin/about-stats/reorder", json={
            "items": [{"id": i, "sort_order": idx} for idx, i in enumerate(ids)],
        }, timeout=30)

    def test_trash_restore_force(self, admin):
        sid = TestAboutStats.created_id
        assert admin.delete(f"{API}/admin/about-stats/{sid}", timeout=30).status_code == 200
        assert sid not in [i["id"] for i in data_of(admin.get(f"{API}/admin/about-stats", timeout=30))]
        trashed = data_of(admin.get(f"{API}/admin/about-stats", params={"trashed": 1}, timeout=30))
        assert sid in [i["id"] for i in trashed]
        assert admin.post(f"{API}/admin/about-stats/{sid}/restore", timeout=30).status_code == 200
        assert sid in [i["id"] for i in data_of(admin.get(f"{API}/admin/about-stats", timeout=30))]

        admin.delete(f"{API}/admin/about-stats/{sid}", timeout=30)
        assert admin.delete(f"{API}/admin/about-stats/{sid}/force", timeout=30).status_code == 200
        trashed = data_of(admin.get(f"{API}/admin/about-stats", params={"trashed": 1}, timeout=30))
        assert sid not in [i["id"] for i in trashed]


# ---------------------------------------------------------------- Public API (no auth)
class TestPublicHeroAbout:
    def test_public_hero_default_locale_id(self, anon):
        r = anon.get(f"{API}/public/hero", timeout=30)
        assert r.status_code == 200, r.text[:300]
        payload = data_of(r)
        assert payload["hero"] is not None
        assert payload["hero"]["content"]["badge"] == "Jasa Website & Mobile App"
        metrics = payload["metrics"]
        assert len(metrics) >= 3
        assert all(m["is_active"] for m in metrics), "public hero returned inactive metrics"
        assert [m["sort_order"] for m in metrics] == sorted(m["sort_order"] for m in metrics)
        assert metrics[0]["label"], "metric label empty on default locale"

    def test_public_hero_en(self, anon):
        r = anon.get(f"{API}/public/hero", params={"locale": "en"}, timeout=30)
        assert r.status_code == 200
        payload = data_of(r)
        assert payload["hero"]["content"]["badge"] == "Website & Mobile App Services"
        labels = [m["label"] for m in payload["metrics"]]
        assert "Page Speed" in labels, labels

    def test_public_about_default_locale_id(self, anon):
        r = anon.get(f"{API}/public/about", timeout=30)
        assert r.status_code == 200, r.text[:300]
        payload = data_of(r)
        assert payload["about"]["content"]["eyebrow"] == "TENTANG SAYA"
        stats = payload["stats"]
        assert len(stats) >= 3
        assert all(s["is_active"] for s in stats)
        assert [s["sort_order"] for s in stats] == sorted(s["sort_order"] for s in stats)

    def test_public_about_en(self, anon):
        r = anon.get(f"{API}/public/about", params={"locale": "en"}, timeout=30)
        assert r.status_code == 200
        payload = data_of(r)
        assert payload["about"]["content"]["eyebrow"] == "ABOUT ME"
        assert payload["about"]["content"]["primary_cta_label"] == "Contact Me"

    def test_public_invalid_locale_falls_back(self, anon):
        r = anon.get(f"{API}/public/hero", params={"locale": "zz"}, timeout=30)
        assert r.status_code == 200
        assert data_of(r)["hero"]["content"]["badge"] == "Jasa Website & Mobile App"

    def test_admin_endpoints_require_auth(self, anon):
        for path in ("admin/hero", "admin/hero-metrics", "admin/about", "admin/about-stats"):
            r = anon.get(f"{API}/{path}", timeout=30)
            assert r.status_code == 401, f"{path} -> {r.status_code}"


# ---------------------------------------------------------------- Editor permissions
class TestEditorPermissions:
    def test_editor_can_view_and_save(self, editor):
        assert editor.get(f"{API}/admin/hero", timeout=30).status_code == 200
        assert editor.get(f"{API}/admin/about", timeout=30).status_code == 200
        r = editor.put(f"{API}/admin/hero", json={"badge_icon": "Sparkles"}, timeout=30)
        assert r.status_code == 200, f"{r.status_code} {r.text[:300]}"
        r = editor.put(f"{API}/admin/about", json={"is_active": True}, timeout=30)
        assert r.status_code == 200, f"{r.status_code} {r.text[:300]}"

    def test_editor_forbidden_force_delete(self, editor, admin):
        metric = data_of(admin.get(f"{API}/admin/hero-metrics", timeout=30))[0]
        stat = data_of(admin.get(f"{API}/admin/about-stats", timeout=30))[0]

        r = editor.delete(f"{API}/admin/hero-metrics/{metric['id']}/force", timeout=30)
        assert r.status_code == 403, f"hero-metric force -> {r.status_code} {r.text[:200]}"
        r = editor.delete(f"{API}/admin/about-stats/{stat['id']}/force", timeout=30)
        assert r.status_code == 403, f"about-stat force -> {r.status_code} {r.text[:200]}"

        # seeded rows must still be intact
        assert metric["id"] in [i["id"] for i in data_of(admin.get(f"{API}/admin/hero-metrics", timeout=30))]
        assert stat["id"] in [i["id"] for i in data_of(admin.get(f"{API}/admin/about-stats", timeout=30))]


# ---------------------------------------------------------------- Light F3 regression
class TestF3Regression:
    @pytest.mark.parametrize("path", [
        "admin/testimonials", "admin/services", "admin/service-stats",
        "admin/faqs", "admin/faq-categories", "admin/settings",
    ])
    def test_f3_endpoints_still_ok(self, admin, path):
        r = admin.get(f"{API}/{path}", timeout=30)
        assert r.status_code == 200, f"{path} -> {r.status_code} {r.text[:200]}"
        data_of(r)
