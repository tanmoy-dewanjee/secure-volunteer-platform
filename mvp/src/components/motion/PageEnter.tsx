"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function PageEnter({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [progress, setProgress] = useState(false);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    setEntered(false);
    setProgress(true);
    const start = window.requestAnimationFrame(() => setEntered(true));
    const timer = window.setTimeout(() => setProgress(false), 520);
    return () => {
      window.cancelAnimationFrame(start);
      window.clearTimeout(timer);
    };
  }, [pathname]);

  return (
    <>
      <div
        className={`pointer-events-none fixed inset-x-0 top-0 z-[90] h-0.5 origin-left bg-purple-700 transition-transform duration-500 ease-out ${
          progress ? "scale-x-100" : "scale-x-0"
        }`}
        aria-hidden
      />
      <div className={entered ? "page-enter" : undefined}>{children}</div>
    </>
  );
}
