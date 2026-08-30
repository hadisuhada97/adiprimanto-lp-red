"use client";

import { ArrowLeft, Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import OtpInput from "@/app/components/admin/OtpInput";
import { ApiError } from "@/app/lib/admin/api-client";
import { useAuth, type TwoFactorChallenge } from "@/app/lib/admin/auth-context";
import { useToast } from "@/app/lib/admin/toast";

type Step = "credentials" | "verification";

function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function AdminLoginPage() {
  const router = useRouter();
  const toast = useToast();
  const { login, verifyCode, resendCode } = useAuth();

  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [challenge, setChallenge] = useState<TwoFactorChallenge | null>(null);
  const [code, setCode] = useState("");
  const [expiresIn, setExpiresIn] = useState(0);
  const [resendIn, setResendIn] = useState(0);
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
  const [isCodeInvalid, setIsCodeInvalid] = useState(false);
  const verifyingRef = useRef(false);

  useEffect(() => {
    if (step !== "verification") return;

    const interval = window.setInterval(() => {
      setExpiresIn((current) => Math.max(0, current - 1));
      setResendIn((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [step]);

  const applyChallenge = useCallback((next: TwoFactorChallenge) => {
    setChallenge(next);
    setExpiresIn(next.expires_in_seconds);
    setResendIn(next.resend_available_in_seconds);
    setAttemptsLeft(next.remaining_attempts);
    setCode("");
    setIsCodeInvalid(false);
  }, []);

  const handleCredentialsSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFieldErrors({});
    setFormError(null);
    setIsSubmitting(true);

    try {
      const nextChallenge = await login(email.trim(), password);

      applyChallenge(nextChallenge);
      setStep("verification");
      toast.success(
        "Verification code sent",
        `We emailed a ${nextChallenge.code_length}-digit code to ${nextChallenge.masked_email}.`,
      );
    } catch (error) {
      if (error instanceof ApiError) {
        setFieldErrors({
          email: error.fieldError("email") ?? "",
          password: error.fieldError("password") ?? "",
        });

        if (Object.keys(error.errors).length === 0) {
          setFormError(error.message);
        }

        toast.error("Sign-in failed", error.message);
      } else {
        toast.error("Sign-in failed", "Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = useCallback(
    async (submittedCode: string) => {
      if (challenge === null || verifyingRef.current) return;

      verifyingRef.current = true;
      setIsSubmitting(true);
      setFormError(null);
      setIsCodeInvalid(false);

      try {
        const user = await verifyCode(challenge.challenge_token, submittedCode);

        toast.success("Welcome back", `Signed in as ${user.name}.`);
        router.replace("/admin/dashboard");
      } catch (error) {
        if (error instanceof ApiError) {
          const remaining = error.context.remaining_attempts;

          if (typeof remaining === "number") setAttemptsLeft(remaining);

          setIsCodeInvalid(true);
          setCode("");
          setFormError(error.fieldError("code") ?? error.message);
          toast.error("Verification failed", error.message);
        } else {
          toast.error("Verification failed", "Something went wrong. Please try again.");
        }
      } finally {
        verifyingRef.current = false;
        setIsSubmitting(false);
      }
    },
    [challenge, router, toast, verifyCode],
  );

  const handleResend = async () => {
    if (challenge === null || resendIn > 0) return;

    setIsSubmitting(true);
    setFormError(null);

    try {
      const nextChallenge = await resendCode(challenge.challenge_token);

      applyChallenge(nextChallenge);
      toast.success("New code sent", `Check ${nextChallenge.masked_email} for the new code.`);
    } catch (error) {
      if (error instanceof ApiError) {
        const retryAfter = error.context.retry_after_seconds;

        if (typeof retryAfter === "number") setResendIn(retryAfter);

        toast.error("Could not resend the code", error.message);
      } else {
        toast.error("Could not resend the code", "Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const backToCredentials = () => {
    setStep("credentials");
    setChallenge(null);
    setCode("");
    setPassword("");
    setFormError(null);
    setIsCodeInvalid(false);
  };

  const isExpired = step === "verification" && expiresIn <= 0;

  return (
    <div className="relative flex min-h-screen flex-col lg:flex-row">
      {/* Left column: forms */}
      <div className="flex w-full flex-1 items-center justify-center px-5 py-12 sm:px-8 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="mb-9 flex items-center gap-3 lg:hidden">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-base font-bold text-white">
              AP
            </span>
            <span className="text-sm font-medium tracking-tight text-admin-gray-500 dark:text-admin-gray-400">
              Adiprimanto CMS
            </span>
          </div>

          {step === "credentials" ? (
            <div data-testid="login-step-credentials">
              <h1 className="mb-2 text-2xl font-semibold text-admin-gray-900 sm:text-3xl dark:text-white/90">
                Sign in
              </h1>
              <p className="mb-8 text-sm text-admin-gray-500 dark:text-admin-gray-400">
                Enter your email and password to continue to the admin panel.
              </p>

              <form onSubmit={handleCredentialsSubmit} noValidate data-testid="login-form">
                <div className="mb-5">
                  <label
                    htmlFor="email"
                    className="mb-1.5 block text-sm font-medium text-admin-gray-700 dark:text-admin-gray-300"
                  >
                    Email <span className="text-error-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-admin-gray-400">
                      <Mail size={18} />
                    </span>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@example.com"
                      data-testid="login-email-input"
                      className={`h-12 w-full rounded-lg border bg-transparent pr-4 pl-11 text-sm text-admin-gray-900 placeholder:text-admin-gray-400 transition-colors outline-none focus:ring-3 dark:text-white/90 ${
                        fieldErrors.email
                          ? "border-error-500 focus:ring-error-500/10"
                          : "border-admin-gray-300 focus:border-brand-500 focus:ring-brand-500/10 dark:border-admin-gray-700"
                      }`}
                    />
                  </div>
                  {fieldErrors.email ? (
                    <p className="mt-1.5 text-xs text-error-500" data-testid="login-email-error">
                      {fieldErrors.email}
                    </p>
                  ) : null}
                </div>

                <div className="mb-5">
                  <label
                    htmlFor="password"
                    className="mb-1.5 block text-sm font-medium text-admin-gray-700 dark:text-admin-gray-300"
                  >
                    Password <span className="text-error-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-admin-gray-400">
                      <Lock size={18} />
                    </span>
                    <input
                      id="password"
                      name="password"
                      type={isPasswordVisible ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Enter your password"
                      data-testid="login-password-input"
                      className={`h-12 w-full rounded-lg border bg-transparent pr-12 pl-11 text-sm text-admin-gray-900 placeholder:text-admin-gray-400 transition-colors outline-none focus:ring-3 dark:text-white/90 ${
                        fieldErrors.password
                          ? "border-error-500 focus:ring-error-500/10"
                          : "border-admin-gray-300 focus:border-brand-500 focus:ring-brand-500/10 dark:border-admin-gray-700"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setIsPasswordVisible((current) => !current)}
                      aria-label={isPasswordVisible ? "Hide password" : "Show password"}
                      data-testid="login-toggle-password-button"
                      className="absolute top-1/2 right-4 -translate-y-1/2 text-admin-gray-400 transition-colors hover:text-admin-gray-600 dark:hover:text-admin-gray-200"
                    >
                      {isPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {fieldErrors.password ? (
                    <p className="mt-1.5 text-xs text-error-500" data-testid="login-password-error">
                      {fieldErrors.password}
                    </p>
                  ) : null}
                </div>

                {formError ? (
                  <div
                    className="mb-5 rounded-lg border border-error-500/30 bg-error-500/5 px-4 py-3 text-sm text-error-500"
                    data-testid="login-form-error"
                  >
                    {formError}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  data-testid="login-submit-button"
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-brand-500 text-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : null}
                  {isSubmitting ? "Sending code…" : "Sign in"}
                </button>
              </form>

              <p className="mt-6 flex items-center gap-2 text-xs text-admin-gray-500 dark:text-admin-gray-400">
                <ShieldCheck size={14} className="text-success-500" />
                Protected by two-factor authentication.
              </p>
            </div>
          ) : (
            <div data-testid="login-step-verification">
              <button
                type="button"
                onClick={backToCredentials}
                data-testid="otp-back-button"
                className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-admin-gray-500 transition-colors hover:text-brand-500 dark:text-admin-gray-400"
              >
                <ArrowLeft size={16} />
                Back to sign in
              </button>

              <h1 className="mb-2 text-2xl font-semibold text-admin-gray-900 sm:text-3xl dark:text-white/90">
                Two-step verification
              </h1>
              <p className="mb-8 text-sm text-admin-gray-500 dark:text-admin-gray-400">
                We sent a {challenge?.code_length ?? 6}-digit code to{" "}
                <span
                  className="font-medium text-admin-gray-800 dark:text-white/90"
                  data-testid="otp-masked-email"
                >
                  {challenge?.masked_email}
                </span>
                . Enter it below to finish signing in.
              </p>

              <label className="mb-3 block text-sm font-medium text-admin-gray-700 dark:text-admin-gray-300">
                Verification code
              </label>

              <OtpInput
                length={challenge?.code_length ?? 6}
                value={code}
                onChange={(next) => {
                  setCode(next);
                  setIsCodeInvalid(false);
                }}
                onComplete={handleVerify}
                disabled={isSubmitting || isExpired}
                hasError={isCodeInvalid}
              />

              <div
                className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs"
                aria-live="polite"
              >
                {isExpired ? (
                  <span className="font-medium text-error-500" data-testid="otp-expired-label">
                    This code has expired. Request a new one.
                  </span>
                ) : (
                  <span
                    className="text-admin-gray-500 dark:text-admin-gray-400"
                    data-testid="otp-countdown"
                  >
                    Code expires in{" "}
                    <span className="font-semibold tabular-nums text-admin-gray-800 dark:text-white/90">
                      {formatCountdown(expiresIn)}
                    </span>
                  </span>
                )}

                {attemptsLeft !== null ? (
                  <span
                    className="text-admin-gray-500 dark:text-admin-gray-400"
                    data-testid="otp-attempts-left"
                  >
                    {attemptsLeft} attempt{attemptsLeft === 1 ? "" : "s"} left
                  </span>
                ) : null}
              </div>

              {formError ? (
                <div
                  className="mt-5 rounded-lg border border-error-500/30 bg-error-500/5 px-4 py-3 text-sm text-error-500"
                  data-testid="otp-form-error"
                >
                  {formError}
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => handleVerify(code)}
                disabled={isSubmitting || isExpired || code.length !== (challenge?.code_length ?? 6)}
                data-testid="otp-verify-button"
                className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-brand-500 text-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : null}
                {isSubmitting ? "Verifying…" : "Verify and sign in"}
              </button>

              <div className="mt-5 text-center text-sm text-admin-gray-500 dark:text-admin-gray-400">
                Didn&apos;t get the code?{" "}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isSubmitting || resendIn > 0}
                  data-testid="otp-resend-button"
                  className="font-medium text-brand-500 transition-colors hover:text-brand-600 disabled:cursor-not-allowed disabled:text-admin-gray-400"
                >
                  {resendIn > 0 ? `Resend in ${formatCountdown(resendIn)}` : "Resend code"}
                </button>
                {challenge ? (
                  <span className="ml-1" data-testid="otp-remaining-resends">
                    ({challenge.remaining_resends} left)
                  </span>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right column: brand panel */}
      <div className="relative hidden w-1/2 items-center justify-center overflow-hidden bg-brand-950 lg:flex">
        <div
          className="absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.35) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.35) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            maskImage: "radial-gradient(circle at 50% 40%, black, transparent 72%)",
          }}
        />
        <div
          className="absolute -top-24 -right-24 h-80 w-80 rounded-full blur-3xl"
          style={{ background: "rgba(70,95,255,0.45)" }}
        />
        <div
          className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full blur-3xl"
          style={{ background: "rgba(38,46,137,0.6)" }}
        />

        <div className="relative z-1 max-w-sm px-8 text-center">
          <span className="mx-auto mb-7 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-xl font-bold text-white ring-1 ring-white/15 backdrop-blur-sm">
            AP
          </span>
          <h2 className="mb-3 text-2xl font-semibold text-white">Adiprimanto CMS</h2>
          <p className="text-sm leading-relaxed text-white/60">
            Manage every section of your portfolio — projects, testimonials, services and
            settings — from one secure dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}
