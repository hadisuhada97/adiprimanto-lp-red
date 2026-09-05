"""Phase F6 — public contact form, honeypot, throttle, SEO endpoints, revalidate webhook."""

import json
import os
import time
import uuid

import pytest
import requests
from dotenv import dotenv_values

fe_env = dotenv_values("/app/frontend/.env")
_api = os.environ.get("NEXT_PUBLIC_API_BASE_URL") or fe_env.get("NEXT_PUBLIC_API_BASE_URL")
if not _api:
    raise RuntimeError("NEXT_PUBLIC_API_BASE_URL missing")
API = _api.rstrip("/")
SITE = API.replace("/api/v1", "")
REVALIDATE_SECRET = fe_env.get("REVALIDATE_SECRET")
LOCAL_NEXT = "http://localhost:3000"

ADMIN_EMAIL = "shell.test@adiprimanto.com"
ADMIN_PASSWORD = "ShellTester#2026"


@pytest.fixture(scope="session")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json", "Accept": "application/json"})
    return s


@pytest.fixture(scope="session")
def token(client):
    r = client.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    if r.status_code == 429:
        pytest.fail("Login throttled (429) — clear cache before running")
    if r.status_code != 200:
        pytest.fail(f"Login failed {r.status_code}: {r.text[:400]}")
    body = r.json()
    tok = body.get("data", {}).get("access_token") or body.get("access_token")
    if not tok:
        pytest.fail(f"No access_token in login response (2FA required?): {r.text[:400]}")
    return tok


@pytest.fixture(scope="session")
def auth(token):
    s = requests.Session()
    s.headers.update({
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": f"Bearer {token}",
    })
    return s


# --- Public contact message ---------------------------------------------------
class TestPublicContact:
    def test_submit_valid_and_persist_in_inbox(self, client, auth):
        marker = uuid.uuid4().hex[:8]
        payload = {
            "name": f"TEST_QA {marker}",
            "email": f"qa_{marker}@example.test",
            "message": f"TEST_ pesan otomatis dari pytest F6 marker {marker}",
            "website": "",
        }
        r = client.post(f"{API}/public/contact-messages", json=payload)
        assert r.status_code in (200, 201), f"{r.status_code}: {r.text[:400]}"
        body = r.json()
        assert body.get("success") is True, body
        # Verify it landed in the admin inbox
        lst = auth.get(f"{API}/admin/contact-messages", params={"search": marker})
        assert lst.status_code == 200, lst.text[:400]
        items = lst.json().get("data", [])
        if isinstance(items, dict):
            items = items.get("data", [])
        found = [i for i in items if marker in json.dumps(i)]
        assert found, f"Lead with marker {marker} not found in inbox: {lst.text[:600]}"
        assert found[0]["status"] == "new", found[0]
        assert found[0]["email"] == payload["email"]
        assert "_id" not in found[0]

    def test_short_message_returns_422(self, client):
        r = client.post(f"{API}/public/contact-messages", json={
            "name": "TEST_QA short", "email": "short@example.test", "message": "hai",
        })
        assert r.status_code == 422, f"{r.status_code}: {r.text[:300]}"
        assert "message" in r.json().get("errors", {}), r.text[:300]

    def test_missing_fields_returns_422(self, client):
        r = client.post(f"{API}/public/contact-messages", json={})
        assert r.status_code == 422
        errors = r.json().get("errors", {})
        assert set(["name", "email", "message"]).issubset(errors.keys()), errors

    def test_honeypot_rejected(self, client):
        r = client.post(f"{API}/public/contact-messages", json={
            "name": "TEST_QA bot",
            "email": "bot@example.test",
            "message": "TEST_ ini pesan bot yang panjang cukup",
            "website": "http://spam.example",
        })
        assert r.status_code == 422, f"{r.status_code}: {r.text[:300]}"
        assert "automated" in r.text.lower(), r.text[:300]

    def test_rate_limit_5_per_minute(self, client):
        codes = []
        for i in range(7):
            r = client.post(f"{API}/public/contact-messages", json={
                "name": f"TEST_QA rl{i}",
                "email": f"rl{i}@example.test",
                "message": f"TEST_ rate limit probe number {i} padding text",
            })
            codes.append(r.status_code)
            if r.status_code == 429:
                break
        assert 429 in codes, f"No 429 observed, codes={codes}"


# --- SEO / public settings endpoints ------------------------------------------
class TestPublicSeo:
    def test_seo_home_entry(self, client):
        r = client.get(f"{API}/public/seo?page_key=home")
        assert r.status_code == 200, r.text[:300]
        payload = r.json().get("data")
        data = payload[0] if isinstance(payload, list) else payload
        assert data.get("meta_title"), data
        assert data.get("meta_description"), data
        sd = data.get("structured_data")
        assert isinstance(sd, dict) and sd, "structured_data empty"
        types = json.dumps(sd)
        for expected in ("Person", "LocalBusiness", "WebSite"):
            assert expected in types, f"{expected} missing from structured_data"

    def test_public_settings(self, client):
        r = client.get(f"{API}/public/settings")
        assert r.status_code == 200
        data = r.json().get("data", {})
        assert data.get("general", {}).get("base_url"), data

    def test_public_navigation(self, client):
        r = client.get(f"{API}/public/navigation")
        assert r.status_code == 200
        payload = r.json().get("data")
        assert payload, payload


