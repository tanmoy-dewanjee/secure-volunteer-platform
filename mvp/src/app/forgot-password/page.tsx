"use client";

import Link from "next/link";
import { FormEvent, Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

import SiteFooter from "@/components/layout/SiteFooter";
import SiteHeader from "@/components/layout/SiteHeader";
import { requestStudentPasswordReset } from "@/utils/supabase/session";

function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [popupTitle, setPopupTitle] = useState("");
  const [popupMessage, setPopupMessage] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const linkError = searchParams.get("error") === "invalid";

  const isValidStudentId = (value: string) => /^a\d{7}$/i.test(value.trim());
  const isValidStudentEmail = (value: string) => {
    const email = value.trim().toLowerCase();
    return (
      /^a\d+@adelaide\.edu\.au$/i.test(email) ||
      /^[a-z0-9._%+-]+@student\.adelaide\.edu\.au$/i.test(email)
    );
  };

  const openPopup = (title: string, message: string) => {
    setPopupTitle(title);
    setPopupMessage(message);
    setShowPopup(true);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = username.trim().toLowerCase();
    setUsernameError("");

    if (!value) {
      setUsernameError("University username is required.");
      openPopup("Check your details", "Please enter your university username.");
      return;
    }
    if (!isValidStudentId(value) && !isValidStudentEmail(value)) {
      setUsernameError("Enter a valid student username or student email.");
      openPopup(
        "Check your details",
        "Use a username such as a1234567, or your Adelaide University student email."
      );
      return;
    }

    setBusy(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: value }),
      });
      try {
        await requestStudentPasswordReset(value);
      } catch {
        /* API already requested the reset when the client client is unavailable. */
      }
      setSent(true);
    } catch {
      openPopup(
        "Could not send reset email",
        "Please try again in a moment."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#7C00E8]">
        Account recovery
      </p>
      <h2 className="mt-3 text-3xl font-semibold">Forgot password</h2>

      {linkError ? (
        <p className="mt-4 border-l-4 border-red-500 bg-red-50 p-4 text-sm leading-6 text-red-800">
          That reset link is invalid or has expired. Request a new one below.
        </p>
      ) : null}

      {sent ? (
        <>
          <p className="mt-4 leading-7 text-gray-600">
            If an account exists for that username, we sent a reset link to the
            student email on file. Open it on this device to choose a new
            password.
          </p>
          <p className="mt-4 text-sm leading-6 text-gray-500">
            The link expires after a short time. Check junk mail if it does not
            arrive.
          </p>
          <Link
            href="/login"
            className="mt-8 block bg-black px-6 py-4 text-center text-lg font-semibold text-white transition hover:bg-[#7C00E8]"
          >
            Back to sign in
          </Link>
        </>
      ) : (
        <>
          <p className="mt-4 leading-7 text-gray-600">
            Enter your university username. We will email a reset link if there
            is a student account for it.
          </p>
          <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-6">
            <div>
              <label htmlFor="username" className="block font-semibold">
                University username *
              </label>
              <input
                id="username"
                name="username"
                type="text"
                value={username}
                onChange={(event) => {
                  setUsername(event.target.value);
                  setUsernameError("");
                }}
                placeholder="a1234567"
                autoComplete="username"
                aria-invalid={Boolean(usernameError)}
                className={`mt-2 w-full border px-4 py-3.5 text-lg outline-none transition focus:ring-2 focus:ring-purple-200 ${
                  usernameError
                    ? "border-red-500"
                    : "border-gray-300 focus:border-[#7C00E8]"
                }`}
              />
              {usernameError ? (
                <p role="alert" className="mt-2 text-sm font-medium text-red-600">
                  {usernameError}
                </p>
              ) : (
                <p className="mt-2 text-sm text-gray-500">
                  Example: a1234567, or a1234567@adelaide.edu.au
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={busy}
              className="w-full bg-black px-6 py-4 text-lg font-semibold text-white transition hover:bg-[#7C00E8] disabled:opacity-60"
            >
              {busy ? "Sending reset email…" : "Send reset email"}
            </button>
          </form>
          <p className="mt-7 text-center text-gray-600">
            Remembered it?{" "}
            <Link href="/login" className="font-semibold text-[#7C00E8] hover:underline">
              Sign in
            </Link>
          </p>
        </>
      )}

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
    </>
  );
}

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen bg-[#f3f1ed] text-[#171717]">
      <SiteHeader />
      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div className="hidden lg:block">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#7C00E8]">
            Student / Volunteer Portal
          </p>
          <h1 className="mt-4 max-w-lg text-3xl font-semibold leading-tight md:text-4xl">
            Reset access
            <span className="block text-[#7C00E8]">without a coordinator.</span>
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-gray-600">
            We send a one-time link to your student email. You choose a new
            password on this portal, then sign in with 2FA as usual.
          </p>
        </div>
        <div className="mx-auto w-full max-w-xl bg-white p-8 shadow-sm md:p-10">
          <Suspense fallback={<p className="text-gray-600">Loading…</p>}>
            <ForgotPasswordForm />
          </Suspense>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
