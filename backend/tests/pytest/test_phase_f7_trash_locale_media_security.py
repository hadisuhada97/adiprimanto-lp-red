"""Phase F7 — Trash, Localization, Media Library (folders/variants/usage),
rich-text sanitisation, flat translatable payload guard and security headers."""

import io
import time
import os
import re
import uuid
from pathlib import Path

import pytest
import requests
from dotenv import dotenv_values
from PIL import Image

frontend_env = dotenv_values("/app/frontend/.env")
raw = os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("NEXT_PUBLIC_API_BASE_URL")
if not raw:
    raise RuntimeError("Backend base URL missing from env")
BASE_URL = raw.rstrip("/").replace("/api/v1", "")
API = f"{BASE_URL}/api/v1"

SUPER = {"email": "shell.test@adiprimanto.com", "password": "ShellTester#2026"}
EDITOR = {"email": "editor.test@adiprimanto.com", "password": "EditorTest#2026"}


class RetrySession(requests.Session):
    """The admin API is throttled at 120 req/min; back off on 429 instead of failing."""

    def request(self, *args, **kwargs):
        for attempt in range(8):
            response = super().request(*args, **kwargs)
            if response.status_code != 429:
                return response
            time.sleep(float(response.headers.get("Retry-After") or 2) + 1)
        return response


def _login(creds):
    r = requests.post(f"{API}/auth/login", json=creds, timeout=60)
    if r.status_code != 200:
        pytest.fail(f"login failed {creds['email']}: {r.status_code} {r.text[:300]}")
    token = (r.json().get("data") or {}).get("access_token")
    if not token:
        pytest.fail(f"no access_token for {creds['email']}: {r.text[:300]}")
    return token


@pytest.fixture(scope="session")
def admin():
    s = RetrySession()
    s.headers.update({"Authorization": f"Bearer {_login(SUPER)}", "Accept": "application/json"})
    return s


@pytest.fixture(scope="session")
def editor():
    s = RetrySession()
    s.headers.update({"Authorization": f"Bearer {_login(EDITOR)}", "Accept": "application/json"})
    return s


def png_bytes(w=900, h=600):
    buf = io.BytesIO()
    Image.new("RGB", (w, h), (12, 90, 200)).save(buf, format="PNG")
    return buf.getvalue()


# ---------------------------------------------------------------- security headers
class TestSecurityHeaders:
    def test_api_health_headers(self):
        r = requests.get(f"{API}/health", timeout=60)
        assert r.status_code == 200
        assert r.headers.get("X-Frame-Options") == "DENY"
        assert r.headers.get("X-Content-Type-Options") == "nosniff"
        assert "Content-Security-Policy" in r.headers
        assert r.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"

    @pytest.mark.parametrize("path", ["/", "/admin/login"])
    def test_frontend_headers(self, path):
        r = requests.get(f"{BASE_URL}{path}", timeout=90)
        assert r.status_code == 200, r.status_code
        assert "Content-Security-Policy" in r.headers, dict(r.headers)
        assert "X-Frame-Options" in r.headers
        assert "Referrer-Policy" in r.headers

    def test_csp_allows_google_fonts_and_api_storage(self):
        csp = requests.get(f"{BASE_URL}/", timeout=90).headers.get("Content-Security-Policy", "")
        assert "fonts.googleapis.com" in csp, csp
        assert "fonts.gstatic.com" in csp, csp


