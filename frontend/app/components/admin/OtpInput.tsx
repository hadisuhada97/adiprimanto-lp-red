"use client";

import {
  useEffect,
  useRef,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";

type OtpInputProps = {
  length: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  hasError?: boolean;
};

export default function OtpInput({
  length,
  value,
  onChange,
  onComplete,
  disabled = false,
  hasError = false,
}: OtpInputProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  const commit = (next: string) => {
    onChange(next);

    if (next.length === length) {
      onComplete?.(next);
    }
  };

  const handleChange = (index: number, raw: string) => {
    const digits = raw.replace(/\D/g, "");

    if (digits === "") return;

    const chars = value.padEnd(length, " ").split("");

    digits.split("").forEach((digit, offset) => {
      if (index + offset < length) chars[index + offset] = digit;
    });

    const next = chars.join("").replace(/\s/g, "").slice(0, length);
    commit(next);

    const focusIndex = Math.min(index + digits.length, length - 1);
    inputsRef.current[focusIndex]?.focus();
  };

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace") {
      event.preventDefault();

      const chars = value.split("");

      if (chars[index]) {
        chars[index] = "";
        commit(chars.join("").replace(/\s/g, ""));
        return;
      }

      if (index > 0) {
        chars[index - 1] = "";
        onChange(chars.join("").replace(/\s/g, "").slice(0, index - 1));
        inputsRef.current[index - 1]?.focus();
      }

      return;
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      inputsRef.current[index - 1]?.focus();
    }

    if (event.key === "ArrowRight" && index < length - 1) {
      event.preventDefault();
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();

    const digits = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);

    if (digits === "") return;

    commit(digits);
    inputsRef.current[Math.min(digits.length, length - 1)]?.focus();
  };

  return (
    <div className="flex items-center gap-2 sm:gap-3" data-testid="otp-input-group">
      {Array.from({ length }).map((_, index) => {
        const digit = value[index] ?? "";

        return (
          <input
            key={index}
            ref={(element) => {
              inputsRef.current[index] = element;
            }}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={length}
            value={digit}
            disabled={disabled}
            aria-label={`Digit ${index + 1} of ${length}`}
            data-testid={`otp-digit-${index}`}
            onChange={(event) => handleChange(index, event.target.value)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            onPaste={handlePaste}
            onFocus={(event) => event.target.select()}
            className={`h-14 w-full rounded-xl border bg-transparent text-center text-xl font-semibold tabular-nums transition-all duration-200 outline-none disabled:cursor-not-allowed disabled:opacity-60 sm:h-16 sm:text-2xl ${
              hasError
                ? "border-error-500 text-error-500 focus:ring-3 focus:ring-error-500/15"
                : digit
                  ? "border-brand-500 text-admin-gray-900 focus:ring-3 focus:ring-brand-500/15 dark:text-white/90"
                  : "border-admin-gray-300 text-admin-gray-900 focus:border-brand-500 focus:ring-3 focus:ring-brand-500/15 dark:border-admin-gray-700 dark:text-white/90"
            }`}
          />
        );
      })}
    </div>
  );
}
