"""Phase F2 auth tests: two-step login (email OTP), lockout, session, audit trail.

Covers all scenarios listed in the F2 review request. Uses the public preview URL
so behaviour matches production. Direct MySQL/tinker access is used for state
verification and to bypass timing gates (OTP expiry, resend cooldown, rate limits).
"""
from __future__ import annotations

import os
import re
import subprocess
import time
from datetime import datetime, timezone

import pytest
import requests

BASE_URL = "https://adiprimanto-cms.preview.emergentagent.com"
ADMIN_EMAIL = "admin@adiprimanto.com"
ADMIN_PASSWORD = "AdiPrimanto#2026"
EDITOR_EMAIL = "editor.test@adiprimanto.com"
EDITOR_PASSWORD = "EditorTest#2026"
LOG_FILE = "/app/backend/storage/logs/laravel.log"


# ---------- helpers ----------
def _mysql(sql: str) -> str:
    out = subprocess.check_output(
        ["mysql", "-u", "root", "-N", "-B", "adiprimanto_cms", "-e", sql],
        stderr=subprocess.STDOUT,
    )
    return out.decode().strip()


def _tinker(php: str) -> str:
    res = subprocess.run(
        ["php", "artisan", "tinker", "--execute", php],
        cwd="/app/backend", capture_output=True, text=True, timeout=60,
    )
    if res.returncode != 0:
        raise RuntimeError(res.stderr or res.stdout)
    return (res.stdout or "").strip()


def _clear_rate_limiter():
    """Nuke laravel cache so throttle middleware counters reset."""
    subprocess.run(
        ["php", "artisan", "cache:clear"],
        cwd="/app/backend", capture_output=True, text=True, timeout=30,
    )


def _reset_user_lock(email: str):
    _tinker(
        f"$u = App\\Models\\User::where('email','{email}')->first();"
        f"if ($u) {{ $u->forceFill(['failed_login_attempts'=>0,'locked_until'=>null,'is_active'=>1])->save(); }}"
    )
    _tinker(f"App\\Models\\TwoFactorCode::where('user_id', function($q){{$q->select('id')->from('users')->where('email','{email}');}})->delete();")


def _log_size() -> int:
    try:
        return os.path.getsize(LOG_FILE)
    except FileNotFoundError:
        return 0


def _read_otp_after(offset: int, timeout: float = 8.0) -> str:
    """Wait for the next OTP code written to the mail log after `offset` bytes."""
    deadline = time.time() + timeout
    pattern = re.compile(r"\*\*(\d{6})\*\*")
    while time.time() < deadline:
        try:
            with open(LOG_FILE, "rb") as fh:
                fh.seek(offset)
                chunk = fh.read().decode("utf-8", errors="ignore")
        except FileNotFoundError:
            chunk = ""
        matches = pattern.findall(chunk)
        if matches:
            return matches[-1]
        time.sleep(0.4)
    raise AssertionError(f"OTP not written to {LOG_FILE} within {timeout}s")


def _login(email: str, password: str) -> requests.Response:
    return requests.post(
        f"{BASE_URL}/api/v1/auth/login",
        json={"email": email, "password": password},
        timeout=20,
    )


def _fresh_challenge(email: str, password: str):
    """Return (challenge_token, code) for a full step-1 sign-in."""
    _clear_rate_limiter()
    _reset_user_lock(email)
    off = _log_size()
    r = _login(email, password)
    assert r.status_code == 200, r.text
    token = r.json()["data"]["challenge_token"]
    code = _read_otp_after(off)
    return token, code


# ---------- module-scoped cleanup ----------
@pytest.fixture(autouse=True)
def _cleanup():
    yield
    _reset_user_lock(EDITOR_EMAIL)


# ===================================================================
# 1. Two-step login step 1 envelope
# ===================================================================
class TestLoginStep1:
    def test_login_returns_challenge_and_no_access_token(self):
        _clear_rate_limiter()
        r = _login(ADMIN_EMAIL, ADMIN_PASSWORD)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["success"] is True
        assert body["message"].lower().startswith("a verification code")
        d = body["data"]
        assert d["requires_two_factor"] is True
        assert "access_token" not in d
        assert d["code_length"] == 6
        assert d["channel"] == "email"
        assert re.fullmatch(r"[A-Za-z0-9]{64}", d["challenge_token"]), d["challenge_token"]
        assert d["masked_email"].startswith("ad") and d["masked_email"].endswith("@adiprimanto.com")
        assert "*" in d["masked_email"]
        assert isinstance(d["expires_in_seconds"], int) and 500 < d["expires_in_seconds"] <= 600
        assert isinstance(d["resend_available_in_seconds"], int)
        assert d["remaining_attempts"] == 5
        assert d["remaining_resends"] == 3
        # expires_at parses and is in the future
        exp = datetime.fromisoformat(d["expires_at"].replace("Z", "+00:00"))
        assert exp > datetime.now(timezone.utc)


