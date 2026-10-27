"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import SiteFooter from "@/components/layout/SiteFooter";
import SiteHeader from "@/components/layout/SiteHeader";
import {
  establishRecoverySessionFromUrl,
  updateStudentPassword,
} from "@/utils/supabase/session";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [busy, setBusy] = useState(false);
  const [popupTitle, setPopupTitle] = useState("");
  const [popupMessage, setPopupMessage] = useState("");
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    let cancelled = false;
    establishRecoverySessionFromUrl()
      .then((ok) => {
        if (cancelled) return;
        setReady(true);
        setInvalid(!ok);
      })
      .catch(() => {
        if (cancelled) return;
        setReady(true);
        setInvalid(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const openPopup = (title: string, message: string) => {
    setPopupTitle(title);
    setPopupMessage(message);
    setShowPopup(true);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordError("");
    setConfirmError("");

    if (password.length < 8) {
      setPasswordError("Password must contain at least 8 characters.");
      openPopup("Check your details", "Your new password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setConfirmError("The passwords do not match.");
      openPopup("Check your details", "The passwords do not match. Enter them again.");
      return;
    }

    setBusy(true);
    try {
      const result = await updateStudentPassword(password);
      if (!result.ok) {
        openPopup(
          "Could not update password",
          result.error || "Request a new reset link and try again."
        );
        return;
      }
      openPopup(
        "Password updated",
        "Sign in with your new password. You will still confirm with your authenticator app."
      );
      window.setTimeout(() => router.push("/login"), 900);
    } catch {
      openPopup("Could not update password", "Please request a new reset link.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f3f1ed] text-[#171717]">
      <SiteHeader />
      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div className="hidden lg:block">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#7C00E8]">
            Student / Volunteer Portal
          </p>
          <h1 className="mt-4 max-w-lg text-3xl font-semibold leading-tight md:text-4xl">
            Choose a new
            <span className="block text-[#7C00E8]">password.</span>
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-gray-600">
            This page only works from the email link. After saving, sign in
            again with two-factor authentication.
          </p>
        </div>
        <div className="mx-auto w-full max-w-xl bg-white p-8 shadow-sm md:p-10">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#7C00E8]">
            Account recovery
          </p>
          <h2 className="mt-3 text-3xl font-semibold">Set a new password</h2>

          {!ready ? (
            <p className="mt-6 text-gray-600">Checking your reset link…</p>
          ) : invalid ? (
            <>
              <p className="mt-4 leading-7 text-gray-600">
                This reset link is invalid or has expired. Request a new email
                from the student portal.
              </p>
              <Link
                href="/forgot-password"
                className="mt-8 block bg-black px-6 py-4 text-center text-lg font-semibold text-white transition hover:bg-[#7C00E8]"
              >
                Request a new link
              </Link>
            </>
          ) : (
            <>
              <p className="mt-4 leading-7 text-gray-600">
                Enter a new password for your volunteer account. Use at least 8
                characters.
              </p>
              <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-6">
                <div>
                  <div className="flex items-center justify-between gap-4">
                    <label htmlFor="password" className="font-semibold">
                      New password *
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="text-sm font-semibold text-[#7C00E8] hover:underline"
                    >
                      {showPassword ? "Hide password" : "Show password"}
                    </button>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setPasswordError("");
                    }}
                    autoComplete="new-password"
                    className={`mt-2 w-full border px-4 py-3.5 text-lg outline-none transition focus:ring-2 focus:ring-purple-200 ${
                      passwordError
                        ? "border-red-500"
                        : "border-gray-300 focus:border-[#7C00E8]"
                    }`}
                  />
                  {passwordError ? (
                    <p role="alert" className="mt-2 text-sm font-medium text-red-600">
                      {passwordError}
                    </p>
                  ) : null}
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="font-semibold">
                    Confirm password *
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(event) => {
                      setConfirmPassword(event.target.value);
                      setConfirmError("");
                    }}
                    autoComplete="new-password"
                    className={`mt-2 w-full border px-4 py-3.5 text-lg outline-none transition focus:ring-2 focus:ring-purple-200 ${
                      confirmError
                        ? "border-red-500"
                        : "border-gray-300 focus:border-[#7C00E8]"
                    }`}
                  />
                  {confirmError ? (
                    <p role="alert" className="mt-2 text-sm font-medium text-red-600">
                      {confirmError}
                    </p>
                  ) : null}
                </div>
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full bg-black px-6 py-4 text-lg font-semibold text-white transition hover:bg-[#7C00E8] disabled:opacity-60"
                >
                  {busy ? "Saving…" : "Save new password"}
                </button>
              </form>
            </>
          )}
        </div>
      </section>

      {showPopup ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-5"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-white p-7 shadow-2xl">
            <div className="h-1.5 w-16 bg-[#7C00E8]" />
            <h2 className="mt-5 text-2xl font-semibold">{popupTitle}</h2>
            <p className="mt-4 leading-7 text-gray-700">{popupMessage}</p>
            <button
              type="button"
              onClick={() => setShowPopup(false)}
              className="mt-7 w-full bg-black px-5 py-3 font-semibold text-white transition hover:bg-[#7C00E8]"
            >
              OK
            </button>
          </div>
        </div>
      ) : null}

      <SiteFooter />
    </main>
  );
}
