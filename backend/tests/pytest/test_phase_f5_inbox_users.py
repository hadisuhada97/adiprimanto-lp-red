"""Phase F5 backend tests: public contact form + anti-spam, inbox, activity log,
users & roles, dashboard statistics and Editor permission boundaries."""

import os
import re
import subprocess
import time
import uuid
from pathlib import Path

import pytest
import requests
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
base = os.environ.get("NEXT_PUBLIC_API_BASE_URL") or frontend_env.get("NEXT_PUBLIC_API_BASE_URL")
if not base:
    raise RuntimeError("NEXT_PUBLIC_API_BASE_URL missing from env and /app/frontend/.env")
API = base.rstrip("/")                      # .../api/v1
ADMIN = f"{API}/admin"
LOG_FILE = Path("/app/backend/storage/logs/laravel.log")

SUPER = {"email": "shell.test@adiprimanto.com", "password": "ShellTester#2026"}
EDITOR = {"email": "editor.test@adiprimanto.com", "password": "EditorTest#2026"}


def clear_cache():
    """Clear the Laravel cache store used by the rate limiter."""
    subprocess.run(["php", "artisan", "cache:clear"], cwd="/app/backend",
                   capture_output=True, timeout=60)


def login(creds):
    clear_cache()
    r = requests.post(f"{API}/auth/login", json=creds, timeout=30)
    if r.status_code != 200:
        pytest.fail(f"Login failed for {creds['email']}: {r.status_code} {r.text[:300]}")
    data = r.json()["data"]
    assert data.get("requires_two_factor") is False
    token = data.get("access_token")
    assert isinstance(token, str) and token
    return token, data["user"]


@pytest.fixture(scope="session")
def super_session():
    token, user = login(SUPER)
    s = requests.Session()
    s.headers.update({"Authorization": f"Bearer {token}", "Accept": "application/json"})
    s.current_user = user
    return s


@pytest.fixture(scope="session")
def editor_session():
    token, _ = login(EDITOR)
    s = requests.Session()
    s.headers.update({"Authorization": f"Bearer {token}", "Accept": "application/json"})
    return s


def submit_contact(payload):
    return requests.post(f"{API}/public/contact-messages", json=payload,
                         headers={"Accept": "application/json"}, timeout=30)


def valid_payload(tag=None):
    tag = tag or uuid.uuid4().hex[:8]
    return {
        "name": f"TEST_Lead {tag}",
        "email": f"test_lead_{tag}@example.com",
        "phone": "+628123456789",
        "subject": f"TEST_Subject {tag}",
        "message": "This is a genuine enquiry message longer than ten characters.",
    }


# ---------------------------------------------------------------- public form
class TestPublicContactForm:
    def test_submit_success_and_mail_logged(self, super_session):
        clear_cache()
        size_before = LOG_FILE.stat().st_size if LOG_FILE.exists() else 0
        payload = valid_payload()
        r = submit_contact(payload)
        assert r.status_code == 201, r.text[:400]
        body = r.json()
        assert body["success"] is True
        assert "message" in body and len(body["message"]) > 0
        message_id = body["data"]["id"]
        assert isinstance(message_id, str) and len(message_id) > 10

        # persisted and visible in the admin inbox with status new
        g = super_session.get(f"{ADMIN}/contact-messages/{message_id}")
        assert g.status_code == 200, g.text[:300]
        stored = g.json()["data"]
        assert stored["name"] == payload["name"]
        assert stored["email"] == payload["email"]
        assert stored["message"] == payload["message"]

        # mail (log driver) must contain a New lead entry
        found = False
        for _ in range(12):
            time.sleep(1)
            with LOG_FILE.open("r", errors="ignore") as fh:
                fh.seek(size_before)
                chunk = fh.read()
            if "New lead" in chunk or payload["email"] in chunk:
                found = True
                break
        assert found, "No 'New lead' mail entry appended to laravel.log"

        # cleanup
        super_session.delete(f"{ADMIN}/contact-messages/{message_id}")
        super_session.delete(f"{ADMIN}/contact-messages/{message_id}/force")

    @pytest.mark.parametrize("mutate,field", [
        ({"name": ""}, "name"),
        ({"email": "not-an-email"}, "email"),
        ({"message": "short"}, "message"),
    ])
    def test_validation_errors(self, mutate, field):
        clear_cache()
        payload = valid_payload()
        payload.update(mutate)
        r = submit_contact(payload)
        assert r.status_code == 422, r.text[:300]
        errors = r.json().get("errors") or r.json().get("data", {}).get("errors", {})
        assert field in errors, r.text[:300]

    def test_honeypot_rejected(self):
        clear_cache()
        payload = valid_payload()
        payload["website"] = "http://spam.example.com"
        r = submit_contact(payload)
        assert r.status_code == 422, r.text[:300]
        assert "This submission looks automated." in r.text

    def test_rate_limit_429(self):
        clear_cache()
        statuses = []
        for _ in range(7):
            statuses.append(submit_contact(valid_payload()).status_code)
        assert 429 in statuses, f"No 429 after 7 rapid submissions: {statuses}"
        assert statuses[:5].count(201) == 5, f"First 5 should be accepted: {statuses}"
        clear_cache()