# ===================================================================
# 2. OTP email delivery via log
# ===================================================================
class TestOtpDelivery:
    def test_otp_written_to_mail_log_by_queue_worker(self):
        _clear_rate_limiter()
        off = _log_size()
        _login(ADMIN_EMAIL, ADMIN_PASSWORD)
        code = _read_otp_after(off)
        assert re.fullmatch(r"\d{6}", code)


# ===================================================================
# 3. Two-step login step 2: verify -> Bearer + UUID token id
# ===================================================================
class TestLoginStep2:
    def test_verify_returns_access_token_with_uuid_pat_id(self):
        token, code = _fresh_challenge(ADMIN_EMAIL, ADMIN_PASSWORD)
        r = requests.post(
            f"{BASE_URL}/api/v1/auth/two-factor/verify",
            json={"challenge_token": token, "code": code},
            timeout=20,
        )
        assert r.status_code == 200, r.text
        body = r.json()
        d = body["data"]
        assert d["token_type"] == "Bearer"
        assert "access_token" in d and "|" in d["access_token"]
        pat_id = d["access_token"].split("|", 1)[0]
        assert re.fullmatch(r"[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}", pat_id), pat_id
        # user + roles + flat permissions
        assert d["user"]["email"] == ADMIN_EMAIL
        assert any(r["slug"] == "super-admin" for r in d["user"]["roles"])
        assert isinstance(d["permissions"], list) and "projects.delete" in d["permissions"]
        # expires_at ~8h ahead
        exp = datetime.fromisoformat(d["expires_at"].replace("Z", "+00:00"))
        delta_min = (exp - datetime.now(timezone.utc)).total_seconds() / 60
        assert 470 < delta_min <= 481, f"expires_at delta {delta_min}min not ~480"

        # PAT row in DB has UUID + expires_at ~8h ahead
        row = _mysql(
            f"SELECT id, TIMESTAMPDIFF(MINUTE, NOW(), expires_at) FROM personal_access_tokens "
            f"WHERE id='{pat_id}';"
        )
        assert row, "PAT row not found"
        db_id, mins = row.split("\t")
        assert db_id == pat_id
        assert 470 <= int(mins) <= 481, f"DB expires_at delta {mins}"


# ===================================================================
# 4. OTP single use (replay -> already used)
# ===================================================================
class TestOtpSingleUse:
    def test_replay_after_success_is_rejected(self):
        token, code = _fresh_challenge(ADMIN_EMAIL, ADMIN_PASSWORD)
        r1 = requests.post(f"{BASE_URL}/api/v1/auth/two-factor/verify",
                           json={"challenge_token": token, "code": code}, timeout=20)
        assert r1.status_code == 200
        r2 = requests.post(f"{BASE_URL}/api/v1/auth/two-factor/verify",
                           json={"challenge_token": token, "code": code}, timeout=20)
        assert r2.status_code != 200
        assert "already" in r2.json()["message"].lower()


# ===================================================================
# 5. OTP wrong code: 5 attempts, then challenge destroyed -> 429/401 "sign in again"
# ===================================================================
class TestOtpWrongCode:
    def test_five_wrong_codes_destroy_challenge(self):
        token, code = _fresh_challenge(ADMIN_EMAIL, ADMIN_PASSWORD)
        wrong = "000000" if code != "000000" else "111111"
        remainings = []
        for i in range(5):
            r = requests.post(f"{BASE_URL}/api/v1/auth/two-factor/verify",
                              json={"challenge_token": token, "code": wrong}, timeout=20)
            assert r.status_code == 422, r.text
            body = r.json()
            assert body["message"] == "The verification code is invalid."
            remainings.append(body.get("data", {}).get("remaining_attempts",
                                 body.get("remaining_attempts")))
        # remaining_attempts strictly decreasing
        cleaned = [x for x in remainings if x is not None]
        assert cleaned == sorted(cleaned, reverse=True), cleaned
        assert cleaned[-1] == 0, cleaned

        # 6th attempt -> challenge destroyed, must sign in again
        r = requests.post(f"{BASE_URL}/api/v1/auth/two-factor/verify",
                          json={"challenge_token": token, "code": wrong}, timeout=20)
        assert r.status_code in (401, 404, 410, 422, 429), r.status_code
        assert "sign in" in r.json()["message"].lower() or "invalid" in r.json()["message"].lower() \
               or "expired" in r.json()["message"].lower()


