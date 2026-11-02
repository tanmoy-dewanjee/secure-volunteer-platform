"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

import PasswordStrength from "@/components/auth/PasswordStrength";
import AdminShell from "@/components/layout/AdminShell";
import { useToast } from "@/components/ui/Toast";
import type { AdminRole } from "@/lib/models";
import { passwordError } from "@/lib/security/password";

type ListedAdmin = {
  id: string;
  username: string;
  displayName: string;
  email: string;
  role: AdminRole;
  roleLabel: string;
  canRemove: boolean;
};

type Me = {
  username: string;
  displayName: string;
  role: AdminRole;
};

export default function SettingsPage() {
  return (
    <AdminShell>
      <SettingsInner />
    </AdminShell>
  );
}

function SettingsInner() {
  const toast = useToast();
  const [me, setMe] = useState<Me | null>(null);
  const [backend, setBackend] = useState<{ configured: boolean } | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [accounts, setAccounts] = useState<ListedAdmin[]>([]);
  const [busy, setBusy] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const isSuper = me?.role === "super_admin";

  const loadAdmins = async () => {
    const response = await fetch("/api/admin/admins", { credentials: "include" });
    if (!response.ok) return;
    const payload = (await response.json()) as { accounts?: ListedAdmin[] };
    setAccounts(payload.accounts ?? []);
  };

  useEffect(() => {
    void fetch("/api/admin/auth/me", { credentials: "include" })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: Me | null) => setMe(payload));
    void fetch("/api/admin/sync")
      .then((response) => response.json())
      .then((payload: { configured?: boolean }) =>
        setBackend({ configured: Boolean(payload.configured) })
      )
      .catch(() => setBackend({ configured: false }));
  }, []);

  useEffect(() => {
    if (isSuper) void loadAdmins();
  }, [isSuper]);

  const sync = async () => {
    setSyncing(true);
    try {
      const response = await fetch("/api/admin/sync", { method: "POST" });
      const payload = (await response.json()) as {
        error?: string;
        events?: number;
      };
      if (!response.ok) {
        toast(payload.error || "Could not sync to Supabase.");
      } else {
        toast(`Catalogue pushed to Supabase (${payload.events ?? 0} events).`);
      }
    } catch {
      toast("Could not reach the backend.");
    } finally {
      setSyncing(false);
    }
  };

  const addCoordinator = async (event: FormEvent) => {
    event.preventDefault();
    const strengthError = passwordError(password, {
      username,
      email,
      name: displayName,
    });
    if (strengthError) {
      toast(strengthError);
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/admin/admins", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, username, email, password }),
      });
      const payload = (await response.json()) as {
        error?: string;
        account?: ListedAdmin;
      };
      if (!response.ok) {
        toast(payload.error || "Could not add that coordinator.");
        return;
      }
      toast(`${payload.account?.displayName || username} can now sign in as a club coordinator.`);
      setDisplayName("");
      setUsername("");
      setEmail("");
      setPassword("");
      await loadAdmins();
    } catch {
      toast("Could not add that coordinator.");
    } finally {
      setBusy(false);
    }
  };

  const removeCoordinator = async (account: ListedAdmin) => {
    if (!account.canRemove) return;
    setBusy(true);
    try {
      const response = await fetch(
        `/api/admin/admins?id=${encodeURIComponent(account.id)}`,
        { method: "DELETE", credentials: "include" }
      );
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        toast(payload.error || "Could not remove that coordinator.");
        return;
      }
      toast(`${account.displayName} can no longer sign in.`);
      await loadAdmins();
    } catch {
      toast("Could not remove that coordinator.");
    } finally {
      setBusy(false);
    }
  };

  if (!me) {
    return (
      <div className="px-4 py-8 lg:px-8">
        <p className="text-gray-600">Loading settings...</p>
      </div>
    );
  }

  if (!isSuper) {
    return (
      <div className="px-4 py-8 lg:px-8">
        <h1 className="text-2xl font-semibold">Admin and settings</h1>
        <p className="mt-4 max-w-xl leading-7 text-gray-600">
          Only the super admin can add club coordinators. You can still review
          events, applications and volunteers.
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 py-8 lg:px-8">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-purple-700">
        System
      </p>
      <h1 className="mt-2 text-2xl font-semibold">Admin and settings</h1>
      <p className="mt-2 text-sm text-gray-500">
        Super admin tools. Club coordinators can run events and applications,
        but they cannot add other admins.
      </p>
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="font-semibold">Supabase backend</h2>
        <p className="mt-2 text-sm text-gray-600">
          {backend?.configured
            ? "Connected. Events, applications, volunteers, audit and club coordinators write to Postgres."
            : "Not configured. Add Supabase keys, run the SQL migrations including 0008_admin_accounts.sql, then sync."}
        </p>
        <button
          type="button"
          onClick={() => void sync()}
          disabled={syncing || !backend?.configured}
          className="mt-4 bg-black px-5 py-3 font-semibold text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          {syncing ? "Syncing..." : "Push catalogue to Supabase"}
        </button>
      </div>
      <Link href="/settings/audit" className="mt-3 inline-block font-semibold text-[#7C00E8]">
        Open audit log →
      </Link>

      <form
        onSubmit={(event) => void addCoordinator(event)}
        className="mt-8 rounded-xl border border-gray-200 bg-white p-5"
      >
        <h2 className="font-semibold">Add a club coordinator</h2>
        <p className="mt-2 text-sm text-gray-600">
          They sign in on the admin portal with this username and password.
          They cannot add or promote admins.
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="text-sm font-semibold">
            Full name
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              required
              className="mt-2 w-full border border-gray-300 px-3 py-2 font-normal"
            />
          </label>
          <label className="text-sm font-semibold">
            Username
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
              placeholder="rotaract.jane"
              className="mt-2 w-full border border-gray-300 px-3 py-2 font-normal"
            />
          </label>
          <label className="text-sm font-semibold">
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="mt-2 w-full border border-gray-300 px-3 py-2 font-normal"
            />
          </label>
          <label className="text-sm font-semibold md:col-span-2">
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="new-password"
              className="mt-2 w-full border border-gray-300 px-3 py-2 font-normal"
            />
            <PasswordStrength
              password={password}
              context={{ username, email, name: displayName }}
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={busy || !backend?.configured}
          className="mt-5 bg-black px-5 py-3 font-semibold text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          {busy ? "Saving..." : "Add club coordinator"}
        </button>
      </form>

      <div className="mt-6 overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[#fafafa]">
            <tr>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Username</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Role</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((row) => (
              <tr key={row.id} className="border-t border-gray-100">
                <td className="px-4 py-3 font-semibold">{row.displayName}</td>
                <td className="px-4 py-3">{row.username}</td>
                <td className="px-4 py-3">{row.email}</td>
                <td className="px-4 py-3">{row.roleLabel}</td>
                <td className="px-4 py-3">
                  {row.canRemove ? (
                    <button
                      type="button"
                      disabled={busy}
                      className="font-semibold text-red-700 disabled:text-gray-400"
                      onClick={() => void removeCoordinator(row)}
                    >
                      Remove
                    </button>
                  ) : (
                    <span className="text-gray-500">Protected</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
