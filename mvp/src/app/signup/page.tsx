"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import SiteFooter from "@/components/layout/SiteFooter";
import SiteHeader from "@/components/layout/SiteHeader";
import { apiRegister } from "@/lib/api";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await apiRegister({
        email: email.trim(),
        displayName: displayName.trim(),
        password,
      });
      router.push("/discover");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#FAFAFB] text-[#140F50]">
      <SiteHeader />
      <div className="mx-auto max-w-lg px-6 py-16">
        <h1 className="text-3xl font-bold">Register as a student</h1>
        <p className="mt-2 text-sm text-gray-600">
          Public registration creates a Student account only. Admin accounts are
          seeded.
        </p>
        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-4 rounded border border-gray-200 bg-white p-6"
        >
          <div>
            <label htmlFor="displayName" className="block text-sm font-semibold">
              Display name
            </label>
            <input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="mt-1 w-full border border-gray-300 px-3 py-2"
              required
              maxLength={80}
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-semibold">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full border border-gray-300 px-3 py-2"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-semibold">
              Password (12+ characters)
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full border border-gray-300 px-3 py-2"
              required
              minLength={12}
            />
          </div>
          {error ? (
            <p className="text-sm text-[#D32362]" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={busy}
            className="w-full bg-[#1448FF] px-4 py-3 font-semibold text-white hover:bg-[#0C2B99] disabled:opacity-60"
          >
            {busy ? "Creating account…" : "Create account"}
          </button>
          <p className="text-sm">
            Already registered?{" "}
            <Link href="/login" className="font-semibold text-[#1448FF]">
              Sign in
            </Link>
          </p>
        </form>
      </div>
      <SiteFooter />
    </main>
  );
}