# ---------------------------------------------------------------- trash
class TestTrash:
    def test_index_shape_and_modules(self, admin):
        r = admin.get(f"{API}/admin/trash", timeout=60)
        assert r.status_code == 200, r.text[:300]
        data = r.json()["data"]
        assert isinstance(data["items"], list)
        modules = {m["module"]: m for m in data["modules"]}
        assert len(modules) >= 20, list(modules)
        for key in ("projects", "technologies", "locales", "media"):
            assert key in modules
            assert "label" in modules[key] and isinstance(modules[key]["count"], int)

    def test_soft_delete_appears_in_trash_then_restore(self, admin):
        name = f"TEST_Tech_{uuid.uuid4().hex[:6]}"
        c = admin.post(f"{API}/admin/technologies", json={"name": name, "slug": name.lower().replace("_", "-"), "is_active": True}, timeout=60)
        assert c.status_code in (200, 201), c.text[:400]
        tid = c.json()["data"]["id"]

        assert admin.delete(f"{API}/admin/technologies/{tid}", timeout=60).status_code == 200

        items = admin.get(f"{API}/admin/trash?module=technologies", timeout=60).json()["data"]["items"]
        found = [i for i in items if i["id"] == tid]
        assert found, f"{tid} not in trash"
        assert found[0]["module_label"] == "Technologies"
        assert found[0]["title"] == name
        assert found[0]["can_restore"] is True

        r = admin.post(f"{API}/admin/trash/technologies/{tid}/restore", timeout=60)
        assert r.status_code == 200, r.text[:300]

        items = admin.get(f"{API}/admin/trash?module=technologies", timeout=60).json()["data"]["items"]
        assert not [i for i in items if i["id"] == tid]
        listed = admin.get(f"{API}/admin/technologies?per_page=200", timeout=60).json()["data"]
        assert tid in [t["id"] for t in listed]

        # cleanup
        admin.delete(f"{API}/admin/technologies/{tid}", timeout=60)
        admin.delete(f"{API}/admin/trash/technologies/{tid}/force", timeout=60)

    def test_force_delete_removes_permanently(self, admin):
        name = f"TEST_Tech_{uuid.uuid4().hex[:6]}"
        tid = admin.post(f"{API}/admin/technologies", json={"name": name, "slug": name.lower().replace("_", "-"), "is_active": True}, timeout=60).json()["data"]["id"]
        admin.delete(f"{API}/admin/technologies/{tid}", timeout=60)

        r = admin.delete(f"{API}/admin/trash/technologies/{tid}/force", timeout=60)
        assert r.status_code == 200, r.text[:300]

        items = admin.get(f"{API}/admin/trash?module=technologies", timeout=60).json()["data"]["items"]
        assert not [i for i in items if i["id"] == tid]
        assert admin.get(f"{API}/admin/technologies/{tid}", timeout=60).status_code == 404

    def test_unknown_module_returns_404(self, admin):
        r = admin.delete(f"{API}/admin/trash/not_a_module/{uuid.uuid4()}/force", timeout=60)
        assert r.status_code == 404, r.status_code

    def test_editor_cannot_force_delete(self, admin, editor):
        name = f"TEST_Tech_{uuid.uuid4().hex[:6]}"
        tid = admin.post(f"{API}/admin/technologies", json={"name": name, "slug": name.lower().replace("_", "-"), "is_active": True}, timeout=60).json()["data"]["id"]
        admin.delete(f"{API}/admin/technologies/{tid}", timeout=60)

        r = editor.delete(f"{API}/admin/trash/technologies/{tid}/force", timeout=60)
        assert r.status_code == 403, f"expected 403, got {r.status_code} {r.text[:200]}"

        items = editor.get(f"{API}/admin/trash?module=technologies", timeout=60).json()["data"]["items"]
        mine = [i for i in items if i["id"] == tid]
        if mine:
            assert mine[0]["can_force_delete"] is False

        admin.delete(f"{API}/admin/trash/technologies/{tid}/force", timeout=60)

    def test_unauthenticated_trash_is_401(self):
        r = requests.get(f"{API}/admin/trash", headers={"Accept": "application/json"}, timeout=60)
        assert r.status_code == 401