# ===================================================================
# 6. OTP expiry -> rejected
# ===================================================================
class TestOtpExpiry:
    def test_expired_challenge_is_rejected(self):
        token, code = _fresh_challenge(ADMIN_EMAIL, ADMIN_PASSWORD)
        # push expires_at into the past
        _tinker(
            "App\\Models\\TwoFactorCode::query()->update(['expires_at' => now()->subMinute()]);"
        )
        r = requests.post(f"{BASE_URL}/api/v1/auth/two-factor/verify",
                          json={"challenge_token": token, "code": code}, timeout=20)
        assert r.status_code != 200
        assert "expire" in r.json()["message"].lower() or "sign in" in r.json()["message"].lower()


# ===================================================================
# 7. OTP resend cooldown / same token / new code / 3-resend limit
# ===================================================================
class TestOtpResend:
    def test_resend_cooldown_then_rotate_then_limit(self):
        token, code = _fresh_challenge(ADMIN_EMAIL, ADMIN_PASSWORD)

        # Immediate resend -> 60s cooldown
        r = requests.post(f"{BASE_URL}/api/v1/auth/two-factor/resend",
                          json={"challenge_token": token}, timeout=20)
        assert r.status_code == 429, (r.status_code, r.text)
        body = r.json()
        assert "60" in body["message"] or "cool" in body["message"].lower() or "wait" in body["message"].lower()
        retry = body.get("data", {}).get("retry_after_seconds")
        assert isinstance(retry, int) and 0 < retry <= 60

        # bypass cooldown by clearing last_sent_at
        old_code = code
        for i in range(3):
            _tinker(
                "App\\Models\\TwoFactorCode::query()->update(['last_sent_at' => now()->subMinutes(2)]);"
            )
            _clear_rate_limiter()
            off = _log_size()
            rr = requests.post(f"{BASE_URL}/api/v1/auth/two-factor/resend",
                               json={"challenge_token": token}, timeout=20)
            if i < 2:
                assert rr.status_code == 200, rr.text
                d = rr.json()["data"]
                # same challenge_token
                assert d.get("challenge_token") == token
                # new code was written
                new_code = _read_otp_after(off)
                assert new_code != old_code
                # attempts reset to 5 and resend_count increments (remaining decreases)
                assert d["remaining_attempts"] == 5
                # remaining_resends decreases by 1 per successful resend (starts at 3, after 1st -> 2)
                assert d["remaining_resends"] == 3 - (i + 1)
                old_code = new_code
            else:
                # third resend attempt: total resends already 2, this would be #3 which is at the limit
                # Depending on impl, either this succeeds (=3) then next fails, or this fails.
                # Loop tolerates: keep going and assert the LIMIT via one more call after loop.
                if rr.status_code == 200:
                    pass
                else:
                    assert rr.status_code in (422, 429)

        # Old code no longer works
        r = requests.post(f"{BASE_URL}/api/v1/auth/two-factor/verify",
                          json={"challenge_token": token, "code": code}, timeout=20)
        assert r.status_code == 422

        # Force one more resend beyond the limit
        _tinker("App\\Models\\TwoFactorCode::query()->update(['last_sent_at' => now()->subMinutes(2)]);")
        _clear_rate_limiter()
        r = requests.post(f"{BASE_URL}/api/v1/auth/two-factor/resend",
                          json={"challenge_token": token}, timeout=20)
        assert r.status_code in (422, 429), r.status_code
        assert "limit" in r.json()["message"].lower() or "sign in" in r.json()["message"].lower()


