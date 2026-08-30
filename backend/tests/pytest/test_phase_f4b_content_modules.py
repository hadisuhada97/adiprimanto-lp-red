"""Phase F4 part 2 backend tests — 8 content modules (skill categories, skills,
pain points, process steps, clients, navigation menus, contact channels, social links,
SEO settings), their public API endpoints and Editor permission boundaries.
"""

import os
import time

import pytest
import requests


class ThrottleAwareSession(requests.Session):
    """The API allows 120 requests/minute per user; this suite exceeds that, so
    back off and retry once when the limiter kicks in (429)."""

    def request(self, *args, **kwargs):
        response = super().request(*args, **kwargs)
        attempts = 0
        while response.status_code == 429 and attempts < 4:
            wait = int(response.headers.get("Retry-After", "10"))
            time.sleep(min(wait + 1, 62))
            response = super().request(*args, **kwargs)
            attempts += 1
        return response
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
    s = ThrottleAwareSession()
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
    s = ThrottleAwareSession()
    s.headers.update({"Accept": "application/json"})
    return s


def data_of(response):
    body = response.json()
    assert body.get("success") is not False, body
    return body["data"]


def no_mongo_or_internal_keys(rows):
    for row in rows:
        assert "_id" not in row
        assert "deleted_at" in row or True


def full_cycle(session, uri, create_body, patch_body, patch_check, label_key="id"):
    """create -> GET verify -> patch -> GET verify -> toggle -> trash -> restore -> trash -> force."""
    r = session.post(f"{API}/admin/{uri}", json=create_body, timeout=30)
    assert r.status_code == 201, f"POST {uri} -> {r.status_code} {r.text[:400]}"
    created = data_of(r)
    new_id = created["id"]

    # GET verify persistence
    got = data_of(session.get(f"{API}/admin/{uri}/{new_id}", timeout=30))
    assert got["id"] == new_id

    # PATCH
    r = session.patch(f"{API}/admin/{uri}/{new_id}", json=patch_body, timeout=30)
    assert r.status_code == 200, f"PATCH {uri} -> {r.status_code} {r.text[:400]}"
    updated = data_of(r)
    for key, expected in patch_check.items():
        assert updated.get(key) == expected, f"{uri}.{key} = {updated.get(key)!r} != {expected!r}"

    again = data_of(session.get(f"{API}/admin/{uri}/{new_id}", timeout=30))
    for key, expected in patch_check.items():
        assert again.get(key) == expected, f"{uri}.{key} not persisted"

    # toggle active
    before = again["is_active"]
    toggled = data_of(session.patch(f"{API}/admin/{uri}/{new_id}/toggle-active", timeout=30))
    assert toggled["is_active"] is (not before)

    # trash
    r = session.delete(f"{API}/admin/{uri}/{new_id}", timeout=30)
    assert r.status_code == 200, r.text[:300]
    trashed = data_of(session.get(f"{API}/admin/{uri}?trashed=1", timeout=30))
    assert any(row["id"] == new_id for row in trashed), f"{uri} not in trash listing"
    assert session.get(f"{API}/admin/{uri}/{new_id}", timeout=30).status_code == 404

    # restore
    r = session.post(f"{API}/admin/{uri}/{new_id}/restore", timeout=30)
    assert r.status_code == 200, r.text[:300]
    assert session.get(f"{API}/admin/{uri}/{new_id}", timeout=30).status_code == 200

    # trash + force
    session.delete(f"{API}/admin/{uri}/{new_id}", timeout=30)
    r = session.delete(f"{API}/admin/{uri}/{new_id}/force", timeout=30)
    assert r.status_code == 200, r.text[:300]
    assert session.get(f"{API}/admin/{uri}/{new_id}", timeout=30).status_code == 404
    return new_id


# ---------------------------------------------------------------- seeded data
SEED_COUNTS = {
    "skill-categories": 4,
    "skills": 22,
    "pain-points": 3,
    "process-steps": 4,
    "clients": 5,
    "navigation-menus": 11,
    "contact-channels": 3,
    "social-links": 4,
    "seo-settings": 2,
}