# --- Frontend rendered SEO artefacts ------------------------------------------
class TestRenderedSeo:
    def test_root_html_title_and_description_from_cms(self, client):
        payload = client.get(f"{API}/public/seo?page_key=home").json()["data"]
        seo = payload[0] if isinstance(payload, list) else payload
        html = requests.get(f"{SITE}/", timeout=60).text
        assert "<title>" in html
        title_txt = seo["meta_title"].split("—")[0].strip()
        assert title_txt in html, "CMS meta_title not present in root HTML"
        assert seo["meta_description"][:40] in html, "CMS meta_description not in root HTML"

    def test_json_ld_valid_and_from_cms(self):
        html = requests.get(f"{SITE}/", timeout=60).text
        start = html.find('type="application/ld+json"')
        assert start != -1, "no ld+json script"
        block = html[start:]
        block = block[block.find(">") + 1: block.find("</script>")]
        parsed = json.loads(block.replace("&quot;", '"'))
        dumped = json.dumps(parsed)
        for expected in ("Person", "LocalBusiness", "WebSite"):
            assert expected in dumped, f"{expected} missing in rendered JSON-LD"

    def test_robots_txt(self, client):
        r = requests.get(f"{SITE}/robots.txt", timeout=60)
        assert r.status_code == 200
        assert "Allow: /" in r.text
        assert "Disallow: /admin" in r.text
        settings = client.get(f"{API}/public/settings").json()["data"]
        base = settings["general"]["base_url"].rstrip("/")
        assert f"Sitemap: {base}/sitemap.xml" in r.text, r.text[-300:]

    def test_sitemap_xml(self):
        r = requests.get(f"{SITE}/sitemap.xml", timeout=60)
        assert r.status_code == 200
        assert "<urlset" in r.text
        for anchor in ("#about", "#services", "#portfolio"):
            assert anchor in r.text, f"{anchor} missing from sitemap"


# --- Revalidate webhook (local only, ingress does not proxy /api to Next) -----
class TestRevalidateWebhook:
    def test_valid_secret_and_tags(self):
        r = requests.post(f"{LOCAL_NEXT}/api/revalidate",
                          headers={"X-Revalidate-Secret": REVALIDATE_SECRET},
                          json={"tags": ["landing", "seo"]}, timeout=30)
        assert r.status_code == 200, r.text[:300]
        body = r.json()
        assert body["success"] is True
        assert sorted(body["data"]["revalidated"]) == ["landing", "seo"]

    def test_wrong_secret_401(self):
        r = requests.post(f"{LOCAL_NEXT}/api/revalidate",
                          headers={"X-Revalidate-Secret": "nope"},
                          json={"tags": ["landing"]}, timeout=30)
        assert r.status_code == 401, r.text[:200]

    def test_missing_tags_422(self):
        r = requests.post(f"{LOCAL_NEXT}/api/revalidate",
                          headers={"X-Revalidate-Secret": REVALIDATE_SECRET},
                          json={}, timeout=30)
        assert r.status_code == 422, r.text[:200]

    def test_admin_mutation_triggers_revalidation_without_errors(self, auth):
        log = "/app/backend/storage/logs/laravel.log"
        before = os.path.getsize(log) if os.path.exists(log) else 0
        lst = auth.get(f"{API}/admin/testimonials")
        assert lst.status_code == 200, lst.text[:300]
        items = lst.json().get("data", [])
        if isinstance(items, dict):
            items = items.get("data", [])
        if not items:
            pytest.skip("no testimonials to toggle")
        tid = items[0]["id"]
        r = auth.patch(f"{API}/admin/testimonials/{tid}/toggle-active")
        assert r.status_code == 200, r.text[:300]
        # restore
        auth.patch(f"{API}/admin/testimonials/{tid}/toggle-active")
        time.sleep(3)
        with open(log, "r", errors="ignore") as fh:
            fh.seek(before)
            tail = fh.read()
        assert "revalidation failed" not in tail.lower(), tail[-1500:]


# --- Admin inbox smoke --------------------------------------------------------
class TestAdminInboxSmoke:
    def test_list_and_stats(self, auth):
        r = auth.get(f"{API}/admin/contact-messages")
        assert r.status_code == 200, r.text[:300]
        assert "data" in r.json()

    def test_requires_auth(self, client):
        r = client.get(f"{API}/admin/contact-messages")
        assert r.status_code == 401, r.status_code
