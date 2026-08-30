"""Phase F3c backend tests — Media Library, Technologies, Project Categories, Projects.

Covers: auth (no-2FA + 2FA), media upload/serve/update/trash/restore/force,
technology & category & project CRUD + toggle-active + reorder + trash lifecycle,
validation (422) and editor permission (403).
"""

import io
import os
import re
import subprocess
import time

import pytest
import requests
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
raw = os.environ.get("NEXT_PUBLIC_API_BASE_URL") or frontend_env.get("NEXT_PUBLIC_API_BASE_URL")
if not raw:
    raise RuntimeError("NEXT_PUBLIC_API_BASE_URL missing from /app/frontend/.env")
API = raw.rstrip("/")                     # .../api/v1
ROOT = API.rsplit("/api/v1", 1)[0]        # base origin

SUPER_ADMIN = ("shell.test@adiprimanto.com", "ShellTester#2026")
SUPER_ADMIN_2FA = ("admin@adiprimanto.com", "AdiPrimanto#2026")
EDITOR = ("editor.test@adiprimanto.com", "EditorTest#2026")

PNG = (
    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06"
    b"\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00"
    b"\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
)


# ---------------------------------------------------------------- helpers
def _login(email, password):
    s = requests.Session()
    s.headers.update({"Accept": "application/json"})
    r = s.post(f"{API}/auth/login", json={"email": email, "password": password}, timeout=30)
    assert r.status_code == 200, f"login {email} -> {r.status_code} {r.text[:300]}"
    body = r.json()
    data = body.get("data", body)
    token = data.get("token") or data.get("access_token")
    if not token:
        # 2FA path
        challenge = data.get("challenge_token")
        assert challenge, f"no token and no challenge_token: {body}"
        time.sleep(3)
        code = _latest_otp()
        assert code, "OTP not found in laravel.log"
        r2 = s.post(
            f"{API}/auth/two-factor/verify",
            json={"challenge_token": challenge, "code": code},
            timeout=30,
        )
        assert r2.status_code == 200, f"2fa verify -> {r2.status_code} {r2.text[:300]}"
        d2 = r2.json().get("data", r2.json())
        token = d2.get("token") or d2.get("access_token")
        assert token
    s.headers.update({"Authorization": f"Bearer {token}"})
    return s


def _latest_otp():
    out = subprocess.run(
        ["tail", "-n", "600", "/app/backend/storage/logs/laravel.log"],
        capture_output=True, text=True,
    ).stdout
    codes = re.findall(r"\*\*(\d{6})\*\*", out)
    if not codes:
        codes = re.findall(r"\b(\d{6})\b", out)
    return codes[-1] if codes else None


@pytest.fixture(scope="session")
def admin():
    return _login(*SUPER_ADMIN)


@pytest.fixture(scope="session")
def editor():
    return _login(*EDITOR)


# ---------------------------------------------------------------- auth
class TestAuth:
    def test_health(self):
        r = requests.get(f"{API}/health", timeout=20)
        assert r.status_code == 200

    def test_login_without_2fa_returns_token(self):
        r = requests.post(
            f"{API}/auth/login",
            json={"email": SUPER_ADMIN[0], "password": SUPER_ADMIN[1]},
            headers={"Accept": "application/json"}, timeout=30,
        )
        assert r.status_code == 200, r.text[:300]
        d = r.json().get("data", {})
        assert d.get("token") or d.get("access_token"), f"expected direct token: {r.json()}"

    def test_login_with_2fa_flow(self):
        s = _login(*SUPER_ADMIN_2FA)
        me = s.get(f"{API}/auth/me", timeout=20)
        assert me.status_code == 200
        d = me.json()["data"]
        d = d.get("user", d)
        assert d["email"] == SUPER_ADMIN_2FA[0]

    def test_me_requires_auth(self):
        r = requests.get(f"{API}/auth/me", headers={"Accept": "application/json"}, timeout=20)
        assert r.status_code == 401


