"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import AdminShell from "@/components/layout/AdminShell";
import type { AdminRole } from "@/lib/models";

type Me = {
  username: string;
  displayName: string;
  role: AdminRole;
  email?: string;
  roleLabel?: string;
};

export default function AdminProfilePage() {
  return (
    <AdminShell>
      <ProfileInner />
    </AdminShell>
  );
}

function ProfileInner() {
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    void fetch("/api/admin/auth/me", { credentials: "include" })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: Me | null) => setMe(payload));
  }, []);

  if (!me) {
    return (
      <div className="px-4 py-8 lg:px-8">
        <p className="text-gray-600">Loading profile...</p>
      </div>
    );
  }

  const role = me.roleLabel || me.role.replace("_", " ");

  return (
    <div className="px-4 py-8 lg:px-8">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-purple-700">
        Account
      </p>
      <h1 className="mt-2 text-2xl font-semibold">Profile</h1>
      <p className="mt-2 max-w-xl text-sm leading-6 text-gray-600">
        This is your coordinator account on the admin portal. Student volunteer
        profiles stay on the student site.
      </p>

      <article className="mt-8 max-w-xl rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-xl font-semibold">{me.displayName}</h2>
        <dl className="mt-5 space-y-3 text-sm">
          <div>
            <dt className="text-gray-500">Username</dt>
            <dd className="mt-1 font-medium">{me.username}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Email</dt>
            <dd className="mt-1 font-medium">{me.email || "Not stored on this demo account"}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Role</dt>
            <dd className="mt-1 font-medium capitalize">{role}</dd>
          </div>
        </dl>
      </article>

      <div className="mt-6 flex flex-wrap gap-4 text-sm font-semibold">
        <Link href="/" className="text-[#7C00E8] hover:underline">
          Back to dashboard →
        </Link>
        {me.role === "super_admin" ? (
          <Link href="/settings" className="text-[#7C00E8] hover:underline">
            Admin settings →
          </Link>
        ) : null}
      </div>
    </div>
  );
}