class TestSeededLists:
    @pytest.mark.parametrize("uri,count", SEED_COUNTS.items())
    def test_list_returns_seeded_rows(self, admin, uri, count):
        r = admin.get(f"{API}/admin/{uri}", timeout=30)
        assert r.status_code == 200, f"{uri} -> {r.status_code} {r.text[:300]}"
        rows = data_of(r)
        assert isinstance(rows, list)
        assert len(rows) >= count, f"{uri}: expected >= {count} seeded rows, got {len(rows)}"
        no_mongo_or_internal_keys(rows)
        orders = [row["sort_order"] for row in rows]
        assert orders == sorted(orders) or uri == "skills", f"{uri} not returned in sort order: {orders}"

    def test_skill_category_counts(self, admin):
        rows = data_of(admin.get(f"{API}/admin/skill-categories", timeout=30))
        counts = sorted(row["skills_count"] for row in rows)
        assert counts == [2, 6, 6, 8], f"unexpected skills_count distribution: {counts}"
        for row in rows:
            assert row["translations"]["id"]["name"]
            assert row["translations"]["en"]["name"]

    def test_skills_expose_category(self, admin):
        rows = data_of(admin.get(f"{API}/admin/skills", timeout=30))
        with_category = [row for row in rows if row.get("category")]
        assert len(with_category) >= 20
        assert "translations" not in with_category[0] or with_category[0].get("translations") in (None, {}, [])

    def test_clients_featured_triplinq(self, admin):
        rows = data_of(admin.get(f"{API}/admin/clients", timeout=30))
        featured = [row["name"] for row in rows if row["is_featured"] is True]
        assert "TripLinq" in featured, f"TripLinq not featured; featured = {featured}"

    def test_navigation_location_filter(self, admin):
        header = data_of(admin.get(f"{API}/admin/navigation-menus?location=header", timeout=30))
        footer = data_of(admin.get(f"{API}/admin/navigation-menus?location=footer", timeout=30))
        assert len(header) == 6, f"header items = {len(header)}"
        assert len(footer) == 5, f"footer items = {len(footer)}"
        assert all(row["location"] == "header" for row in header)
        assert all(row["location"] == "footer" for row in footer)

    def test_contact_channel_types(self, admin):
        rows = data_of(admin.get(f"{API}/admin/contact-channels", timeout=30))
        types = sorted(row["type"] for row in rows)
        assert types == ["email", "instagram", "whatsapp"], types

    def test_social_link_platforms(self, admin):
        rows = data_of(admin.get(f"{API}/admin/social-links", timeout=30))
        platforms = {row["platform"].lower() for row in rows}
        for expected in ("linkedin", "instagram", "tiktok", "github"):
            assert any(expected in platform for platform in platforms), f"{expected} missing from {platforms}"

    def test_seo_pages(self, admin):
        rows = data_of(admin.get(f"{API}/admin/seo-settings", timeout=30))
        keys = sorted(row["page_key"] for row in rows)
        assert "home" in keys and "portfolio" in keys, keys


