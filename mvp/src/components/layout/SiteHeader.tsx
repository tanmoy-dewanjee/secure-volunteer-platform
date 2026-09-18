"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import DemoBanner from "@/components/DemoBanner";
import { useSession } from "@/hooks/useSession";

type SiteHeaderProps = {
  active?:
    | "home"
    | "discover"
    | "applications"
    | "shifts"
    | "profile"
    | "support"
    | "students"
    | "admin";
};

export default function SiteHeader({ active = "home" }: SiteHeaderProps) {
  const router = useRouter();
  const { session, ready, signedIn, isAdmin, signOut } = useSession();

  const linkClass = (id: SiteHeaderProps["active"]) =>
    id === active ? "text-[#1448FF]" : "hover:text-[#1448FF]";

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <>
      <DemoBanner />

      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-end gap-x-6 gap-y-2 px-6 py-3 text-sm text-[#140F50]">
          <Link href="/current-students" className="hover:underline">
            Current students
          </Link>
          <Link href="/volunteer-support" className="hover:underline">
            Volunteer support
          </Link>
          {!ready ? (
            <span className="text-gray-400">Account</span>
          ) : signedIn ? (
            <>
              <span className="font-semibold">
                {session?.displayName} ({session?.role})
              </span>
              <button
                type="button"
                onClick={handleSignOut}
                className="font-semibold hover:underline"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link href="/login" className="font-semibold hover:underline">
              Sign in
            </Link>
          )}
        </div>
      </div>

      <header className="border-b border-gray-200 bg-[#140F50] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-5">
          <Link href="/" className="block">
            <p className="text-2xl font-bold tracking-tight">Adelaide University</p>
            <p className="mt-1 text-sm text-white/80">
              Volunteer and Event Coordination — demo
            </p>
          </Link>

          <nav
            aria-label="Main navigation"
            className="flex flex-wrap items-center justify-end gap-x-6 gap-y-2 font-medium"
          >
            <Link href="/" className={active === "home" ? "underline" : "hover:underline"}>
              Home
            </Link>
            <Link
              href="/discover"
              className={active === "discover" ? "underline" : "hover:underline"}
            >
              Discover
            </Link>
            {isAdmin ? (
              <Link
                href="/admin/events"
                className={active === "admin" ? "underline" : "hover:underline"}
              >
                Admin events
              </Link>
            ) : null}
            <Link
              href="/my-applications"
              className={linkClass("applications")}
              style={{ color: "inherit" }}
            >
              My Applications
            </Link>
            {signedIn ? (
              <Link
                href="/discover"
                className="bg-[#1448FF] px-5 py-3 text-white transition hover:bg-[#0C2B99]"
              >
                Explore events
              </Link>
            ) : (
              <Link
                href="/login"
                className="bg-[#1448FF] px-5 py-3 text-white transition hover:bg-[#0C2B99]"
              >
                Sign in
              </Link>
            )}
          </nav>
        </div>
      </header>
    </>
  );
}
