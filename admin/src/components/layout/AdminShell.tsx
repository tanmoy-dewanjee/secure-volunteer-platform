"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import DemoBanner from "@/components/layout/DemoBanner";
import IdleTimeout from "@/components/layout/IdleTimeout";
import { ToastHost } from "@/components/ui/Toast";
import { useAdminData } from "@/hooks/useAdminData";
import type { AdminRole } from "@/lib/models";
import { sidebarNav } from "@/lib/routing";
import { signOutAdminSession } from "@/utils/supabase/session";

type Session = {
  username: string;
  displayName: string;
  role: AdminRole;
};

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { events, ops } = useAdminData();
  const [session, setSession] = useState<Session | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [alertsOpen, setAlertsOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/auth/me", { credentials: "include" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!cancelled) setSession(data);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const signOut = async () => {
    await signOutAdminSession();
    await fetch("/api/admin/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    router.replace("/login");
    router.refresh();
  };

  const links = sidebarNav.filter(
    (item) =>
      !("role" in item) ||
      item.role === session?.role ||
      session?.role === "super_admin"
  );

  const hits = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (needle.length < 2) return [];
    const eventHits = events
      .filter((event) => event.title.toLowerCase().includes(needle))
      .slice(0, 4)
      .map((event) => ({ href: `/events/${event.id}`, label: event.title, kind: "Event" }));
    const volunteerHits = ops.volunteers
      .filter((item) => item.name.toLowerCase().includes(needle))
      .slice(0, 3)
      .map((item) => ({ href: "/volunteers", label: item.name, kind: "Volunteer" }));
    const appHits = ops.applications
      .filter((item) => item.volunteerName.toLowerCase().includes(needle))
      .slice(0, 3)
      .map((item) => ({
        href: "/applications",
        label: `${item.volunteerName} · ${item.eventTitle}`,
        kind: "Application",
      }));
    return [...eventHits, ...volunteerHits, ...appHits];
  }, [events, ops, query]);

  const alertCount =
    ops.applications.filter((item) => item.status === "Pending").length +
    ops.swaps.filter((item) => item.status === "Pending").length;

  return (
    <ToastHost>
      <div className="min-h-screen bg-[#fafafa] text-[#171717]">
        <DemoBanner />
        <IdleTimeout />
        <div className="flex min-h-[calc(100vh-40px)]">
          <aside
            className={`fixed inset-y-0 left-0 z-40 w-[17.5rem] bg-[#171717] text-white transition-transform lg:static lg:translate-x-0 ${
              navOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <div className="flex h-full flex-col px-5 py-6">
              <Link href="/" className="block" onClick={() => setNavOpen(false)}>
                <p className="text-lg font-bold tracking-tight">Adelaide University</p>
                <p className="mt-1 text-sm text-gray-400">Volunteer coordination</p>
                <span className="mt-3 inline-block rounded-full bg-[#7C00E8] px-3 py-1 text-xs font-bold uppercase tracking-[0.16em]">
                  Admin
                </span>
              </Link>
              <nav aria-label="Admin" className="mt-8 flex flex-1 flex-col gap-1">
                {links.map((item) => {
                  const active =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setNavOpen(false)}
                      className={`rounded-md px-3 py-2.5 text-sm font-medium transition ${
                        active
                          ? "bg-white text-[#171717]"
                          : "text-gray-300 hover:bg-white/10"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
              <div className="border-t border-white/10 pt-4 text-sm">
                <p className="font-semibold">{session?.displayName ?? "Coordinator"}</p>
                <p className="mt-1 text-gray-400">{session?.username}</p>
                <p className="mt-1 text-xs uppercase tracking-wide text-purple-200">
                  {session?.role?.replace("_", " ")}
                </p>
                <button
                  type="button"
                  onClick={() => void signOut()}
                  className="mt-3 font-semibold text-purple-200 hover:underline"
                >
                  Sign out
                </button>
              </div>
            </div>
          </aside>

          {navOpen ? (
            <button
              type="button"
              aria-label="Close menu"
              className="fixed inset-0 z-30 bg-black/40 lg:hidden"
              onClick={() => setNavOpen(false)}
            />
          ) : null}

          <div className="flex min-w-0 flex-1 flex-col">
            <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 backdrop-blur">
              <div className="flex items-center gap-4 px-4 py-4 lg:px-8">
                <button
                  type="button"
                  className="border border-gray-200 px-3 py-2 text-sm font-semibold lg:hidden"
                  onClick={() => setNavOpen(true)}
                >
                  Menu
                </button>
                <div className="relative min-w-0 flex-1">
                  <label className="sr-only" htmlFor="admin-search">
                    Search
                  </label>
                  <input
                    id="admin-search"
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search events, volunteers, applications"
                    className="w-full rounded-md border border-gray-200 px-4 py-2.5 outline-none focus:border-[#7C00E8] focus:ring-2 focus:ring-purple-200"
                  />
                  {hits.length > 0 ? (
                    <ul className="absolute z-30 mt-1 w-full border border-gray-200 bg-white shadow-lg">
                      {hits.map((hit) => (
                        <li key={hit.href + hit.label}>
                          <Link
                            href={hit.href}
                            onClick={() => setQuery("")}
                            className="block px-4 py-3 text-sm hover:bg-purple-50"
                          >
                            <span className="text-xs font-bold uppercase tracking-wide text-purple-700">
                              {hit.kind}
                            </span>
                            <span className="mt-1 block">{hit.label}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
                <div className="relative">
                  <button
                    type="button"
                    className="border border-gray-200 px-3 py-2 text-sm font-semibold"
                    onClick={() => setAlertsOpen((value) => !value)}
                  >
                    Alerts{alertCount ? ` (${alertCount})` : ""}
                  </button>
                  {alertsOpen ? (
                    <div className="absolute right-0 z-30 mt-1 w-72 border border-gray-200 bg-white p-3 text-sm shadow-lg">
                      <p className="font-semibold">Needs you</p>
                      <p className="mt-2 text-gray-600">
                        {ops.applications.filter((item) => item.status === "Pending").length}{" "}
                        pending applications
                      </p>
                      <p className="mt-1 text-gray-600">
                        {ops.swaps.filter((item) => item.status === "Pending").length} swap/drop
                        requests
                      </p>
                      <Link
                        href="/applications"
                        className="mt-3 inline-block font-semibold text-[#7C00E8]"
                        onClick={() => setAlertsOpen(false)}
                      >
                        Open inbox →
                      </Link>
                    </div>
                  ) : null}
                </div>
              </div>
            </header>
            <div className="page-enter flex-1">{children}</div>
          </div>
        </div>
      </div>
    </ToastHost>
  );
}