# ------------------------------------------------------------------- inbox
class TestInbox:
    @pytest.fixture(scope="class")
    def message_id(self, super_session):
        clear_cache()
        r = submit_contact(valid_payload("inbox"))
        assert r.status_code == 201, r.text[:300]
        mid = r.json()["data"]["id"]
        yield mid
        super_session.delete(f"{ADMIN}/contact-messages/{mid}")
        super_session.delete(f"{ADMIN}/contact-messages/{mid}/force")

    def test_index_and_unread_header(self, super_session, message_id):
        r = super_session.get(f"{ADMIN}/contact-messages")
        assert r.status_code == 200, r.text[:300]
        body = r.json()
        assert isinstance(body["data"], list)
        assert all("_id" not in item for item in body["data"])
        assert any(item["id"] == message_id for item in body["data"])
        assert "meta" in body
        assert int(r.headers.get("X-Unread-Count", "-1")) >= 1

    def test_summary(self, super_session, message_id):
        r = super_session.get(f"{ADMIN}/contact-messages/summary")
        assert r.status_code == 200
        data = r.json()["data"]
        assert data["unread"] >= 1
        assert data["total"] >= 1
        assert isinstance(data["by_status"], dict)

    def test_status_filter_and_search(self, super_session, message_id):
        r = super_session.get(f"{ADMIN}/contact-messages", params={"status": "new"})
        assert r.status_code == 200
        assert all(m["status"] == "new" for m in r.json()["data"])

        r = super_session.get(f"{ADMIN}/contact-messages", params={"search": "TEST_Lead inbox"})
        assert r.status_code == 200
        assert any(m["id"] == message_id for m in r.json()["data"])

    def test_show_marks_read(self, super_session, message_id):
        before = super_session.get(f"{ADMIN}/contact-messages/summary").json()["data"]["unread"]
        r = super_session.get(f"{ADMIN}/contact-messages/{message_id}")
        assert r.status_code == 200
        data = r.json()["data"]
        assert data["status"] == "read", f"expected read, got {data['status']}"
        assert data["read_at"] is not None
        after = super_session.get(f"{ADMIN}/contact-messages/summary").json()["data"]["unread"]
        assert after == before - 1, f"unread counter did not drop: {before} -> {after}"

    @pytest.mark.parametrize("status", ["replied", "spam", "archived"])
    def test_status_transitions(self, super_session, message_id, status):
        r = super_session.put(f"{ADMIN}/contact-messages/{message_id}", json={"status": status})
        assert r.status_code == 200, r.text[:300]
        assert r.json()["data"]["status"] == status
        if status == "replied":
            assert r.json()["data"]["replied_at"] is not None
        g = super_session.get(f"{ADMIN}/contact-messages/{message_id}")
        assert g.json()["data"]["status"] == status

    def test_internal_note_persists(self, super_session, message_id):
        note = "TEST_note followed up on WhatsApp"
        r = super_session.put(f"{ADMIN}/contact-messages/{message_id}",
                              json={"internal_note": note})
        assert r.status_code == 200, r.text[:300]
        g = super_session.get(f"{ADMIN}/contact-messages/{message_id}")
        assert g.json()["data"]["internal_note"] == note

    def test_invalid_status_rejected(self, super_session, message_id):
        r = super_session.put(f"{ADMIN}/contact-messages/{message_id}",
                              json={"status": "bogus"})
        assert r.status_code == 422, r.text[:300]

    def test_show_trashed_message(self, super_session):
        """The inbox trash view opens a message with GET show before restoring it,
        so a soft-deleted message must still be retrievable."""
        clear_cache()
        r = submit_contact(valid_payload("showtrash"))
        assert r.status_code == 201, r.text[:300]
        mid = r.json()["data"]["id"]
        try:
            assert super_session.delete(f"{ADMIN}/contact-messages/{mid}").status_code == 200
            g = super_session.get(f"{ADMIN}/contact-messages/{mid}")
            assert g.status_code == 200, (
                f"GET a trashed message -> {g.status_code}; the UI trash view cannot open it, "
                "so restore / permanent delete are unreachable"
            )
        finally:
            super_session.delete(f"{ADMIN}/contact-messages/{mid}/force")

    def test_trash_restore_force(self, super_session):
        clear_cache()
        r = submit_contact(valid_payload("trash"))
        assert r.status_code == 201, r.text[:300]
        mid = r.json()["data"]["id"]

        assert super_session.delete(f"{ADMIN}/contact-messages/{mid}").status_code == 200
        listed = super_session.get(f"{ADMIN}/contact-messages").json()["data"]
        assert all(m["id"] != mid for m in listed)
        trashed = super_session.get(f"{ADMIN}/contact-messages",
                                    params={"trashed": 1}).json()["data"]
        assert any(m["id"] == mid for m in trashed)

        assert super_session.post(f"{ADMIN}/contact-messages/{mid}/restore").status_code == 200
        assert super_session.get(f"{ADMIN}/contact-messages/{mid}").status_code == 200

        assert super_session.delete(f"{ADMIN}/contact-messages/{mid}").status_code == 200
        assert super_session.delete(f"{ADMIN}/contact-messages/{mid}/force").status_code == 200
        assert super_session.get(f"{ADMIN}/contact-messages/{mid}").status_code == 404


