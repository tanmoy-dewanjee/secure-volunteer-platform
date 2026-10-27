"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import AdminShell from "@/components/layout/AdminShell";
import { useToast } from "@/components/ui/Toast";
import { adminAccounts } from "@/lib/auth/accounts";

export default function SettingsPage() {
  return (
    <AdminShell>
      <SettingsInner />
    </AdminShell>
  );
}

function SettingsInner() {
  const toast = useToast();
  const [backend, setBackend] = useState<{ configured: boolean } | null>(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    void fetch("/api/admin/sync")
      .then((response) => response.json())
      .then((payload: { configured?: boolean }) =>
        setBackend({ configured: Boolean(payload.configured) })
      )
      .catch(() => setBackend({ configured: false }));
  }, []);

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
        toast(
          `Catalogue pushed to Supabase (${payload.events ?? 0} events).`
        );
      }
    } catch {
      toast("Could not reach the backend.");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="px-4 py-8 lg:px-8">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-purple-700">
        System
      </p>
      <h1 className="mt-2 text-2xl font-semibold">Admin and settings</h1>
      <p className="mt-2 text-sm text-gray-500">
        Super admin tools. Event categories match the student Discover filters.
      </p>
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="font-semibold">Supabase backend</h2>
        <p className="mt-2 text-sm text-gray-600">
          {backend?.configured
            ? "Connected. Events, applications, volunteers and audit write to Postgres."
            : "Not configured. Portals currently use the local demo store. Add NEXT_PUBLIC_SUPABASE_URL and keys, run the SQL migration, then sync."}
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
      <div className="mt-6 overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[#fafafa]">
            <tr>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Username</th>
              <th className="px-4 py-3 font-semibold">Role</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {adminAccounts.map((row) => (
              <tr key={row.id} className="border-t border-gray-100">
                <td className="px-4 py-3 font-semibold">{row.displayName}</td>
                <td className="px-4 py-3">{row.username}</td>
                <td className="px-4 py-3">{row.role.replace("_", " ")}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    className="mr-3 font-semibold text-[#7C00E8]"
                    onClick={() => toast("MFA reset queued for next sign-in.")}
                  >
                    Reset MFA
                  </button>
                  <button
                    type="button"
                    className="font-semibold text-red-700"
                    onClick={() => toast("Force logout flagged for that account.")}
                  >
                    Force logout
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        type="button"
        onClick={() => toast("Invite sent to the demo mailbox.")}
        className="mt-6 bg-black px-5 py-3 font-semibold text-white hover:bg-purple-700"
      >
        Invite admin
      </button>
    </div>
  );
}
