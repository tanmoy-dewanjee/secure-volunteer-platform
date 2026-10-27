"use client";

import { FormEvent, useEffect, useState } from "react";

import AuthenticatorQr from "@/components/auth/AuthenticatorQr";
import {
  confirmMfaEnrollment,
  getMfaRecord,
  startMfaEnrollment,
  verifyMfaChallenge,
  type MfaRecord,
} from "@/lib/mfa";
import { otpauthUrl } from "@/lib/totp";

type TwoFactorPanelProps = {
  username: string;
  mode?: "enroll" | "verify";
  onVerified: () => void | Promise<void>;
  onCancel?: () => void;
};

export default function TwoFactorPanel({
  username,
  mode = "enroll",
  onVerified,
  onCancel,
}: TwoFactorPanelProps) {
  const enroll = mode === "enroll";
  const [record, setRecord] = useState<MfaRecord | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const key = username.trim().toLowerCase();
    if (!key) {
      setRecord(null);
      return;
    }
    setRecord(enroll ? startMfaEnrollment(key) : getMfaRecord(key));
    setCode("");
    setError("");
  }, [enroll, username]);

  const persistEnabled = async (secret?: string, recoveryCode?: string) => {
    await fetch("/api/auth/mfa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "enable",
        username: username.trim().toLowerCase(),
        code,
        secret,
        recoveryCode,
      }),
    }).catch(() => undefined);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    const key = username.trim().toLowerCase();

    if (enroll) {
      const result = await confirmMfaEnrollment(key, code);
      if (!result.ok) {
        setBusy(false);
        setError(result.error || "That code could not be verified.");
        return;
      }
      await persistEnabled(result.record?.secret, result.record?.recoveryCode);
      setBusy(false);
      await onVerified();
      return;
    }

    const local = await verifyMfaChallenge(key, code);
    if (local.ok) {
      setBusy(false);
      await onVerified();
      return;
    }

    try {
      const response = await fetch("/api/auth/mfa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", username: key, code }),
      });
      const payload = (await response.json()) as { error?: string; ok?: boolean };
      setBusy(false);
      if (!response.ok || !payload.ok) {
        setError(payload.error || "That authentication code is not valid.");
        return;
      }
      await onVerified();
    } catch {
      setBusy(false);
      setError(local.error || "That authentication code is not valid.");
    }
  };

  if (enroll && !record) {
    return (
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-purple-700">
          Two-factor authentication
        </p>
        <h2 className="mt-3 text-3xl font-semibold">Scan this QR code</h2>
        <p className="mt-3 leading-7 text-gray-600">
          Preparing authenticator setup…
        </p>
      </div>
    );
  }

  const otpauth = record
    ? otpauthUrl(record.secret, username.trim().toLowerCase())
    : "";

  return (
    <div>
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-purple-700">
        Two-factor authentication
      </p>
      {enroll ? (
        <>
          <h2 className="mt-3 text-3xl font-semibold">Scan this QR code</h2>
          <p className="mt-3 leading-7 text-gray-600">
            Link an authenticator app before this account can sign in. Scan the
            QR code, save the recovery code, then enter the 6-digit code from
            the app.
          </p>
          <div className="mt-6 grid gap-5 border border-gray-200 bg-[#f7f7f7] p-5 sm:grid-cols-[196px_1fr]">
            <div className="flex items-center justify-center bg-white p-2">
              <AuthenticatorQr value={otpauth} account={username} />
            </div>
            <div>
              <p className="text-sm font-semibold">Secret key</p>
              <p className="mt-1 break-all font-mono text-sm">{record?.secret}</p>
              <p className="mt-4 text-sm font-semibold">Recovery code</p>
              <p className="mt-1 font-mono text-sm">{record?.recoveryCode}</p>
            </div>
          </div>
        </>
      ) : (
        <>
          <h2 className="mt-3 text-3xl font-semibold">Enter your 2FA code</h2>
          <p className="mt-3 leading-7 text-gray-600">
            This account already has an authenticator app linked. Open the app
            and enter the current 6-digit code. You can also use your recovery
            code.
          </p>
        </>
      )}

      <form onSubmit={(event) => void handleSubmit(event)} className="mt-6 space-y-4">
        <div>
          <label htmlFor="totp" className="block font-semibold">
            6-digit code from your app *
          </label>
          <input
            id="totp"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(event) => {
              setCode(event.target.value);
              setError("");
            }}
            placeholder="123456"
            className="mt-2 w-full border border-gray-300 px-4 py-3.5 text-lg tracking-[0.3em] outline-none focus:border-purple-700 focus:ring-2 focus:ring-purple-100"
          />
        </div>
        {error ? (
          <p role="alert" className="text-sm font-medium text-red-600">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={busy}
          className="w-full bg-black px-6 py-3.5 font-semibold text-white transition hover:bg-purple-700 disabled:opacity-60"
        >
          {busy ? "Checking..." : enroll ? "Enable 2FA and continue" : "Verify and continue"}
        </button>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="w-full border border-black px-6 py-3 font-semibold hover:bg-[#f3f1ed]"
          >
            Back
          </button>
        ) : null}
      </form>
    </div>
  );
}