# ---------------------------------------------------------------- locales
class TestLocales:
    def test_index_has_id_default_and_en(self, admin):
        r = admin.get(f"{API}/admin/locales", timeout=60)
        assert r.status_code == 200, r.text[:300]
        locales = {l["code"]: l for l in r.json()["data"]}
        assert "id" in locales and "en" in locales
        assert locales["id"]["is_default"] is True
        assert locales["en"]["is_default"] is False

    def test_default_locale_cannot_be_deactivated_or_deleted(self, admin):
        lid = [l for l in admin.get(f"{API}/admin/locales", timeout=60).json()["data"] if l["code"] == "id"][0]["id"]

        r = admin.patch(f"{API}/admin/locales/{lid}/toggle-active", timeout=60)
        assert r.status_code == 422, r.status_code
        assert "default locale" in r.json().get("message", "").lower()

        r = admin.delete(f"{API}/admin/locales/{lid}", timeout=60)
        assert r.status_code == 422, r.status_code
        assert "default locale" in r.json().get("message", "").lower()

        # still default & active
        after = [l for l in admin.get(f"{API}/admin/locales", timeout=60).json()["data"] if l["code"] == "id"][0]
        assert after["is_default"] is True and after["is_active"] is True

    def test_set_default_switch_and_revert(self, admin):
        locales = {l["code"]: l for l in admin.get(f"{API}/admin/locales", timeout=60).json()["data"]}
        en, idl = locales["en"]["id"], locales["id"]["id"]

        r = admin.patch(f"{API}/admin/locales/{en}/set-default", timeout=60)
        assert r.status_code == 200, r.text[:300]
        now = {l["code"]: l for l in admin.get(f"{API}/admin/locales", timeout=60).json()["data"]}
        assert now["en"]["is_default"] is True
        assert now["id"]["is_default"] is False

        assert admin.patch(f"{API}/admin/locales/{idl}/set-default", timeout=60).status_code == 200
        back = {l["code"]: l for l in admin.get(f"{API}/admin/locales", timeout=60).json()["data"]}
        assert back["id"]["is_default"] is True and back["en"]["is_default"] is False
        assert back["id"]["is_active"] is True and back["en"]["is_active"] is True

    def test_toggle_active_non_default_roundtrip(self, admin):
        en = [l for l in admin.get(f"{API}/admin/locales", timeout=60).json()["data"] if l["code"] == "en"][0]["id"]
        r = admin.patch(f"{API}/admin/locales/{en}/toggle-active", timeout=60)
        assert r.status_code == 200, r.text[:300]
        assert r.json()["data"]["is_active"] is False
        r = admin.patch(f"{API}/admin/locales/{en}/toggle-active", timeout=60)
        assert r.status_code == 200
        assert r.json()["data"]["is_active"] is True

    def test_create_soft_delete_trash_and_force_delete(self, admin):
        payload = {"code": "jv", "name": "Javanese", "native_name": "Basa Jawa", "is_active": True, "is_default": False}
        r = admin.post(f"{API}/admin/locales", json=payload, timeout=60)
        assert r.status_code in (200, 201), r.text[:400]
        created = r.json()["data"]
        assert created["code"] == "jv" and created["name"] == "Javanese"
        lid = created["id"]

        # duplicate code rejected
        assert admin.post(f"{API}/admin/locales", json=payload, timeout=60).status_code == 422

        assert admin.delete(f"{API}/admin/locales/{lid}", timeout=60).status_code == 200
        assert "jv" not in [l["code"] for l in admin.get(f"{API}/admin/locales", timeout=60).json()["data"]]

        items = admin.get(f"{API}/admin/trash?module=locales", timeout=60).json()["data"]["items"]
        assert [i for i in items if i["id"] == lid], "locale not listed in trash"

        assert admin.delete(f"{API}/admin/trash/locales/{lid}/force", timeout=60).status_code == 200
        items = admin.get(f"{API}/admin/trash?module=locales", timeout=60).json()["data"]["items"]
        assert not [i for i in items if i["id"] == lid]

    def test_completeness_coverage(self, admin):
        r = admin.get(f"{API}/admin/locales/completeness", timeout=60)
        assert r.status_code == 200, r.text[:300]
        data = r.json()["data"]
        assert set(["id", "en"]).issubset(set(data["locales"]))
        assert len(data["modules"]) >= 15
        m = data["modules"][0]
        assert isinstance(m["total"], int)
        assert set(data["locales"]).issubset(set(m["translated"].keys()))
        for mod in data["modules"]:
            for code, count in mod["translated"].items():
                assert count <= mod["total"], f"{mod['module']} {code} {count}>{mod['total']}"