# -------------------------------------------------------------- activity log
class TestActivityLog:
    def test_index_shape(self, super_session):
        r = super_session.get(f"{ADMIN}/activity-logs")
        assert r.status_code == 200, r.text[:300]
        body = r.json()
        rows = body["data"]
        assert isinstance(rows, list) and len(rows) > 0
        row = rows[0]
        for key in ("id", "action", "description", "created_at"):
            assert key in row, f"missing {key} in activity row: {row}"
        assert "_id" not in row

    def test_filters_endpoint(self, super_session):
        r = super_session.get(f"{ADMIN}/activity-logs/filters")
        assert r.status_code == 200
        data = r.json()["data"]
        assert len(data["actions"]) > 0
        assert len(data["modules"]) > 0
        assert all({"value", "label"} <= set(m) for m in data["modules"])

    def test_action_and_module_filter(self, super_session):
        filters = super_session.get(f"{ADMIN}/activity-logs/filters").json()["data"]
        action = filters["actions"][0]
        r = super_session.get(f"{ADMIN}/activity-logs", params={"action": action})
        assert r.status_code == 200
        assert all(row["action"] == action for row in r.json()["data"])

        module = "ContactMessage"
        r = super_session.get(f"{ADMIN}/activity-logs",
                              params={"subject_type": module, "per_page": 50})
        assert r.status_code == 200
        rows = r.json()["data"]
        assert len(rows) > 0, "no ContactMessage activity entries found"
        for row in rows:
            actual = str(row.get("module") or row.get("subject_type") or "")
            assert actual.replace(" ", "").lower() == module.lower(), row

    def test_date_range_filter(self, super_session):
        r = super_session.get(f"{ADMIN}/activity-logs",
                              params={"from": "2000-01-01", "to": "2000-01-02"})
        assert r.status_code == 200, r.text[:300]
        assert r.json()["data"] == []

    def test_to_date_includes_same_day(self, super_session):
        """A from==to filter set to today must still return today's entries."""
        today = requests.get(f"{API}/health", timeout=30)
        assert today.status_code == 200
        import datetime as _dt
        day = _dt.datetime.utcnow().strftime("%Y-%m-%d")
        r = super_session.get(f"{ADMIN}/activity-logs", params={"from": day, "to": day})
        assert r.status_code == 200
        assert len(r.json()["data"]) > 0, (
            "from==to (today) returns nothing — the 'to' bound is parsed as midnight "
            "instead of end-of-day"
        )

    def test_user_filter(self, super_session):
        users = super_session.get(f"{ADMIN}/users").json()["data"]
        uid = super_session.current_user["id"]
        assert any(u["id"] == uid for u in users)
        r = super_session.get(f"{ADMIN}/activity-logs", params={"user_id": uid})
        assert r.status_code == 200
        for row in r.json()["data"]:
            actor = row.get("user") or {}
            assert (row.get("user_id") == uid) or (actor.get("id") == uid), row

    def test_before_after_payload_present(self, super_session):
        r = super_session.get(f"{ADMIN}/activity-logs", params={"action": "updated"})
        assert r.status_code == 200
        rows = r.json()["data"]
        if not rows:
            pytest.skip("no 'updated' entries")
        assert any(("old_values" in row or "before" in row) for row in rows), rows[0]