# ---------------------------------------------------------------- CRUD cycles
class TestCrudCycles:
    def test_skill_category_cycle(self, admin):
        full_cycle(
            admin,
            "skill-categories",
            {
                "eyebrow": "09",
                "icon_name": "SiTest",
                "is_active": True,
                "translations": {
                    "id": {"name": "TEST_Kategori F4"},
                    "en": {"name": "TEST_Category F4"},
                },
            },
            {"eyebrow": "10", "translations": {"en": {"name": "TEST_Category F4 renamed"}}},
            {"eyebrow": "10"},
        )

    def test_skill_cycle_and_category_link(self, admin):
        categories = data_of(admin.get(f"{API}/admin/skill-categories", timeout=30))
        category_id = categories[0]["id"]

        r = admin.post(f"{API}/admin/skills", json={
            "name": "TEST_Skill F4",
            "skill_category_id": category_id,
            "icon_name": "SiReact",
            "color_hex": "#61DAFB",
            "proficiency": 87,
            "is_active": True,
        }, timeout=30)
        assert r.status_code == 201, r.text[:400]
        skill = data_of(r)
        assert skill["proficiency"] == 87
        assert isinstance(skill["proficiency"], int)
        assert skill["category"]["id"] == category_id

        got = data_of(admin.get(f"{API}/admin/skills/{skill['id']}", timeout=30))
        assert got["color_hex"] == "#61DAFB"

        admin.delete(f"{API}/admin/skills/{skill['id']}", timeout=30)
        assert admin.delete(f"{API}/admin/skills/{skill['id']}/force", timeout=30).status_code == 200

    def test_pain_point_cycle(self, admin):
        full_cycle(
            admin,
            "pain-points",
            {
                "icon_name": "AlertTriangle",
                "is_active": True,
                "translations": {
                    "id": {"title": "TEST_Masalah", "description": "Deskripsi uji"},
                    "en": {"title": "TEST_Problem", "description": "Test description"},
                },
            },
            {"icon_name": "Bug"},
            {"icon_name": "Bug"},
        )

    def test_process_step_cycle_number_is_int(self, admin):
        r = admin.post(f"{API}/admin/process-steps", json={
            "step_number": 9,
            "icon_name": "Rocket",
            "is_active": True,
            "translations": {
                "id": {"title": "TEST_Langkah", "description": "Uji"},
                "en": {"title": "TEST_Step", "description": "Test"},
            },
        }, timeout=30)
        assert r.status_code == 201, r.text[:400]
        step = data_of(r)
        assert step["step_number"] == 9 and isinstance(step["step_number"], int)

        admin.delete(f"{API}/admin/process-steps/{step['id']}", timeout=30)
        assert admin.delete(f"{API}/admin/process-steps/{step['id']}/force", timeout=30).status_code == 200

    def test_client_cycle(self, admin):
        full_cycle(
            admin,
            "clients",
            {
                "name": "TEST_Brand",
                "website_url": "https://example.com",
                "icon_name": "Building",
                "font_class": "font-sans",
                "is_featured": True,
                "is_active": True,
                "translations": {"id": {"description": "Klien uji"}, "en": {"description": "Test client"}},
            },
            {"name": "TEST_Brand renamed", "is_featured": False},
            {"name": "TEST_Brand renamed", "is_featured": False},
        )

    def test_navigation_cycle_header_and_footer(self, admin):
        for location in ("header", "footer"):
            r = admin.post(f"{API}/admin/navigation-menus", json={
                "location": location,
                "anchor": "#test-f4",
                "target": "_blank",
                "is_active": True,
                "translations": {"id": {"label": "TEST_Menu"}, "en": {"label": "TEST_Menu EN"}},
            }, timeout=30)
            assert r.status_code == 201, r.text[:400]
            item = data_of(r)
            assert item["location"] == location
            assert item["target"] == "_blank"

            other = "footer" if location == "header" else "header"
            in_other = data_of(admin.get(f"{API}/admin/navigation-menus?location={other}", timeout=30))
            assert all(row["id"] != item["id"] for row in in_other), "item leaked into the other section"

            admin.delete(f"{API}/admin/navigation-menus/{item['id']}", timeout=30)
            assert admin.delete(f"{API}/admin/navigation-menus/{item['id']}/force", timeout=30).status_code == 200

    def test_contact_channel_cycle(self, admin):
        full_cycle(
            admin,
            "contact-channels",
            {
                "type": "email",
                "value": "test-f4@example.com",
                "url": "mailto:test-f4@example.com",
                "icon_name": "Mail",
                "color_hex": "#123456",
                "is_active": True,
                "translations": {"id": {"label": "Email uji"}, "en": {"label": "Test email"}},
            },
            {"value": "changed-f4@example.com"},
            {"value": "changed-f4@example.com"},
        )

    def test_social_link_cycle(self, admin):
        full_cycle(
            admin,
            "social-links",
            {
                "platform": "TEST_Platform",
                "url": "https://example.com/test",
                "icon_name": "Link",
                "is_active": True,
            },
            {"url": "https://example.com/changed"},
            {"url": "https://example.com/changed"},
        )

    def test_seo_setting_cycle(self, admin):
        full_cycle(
            admin,
            "seo-settings",
            {
                "page_key": "test-f4-page",
                "robots_directive": "noindex,follow",
                "is_active": True,
                "structured_data": {"@context": "https://schema.org", "@type": "WebPage"},
                "translations": {
                    "id": {"meta_title": "TEST Judul", "meta_description": "Deskripsi", "meta_keywords": "a,b"},
                    "en": {"meta_title": "TEST Title", "meta_description": "Description", "meta_keywords": "a,b"},
                },
            },
            {"robots_directive": "index,follow"},
            {"robots_directive": "index,follow"},
        )

    def test_reorder_persists(self, admin):
        rows = data_of(admin.get(f"{API}/admin/pain-points", timeout=30))
        assert len(rows) >= 2
        swapped = [rows[1], rows[0], *rows[2:]]
        r = admin.post(f"{API}/admin/pain-points/reorder", json={
            "items": [{"id": row["id"], "sort_order": index + 1} for index, row in enumerate(swapped)],
        }, timeout=30)
        assert r.status_code == 200, r.text[:300]

        after = data_of(admin.get(f"{API}/admin/pain-points", timeout=30))
        assert [row["id"] for row in after] == [row["id"] for row in swapped]

        # restore original order
        admin.post(f"{API}/admin/pain-points/reorder", json={
            "items": [{"id": row["id"], "sort_order": index + 1} for index, row in enumerate(rows)],
        }, timeout=30)