# ===================================================================
# 8. Account lockout: 5 wrong passwords -> 423, 6th & correct pw -> 423
# ===================================================================
class TestAccountLockout:
    def test_five_wrong_passwords_lock_account(self):
        _reset_user_lock(EDITOR_EMAIL)
        _clear_rate_limiter()

        statuses = []
        remainings = []
        # 5 wrong passwords within the 5/min limiter window
        for i in range(5):
            r = _login(EDITOR_EMAIL, f"WrongPass{i}!")
            statuses.append(r.status_code)
            body = r.json()
            remainings.append(body.get("data", {}).get("remaining_attempts"))
            assert body["message"] in (
                "These credentials do not match our records.",
                f"Too many failed attempts. This account is locked for 15 minutes.",
            )

        # first 4 => 401 with decreasing remaining_attempts, 5th => 423
        assert statuses[:4] == [401, 401, 401, 401], statuses
        assert statuses[4] == 423, statuses
        cleaned = [x for x in remainings[:4] if x is not None]
        assert cleaned == sorted(cleaned, reverse=True) and cleaned[0] < 5, cleaned

        # verify DB state
        row = _mysql(
            f"SELECT failed_login_attempts, locked_until IS NOT NULL "
            f"FROM users WHERE email='{EDITOR_EMAIL}';"
        )
        fla, has_lock = row.split("\t")
        assert fla == "5"
        assert has_lock == "1"

        # 6th wrong pw AND correct pw both return 423 while locked
        # wait for login rate limiter to clear
        _clear_rate_limiter()

        r = _login(EDITOR_EMAIL, "AnotherWrong!")
        assert r.status_code == 423, r.status_code
        d = r.json().get("data", {})
        assert "locked_until" in d
        assert "retry_after_seconds" in d and d["retry_after_seconds"] > 0

        _clear_rate_limiter()
        r = _login(EDITOR_EMAIL, EDITOR_PASSWORD)
        assert r.status_code == 423, r.status_code

    def test_success_resets_failed_counter(self):
        _reset_user_lock(EDITOR_EMAIL)
        _clear_rate_limiter()
        # 2 wrong then correct
        assert _login(EDITOR_EMAIL, "WrongPass1!").status_code == 401
        assert _login(EDITOR_EMAIL, "WrongPass2!").status_code == 401
        assert _mysql(f"SELECT failed_login_attempts FROM users WHERE email='{EDITOR_EMAIL}';") == "2"
        r = _login(EDITOR_EMAIL, EDITOR_PASSWORD)
        assert r.status_code == 200
        assert _mysql(f"SELECT failed_login_attempts FROM users WHERE email='{EDITOR_EMAIL}';") == "0"


# ===================================================================
# 9. Enumeration protection
# ===================================================================
class TestEnumerationProtection:
    def test_unknown_email_same_message_as_wrong_password(self):
        _clear_rate_limiter()
        r1 = _login("does-not-exist@example.com", "whatever")
        _clear_rate_limiter()
        _reset_user_lock(EDITOR_EMAIL)
        r2 = _login(EDITOR_EMAIL, "definitely-wrong")
        assert r1.status_code == 401
        assert r2.status_code == 401
        assert r1.json()["message"] == r2.json()["message"] == \
            "These credentials do not match our records."


# ===================================================================
# 10. Inactive account -> 403
# ===================================================================
class TestInactiveAccount:
    def test_deactivated_account_returns_403(self):
        _reset_user_lock(EDITOR_EMAIL)
        _clear_rate_limiter()
        _tinker(
            f"App\\Models\\User::where('email','{EDITOR_EMAIL}')->update(['is_active' => 0]);"
        )
        try:
            r = _login(EDITOR_EMAIL, EDITOR_PASSWORD)
            assert r.status_code == 403, r.status_code
            assert r.json()["message"] == "This account has been deactivated."
        finally:
            _tinker(
                f"App\\Models\\User::where('email','{EDITOR_EMAIL}')->update(['is_active' => 1]);"
            )


# ===================================================================
# 11. Input validation (422)
# ===================================================================
class TestInputValidation:
    def test_login_malformed_email_and_missing_password(self):
        _clear_rate_limiter()
        r = requests.post(f"{BASE_URL}/api/v1/auth/login",
                          json={"email": "not-an-email"}, timeout=20)
        assert r.status_code == 422
        body = r.json()
        assert body["success"] is False
        assert body["message"] == "The given data was invalid."
        assert "email" in body["errors"] and "password" in body["errors"]

    def test_verify_short_token_and_non_numeric_code(self):
        r = requests.post(f"{BASE_URL}/api/v1/auth/two-factor/verify",
                          json={"challenge_token": "abc", "code": "AAAAAA"}, timeout=20)
        assert r.status_code == 422
        body = r.json()
        assert body["success"] is False
        assert "challenge_token" in body["errors"]
        assert "code" in body["errors"]


