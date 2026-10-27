"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import QrCodeImage from "@/components/qr/QrCodeImage";
import { signInAdminSession } from "@/utils/supabase/session";

type Enrollment = {
  secret: string;
  otpauthUrl: string;
  recoveryCode: string;
};

export default function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<"password" | "mfa">("password");
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const finish = () => {
    const next = searchParams.get("next");
    router.replace(next && next.startsWith("/") && !next.startsWith("//") ? next : "/");
    router.refresh();
  };

  const handlePassword = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    const response = await fetch("/api/admin/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username, password }),
    });
    const data = (await response.json()) as {
      error?: string;
      enrolled?: boolean;
      enrollment?: Enrollment;
    };
    setBusy(false);
    if (!response.ok) {
      setError(data.error || "Sign-in details were not recognised.");
      return;
    }
    setEnrollment(data.enrolled ? null : data.enrollment ?? null);
    setStep("mfa");
  };

  const handleMfa = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    const response = await fetch("/api/admin/auth/mfa", {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ code }),
    });
    const data = (await response.json()) as { error?: string };
    setBusy(false);
    if (!response.ok) {
      setError(data.error || "That code is not valid.");
      return;
    }
    await signInAdminSession(username, password);
    finish();
  };

  if (step === "mfa") {
    return (
      <form onSubmit={(event) => void handleMfa(event)} className="mt-8 space-y-6">
        {enrollment ? (
          <>
            <p className="leading-7 text-gray-600">
              First sign-in for this coordinator requires authenticator setup.
              Scan the QR code, store the recovery code, then enter the 6-digit
              code from the app.
            </p>
            <div className="grid gap-5 border border-gray-200 bg-[#f7f7f7] p-5 sm:grid-cols-[180px_1fr]">
              <QrCodeImage
                value={enrollment.otpauthUrl}
                label="Authenticator QR code"
                size={180}
              />
              <div>
                <p className="text-sm font-semibold">Secret key</p>
                <p className="mt-1 break-all font-mono text-sm">{enrollment.secret}</p>
                <p className="mt-4 text-sm font-semibold">Recovery code</p>
                <p className="mt-1 font-mono text-sm">{enrollment.recoveryCode}</p>
                <p className="mt-3 text-sm text-gray-600">
                  Codes from the authenticator app are never shown in this portal.
                </p>
              </div>
            </div>
          </>
        ) : (
          <p className="leading-7 text-gray-600">
            Open your authenticator app and enter the current 6-digit code.
          </p>
        )}
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
            className="mt-2 w-full border border-gray-300 px-4 py-3.5 text-lg tracking-[0.3em] outline-none focus:border-[#7C00E8] focus:ring-2 focus:ring-purple-200"
            placeholder="123456"
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
          className="w-full bg-black px-6 py-4 text-lg font-semibold text-white transition hover:bg-[#7C00E8] disabled:opacity-60"
        >
          {busy ? "Checking..." : enrollment ? "Enable 2FA and sign in" : "Verify and sign in"}
        </button>
        <button
          type="button"
          onClick={() => {
            setStep("password");
            setCode("");
            setError("");
            setEnrollment(null);
          }}
          className="w-full border border-black px-6 py-3 font-semibold hover:bg-[#f3f1ed]"
        >
          Back
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={(event) => void handlePassword(event)} className="mt-8 space-y-6" noValidate>
      <div>
        <label htmlFor="username" className="block font-semibold">
          Coordinator username *
        </label>
        <input
          id="username"
          autoComplete="username"
          value={username}
          onChange={(event) => {
            setUsername(event.target.value);
            setError("");
          }}
          placeholder="rotaract.admin"
          className="mt-2 w-full border border-gray-300 px-4 py-3.5 text-lg outline-none focus:border-[#7C00E8] focus:ring-2 focus:ring-purple-200"
        />
      </div>
      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="font-semibold">
            Password *
          </label>
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="text-sm font-semibold text-[#7C00E8] hover:underline"
          >
            {showPassword ? "Hide password" : "Show password"}
          </button>
        </div>
        <input
          id="password"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            setError("");
          }}
          className="mt-2 w-full border border-gray-300 px-4 py-3.5 text-lg outline-none focus:border-[#7C00E8] focus:ring-2 focus:ring-purple-200"
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
        className="w-full bg-black px-6 py-4 text-lg font-semibold text-white transition hover:bg-[#7C00E8] disabled:opacity-60"
      >
        {busy ? "Checking..." : "Continue to 2FA"}
      </button>
    </form>
  );
}
