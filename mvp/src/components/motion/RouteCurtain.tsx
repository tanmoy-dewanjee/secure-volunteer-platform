"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { consumeLoginWave } from "@/lib/login-wave";

function Wave({
  className,
  fill,
  d,
}: {
  className: string;
  fill: string;
  d: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 2400 180"
      preserveAspectRatio="none"
      aria-hidden
    >
      <path fill={fill} d={d} />
    </svg>
  );
}

export default function RouteCurtain({
  kicker = "Adelaide University",
}: {
  kicker?: string;
}) {
  const pathname = usePathname();
  const [phase, setPhase] = useState<"idle" | "cover" | "reveal">("idle");

  useEffect(() => {
    if (!consumeLoginWave()) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    setPhase("cover");
    const reveal = window.setTimeout(() => setPhase("reveal"), 920);
    const done = window.setTimeout(() => setPhase("idle"), 1860);
    return () => {
      window.clearTimeout(reveal);
      window.clearTimeout(done);
    };
  }, [pathname]);

  if (phase === "idle") return null;

  return (
    <div className={`route-curtain ${phase}`} aria-hidden>
      <div className="tide">
        <div className="tide-crests">
          <Wave
            className="tide-wave tide-wave-back"
            fill="rgba(56, 189, 248, 0.38)"
            d="M0 96C180 24 360 168 540 96C720 24 900 168 1080 96C1260 24 1440 168 1620 96C1800 24 1980 168 2160 96C2280 60 2340 84 2400 96V180H0Z"
          />
          <Wave
            className="tide-wave tide-wave-mid"
            fill="rgba(124, 58, 237, 0.78)"
            d="M0 88C200 160 400 16 600 88C800 160 1000 16 1200 88C1400 160 1600 16 1800 88C2000 160 2200 16 2400 88V180H0Z"
          />
          <Wave
            className="tide-wave tide-wave-front"
            fill="#312e81"
            d="M0 104C150 48 300 150 450 104C600 58 750 150 900 104C1050 58 1200 150 1350 104C1500 58 1650 150 1800 104C1950 58 2100 150 2250 104C2325 82 2360 96 2400 104V180H0Z"
          />
          <Wave
            className="tide-wave tide-wave-foam"
            fill="rgba(224, 242, 254, 0.42)"
            d="M0 118C120 86 240 148 360 118C480 88 600 148 720 118C840 88 960 148 1080 118C1200 88 1320 148 1440 118C1560 88 1680 148 1800 118C1920 88 2040 148 2160 118C2280 88 2340 108 2400 118V180H0Z"
          />
        </div>
        <div className="tide-body">
          <span className="tide-caustic" />
          <span className="tide-bubble tide-bubble-a" />
          <span className="tide-bubble tide-bubble-b" />
          <span className="tide-bubble tide-bubble-c" />
          <span className="tide-bubble tide-bubble-d" />
          <span className="tide-bubble tide-bubble-e" />
          <div className="route-curtain-brand">
            <span className="route-curtain-mark">AU</span>
            <span className="route-curtain-copy">{kicker}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