# ===================================================================
# 12. Session endpoints
# ===================================================================
class TestSessionEndpoints:
    def _issue_token(self) -> str:
        token, code = _fresh_challenge(ADMIN_EMAIL, ADMIN_PASSWORD)
        r = requests.post(f"{BASE_URL}/api/v1/auth/two-factor/verify",
                          json={"challenge_token": token, "code": code}, timeout=20)
        assert r.status_code == 200
        return r.json()["data"]["access_token"]

    def test_me_logout_and_logout_all(self):
        access = self._issue_token()
        h = {"Authorization": f"Bearer {access}", "Accept": "application/json"}

        r = requests.get(f"{BASE_URL}/api/v1/auth/me", headers=h, timeout=20)
        assert r.status_code == 200
        d = r.json()["data"]
        assert d["user"]["email"] == ADMIN_EMAIL
        assert isinstance(d["permissions"], list) and len(d["permissions"]) == 128
        assert any(role["slug"] == "super-admin" for role in d["user"]["roles"])

        # logout current token
        r = requests.post(f"{BASE_URL}/api/v1/auth/logout", headers=h, timeout=20)
        assert r.status_code == 200

        r = requests.get(f"{BASE_URL}/api/v1/auth/me", headers=h, timeout=20)
        assert r.status_code == 401
        assert r.json()["message"] == "Unauthenticated."

        # issue 2 tokens then logout-all
        t1 = self._issue_token()
        t2 = self._issue_token()
        h2 = {"Authorization": f"Bearer {t2}", "Accept": "application/json"}
        r = requests.post(f"{BASE_URL}/api/v1/auth/logout-all", headers=h2, timeout=20)
        assert r.status_code == 200
        assert r.json()["data"]["revoked_tokens"] >= 2
        # both tokens invalid
        for t in (t1, t2):
            rr = requests.get(f"{BASE_URL}/api/v1/auth/me",
                              headers={"Authorization": f"Bearer {t}"}, timeout=20)
            assert rr.status_code == 401


# ===================================================================
# 13. Rate limiting
# ===================================================================
class TestRateLimiting:
    def test_login_throttle_shape(self):
        _clear_rate_limiter()
        # Use a non-existent email so we exercise the throttle without ever hitting lockout (423).
        target = "throttle-target-f2@example.com"
        last = None
        for _ in range(7):
            last = _login(target, "AnyBadPass!")
        assert last.status_code == 429, last.status_code
        assert "application/json" in last.headers.get("content-type", "")
        body = last.json()
        assert body["success"] is False
        assert "too many" in body["message"].lower()
        assert "Retry-After" in last.headers


# ===================================================================
# 14. Auth audit trail
# ===================================================================
class TestAuditTrail:
    def test_activity_log_actions_are_recorded(self):
        # Trigger a bunch of events end-to-end
        _reset_user_lock(EDITOR_EMAIL)
        _clear_rate_limiter()

        # login_failed
        _login(EDITOR_EMAIL, "wrong")
        # full successful flow -> two_factor_issued, two_factor_verified, login_succeeded
        access_token, code = None, None
        token, code = _fresh_challenge(ADMIN_EMAIL, ADMIN_PASSWORD)
        # two_factor_failed
        requests.post(f"{BASE_URL}/api/v1/auth/two-factor/verify",
                      json={"challenge_token": token, "code": "000000"}, timeout=20)
        # verified
        r = requests.post(f"{BASE_URL}/api/v1/auth/two-factor/verify",
                          json={"challenge_token": token, "code": code}, timeout=20)
        access = r.json()["data"]["access_token"]
        # logged_out
        requests.post(f"{BASE_URL}/api/v1/auth/logout",
                      headers={"Authorization": f"Bearer {access}"}, timeout=20)

        # account_locked / account_locked_out require driving editor to lockout
        _clear_rate_limiter()
        _reset_user_lock(EDITOR_EMAIL)
        for _ in range(5):
            _login(EDITOR_EMAIL, "bad-pw!")
        _clear_rate_limiter()
        _login(EDITOR_EMAIL, "bad-again!")  # account_locked_out (hits pre-check)

        expected = [
            "auth.two_factor_issued",
            "auth.two_factor_verified",
            "auth.two_factor_failed",
            "auth.login_failed",
            "auth.account_locked",
            "auth.account_locked_out",
            "auth.login_succeeded",
            "auth.logged_out",
        ]
        for action in expected:
            n = _mysql(
                f"SELECT COUNT(*) FROM activity_logs WHERE action='{action}' "
                f"AND ip_address IS NOT NULL AND new_values IS NOT NULL;"
            )
            assert int(n) >= 1, f"missing activity_logs row for {action}"


# ===================================================================
# 15. Regression: health + JSON 404 still healthy
# ===================================================================
class TestRegression:
    def test_health_still_ok(self):
        r = requests.get(f"{BASE_URL}/api/v1/health", timeout=15)
        assert r.status_code == 200
        assert r.json()["success"] is True

    def test_unknown_route_json_404(self):
        r = requests.get(f"{BASE_URL}/api/v1/does-not-exist-f2", timeout=15)
        assert r.status_code == 404
        assert "application/json" in r.headers.get("content-type", "")
        assert r.json() == {
            "success": False,
            "message": "The requested resource was not found.",
        }