# ---------------------------------------------------------------- media
class TestMedia:
    def test_upload_serve_update_trash_restore_force(self, admin):
        files = [("file", ("TEST_f3c_media.png", io.BytesIO(PNG), "image/png"))]
        r = admin.post(f"{API}/admin/media", files=files, timeout=60)
        assert r.status_code in (200, 201), f"upload -> {r.status_code} {r.text[:400]}"
        payload = r.json()["data"]
        item = payload[0] if isinstance(payload, list) else payload
        mid = item["id"]
        url = item["url"]
        assert re.search(r"/api/storage/media/\d{4}/\d{2}/", url), url

        # file actually served
        f = requests.get(url, timeout=30)
        assert f.status_code == 200, f"serve {url} -> {f.status_code}"
        assert f.headers.get("content-type", "").startswith("image/"), f.headers

        # search narrows results
        s = admin.get(f"{API}/admin/media", params={"search": "TEST_f3c_media"}, timeout=30)
        assert s.status_code == 200
        assert any(x["id"] == mid for x in s.json()["data"])
        assert "meta" in s.json()

        # update alt text persists
        u = admin.patch(f"{API}/admin/media/{mid}", json={"alt_text": "TEST alt text"}, timeout=30)
        assert u.status_code == 200, u.text[:300]
        g = admin.get(f"{API}/admin/media/{mid}", timeout=30)
        assert g.json()["data"]["alt_text"] == "TEST alt text"

        # trash
        assert admin.delete(f"{API}/admin/media/{mid}", timeout=30).status_code in (200, 204)
        assert admin.get(f"{API}/admin/media/{mid}", timeout=30).status_code == 404
        tr = admin.get(f"{API}/admin/media", params={"trashed": 1}, timeout=30)
        assert tr.status_code == 200
        assert any(x["id"] == mid for x in tr.json()["data"]), "trashed item not listed"

        # restore
        assert admin.post(f"{API}/admin/media/{mid}/restore", timeout=30).status_code == 200
        assert admin.get(f"{API}/admin/media/{mid}", timeout=30).status_code == 200

        # force delete
        admin.delete(f"{API}/admin/media/{mid}", timeout=30)
        fd = admin.delete(f"{API}/admin/media/{mid}/force", timeout=30)
        assert fd.status_code in (200, 204), fd.text[:300]
        assert requests.get(url, timeout=30).status_code == 404

    def test_upload_rejects_non_image(self, admin):
        files = [("file", ("TEST_bad.txt", io.BytesIO(b"nope"), "text/plain"))]
        r = admin.post(f"{API}/admin/media", files=files, timeout=30)
        assert r.status_code == 422, f"expected 422, got {r.status_code}"

    def test_pagination_meta(self, admin):
        r = admin.get(f"{API}/admin/media", params={"per_page": 24, "page": 1}, timeout=30)
        assert r.status_code == 200
        meta = r.json().get("meta", {})
        for key in ("current_page", "per_page", "total"):
            assert key in meta, f"missing meta.{key}: {meta}"


# ---------------------------------------------------------------- technologies
class TestTechnologies:
    def test_full_lifecycle(self, admin):
        r = admin.post(f"{API}/admin/technologies", json={
            "name": "TEST_Tech_F3c", "slug": "test-tech-f3c",
            "color": "#3366ff", "is_active": True,
        }, timeout=30)
        assert r.status_code in (200, 201), r.text[:400]
        tid = r.json()["data"]["id"]
        assert r.json()["data"]["slug"] == "test-tech-f3c"

        g = admin.get(f"{API}/admin/technologies/{tid}", timeout=30)
        assert g.status_code == 200 and g.json()["data"]["name"] == "TEST_Tech_F3c"

        up = admin.put(f"{API}/admin/technologies/{tid}",
                       json={"name": "TEST_Tech_F3c_v2", "slug": "test-tech-f3c"}, timeout=30)
        assert up.status_code == 200, up.text[:300]
        assert admin.get(f"{API}/admin/technologies/{tid}", timeout=30).json()["data"]["name"] == "TEST_Tech_F3c_v2"

        t = admin.patch(f"{API}/admin/technologies/{tid}/toggle-active", timeout=30)
        assert t.status_code == 200, t.text[:300]
        assert admin.get(f"{API}/admin/technologies/{tid}", timeout=30).json()["data"]["is_active"] is False

        assert admin.delete(f"{API}/admin/technologies/{tid}", timeout=30).status_code in (200, 204)
        only = admin.get(f"{API}/admin/technologies", params={"trashed": 1}, timeout=30).json()["data"]
        assert any(x["id"] == tid for x in only)
        assert admin.post(f"{API}/admin/technologies/{tid}/restore", timeout=30).status_code == 200
        admin.delete(f"{API}/admin/technologies/{tid}", timeout=30)
        assert admin.delete(f"{API}/admin/technologies/{tid}/force", timeout=30).status_code in (200, 204)
        assert admin.get(f"{API}/admin/technologies/{tid}", timeout=30).status_code == 404

    def test_invalid_slug_returns_422_with_field_error(self, admin):
        r = admin.post(f"{API}/admin/technologies",
                       json={"name": "TEST Bad Slug", "slug": "BAD SLUG"}, timeout=30)
        assert r.status_code == 422, r.text[:300]
        assert "slug" in r.json().get("errors", {}), r.json()


