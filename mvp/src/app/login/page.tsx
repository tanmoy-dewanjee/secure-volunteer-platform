"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import SiteFooter from "@/components/layout/SiteFooter";
import SiteHeader from "@/components/layout/SiteHeader";
import { useSession } from "@/hooks/useSession";
import { apiLogin, takeReturnPath } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const { signedIn, session, signOut, ready } = useSession();
  const [email, setEmail] = useState("student@demo.local");
  const [password, setPassword] = useState("StudentPass1234");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const user = await apiLogin({ email: email.trim(), password });
      const returnTo = takeReturnPath();
      if (user.role === "admin") {
        router.push(returnTo || "/admin/events");
      } else {
        router.push(returnTo || "/discover");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#FAFAFB] text-[#140F50]">
      <SiteHeader />
      <div className="mx-auto max-w-lg px-6 py-16">
        <h1 className="text-3xl font-bold">Sign in</h1>
        <p className="mt-2 text-sm text-gray-600">
          Demo accounts: <code>admin@demo.local</code> /{" "}
          <code>AdminPass1234</code> and <code>student@demo.local</code> /{" "}
          <code>StudentPass1234</code>.
        </p>

        {ready && signedIn ? (
          <div className="mt-8 rounded border border-gray-200 bg-white p-6">
            <p>
              Signed in as <strong>{session?.displayName}</strong> ({session?.role}
              ).
            </p>
            <div className="mt-4 flex gap-3">
              <Link
                href={session?.role === "admin" ? "/admin/events" : "/discover"}
                className="bg-[#1448FF] px-4 py-2 text-white"
              >
                Continue
              </Link>
              <button
                type="button"
                onClick={() => signOut()}
                className="border border-[#1448FF] px-4 py-2 text-[#1448FF]"
              >
                Sign out
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-4 rounded border border-gray-200 bg-white p-6">
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
                autoComplete="username"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-semibold">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full border border-gray-300 px-3 py-2"
                autoComplete="current-password"
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
              {busy ? "Signing in…" : "Sign in"}
            </button>
            <p className="text-sm">
              New student?{" "}
              <Link href="/signup" className="font-semibold text-[#1448FF]">
                Register
              </Link>
            </p>
          </form>
        )}
      </div>
      <SiteFooter />
    </main>
  );
}
