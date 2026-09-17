"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { SESSION_EVENT, apiSession, rememberReturnPath } from "@/lib/api";

type AuthGuardProps = {
  children: ReactNode;
};

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      const session = await apiSession();
      if (cancelled) return;
      if (!session) {
        rememberReturnPath(pathname);
        router.replace("/login");
        return;
      }
      setAllowed(true);
      setChecking(false);
    };

    check();

    const onSessionChange = () => {
      check();
    };

    window.addEventListener(SESSION_EVENT, onSessionChange);
    return () => {
      cancelled = true;
      window.removeEventListener(SESSION_EVENT, onSessionChange);
    };
  }, [pathname, router]);

  if (checking) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#F9F2E6]">
        <p className="font-medium text-[#140F50]">Checking access…</p>
      </div>
    );
  }

  if (!allowed) return null;

  return <>{children}</>;
}