# ---------------------------------------------------------------- categories
class TestProjectCategories:
    def test_translatable_create_and_partial_update(self, admin):
        r = admin.post(f"{API}/admin/project-categories", json={
            "slug": "test-cat-f3c",
            "translations": {
                "id": {"name": "TEST Kategori ID"},
                "en": {"name": "TEST Category EN"},
            },
            "is_active": True,
        }, timeout=30)
        assert r.status_code in (200, 201), r.text[:500]
        cid = r.json()["data"]["id"]
        try:
            # update only EN, ID must survive
            u = admin.put(f"{API}/admin/project-categories/{cid}", json={
                "slug": "test-cat-f3c",
                "translations": {"en": {"name": "TEST Category EN v2"}},
            }, timeout=30)
            assert u.status_code == 200, u.text[:400]
            d = admin.get(f"{API}/admin/project-categories/{cid}", timeout=30).json()["data"]
            tr = d.get("translations", {})
            assert tr.get("en", {}).get("name") == "TEST Category EN v2", tr
            assert tr.get("id", {}).get("name") == "TEST Kategori ID", f"ID translation lost: {tr}"

            assert admin.patch(f"{API}/admin/project-categories/{cid}/toggle-active", timeout=30).status_code == 200
        finally:
            admin.delete(f"{API}/admin/project-categories/{cid}", timeout=30)
            admin.delete(f"{API}/admin/project-categories/{cid}/force", timeout=30)

    def test_index_exposes_projects_count(self, admin):
        r = admin.get(f"{API}/admin/project-categories", timeout=30)
        assert r.status_code == 200
        rows = r.json()["data"]
        assert len(rows) >= 5, f"expected >=5 seeded categories, got {len(rows)}"
        assert any("projects_count" in x for x in rows), rows[0].keys()


