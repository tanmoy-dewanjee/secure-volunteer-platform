"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";

import { apiSession, rememberReturnPath } from "@/lib/api";

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

  const handleClick = async () => {
    const session = await apiSession();
    if (session) {
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
