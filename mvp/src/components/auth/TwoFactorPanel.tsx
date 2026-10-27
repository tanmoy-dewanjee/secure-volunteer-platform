"use client";

import { FormEvent, useEffect, useState } from "react";

import AuthenticatorQr from "@/components/auth/AuthenticatorQr";
import {
  confirmMfaEnrollment,
  getMfaRecord,
  startMfaEnrollment,
  type MfaRecord,
} from "@/lib/mfa";
import { otpauthUrl } from "@/lib/totp";

type TwoFactorPanelProps = {
  username: string;
  mode?: "enroll" | "verify";
  onVerified: () => void | Promise<void>;
  onCancel?: () => void;
};

function loadOrStartRecord(username: string): MfaRecord | null {
  const key = username.trim().toLowerCase();
  if (!key) return null;
  return getMfaRecord(key) ?? startMfaEnrollment(key);
}

export default function TwoFactorPanel({
  username,
  onVerified,
  onCancel,
}: TwoFactorPanelProps) {
  const [record, setRecord] = useState<MfaRecord | null>(() =>
    loadOrStartRecord(username)
  );
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setRecord(loadOrStartRecord(username));
    setCode("");
    setError("");
  }, [username]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");

    const result = await confirmMfaEnrollment(username, code);

    setBusy(false);
    if (!result.ok) {
      setError(result.error || "That code could not be verified.");
      return;
    }
    await onVerified();
  };

  if (!record) {
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

  const otpauth = otpauthUrl(record.secret, username.trim().toLowerCase());

  return (
    <div>
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-purple-700">
        Two-factor authentication
      </p>
      <h2 className="mt-3 text-3xl font-semibold">Scan this QR code</h2>
      <p className="mt-3 leading-7 text-gray-600">
        You must link an authenticator app before this account can sign in. Scan
        the QR code with Google Authenticator, Authy or 1Password, save the
        recovery code, then enter the 6-digit code from the app.
      </p>

      <div className="mt-6 grid gap-5 border border-gray-200 bg-[#f7f7f7] p-5 sm:grid-cols-[196px_1fr]">
        <div className="flex items-center justify-center bg-white p-2">
          <AuthenticatorQr value={otpauth} account={username} />
        </div>
        <div>
          <p className="text-sm font-semibold">Secret key</p>
          <p className="mt-1 break-all font-mono text-sm">{record.secret}</p>
          <p className="mt-4 text-sm font-semibold">Recovery code</p>
          <p className="mt-1 font-mono text-sm">{record.recoveryCode}</p>
          <p className="mt-3 text-sm text-gray-600">
            Scan this QR first. The 6-digit box below is for the code in your
            app after scanning, not a code from this website.
          </p>
        </div>
      </div>

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
          {busy ? "Checking..." : "Enable 2FA and continue"}
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