# ------------------------------------------------------------------- roles
class TestRoles:
    def test_roles_index(self, super_session):
        r = super_session.get(f"{ADMIN}/roles")
        assert r.status_code == 200, r.text[:300]
        data = r.json()["data"]
        roles = data["roles"] if isinstance(data, dict) else data
        slugs = {role["slug"] for role in roles}
        assert {"super-admin", "admin", "editor"}.issubset(slugs), slugs
        for role in roles:
            assert isinstance(role["permissions"], list)
            assert "users_count" in role
        if isinstance(data, dict):
            assert "permissions" in data or "matrix" in data or "modules" in data, data.keys()


# ------------------------------------------------------------------- users
class TestUsers:
    @pytest.fixture(scope="class")
    def role_ids(self, super_session):
        data = super_session.get(f"{ADMIN}/roles").json()["data"]
        roles = data["roles"] if isinstance(data, dict) else data
        return {role["slug"]: role["id"] for role in roles}

    @pytest.fixture(scope="class")
    def created_ids(self, super_session):
        ids = []
        yield ids
        for uid in ids:
            super_session.delete(f"{ADMIN}/users/{uid}")
            subprocess.run(
                ["php", "artisan", "tinker", "--execute",
                 f"App\\Models\\User::withTrashed()->where('id','{uid}')->forceDelete();"],
                cwd="/app/backend", capture_output=True, timeout=90)

    def test_index(self, super_session):
        r = super_session.get(f"{ADMIN}/users")
        assert r.status_code == 200, r.text[:300]
        users = r.json()["data"]
        assert len(users) > 0
        u = users[0]
        assert "_id" not in u
        assert "password" not in u
        for key in ("id", "name", "email", "roles", "is_active", "is_two_factor_enabled"):
            assert key in u, f"missing {key}: {u}"
        assert "last_login_at" in u

    def test_create_user(self, super_session, role_ids, created_ids):
        tag = uuid.uuid4().hex[:6]
        payload = {
            "name": f"TEST_User {tag}",
            "email": f"test_user_{tag}@example.com",
            "password": "TestPassword#2026",
            "role_ids": [role_ids["editor"]],
            "is_active": True,
            "is_two_factor_enabled": False,
        }
        r = super_session.post(f"{ADMIN}/users", json=payload)
        assert r.status_code == 201, r.text[:400]
        data = r.json()["data"]
        created_ids.append(data["id"])
        assert data["email"] == payload["email"]
        assert data["name"] == payload["name"]
        assert [role["slug"] for role in data["roles"]] == ["editor"]

        listed = super_session.get(f"{ADMIN}/users",
                                   params={"search": payload["email"]}).json()["data"]
        assert any(x["id"] == data["id"] for x in listed)

        # the new user can sign in with the supplied password
        token, _ = login({"email": payload["email"], "password": payload["password"]})
        assert token

    def test_short_password_rejected(self, super_session, role_ids):
        r = super_session.post(f"{ADMIN}/users", json={
            "name": "TEST_Short", "email": f"test_short_{uuid.uuid4().hex[:6]}@example.com",
            "password": "short12", "role_ids": [role_ids["editor"]],
        })
        assert r.status_code == 422, r.text[:300]
        assert "password" in r.text

    def test_duplicate_email_rejected(self, super_session, role_ids):
        r = super_session.post(f"{ADMIN}/users", json={
            "name": "TEST_Dup", "email": EDITOR["email"],
            "password": "TestPassword#2026", "role_ids": [role_ids["editor"]],
        })
        assert r.status_code == 422, r.text[:300]
        assert "email" in r.text

    def test_no_role_rejected(self, super_session):
        r = super_session.post(f"{ADMIN}/users", json={
            "name": "TEST_NoRole", "email": f"test_norole_{uuid.uuid4().hex[:6]}@example.com",
            "password": "TestPassword#2026", "role_ids": [],
        })
        assert r.status_code == 422, r.text[:300]

    def test_update_without_password_keeps_login(self, super_session, role_ids, created_ids):
        tag = uuid.uuid4().hex[:6]
        email = f"test_keep_{tag}@example.com"
        password = "KeepPassword#2026"
        create = super_session.post(f"{ADMIN}/users", json={
            "name": "TEST_Keep", "email": email, "password": password,
            "role_ids": [role_ids["editor"]], "is_two_factor_enabled": False,
        })
        assert create.status_code == 201, create.text[:300]
        uid = create.json()["data"]["id"]
        created_ids.append(uid)

        upd = super_session.put(f"{ADMIN}/users/{uid}",
                                json={"name": "TEST_Keep Renamed", "password": None})
        assert upd.status_code == 200, upd.text[:300]
        assert upd.json()["data"]["name"] == "TEST_Keep Renamed"

        token, _ = login({"email": email, "password": password})
        assert token, "user could not log in after a password-less update"

    def test_password_change_revokes_tokens(self, super_session, role_ids, created_ids):
        tag = uuid.uuid4().hex[:6]
        email = f"test_rev_{tag}@example.com"
        create = super_session.post(f"{ADMIN}/users", json={
            "name": "TEST_Revoke", "email": email, "password": "OldPassword#2026",
            "role_ids": [role_ids["editor"]], "is_two_factor_enabled": False,
        })
        assert create.status_code == 201, create.text[:300]
        uid = create.json()["data"]["id"]
        created_ids.append(uid)

        token, _ = login({"email": email, "password": "OldPassword#2026"})
        headers = {"Authorization": f"Bearer {token}", "Accept": "application/json"}
        assert requests.get(f"{API}/auth/me", headers=headers, timeout=30).status_code == 200

        upd = super_session.put(f"{ADMIN}/users/{uid}", json={"password": "NewPassword#2026"})
        assert upd.status_code == 200, upd.text[:300]
        me = requests.get(f"{API}/auth/me", headers=headers, timeout=30)
        assert me.status_code == 401, f"token still valid after password change: {me.status_code}"

    def test_toggle_active_revokes_tokens(self, super_session, role_ids, created_ids):
        tag = uuid.uuid4().hex[:6]
        email = f"test_tog_{tag}@example.com"
        create = super_session.post(f"{ADMIN}/users", json={
            "name": "TEST_Toggle", "email": email, "password": "TogglePassword#2026",
            "role_ids": [role_ids["editor"]], "is_two_factor_enabled": False,
        })
        assert create.status_code == 201, create.text[:300]
        uid = create.json()["data"]["id"]
        created_ids.append(uid)

        token, _ = login({"email": email, "password": "TogglePassword#2026"})
        headers = {"Authorization": f"Bearer {token}", "Accept": "application/json"}
        assert requests.get(f"{API}/auth/me", headers=headers, timeout=30).status_code == 200

        r = super_session.patch(f"{ADMIN}/users/{uid}/toggle-active")
        assert r.status_code == 200, r.text[:300]
        assert r.json()["data"]["is_active"] is False
        me = requests.get(f"{API}/auth/me", headers=headers, timeout=30)
        assert me.status_code == 401, f"token still valid after deactivation: {me.status_code}"

        r = super_session.patch(f"{ADMIN}/users/{uid}/toggle-active")
        assert r.status_code == 200
        assert r.json()["data"]["is_active"] is True

    def test_self_protection(self, super_session):
        me = super_session.current_user["id"]
        r = super_session.patch(f"{ADMIN}/users/{me}/toggle-active")
        assert r.status_code == 422, r.text[:300]
        r = super_session.delete(f"{ADMIN}/users/{me}")
        assert r.status_code == 422, r.text[:300]
        # still active and able to call the API
        assert super_session.get(f"{API}/auth/me").status_code == 200

    def test_trash_and_restore(self, super_session, role_ids, created_ids):
        tag = uuid.uuid4().hex[:6]
        create = super_session.post(f"{ADMIN}/users", json={
            "name": "TEST_Trash", "email": f"test_trash_{tag}@example.com",
            "password": "TrashPassword#2026", "role_ids": [role_ids["editor"]],
        })
        assert create.status_code == 201, create.text[:300]
        uid = create.json()["data"]["id"]
        created_ids.append(uid)

        assert super_session.delete(f"{ADMIN}/users/{uid}").status_code == 200
        active = super_session.get(f"{ADMIN}/users").json()["data"]
        assert all(u["id"] != uid for u in active)
        trashed = super_session.get(f"{ADMIN}/users", params={"trashed": 1}).json()["data"]
        assert any(u["id"] == uid for u in trashed)

        assert super_session.post(f"{ADMIN}/users/{uid}/restore").status_code == 200
        active = super_session.get(f"{ADMIN}/users").json()["data"]
        assert any(u["id"] == uid for u in active)


