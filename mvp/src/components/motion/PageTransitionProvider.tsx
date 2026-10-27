"use client";

import RouteCurtain from "@/components/motion/RouteCurtain";

export default function PageTransitionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <RouteCurtain />
      {children}
    </>
  );
}
