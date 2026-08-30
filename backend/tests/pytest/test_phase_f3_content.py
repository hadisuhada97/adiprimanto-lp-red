"""Phase F3 backend tests — Testimonials, Services (+ Stats), FAQ (categories + questions),
Site Settings, Public content API and Editor permissions.
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


def payload_data(response):
    body = response.json()
    assert body.get("success") is not False, body
    return body["data"]


# ---------------------------------------------------------------- Testimonials
class TestTestimonials:
    created = []

    def test_list_seeded(self, admin):
        r = admin.get(f"{API}/admin/testimonials", timeout=30)
        assert r.status_code == 200, r.text[:300]
        items = payload_data(r)
        assert isinstance(items, list)
        assert len(items) >= 3, f"expected >=3 seeded testimonials, got {len(items)}"
        first = items[0]
        for key in ("id", "name", "feedback", "rating", "translations", "is_active", "sort_order"):
            assert key in first
        assert "_id" not in first

    def test_validation_no_translations(self, admin):
        r = admin.post(f"{API}/admin/testimonials", json={"rating": 5}, timeout=30)
        assert r.status_code == 422, f"{r.status_code} {r.text[:300]}"
        body = r.json()
        assert "translations" in body.get("errors", {}), body

    def test_validation_bad_accent_color(self, admin):
        r = admin.post(
            f"{API}/admin/testimonials",
            json={
                "rating": 5,
                "accent_color": "red",
                "translations": {"id": {"name": "TEST_x", "feedback": "ok"}},
            },
            timeout=30,
        )
        assert r.status_code == 422
        assert "accent_color" in r.json().get("errors", {})

    def test_full_lifecycle(self, admin):
        create = {
            "rating": 4,
            "accent_color": "#ef4444",
            "source": "manual",
            "is_featured": True,
            "is_active": True,
            "translations": {
                "id": {
                    "name": "TEST_Klien Satu",
                    "role": "Direktur",
                    "company": "PT TEST",
                    "project_label": "Landing Page",
                    "feedback": "Kerja bagus sekali.",
                },
                "en": {
                    "name": "TEST_Client One",
                    "role": "Director",
                    "company": "TEST Inc",
                    "project_label": "Landing Page",
                    "feedback": "Great work indeed.",
                },
            },
        }
        r = admin.post(f"{API}/admin/testimonials", json=create, timeout=30)
        assert r.status_code == 201, f"{r.status_code} {r.text[:400]}"
        item = payload_data(r)
        tid = item["id"]
        TestTestimonials.created.append(tid)
        assert item["rating"] == 4
        assert item["accent_color"] == "#ef4444"
        assert item["is_featured"] is True
        assert item["translations"]["id"]["name"] == "TEST_Klien Satu"
        assert item["translations"]["en"]["feedback"] == "Great work indeed."

        # GET verifies persistence
        r = admin.get(f"{API}/admin/testimonials/{tid}", timeout=30)
        assert r.status_code == 200
        got = payload_data(r)
        assert got["translations"]["en"]["name"] == "TEST_Client One"

        # UPDATE (partial: only rating + EN translation)
        r = admin.put(
            f"{API}/admin/testimonials/{tid}",
            json={
                "rating": 5,
                "translations": {
                    "id": create["translations"]["id"],
                    "en": {"name": "TEST_Client One", "feedback": "Updated feedback."},
                },
            },
            timeout=30,
        )
        assert r.status_code == 200, r.text[:300]
        got = payload_data(r)
        assert got["rating"] == 5
        assert got["translations"]["en"]["feedback"] == "Updated feedback."
        assert got["translations"]["id"]["name"] == "TEST_Klien Satu"

        r = admin.get(f"{API}/admin/testimonials/{tid}", timeout=30)
        assert payload_data(r)["rating"] == 5

        # TOGGLE ACTIVE
        r = admin.patch(f"{API}/admin/testimonials/{tid}/toggle-active", timeout=30)
        assert r.status_code == 200
        assert payload_data(r)["is_active"] is False
        assert payload_data(admin.get(f"{API}/admin/testimonials/{tid}", timeout=30))["is_active"] is False
        admin.patch(f"{API}/admin/testimonials/{tid}/toggle-active", timeout=30)

        # REORDER
        ids = [i["id"] for i in payload_data(admin.get(f"{API}/admin/testimonials", timeout=30))]
        reordered = list(reversed(ids))
        r = admin.post(
            f"{API}/admin/testimonials/reorder",
            json={"items": [{"id": i, "sort_order": n} for n, i in enumerate(reordered)]},
            timeout=30,
        )
        assert r.status_code == 200, r.text[:300]
        assert "order updated" in r.json()["message"].lower()
        after = [i["id"] for i in payload_data(admin.get(f"{API}/admin/testimonials", timeout=30))]
        assert after == reordered, "reorder not persisted"
        # restore original order
        admin.post(
            f"{API}/admin/testimonials/reorder",
            json={"items": [{"id": i, "sort_order": n} for n, i in enumerate(ids)]},
            timeout=30,
        )

        # TRASH -> list(trashed) -> RESTORE -> FORCE DELETE
        r = admin.delete(f"{API}/admin/testimonials/{tid}", timeout=30)
        assert r.status_code == 200, r.text[:300]
        active_ids = [i["id"] for i in payload_data(admin.get(f"{API}/admin/testimonials", timeout=30))]
        assert tid not in active_ids
        trashed = payload_data(admin.get(f"{API}/admin/testimonials?trashed=1", timeout=30))
        assert tid in [i["id"] for i in trashed]
        assert admin.post(f"{API}/admin/testimonials/{tid}/restore", timeout=30).status_code == 200
        assert tid in [i["id"] for i in payload_data(admin.get(f"{API}/admin/testimonials", timeout=30))]

        admin.delete(f"{API}/admin/testimonials/{tid}", timeout=30)
        r = admin.delete(f"{API}/admin/testimonials/{tid}/force", timeout=30)
        assert r.status_code == 200, r.text[:300]
        TestTestimonials.created.remove(tid)
        assert admin.get(f"{API}/admin/testimonials/{tid}", timeout=30).status_code == 404

    def test_search_filter(self, admin):
        items = payload_data(admin.get(f"{API}/admin/testimonials", timeout=30))
        name = items[0]["translations"].get("id", {}).get("name") or items[0]["name"]
        token = name.split()[0]
        r = admin.get(f"{API}/admin/testimonials", params={"search": token}, timeout=30)
        assert r.status_code == 200
        assert len(payload_data(r)) >= 1

    @classmethod
    def teardown_class(cls):
        s = _login(*SUPER_ADMIN)
        for tid in cls.created:
            s.delete(f"{API}/admin/testimonials/{tid}", timeout=30)
            s.delete(f"{API}/admin/testimonials/{tid}/force", timeout=30)


# ---------------------------------------------------------------- Services + Stats
class TestServices:
    created = []
    created_stats = []

    def test_list_seeded_services(self, admin):
        r = admin.get(f"{API}/admin/services", timeout=30)
        assert r.status_code == 200, r.text[:300]
        items = payload_data(r)
        assert len(items) >= 7, f"expected >=7 seeded services, got {len(items)}"
        assert "tags" in items[0] and isinstance(items[0]["tags"], list)

    def test_list_seeded_stats(self, admin):
        r = admin.get(f"{API}/admin/service-stats", timeout=30)
        assert r.status_code == 200, r.text[:300]
        items = payload_data(r)
        assert len(items) >= 3, f"expected >=3 seeded stats, got {len(items)}"

    def test_service_validation(self, admin):
        r = admin.post(f"{API}/admin/services", json={"icon_name": "code"}, timeout=30)
        assert r.status_code == 422
        assert "translations" in r.json().get("errors", {})

    def test_service_lifecycle(self, admin):
        create = {
            "icon_name": "code",
            "price_from": 2500000,
            "price_currency": "IDR",
            "duration_days": 14,
            "is_featured": True,
            "translations": {
                "id": {"title": "TEST_Layanan", "description": "Deskripsi", "tags": ["Web", "API"]},
                "en": {"title": "TEST_Service", "description": "Description", "tags": ["Web", "API"]},
            },
        }
        r = admin.post(f"{API}/admin/services", json=create, timeout=30)
        assert r.status_code == 201, f"{r.status_code} {r.text[:400]}"
        item = payload_data(r)
        sid = item["id"]
        TestServices.created.append(sid)
        assert item["price_from"] == 2500000
        assert item["price_currency"] == "IDR"
        assert item["duration_days"] == 14
        assert item["translations"]["id"]["tags"] == ["Web", "API"]

        r = admin.put(
            f"{API}/admin/services/{sid}",
            json={"duration_days": 21, "translations": {"id": {"title": "TEST_Layanan Baru", "tags": ["X"]}}},
            timeout=30,
        )
        assert r.status_code == 200, r.text[:300]
        got = payload_data(admin.get(f"{API}/admin/services/{sid}", timeout=30))
        assert got["duration_days"] == 21
        assert got["translations"]["id"]["title"] == "TEST_Layanan Baru"

        r = admin.patch(f"{API}/admin/services/{sid}/toggle-active", timeout=30)
        assert r.status_code == 200 and payload_data(r)["is_active"] is False
        admin.patch(f"{API}/admin/services/{sid}/toggle-active", timeout=30)

        ids = [i["id"] for i in payload_data(admin.get(f"{API}/admin/services", timeout=30))]
        rev = list(reversed(ids))
        assert admin.post(
            f"{API}/admin/services/reorder",
            json={"items": [{"id": i, "sort_order": n} for n, i in enumerate(rev)]},
            timeout=30,
        ).status_code == 200
        after = [i["id"] for i in payload_data(admin.get(f"{API}/admin/services", timeout=30))]
        assert after == rev
        admin.post(
            f"{API}/admin/services/reorder",
            json={"items": [{"id": i, "sort_order": n} for n, i in enumerate(ids)]},
            timeout=30,
        )

        assert admin.delete(f"{API}/admin/services/{sid}", timeout=30).status_code == 200
        assert sid in [i["id"] for i in payload_data(admin.get(f"{API}/admin/services?trashed=1", timeout=30))]
        assert admin.post(f"{API}/admin/services/{sid}/restore", timeout=30).status_code == 200
        admin.delete(f"{API}/admin/services/{sid}", timeout=30)
        assert admin.delete(f"{API}/admin/services/{sid}/force", timeout=30).status_code == 200
        TestServices.created.remove(sid)
        assert admin.get(f"{API}/admin/services/{sid}", timeout=30).status_code == 404

    def test_stat_lifecycle(self, admin):
        r = admin.post(
            f"{API}/admin/service-stats",
            json={
                "value": "42",
                "icon_name": "star",
                "translations": {
                    "id": {"unit": "+", "label": "TEST_Proyek"},
                    "en": {"unit": "+", "label": "TEST_Projects"},
                },
            },
            timeout=30,
        )
        assert r.status_code == 201, f"{r.status_code} {r.text[:400]}"
        item = payload_data(r)
        stat_id = item["id"]
        TestServices.created_stats.append(stat_id)
        assert item["value"] == "42"

        r = admin.put(f"{API}/admin/service-stats/{stat_id}", json={"value": "99"}, timeout=30)
        assert r.status_code == 200, r.text[:300]
        listed = {i["id"]: i for i in payload_data(admin.get(f"{API}/admin/service-stats", timeout=30))}
        assert listed[stat_id]["value"] == "99"

        r = admin.patch(f"{API}/admin/service-stats/{stat_id}/toggle-active", timeout=30)
        assert r.status_code == 200 and payload_data(r)["is_active"] is False
        admin.patch(f"{API}/admin/service-stats/{stat_id}/toggle-active", timeout=30)

        ids = [i["id"] for i in payload_data(admin.get(f"{API}/admin/service-stats", timeout=30))]
        rev = list(reversed(ids))
        assert admin.post(
            f"{API}/admin/service-stats/reorder",
            json={"items": [{"id": i, "sort_order": n} for n, i in enumerate(rev)]},
            timeout=30,
        ).status_code == 200
        after = [i["id"] for i in payload_data(admin.get(f"{API}/admin/service-stats", timeout=30))]
        assert after == rev
        admin.post(
            f"{API}/admin/service-stats/reorder",
            json={"items": [{"id": i, "sort_order": n} for n, i in enumerate(ids)]},
            timeout=30,
        )

        assert admin.delete(f"{API}/admin/service-stats/{stat_id}", timeout=30).status_code == 200
        trashed = [i["id"] for i in payload_data(admin.get(f"{API}/admin/service-stats?trashed=1", timeout=30))]
        assert stat_id in trashed
        assert admin.post(f"{API}/admin/service-stats/{stat_id}/restore", timeout=30).status_code == 200
        admin.delete(f"{API}/admin/service-stats/{stat_id}", timeout=30)
        assert admin.delete(f"{API}/admin/service-stats/{stat_id}/force", timeout=30).status_code == 200
        TestServices.created_stats.remove(stat_id)
        assert stat_id not in [i["id"] for i in payload_data(admin.get(f"{API}/admin/service-stats?trashed=1", timeout=30))]

    @classmethod
    def teardown_class(cls):
        s = _login(*SUPER_ADMIN)
        for sid in cls.created:
            s.delete(f"{API}/admin/services/{sid}", timeout=30)
            s.delete(f"{API}/admin/services/{sid}/force", timeout=30)
        for sid in cls.created_stats:
            s.delete(f"{API}/admin/service-stats/{sid}", timeout=30)
            s.delete(f"{API}/admin/service-stats/{sid}/force", timeout=30)


# ---------------------------------------------------------------- FAQ
class TestFaq:
    created_categories = []
    created_faqs = []

    def test_list_seeded_categories(self, admin):
        r = admin.get(f"{API}/admin/faq-categories", timeout=30)
        assert r.status_code == 200, r.text[:300]
        items = payload_data(r)
        assert len(items) >= 3, f"expected >=3 seeded categories, got {len(items)}"
        assert "faqs_count" in items[0] or "questions_count" in items[0], items[0].keys()

    def test_list_seeded_questions(self, admin):
        r = admin.get(f"{API}/admin/faqs", timeout=30)
        assert r.status_code == 200, r.text[:300]
        items = payload_data(r)
        assert len(items) >= 4, f"expected >=4 seeded FAQs, got {len(items)}"
        assert items[0]["category"] is not None

    def test_category_duplicate_slug_422(self, admin):
        existing = payload_data(admin.get(f"{API}/admin/faq-categories", timeout=30))[0]["slug"]
        r = admin.post(
            f"{API}/admin/faq-categories",
            json={"slug": existing, "translations": {"id": {"name": "TEST_Dup"}}},
            timeout=30,
        )
        assert r.status_code == 422, f"{r.status_code} {r.text[:300]}"
        assert "slug" in r.json().get("errors", {})

    def test_category_lifecycle(self, admin):
        r = admin.post(
            f"{API}/admin/faq-categories",
            json={
                "slug": "test-kategori-qa",
                "translations": {"id": {"name": "TEST_Kategori QA"}, "en": {"name": "TEST_Category QA"}},
            },
            timeout=30,
        )
        assert r.status_code == 201, f"{r.status_code} {r.text[:400]}"
        cat = payload_data(r)
        cid = cat["id"]
        TestFaq.created_categories.append(cid)
        assert cat["slug"] == "test-kategori-qa"

        r = admin.put(
            f"{API}/admin/faq-categories/{cid}",
            json={"translations": {"id": {"name": "TEST_Kategori QA2"}}},
            timeout=30,
        )
        assert r.status_code == 200, r.text[:300]
        got = payload_data(admin.get(f"{API}/admin/faq-categories/{cid}", timeout=30))
        assert got["translations"]["id"]["name"] == "TEST_Kategori QA2"

        r = admin.patch(f"{API}/admin/faq-categories/{cid}/toggle-active", timeout=30)
        assert r.status_code == 200 and payload_data(r)["is_active"] is False
        admin.patch(f"{API}/admin/faq-categories/{cid}/toggle-active", timeout=30)

        # FAQ question under this category
        r = admin.post(
            f"{API}/admin/faqs",
            json={
                "faq_category_id": cid,
                "translations": {
                    "id": {"question": "TEST_Pertanyaan?", "answer": "Jawaban."},
                    "en": {"question": "TEST_Question?", "answer": "Answer."},
                },
            },
            timeout=30,
        )
        assert r.status_code == 201, f"{r.status_code} {r.text[:400]}"
        faq = payload_data(r)
        fid = faq["id"]
        TestFaq.created_faqs.append(fid)
        assert faq["faq_category_id"] == cid

        # category filter
        r = admin.get(f"{API}/admin/faqs", params={"category_id": cid}, timeout=30)
        assert r.status_code == 200
        filtered = payload_data(r)
        assert [i["id"] for i in filtered] == [fid], f"category filter returned {len(filtered)} rows"

        # search
        r = admin.get(f"{API}/admin/faqs", params={"search": "TEST_Pertanyaan"}, timeout=30)
        assert r.status_code == 200
        assert fid in [i["id"] for i in payload_data(r)]

        # update + toggle
        r = admin.put(
            f"{API}/admin/faqs/{fid}",
            json={"translations": {"id": {"question": "TEST_Pertanyaan Baru?", "answer": "Jawaban baru."}}},
            timeout=30,
        )
        assert r.status_code == 200, r.text[:300]
        got = payload_data(admin.get(f"{API}/admin/faqs/{fid}", timeout=30))
        assert got["translations"]["id"]["question"] == "TEST_Pertanyaan Baru?"

        r = admin.patch(f"{API}/admin/faqs/{fid}/toggle-active", timeout=30)
        assert r.status_code == 200 and payload_data(r)["is_active"] is False
        admin.patch(f"{API}/admin/faqs/{fid}/toggle-active", timeout=30)

        # FAQ reorder
        ids = [i["id"] for i in payload_data(admin.get(f"{API}/admin/faqs", timeout=30))]
        rev = list(reversed(ids))
        assert admin.post(
            f"{API}/admin/faqs/reorder",
            json={"items": [{"id": i, "sort_order": n} for n, i in enumerate(rev)]},
            timeout=30,
        ).status_code == 200
        assert [i["id"] for i in payload_data(admin.get(f"{API}/admin/faqs", timeout=30))] == rev
        admin.post(
            f"{API}/admin/faqs/reorder",
            json={"items": [{"id": i, "sort_order": n} for n, i in enumerate(ids)]},
            timeout=30,
        )

        # FAQ trash/restore/force
        assert admin.delete(f"{API}/admin/faqs/{fid}", timeout=30).status_code == 200
        assert fid in [i["id"] for i in payload_data(admin.get(f"{API}/admin/faqs?trashed=1", timeout=30))]
        assert admin.post(f"{API}/admin/faqs/{fid}/restore", timeout=30).status_code == 200
        admin.delete(f"{API}/admin/faqs/{fid}", timeout=30)
        assert admin.delete(f"{API}/admin/faqs/{fid}/force", timeout=30).status_code == 200
        TestFaq.created_faqs.remove(fid)
        assert admin.get(f"{API}/admin/faqs/{fid}", timeout=30).status_code == 404

        # category reorder
        cids = [i["id"] for i in payload_data(admin.get(f"{API}/admin/faq-categories", timeout=30))]
        crev = list(reversed(cids))
        assert admin.post(
            f"{API}/admin/faq-categories/reorder",
            json={"items": [{"id": i, "sort_order": n} for n, i in enumerate(crev)]},
            timeout=30,
        ).status_code == 200
        assert [i["id"] for i in payload_data(admin.get(f"{API}/admin/faq-categories", timeout=30))] == crev
        admin.post(
            f"{API}/admin/faq-categories/reorder",
            json={"items": [{"id": i, "sort_order": n} for n, i in enumerate(cids)]},
            timeout=30,
        )

        # category trash/restore/force
        assert admin.delete(f"{API}/admin/faq-categories/{cid}", timeout=30).status_code == 200
        assert cid in [i["id"] for i in payload_data(admin.get(f"{API}/admin/faq-categories?trashed=1", timeout=30))]
        assert admin.post(f"{API}/admin/faq-categories/{cid}/restore", timeout=30).status_code == 200
        admin.delete(f"{API}/admin/faq-categories/{cid}", timeout=30)
        assert admin.delete(f"{API}/admin/faq-categories/{cid}/force", timeout=30).status_code == 200
        TestFaq.created_categories.remove(cid)
        assert admin.get(f"{API}/admin/faq-categories/{cid}", timeout=30).status_code == 404

    def test_faq_validation(self, admin):
        r = admin.post(f"{API}/admin/faqs", json={"is_active": True}, timeout=30)
        assert r.status_code == 422
        assert "translations" in r.json().get("errors", {})

    @classmethod
    def teardown_class(cls):
        s = _login(*SUPER_ADMIN)
        for fid in cls.created_faqs:
            s.delete(f"{API}/admin/faqs/{fid}", timeout=30)
            s.delete(f"{API}/admin/faqs/{fid}/force", timeout=30)
        for cid in cls.created_categories:
            s.delete(f"{API}/admin/faq-categories/{cid}", timeout=30)
            s.delete(f"{API}/admin/faq-categories/{cid}/force", timeout=30)


# ---------------------------------------------------------------- Settings
class TestSettings:
    def test_index_groups(self, admin):
        r = admin.get(f"{API}/admin/settings", timeout=30)
        assert r.status_code == 200, r.text[:300]
        data = payload_data(r)
        assert "items" in data and "media" in data
        groups = {i["group"] for i in data["items"]}
        assert {"general", "appearance", "integration"} <= groups, groups

    def test_update_and_persist(self, admin):
        data = payload_data(admin.get(f"{API}/admin/settings", timeout=30))
        target = next(i for i in data["items"] if i["group"] == "general" and i["type"] in ("string", "text"))
        original = target["value"]
        new_value = "TEST_QA_VALUE"
        r = admin.patch(
            f"{API}/admin/settings",
            json={"items": [{"group": target["group"], "key": target["key"], "value": new_value}]},
            timeout=30,
        )
        assert r.status_code == 200, r.text[:300]
        assert "saved" in r.json()["message"].lower()

        after = payload_data(admin.get(f"{API}/admin/settings", timeout=30))["items"]
        got = next(i for i in after if i["group"] == target["group"] and i["key"] == target["key"])
        assert got["value"] == new_value

        # restore
        admin.patch(
            f"{API}/admin/settings",
            json={"items": [{"group": target["group"], "key": target["key"], "value": original}]},
            timeout=30,
        )
        after = payload_data(admin.get(f"{API}/admin/settings", timeout=30))["items"]
        got = next(i for i in after if i["group"] == target["group"] and i["key"] == target["key"])
        assert got["value"] == original

    def test_unknown_setting_rejected(self, admin):
        r = admin.patch(
            f"{API}/admin/settings",
            json={"items": [{"group": "general", "key": "does_not_exist_qa", "value": "x"}]},
            timeout=30,
        )
        assert r.status_code == 422, f"{r.status_code} {r.text[:300]}"


# ---------------------------------------------------------------- Public API
class TestPublicApi:
    def test_requires_no_auth_testimonials(self, anon):
        r = anon.get(f"{API}/public/testimonials", timeout=30)
        assert r.status_code == 200, r.text[:300]
        items = payload_data(r)
        assert all(i.get("is_active", True) for i in items)

    def test_locale_switch_testimonials(self, anon):
        id_items = payload_data(anon.get(f"{API}/public/testimonials?locale=id", timeout=30))
        en_items = payload_data(anon.get(f"{API}/public/testimonials?locale=en", timeout=30))
        assert len(id_items) == len(en_items) and len(id_items) > 0
        pairs = list(zip(id_items, en_items))
        assert any(a["feedback"] != b["feedback"] for a, b in pairs), "locale=en returned identical text"

    def test_services_public(self, anon):
        data = payload_data(anon.get(f"{API}/public/services?locale=en", timeout=30))
        assert "services" in data and "stats" in data
        assert len(data["services"]) >= 7
        assert len(data["stats"]) >= 3

    def test_faqs_public(self, anon):
        data = payload_data(anon.get(f"{API}/public/faqs?locale=id", timeout=30))
        assert "categories" in data and "faqs" in data
        assert len(data["faqs"]) >= 4
        en = payload_data(anon.get(f"{API}/public/faqs?locale=en", timeout=30))
        assert any(
            a["question"] != b["question"] for a, b in zip(data["faqs"], en["faqs"])
        ), "locale=en returned identical FAQ text"

    def test_settings_public_excludes_integration(self, anon):
        data = payload_data(anon.get(f"{API}/public/settings", timeout=30))
        assert "integration" not in data, "private integration group leaked in public settings"
        assert "general" in data

    def test_public_hides_inactive(self, admin, anon):
        items = payload_data(admin.get(f"{API}/admin/testimonials", timeout=30))
        target = items[0]["id"]
        admin.patch(f"{API}/admin/testimonials/{target}/toggle-active", timeout=30)
        try:
            public_ids = [i["id"] for i in payload_data(anon.get(f"{API}/public/testimonials", timeout=30))]
            assert target not in public_ids, "inactive testimonial exposed on public API"
        finally:
            admin.patch(f"{API}/admin/testimonials/{target}/toggle-active", timeout=30)


# ---------------------------------------------------------------- Permissions
class TestEditorPermissions:
    def test_editor_can_view(self, editor):
        for path in ("testimonials", "services", "service-stats", "faqs", "faq-categories", "settings"):
            r = editor.get(f"{API}/admin/{path}", timeout=30)
            assert r.status_code == 200, f"{path} -> {r.status_code} {r.text[:200]}"

    def test_editor_can_update(self, editor):
        item = payload_data(editor.get(f"{API}/admin/testimonials", timeout=30))[0]
        r = editor.patch(f"{API}/admin/testimonials/{item['id']}/toggle-active", timeout=30)
        assert r.status_code == 200, r.text[:200]
        editor.patch(f"{API}/admin/testimonials/{item['id']}/toggle-active", timeout=30)

    def test_editor_force_delete_forbidden(self, editor):
        mapping = {
            "testimonials": payload_data(editor.get(f"{API}/admin/testimonials", timeout=30))[0]["id"],
            "services": payload_data(editor.get(f"{API}/admin/services", timeout=30))[0]["id"],
            "faqs": payload_data(editor.get(f"{API}/admin/faqs", timeout=30))[0]["id"],
        }
        for path, rid in mapping.items():
            r = editor.delete(f"{API}/admin/{path}/{rid}/force", timeout=30)
            assert r.status_code == 403, f"{path} force delete -> {r.status_code} {r.text[:200]}"

    def test_unauthenticated_admin_blocked(self, anon):
        r = anon.get(f"{API}/admin/testimonials", timeout=30)
        assert r.status_code == 401, f"{r.status_code} {r.text[:200]}"