# ----------------------------------------------------------------- dashboard
class TestDashboard:
    def test_stats(self, super_session):
        r = super_session.get(f"{ADMIN}/dashboard/stats")
        assert r.status_code == 200, r.text[:300]
        data = r.json()["data"]
        counts = data["counts"]
        for key in ("projects_published", "testimonials", "clients", "media",
                    "messages_unread"):
            assert key in counts, f"missing count {key}"
            assert isinstance(counts[key], int)
        assert len(data["leads_timeline"]) == 30
        assert all({"date", "total"} <= set(point) for point in data["leads_timeline"])
        assert "recent_messages" in data
        assert "recent_activity" in data or "recent_activities" in data
        assert "translation" in str(data.keys()).lower() or "translation_gaps" in data

    def test_counts_match_modules(self, super_session):
        counts = super_session.get(f"{ADMIN}/dashboard/stats").json()["data"]["counts"]
        clients = super_session.get(f"{ADMIN}/clients").json()
        listed = clients["data"] if isinstance(clients["data"], list) else clients["data"]["data"]
        assert counts["clients"] == len(listed), f"{counts['clients']} vs {len(listed)}"

        unread = super_session.get(f"{ADMIN}/contact-messages/summary").json()["data"]["unread"]
        assert counts["messages_unread"] == unread


