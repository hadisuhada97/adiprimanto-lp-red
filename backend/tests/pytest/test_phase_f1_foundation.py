"""Phase F1 foundation tests: HTTP envelope + DB schema/seed verification."""
import os
import re
import subprocess
import pytest
import requests

BASE_URL = "https://adiprimanto-cms-1.preview.emergentagent.com"


def _mysql(sql: str) -> str:
    out = subprocess.check_output(
        ["mysql", "-u", "root", "-N", "-B", "adiprimanto_cms", "-e", sql],
        stderr=subprocess.STDOUT,
    )
    return out.decode().strip()


# ---------------- HTTP envelope ----------------
class TestHealth:
    def test_health_success_envelope(self):
        r = requests.get(f"{BASE_URL}/api/v1/health", timeout=15)
        assert r.status_code == 200
        body = r.json()
        assert body["success"] is True
        assert "message" in body and "data" in body
        d = body["data"]
        assert d["database_connected"] is True
        assert d["default_locale"] == "id"
        assert d["active_locales"] == ["id", "en"]
        assert d["laravel_version"].startswith("12.")


class TestErrorEnvelope:
    def test_unknown_route_returns_json_404(self):
        r = requests.get(f"{BASE_URL}/api/v1/does-not-exist", timeout=15)
        assert r.status_code == 404
        assert "application/json" in r.headers.get("content-type", "")
        body = r.json()
        assert body == {
            "success": False,
            "message": "The requested resource was not found.",
        }


# ---------------- Schema ----------------
APP_TABLES = [
    "users", "roles", "permissions", "role_permission", "role_user",
    "two_factor_codes", "activity_logs", "locales", "settings",
    "setting_translations", "personal_access_tokens",
]
SOFT_DELETE_TABLES = ["users", "roles", "permissions", "locales", "settings"]


class TestSchema:
    @pytest.mark.parametrize("table", APP_TABLES)
    def test_uuid_primary_key(self, table):
        out = _mysql(
            f"SELECT COLUMN_TYPE FROM information_schema.COLUMNS "
            f"WHERE TABLE_SCHEMA='adiprimanto_cms' AND TABLE_NAME='{table}' AND COLUMN_NAME='id';"
        )
        assert out == "char(36)", f"{table}.id is {out!r}, expected char(36)"

    @pytest.mark.parametrize("table", SOFT_DELETE_TABLES)
    def test_soft_delete_column(self, table):
        out = _mysql(
            f"SELECT COUNT(*) FROM information_schema.COLUMNS "
            f"WHERE TABLE_SCHEMA='adiprimanto_cms' AND TABLE_NAME='{table}' AND COLUMN_NAME='deleted_at';"
        )
        assert out == "1", f"{table} missing deleted_at"


# ---------------- Seed data ----------------
class TestSeededData:
    def test_permission_count_and_slug_format(self):
        assert _mysql("SELECT COUNT(*) FROM permissions;") == "128"
        assert _mysql(
            "SELECT COUNT(*) FROM permissions WHERE slug NOT REGEXP '^[a-z_]+\\\\.[a-z_]+$';"
        ) == "0"

    def test_role_permission_counts(self):
        rows = _mysql(
            "SELECT r.slug, COUNT(rp.permission_id) FROM roles r "
            "LEFT JOIN role_permission rp ON r.id=rp.role_id GROUP BY r.id, r.slug;"
        )
        counts = {line.split("\t")[0]: int(line.split("\t")[1]) for line in rows.splitlines()}
        assert counts == {"super-admin": 128, "admin": 97, "editor": 54}

    def test_editor_no_projects_delete(self):
        assert _mysql(
            "SELECT COUNT(*) FROM role_permission rp "
            "JOIN roles r ON r.id=rp.role_id JOIN permissions p ON p.id=rp.permission_id "
            "WHERE r.slug='editor' AND p.slug='projects.delete';"
        ) == "0"

    def test_locales_and_settings(self):
        assert _mysql("SELECT COUNT(*) FROM locales;") == "2"
        assert _mysql("SELECT code FROM locales WHERE is_default=1;") == "id"
        assert _mysql("SELECT COUNT(*) FROM settings;") == "15"

    def test_admin_user_seeded(self):
        row = _mysql(
            "SELECT is_active, is_two_factor_enabled, LEFT(password,4) "
            "FROM users WHERE email='admin@adiprimanto.com';"
        )
        assert row, "admin user missing"
        active, twofa, prefix = row.split("\t")
        assert active == "1"
        assert twofa == "1"
        assert prefix == "$2y$"

    def test_admin_attached_to_super_admin_with_uuid_pivot(self):
        row = _mysql(
            "SELECT ru.id, r.slug FROM role_user ru "
            "JOIN roles r ON r.id=ru.role_id JOIN users u ON u.id=ru.user_id "
            "WHERE u.email='admin@adiprimanto.com';"
        )
        pivot_id, slug = row.split("\t")
        assert slug == "super-admin"
        assert re.match(r"^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-", pivot_id), pivot_id


class TestUuidV7:
    @pytest.mark.parametrize("table", [
        "users", "roles", "permissions", "role_user", "role_permission", "locales", "settings",
    ])
    def test_ids_are_uuid_v7(self, table):
        # 13th hex char (index 14 with dashes) must be '7'
        out = _mysql(f"SELECT DISTINCT SUBSTRING(id,15,1) FROM {table};")
        versions = set(out.splitlines()) if out else set()
        assert versions == {"7"}, f"{table} has non-v7 uuids: {versions}"


class TestSeederIdempotency:
    def test_reseed_does_not_duplicate(self):
        def snap():
            return _mysql(
                "SELECT (SELECT COUNT(*) FROM permissions),(SELECT COUNT(*) FROM roles),"
                "(SELECT COUNT(*) FROM locales),(SELECT COUNT(*) FROM settings),"
                "(SELECT COUNT(*) FROM users),(SELECT COUNT(*) FROM role_user),"
                "(SELECT COUNT(*) FROM role_permission);"
            )
        before = snap()
        res = subprocess.run(
            ["php", "artisan", "db:seed", "--force"],
            cwd="/app/backend", capture_output=True, text=True, timeout=120,
        )
        assert res.returncode == 0, res.stderr
        after = snap()
        assert before == after, f"seed changed counts: {before} -> {after}"
