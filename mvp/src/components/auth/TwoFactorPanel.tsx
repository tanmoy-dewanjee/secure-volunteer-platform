"use client";

import { FormEvent, useEffect, useState } from "react";

import {
  confirmMfaEnrollment,
  getMfaRecord,
  startMfaEnrollment,
  type MfaRecord,
  verifyMfaChallenge,
} from "@/lib/mfa";
import { otpauthUrl } from "@/lib/totp";

type TwoFactorPanelProps = {
  username: string;
  mode: "enroll" | "verify";
  onVerified: () => void;
  onCancel?: () => void;
};

export default function TwoFactorPanel({
  username,
  mode,
  onVerified,
  onCancel,
}: TwoFactorPanelProps) {
  const [record, setRecord] = useState<MfaRecord | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (mode === "enroll") {
      setRecord(startMfaEnrollment(username));
      return;
    }
    setRecord(getMfaRecord(username));
  }, [mode, username]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");

    const result =
      mode === "enroll"
        ? await confirmMfaEnrollment(username, code)
        : await verifyMfaChallenge(username, code);

    setBusy(false);
    if (!result.ok) {
      setError(result.error || "That code could not be verified.");
      return;
    }
    onVerified();
  };

  const qrUrl = record
    ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
        otpauthUrl(record.secret, username)
      )}`
    : "";

  return (
    <div>
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-purple-700">
        Two-factor authentication
      </p>
      <h2 className="mt-3 text-3xl font-semibold">
        {mode === "enroll" ? "Protect this account" : "Enter your authenticator code"}
      </h2>
      <p className="mt-3 leading-7 text-gray-600">
        {mode === "enroll"
          ? "Scan the QR code with Google Authenticator, Authy or 1Password, then enter the 6-digit code from the app. Store the recovery code somewhere safe."
          : "Open your authenticator app and enter the current 6-digit code. A recovery code also works if you lose the device."}
      </p>

      {mode === "enroll" && record ? (
        <div className="mt-6 grid gap-5 border border-gray-200 bg-[#f7f7f7] p-5 sm:grid-cols-[180px_1fr]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrUrl} alt="Authenticator QR code" width={180} height={180} />
          <div>
            <p className="text-sm font-semibold">Secret key</p>
            <p className="mt-1 break-all font-mono text-sm">{record.secret}</p>
            <p className="mt-4 text-sm font-semibold">Recovery code</p>
            <p className="mt-1 font-mono text-sm">{record.recoveryCode}</p>
            <p className="mt-3 text-sm text-gray-600">
              This secret is shown only during setup. Codes from the app are
              never displayed in the portal.
            </p>
          </div>
        </div>
      ) : null}

      <form onSubmit={(event) => void handleSubmit(event)} className="mt-6 space-y-4">
        <div>
          <label htmlFor="totp" className="block font-semibold">
            6-digit code *
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
          {busy ? "Checking..." : mode === "enroll" ? "Enable 2FA" : "Verify and continue"}
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