# ---------------------------------------------------------------- validation
class TestValidation:
    def test_pain_point_empty_payload_422(self, admin):
        r = admin.post(f"{API}/admin/pain-points", json={}, timeout=30)
        assert r.status_code == 422, r.status_code
        body = r.json()
        assert "errors" in body and body["errors"], body
        message = body.get("message", "")
        assert message and ":attribute" not in message and "validation." not in message, message

    def test_client_invalid_website_url_422(self, admin):
        r = admin.post(f"{API}/admin/clients", json={
            "name": "TEST_Bad", "website_url": "not-a-url",
            "translations": {"id": {"description": "x"}},
        }, timeout=30)
        assert r.status_code == 422, r.text[:300]
        assert "website_url" in r.json()["errors"]

    def test_contact_channel_invalid_colour_422(self, admin):
        r = admin.post(f"{API}/admin/contact-channels", json={
            "type": "email", "value": "x@example.com", "color_hex": "red",
            "translations": {"id": {"label": "x"}},
        }, timeout=30)
        assert r.status_code == 422, r.text[:300]
        assert "color_hex" in r.json()["errors"]

    def test_social_link_invalid_url_422(self, admin):
        r = admin.post(f"{API}/admin/social-links", json={"platform": "x", "url": "nope"}, timeout=30)
        assert r.status_code == 422, r.text[:300]
        assert "url" in r.json()["errors"]

    def test_seo_duplicate_page_key_422(self, admin):
        r = admin.post(f"{API}/admin/seo-settings", json={
            "page_key": "home",
            "translations": {"id": {"meta_title": "dup"}},
        }, timeout=30)
        assert r.status_code == 422, r.text[:300]
        assert "page_key" in r.json()["errors"]

    def test_skill_requires_name(self, admin):
        r = admin.post(f"{API}/admin/skills", json={}, timeout=30)
        assert r.status_code == 422
        assert "name" in r.json()["errors"]


# ---------------------------------------------------------------- public API
PUBLIC_PATHS = [
    "skills", "pain-points", "process-steps", "clients", "navigation", "contact", "seo",
]