# ---------------------------------------------------------------- projects
class TestProjects:
    def test_seeded_list_and_filters(self, admin):
        r = admin.get(f"{API}/admin/projects", timeout=30)
        assert r.status_code == 200, r.text[:300]
        rows = r.json()["data"]
        assert len(rows) >= 3, f"expected >=3 seeded projects, got {len(rows)}"
        assert "meta" in r.json()
        for row in rows:
            assert "_id" not in row

        pub = admin.get(f"{API}/admin/projects", params={"status": "published"}, timeout=30)
        assert pub.status_code == 200
        assert all(x["status"] == "published" for x in pub.json()["data"])

        cat = rows[0].get("category") or {}
        if cat.get("id"):
            fc = admin.get(f"{API}/admin/projects", params={"category_id": cat["id"]}, timeout=30)
            assert fc.status_code == 200
            assert all((x.get("category") or {}).get("id") == cat["id"] for x in fc.json()["data"])

        sl = rows[0]["slug"]
        srch = admin.get(f"{API}/admin/projects", params={"search": sl}, timeout=30)
        assert srch.status_code == 200
        assert any(x["slug"] == sl for x in srch.json()["data"])

    def test_create_update_publish_toggle_trash_lifecycle(self, admin):
        cats = admin.get(f"{API}/admin/project-categories", timeout=30).json()["data"]
        techs = admin.get(f"{API}/admin/technologies", timeout=30).json()["data"]
        payload = {
            "slug": "test-project-f3c",
            "project_category_id": cats[0]["id"],
            "technology_ids": [techs[0]["id"], techs[1]["id"]],
            "status": "draft",
            "is_active": True,
            "translations": {
                "id": {"title": "TEST Proyek ID", "description": "desc id"},
                "en": {"title": "TEST Project EN", "description": "desc en"},
            },
        }
        r = admin.post(f"{API}/admin/projects", json=payload, timeout=30)
        assert r.status_code in (200, 201), r.text[:600]
        pid = r.json()["data"]["id"]
        try:
            d = r.json()["data"]
            assert d["status"] == "draft"
            assert len(d.get("technologies", [])) == 2, d.get("technologies")

            # update EN only, ID preserved
            u = admin.put(f"{API}/admin/projects/{pid}", json={
                "slug": "test-project-f3c",
                "project_category_id": cats[0]["id"],
                "translations": {"en": {"title": "TEST Project EN v2"}},
            }, timeout=30)
            assert u.status_code == 200, u.text[:500]
            got = admin.get(f"{API}/admin/projects/{pid}", timeout=30).json()["data"]
            assert got["translations"]["en"]["title"] == "TEST Project EN v2"
            assert got["translations"]["id"]["title"] == "TEST Proyek ID", got["translations"]

            # publish
            p = admin.put(f"{API}/admin/projects/{pid}", json={
                "slug": "test-project-f3c",
                "project_category_id": cats[0]["id"],
                "status": "published",
                "published_at": "2026-07-01T00:00:00+00:00",
                "translations": {"id": {"title": "TEST Proyek ID"}},
            }, timeout=30)
            assert p.status_code == 200, p.text[:400]
            pub = admin.get(f"{API}/admin/projects/{pid}", timeout=30).json()["data"]
            assert pub["status"] == "published"
            assert pub.get("published_at"), "published_at not set on publish"

            # toggle active
            t = admin.patch(f"{API}/admin/projects/{pid}/toggle-active", timeout=30)
            assert t.status_code == 200, t.text[:300]
            assert admin.get(f"{API}/admin/projects/{pid}", timeout=30).json()["data"]["is_active"] is False

            # trash / restore
            assert admin.delete(f"{API}/admin/projects/{pid}", timeout=30).status_code in (200, 204)
            assert admin.get(f"{API}/admin/projects/{pid}", timeout=30).status_code == 404
            only = admin.get(f"{API}/admin/projects", params={"trashed": 1}, timeout=30).json()["data"]
            assert any(x["id"] == pid for x in only)
            assert admin.post(f"{API}/admin/projects/{pid}/restore", timeout=30).status_code == 200
            assert admin.get(f"{API}/admin/projects/{pid}", timeout=30).status_code == 200
        finally:
            admin.delete(f"{API}/admin/projects/{pid}", timeout=30)
            admin.delete(f"{API}/admin/projects/{pid}/force", timeout=30)
        assert admin.get(f"{API}/admin/projects/{pid}", timeout=30).status_code == 404

    def test_empty_payload_returns_422(self, admin):
        r = admin.post(f"{API}/admin/projects", json={}, timeout=30)
        assert r.status_code == 422, f"{r.status_code} {r.text[:300]}"
        assert r.json().get("errors")

    def test_reorder_persists(self, admin):
        rows = admin.get(f"{API}/admin/projects", timeout=30).json()["data"]
        assert len(rows) >= 3
        ids = [x["id"] for x in rows[:3]]
        new_order = [ids[1], ids[2], ids[0]]
        r = admin.post(f"{API}/admin/projects/reorder",
                       json={"ids": new_order}, timeout=30)
        if r.status_code == 422:
            r = admin.post(f"{API}/admin/projects/reorder", json={
                "items": [{"id": i, "sort_order": n} for n, i in enumerate(new_order, start=1)]
            }, timeout=30)
        assert r.status_code in (200, 204), f"reorder -> {r.status_code} {r.text[:400]}"
        after = [x["id"] for x in admin.get(f"{API}/admin/projects", timeout=30).json()["data"]][:3]
        assert after == new_order, f"order not persisted: {after} != {new_order}"
        # restore original order
        admin.post(f"{API}/admin/projects/reorder", json={"ids": ids}, timeout=30)


# ---------------------------------------------------------------- permissions
class TestEditorPermissions:
    def test_editor_can_view(self, editor):
        for path in ("projects", "project-categories", "technologies", "media"):
            r = editor.get(f"{API}/admin/{path}", timeout=30)
            assert r.status_code == 200, f"{path} -> {r.status_code}"

    def test_editor_cannot_delete(self, editor, admin):
        pid = admin.get(f"{API}/admin/projects", timeout=30).json()["data"][0]["id"]
        cid = admin.get(f"{API}/admin/project-categories", timeout=30).json()["data"][0]["id"]
        tid = admin.get(f"{API}/admin/technologies", timeout=30).json()["data"][0]["id"]
        assert editor.delete(f"{API}/admin/projects/{pid}", timeout=30).status_code == 403
        assert editor.delete(f"{API}/admin/project-categories/{cid}", timeout=30).status_code == 403
        assert editor.delete(f"{API}/admin/technologies/{tid}", timeout=30).status_code == 403

    def test_editor_cannot_force_delete(self, editor, admin):
        pid = admin.get(f"{API}/admin/projects", timeout=30).json()["data"][0]["id"]
        assert editor.delete(f"{API}/admin/projects/{pid}/force", timeout=30).status_code == 403
