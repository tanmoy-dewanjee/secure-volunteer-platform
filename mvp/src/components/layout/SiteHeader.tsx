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
    | "students";
};

export default function SiteHeader({ active = "home" }: SiteHeaderProps) {
  const router = useRouter();
  const { session, ready, signedIn, signOut } = useSession();

  const linkClass = (id: SiteHeaderProps["active"]) =>
    id === active ? "text-purple-700" : "hover:text-purple-700";

  const handleSignOut = () => {
    signOut();
    router.push("/");
  };

  return (
    <>
      <DemoBanner />

      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-end gap-x-6 gap-y-2 px-6 py-3 text-sm">
          <Link href="/current-students" className="hover:text-purple-700 hover:underline">
            Current students
          </Link>
          <Link href="/volunteer-support" className="hover:text-purple-700 hover:underline">
            Volunteer support
          </Link>
          {!ready ? (
            <span className="text-gray-400">Account</span>
          ) : signedIn ? (
            <>
              <Link href="/profile" className="font-semibold hover:text-purple-700">
                {session?.username}
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="font-semibold hover:text-purple-700 hover:underline"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="font-semibold hover:text-purple-700 hover:underline"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>

      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-5">
          <Link href="/" className="block">
            <p className="text-2xl font-bold tracking-tight">Adelaide University</p>
            <p className="mt-1 text-sm text-gray-500">
              Volunteer & Event Coordination
            </p>
          </Link>

          <nav
            aria-label="Main navigation"
            className="flex flex-wrap items-center justify-end gap-x-6 gap-y-2 font-medium"
          >
            <Link href="/" className={linkClass("home")}>
              Home
            </Link>
            <Link href="/discover" className={linkClass("discover")}>
              Discover
            </Link>
            <Link href="/my-applications" className={linkClass("applications")}>
              My Applications
            </Link>
            <Link href="/my-shifts" className={linkClass("shifts")}>
              My Shifts
            </Link>
            <Link href="/profile" className={linkClass("profile")}>
              Profile
            </Link>
            {signedIn ? (
              <Link
                href="/profile"
                className="bg-black px-5 py-3 text-white transition hover:bg-purple-700"
              >
                Your portal
              </Link>
            ) : (
              <Link
                href="/login"
                className="bg-black px-5 py-3 text-white transition hover:bg-purple-700"
              >
                Student Portal
              </Link>
            )}
          </nav>
        </div>
      </header>
    </>
  );
}