# ---------------------------------------------------------------- media folders + variants + usage
class TestMediaLibrary:
    def test_folder_crud_and_non_empty_protection(self, admin):
        fname = f"TEST_Folder_{uuid.uuid4().hex[:6]}"
        r = admin.post(f"{API}/admin/media/folders", json={"name": fname}, timeout=60)
        assert r.status_code in (200, 201), r.text[:400]
        folder = r.json()["data"]
        fid = folder["id"]
        assert folder["name"] == fname

        listed = admin.get(f"{API}/admin/media/folders", timeout=60).json()["data"]
        assert fid in [f["id"] for f in listed]

        # rename
        r = admin.patch(f"{API}/admin/media/folders/{fid}", json={"name": fname + "_ren"}, timeout=60)
        assert r.status_code == 200, r.text[:300]
        assert admin.get(f"{API}/admin/media/folders", timeout=60).json()["data"]
        assert fname + "_ren" in [f["name"] for f in admin.get(f"{API}/admin/media/folders", timeout=60).json()["data"]]

        # upload a file into the folder -> delete must be blocked
        up = admin.post(
            f"{API}/admin/media",
            files={"file": ("TEST_folderguard.png", png_bytes(200, 150), "image/png")},
            data={"folder_id": fid},
            timeout=120,
        )
        assert up.status_code in (200, 201), up.text[:400]
        mid = up.json()["data"]["id"]
        assert up.json()["data"].get("folder_id") == fid

        r = admin.delete(f"{API}/admin/media/folders/{fid}", timeout=60)
        assert r.status_code == 409, f"expected 409 for non-empty folder, got {r.status_code} {r.text[:200]}"
        assert r.json().get("message")

        # remove file then folder deletes fine
        admin.delete(f"{API}/admin/media/{mid}", timeout=60)
        admin.delete(f"{API}/admin/media/{mid}/force", timeout=60)
        r = admin.delete(f"{API}/admin/media/folders/{fid}", timeout=60)
        assert r.status_code == 200, r.text[:300]
        assert fid not in [f["id"] for f in admin.get(f"{API}/admin/media/folders", timeout=60).json()["data"]]

    def test_image_upload_generates_reachable_webp_and_thumbnail(self, admin):
        up = admin.post(
            f"{API}/admin/media",
            files={"file": ("TEST_variants.png", png_bytes(1200, 800), "image/png")},
            data={"alt_text": "TEST variants"},
            timeout=120,
        )
        assert up.status_code in (200, 201), up.text[:400]
        m = up.json()["data"]
        assert m["url"] and m["webp_url"] and m["thumbnail_url"]
        assert m["webp_url"] != m["url"], m
        assert m["thumbnail_url"] != m["url"], m
        assert m["webp_url"].endswith(".webp") and m["thumbnail_url"].endswith(".webp")
        for key in ("url", "webp_url", "thumbnail_url"):
            resp = requests.get(m[key], timeout=90)
            assert resp.status_code == 200, f"{key} -> {resp.status_code} ({m[key]})"
            assert int(resp.headers.get("content-length") or len(resp.content)) > 0

        admin.delete(f"{API}/admin/media/{m['id']}", timeout=60)
        admin.delete(f"{API}/admin/media/{m['id']}/force", timeout=60)

    def test_pdf_upload_variants_fallback_to_original(self, admin):
        pdf = b"%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<<>>\n%%EOF\n"
        up = admin.post(
            f"{API}/admin/media",
            files={"file": ("TEST_doc.pdf", pdf, "application/pdf")},
            timeout=120,
        )
        assert up.status_code in (200, 201), up.text[:400]
        m = up.json()["data"]
        assert m["webp_url"] == m["url"]
        assert m["thumbnail_url"] == m["url"]
        admin.delete(f"{API}/admin/media/{m['id']}", timeout=60)
        admin.delete(f"{API}/admin/media/{m['id']}/force", timeout=60)

    def test_update_details_and_move(self, admin):
        f1 = admin.post(f"{API}/admin/media/folders", json={"name": f"TEST_A_{uuid.uuid4().hex[:5]}"}, timeout=60).json()["data"]["id"]
        f2 = admin.post(f"{API}/admin/media/folders", json={"name": f"TEST_B_{uuid.uuid4().hex[:5]}"}, timeout=60).json()["data"]["id"]
        mid = admin.post(
            f"{API}/admin/media",
            files={"file": ("TEST_move.png", png_bytes(300, 200), "image/png")},
            data={"folder_id": f1},
            timeout=120,
        ).json()["data"]["id"]

        r = admin.patch(f"{API}/admin/media/{mid}", json={"alt_text": "TEST alt", "caption": "TEST caption"}, timeout=60)
        assert r.status_code == 200, r.text[:300]

        r = admin.patch(f"{API}/admin/media/{mid}/move", json={"folder_id": f2}, timeout=60)
        assert r.status_code == 200, r.text[:300]

        got = admin.get(f"{API}/admin/media/{mid}", timeout=60).json()["data"]
        assert got["alt_text"] == "TEST alt"
        assert got["caption"] == "TEST caption"
        assert got["folder_id"] == f2

        # folder filter reflects the move
        in_f2 = admin.get(f"{API}/admin/media?folder_id={f2}&per_page=100", timeout=60).json()["data"]
        assert mid in [x["id"] for x in in_f2]
        in_f1 = admin.get(f"{API}/admin/media?folder_id={f1}&per_page=100", timeout=60).json()["data"]
        assert mid not in [x["id"] for x in in_f1]

        admin.delete(f"{API}/admin/media/{mid}", timeout=60)
        admin.delete(f"{API}/admin/media/{mid}/force", timeout=60)
        admin.delete(f"{API}/admin/media/folders/{f1}", timeout=60)
        admin.delete(f"{API}/admin/media/folders/{f2}", timeout=60)

    def test_usage_tracking_and_force_delete_protection(self, admin):
        mid = admin.post(
            f"{API}/admin/media",
            files={"file": ("TEST_usage.png", png_bytes(640, 480), "image/png")},
            timeout=120,
        ).json()["data"]["id"]

        u = admin.get(f"{API}/admin/media/{mid}/usage", timeout=60)
        assert u.status_code == 200, u.text[:300]
        assert u.json()["data"]["total"] == 0
        assert u.json()["data"]["references"] == []

        project = admin.get(f"{API}/admin/projects?per_page=1", timeout=60).json()["data"][0]
        pid = project["id"]
        original_cover = (project.get("cover_media") or {}).get("id") if project.get("cover_media") else project.get("cover_media_id")

        r = admin.patch(f"{API}/admin/projects/{pid}", json={"cover_media_id": mid}, timeout=60)
        assert r.status_code == 200, r.text[:400]

        u = admin.get(f"{API}/admin/media/{mid}/usage", timeout=60).json()["data"]
        assert u["total"] == 1, u
        refs = {x["label"]: x["count"] for x in u["references"]}
        assert refs.get("Projects") == 1, u

        d = admin.delete(f"{API}/admin/media/{mid}/force", timeout=60)
        assert d.status_code == 409, f"expected 409, got {d.status_code} {d.text[:200]}"
        assert "still used by Projects" in d.json().get("message", ""), d.json().get("message")

        # release then force delete works
        assert admin.patch(f"{API}/admin/projects/{pid}", json={"cover_media_id": None}, timeout=60).status_code == 200
        assert admin.get(f"{API}/admin/media/{mid}/usage", timeout=60).json()["data"]["total"] == 0
        assert admin.delete(f"{API}/admin/media/{mid}/force", timeout=60).status_code == 200
        assert admin.get(f"{API}/admin/media/{mid}", timeout=60).status_code == 404

        # restore original cover
        if original_cover:
            admin.patch(f"{API}/admin/projects/{pid}", json={"cover_media_id": original_cover}, timeout=60)