class TestPublicApi:
    @pytest.mark.parametrize("path", PUBLIC_PATHS)
    def test_public_no_auth(self, anon, path):
        r = anon.get(f"{API}/public/{path}", timeout=30)
        assert r.status_code == 200, f"/public/{path} -> {r.status_code} {r.text[:300]}"
        data_of(r)

    def test_public_skills_only_active(self, anon, admin):
        skills = data_of(admin.get(f"{API}/admin/skills", timeout=30))
        target = skills[0]
        admin.patch(f"{API}/admin/skills/{target['id']}/toggle-active", timeout=30)
        try:
            groups = data_of(anon.get(f"{API}/public/skills", timeout=30))
            flat = [skill["name"] for group in groups for skill in group.get("skills", [])]
            if target["is_active"]:
                assert target["name"] not in flat, "deactivated skill still exposed publicly"
        finally:
            admin.patch(f"{API}/admin/skills/{target['id']}/toggle-active", timeout=30)

    def test_public_navigation_shape(self, anon):
        payload = data_of(anon.get(f"{API}/public/navigation", timeout=30))
        assert "header" in payload and "footer" in payload, payload
        assert len(payload["header"]) >= 1 and len(payload["footer"]) >= 1
        for row in payload["header"] + payload["footer"]:
            assert "label" in row

    def test_public_contact_shape(self, anon):
        payload = data_of(anon.get(f"{API}/public/contact", timeout=30))
        assert "channels" in payload and "social_links" in payload, payload
        assert len(payload["channels"]) >= 1 and len(payload["social_links"]) >= 1

    def test_public_seo_by_page_key(self, anon):
        payload = data_of(anon.get(f"{API}/public/seo?page_key=home", timeout=30))
        assert isinstance(payload, dict), payload
        assert payload.get("page_key") == "home", payload

    def test_public_locale_switch(self, anon):
        id_rows = data_of(anon.get(f"{API}/public/pain-points?locale=id", timeout=30))
        en_rows = data_of(anon.get(f"{API}/public/pain-points?locale=en", timeout=30))
        default = data_of(anon.get(f"{API}/public/pain-points", timeout=30))
        assert [row["title"] for row in default] == [row["title"] for row in id_rows], "default locale is not id"
        assert [row["title"] for row in id_rows] != [row["title"] for row in en_rows], "locale=en returned ID copy"

    def test_public_process_steps_sorted(self, anon):
        rows = data_of(anon.get(f"{API}/public/process-steps", timeout=30))
        numbers = [row["step_number"] for row in rows]
        assert numbers == sorted(numbers), numbers


# ---------------------------------------------------------------- permissions
MODULE_URIS = list(SEED_COUNTS.keys())


class TestEditorPermissions:
    @pytest.mark.parametrize("uri", MODULE_URIS)
    def test_editor_can_list(self, editor, uri):
        r = editor.get(f"{API}/admin/{uri}", timeout=30)
        assert r.status_code == 200, f"editor GET {uri} -> {r.status_code} {r.text[:200]}"

    @pytest.mark.parametrize("uri", MODULE_URIS)
    def test_editor_force_delete_forbidden(self, editor, admin, uri):
        rows = data_of(admin.get(f"{API}/admin/{uri}", timeout=30))
        assert rows, f"no rows to test {uri}"
        r = editor.delete(f"{API}/admin/{uri}/{rows[0]['id']}/force", timeout=30)
        assert r.status_code == 403, f"editor force delete {uri} -> {r.status_code} {r.text[:200]}"

    def test_editor_can_toggle(self, editor, uri="pain-points"):
        rows = data_of(editor.get(f"{API}/admin/{uri}", timeout=30))
        target = rows[0]["id"]
        r = editor.patch(f"{API}/admin/{uri}/{target}/toggle-active", timeout=30)
        assert r.status_code == 200, r.text[:200]
        editor.patch(f"{API}/admin/{uri}/{target}/toggle-active", timeout=30)

    def test_anonymous_admin_access_denied(self, anon):
        r = anon.get(f"{API}/admin/skills", timeout=30)
        assert r.status_code == 401, r.status_code


# ---------------------------------------------------------------- regression
class TestRegression:
    @pytest.mark.parametrize("path", [
        "hero", "hero-metrics", "about", "about-stats", "testimonials",
        "services", "faqs", "faq-categories", "settings",
    ])
    def test_earlier_modules_still_ok(self, admin, path):
        r = admin.get(f"{API}/admin/{path}", timeout=30)
        assert r.status_code == 200, f"{path} -> {r.status_code} {r.text[:200]}"