# --------------------------------------------------------------- permissions
class TestEditorPermissions:
    def test_editor_forbidden_endpoints(self, editor_session):
        for path in ("activity-logs", "users", "roles"):
            r = editor_session.get(f"{ADMIN}/{path}")
            assert r.status_code == 403, f"GET {path} -> {r.status_code} {r.text[:200]}"

    def test_editor_can_read_inbox(self, editor_session):
        r = editor_session.get(f"{ADMIN}/contact-messages")
        assert r.status_code == 200, r.text[:300]

    def test_editor_cannot_force_delete_message(self, editor_session, super_session):
        clear_cache()
        sub = submit_contact(valid_payload("perm"))
        assert sub.status_code == 201, sub.text[:300]
        mid = sub.json()["data"]["id"]
        try:
            r = editor_session.delete(f"{ADMIN}/contact-messages/{mid}/force")
            assert r.status_code == 403, f"force delete -> {r.status_code}"
        finally:
            super_session.delete(f"{ADMIN}/contact-messages/{mid}")
            super_session.delete(f"{ADMIN}/contact-messages/{mid}/force")

    def test_unauthenticated_rejected(self):
        for path in ("contact-messages", "users", "activity-logs", "dashboard/stats"):
            r = requests.get(f"{ADMIN}/{path}", headers={"Accept": "application/json"}, timeout=30)
            assert r.status_code == 401, f"{path} -> {r.status_code}"


# --------------------------------------------------------------- regression
class TestRegression:
    @pytest.mark.parametrize("path", [
        "hero", "skills", "navigation-menus", "settings",
        "testimonials", "clients", "projects",
    ])
    def test_existing_modules_still_reachable(self, super_session, path):
        r = super_session.get(f"{ADMIN}/{path}")
        assert r.status_code == 200, f"GET {path} -> {r.status_code} {r.text[:200]}"
        assert re.search(r'"success"\s*:\s*true', r.text)