# ---------------------------------------------------------------- rich text sanitisation
XSS = '<p>Aman</p><script>alert(1)</script><img src=x onerror=alert(1)>'


class TestRichTextSanitisation:
    """Patches the full id-translation object with a poisoned rich-text field,
    asserts the stored value is the sanitised allowlist output, then restores."""

    def _roundtrip(self, admin, get_url, patch_url, field, container="data"):
        row = admin.get(get_url, timeout=60).json()[container]
        if isinstance(row, list):
            row = row[0]
        translations = dict((row.get("translations") or {}).get("id") or {})
        original = translations.get(field)
        payload = dict(translations)
        payload[field] = XSS
        r = admin.patch(patch_url or get_url, json={"translations": {"id": payload}}, timeout=60)
        assert r.status_code == 200, r.text[:400]

        row = admin.get(get_url, timeout=60).json()[container]
        if isinstance(row, list):
            row = row[0]
        stored = ((row.get("translations") or {}).get("id") or {}).get(field)

        # restore
        translations[field] = original
        admin.patch(patch_url or get_url, json={"translations": {"id": translations}}, timeout=60)
        return stored

    def test_project_content_sanitised(self, admin):
        pid = admin.get(f"{API}/admin/projects?per_page=1", timeout=60).json()["data"][0]["id"]
        stored = self._roundtrip(admin, f"{API}/admin/projects/{pid}", None, "content")
        assert "<script" not in (stored or "").lower()
        assert "onerror" not in (stored or "").lower()
        assert (stored or "").strip() == "<p>Aman</p>", stored

    def test_faq_answer_sanitised(self, admin):
        fid = admin.get(f"{API}/admin/faqs?per_page=1", timeout=60).json()["data"][0]["id"]
        stored = self._roundtrip(admin, f"{API}/admin/faqs/{fid}", None, "answer")
        assert "<script" not in (stored or "").lower()
        assert "onerror" not in (stored or "").lower()
        assert (stored or "").strip() == "<p>Aman</p>", stored

    def test_about_bio_sanitised(self, admin):
        stored = self._roundtrip(admin, f"{API}/admin/about", None, "bio_paragraph_1")
        assert "<script" not in (stored or "").lower()
        assert "onerror" not in (stored or "").lower()
        assert (stored or "").strip() == "<p>Aman</p>", stored


