"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";

import { getSession, rememberReturnPath } from "@/lib/session";

type ProtectedLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
};

export default function ProtectedLink({
  href,
  children,
  className = "",
}: ProtectedLinkProps) {
  const router = useRouter();

  const handleClick = () => {
    if (getSession()) {
      router.push(href);
      return;
    }

    rememberReturnPath(href);
    router.push("/login");
  };

  return (
    <button type="button" onClick={handleClick} className={className}>
      {children}
    </button>
  );
}
