"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { ADMIN_IDLE_MS } from "@/lib/security/constants";

const WARN_AT = ADMIN_IDLE_MS - 2 * 60 * 1000;

export default function IdleTimeout() {
  const router = useRouter();
  const [warn, setWarn] = useState(false);

  useEffect(() => {
    let last = Date.now();
    const bump = () => {
      last = Date.now();
      setWarn(false);
    };
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach((name) => window.addEventListener(name, bump, { passive: true }));

    const timer = window.setInterval(async () => {
      const idle = Date.now() - last;
      if (idle >= ADMIN_IDLE_MS) {
        await fetch("/api/admin/auth/logout", { method: "POST", credentials: "include" });
        router.replace("/login");
        router.refresh();
        return;
      }
      if (idle >= WARN_AT) setWarn(true);
    }, 5000);

    return () => {
      events.forEach((name) => window.removeEventListener(name, bump));
      window.clearInterval(timer);
    };
  }, [router]);

  if (!warn) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-5">
      <div className="w-full max-w-md bg-white p-7 shadow-2xl" role="alertdialog" aria-modal="true">
        <div className="h-1.5 w-16 bg-[#7C00E8]" />
        <p className="mt-5 text-sm font-bold uppercase tracking-[0.15em] text-[#7C00E8]">
          Admin session
        </p>
        <h2 className="mt-3 text-2xl font-semibold">Still there?</h2>
        <p className="mt-4 leading-7 text-gray-700">
          You will be signed out in two minutes for inactivity. Move the mouse
          or press a key to stay signed in.
        </p>
      </div>
    </div>
  );
}