# ---------------------------------------------------------------- flat translatable payload guard
class TestFlatTranslatableGuard:
    def test_project_flat_title_rejected(self, admin):
        pid = admin.get(f"{API}/admin/projects?per_page=1", timeout=60).json()["data"][0]["id"]
        r = admin.patch(f"{API}/admin/projects/{pid}", json={"title": "flat"}, timeout=60)
        assert r.status_code == 422, f"{r.status_code} {r.text[:300]}"
        errors = r.json().get("errors") or {}
        assert "title" in errors, errors
        assert "Send title inside translations.{locale} instead." in errors["title"][0], errors

    def test_project_nested_title_accepted(self, admin):
        p = admin.get(f"{API}/admin/projects?per_page=1", timeout=60).json()["data"][0]
        pid = p["id"]
        original = (p.get("translations") or {}).get("id", {}).get("title") or p.get("title")
        r = admin.patch(f"{API}/admin/projects/{pid}", json={"translations": {"id": {"title": "TEST_NestedOK"}}}, timeout=60)
        assert r.status_code == 200, r.text[:400]
        got = admin.get(f"{API}/admin/projects/{pid}", timeout=60).json()["data"]
        title = (got.get("translations") or {}).get("id", {}).get("title") or got.get("title")
        assert title == "TEST_NestedOK"
        if original:
            admin.patch(f"{API}/admin/projects/{pid}", json={"translations": {"id": {"title": original}}}, timeout=60)

    def test_faq_flat_fields_rejected(self, admin):
        fid = admin.get(f"{API}/admin/faqs?per_page=1", timeout=60).json()["data"][0]["id"]
        r = admin.patch(f"{API}/admin/faqs/{fid}", json={"question": "flat", "answer": "<p>flat</p>"}, timeout=60)
        assert r.status_code == 422, f"{r.status_code} {r.text[:300]}"
        errors = r.json().get("errors") or {}
        assert "question" in errors and "answer" in errors, errors
        assert "translations.{locale}" in errors["question"][0]

    def test_seo_flat_meta_title_rejected(self, admin):
        seo = admin.get(f"{API}/admin/seo-settings?per_page=1", timeout=60).json()["data"][0]
        sid = seo["id"]
        r = admin.patch(f"{API}/admin/seo-settings/{sid}", json={"meta_title": "flat"}, timeout=60)
        assert r.status_code == 422, f"{r.status_code} {r.text[:300]}"
        errors = r.json().get("errors") or {}
        assert "meta_title" in errors, errors
        assert "translations.{locale}" in errors["meta_title"][0]
