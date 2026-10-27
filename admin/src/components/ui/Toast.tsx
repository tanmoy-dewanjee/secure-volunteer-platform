"use client";

import { createContext, useContext, useMemo, useState } from "react";

type Toast = { id: number; message: string; tone: "ok" | "error" };

const ToastContext = createContext<(message: string, tone?: Toast["tone"]) => void>(
  () => undefined
);

export function useToast() {
  return useContext(ToastContext);
}

export function ToastHost({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);

  const push = useMemo(
    () => (message: string, tone: Toast["tone"] = "ok") => {
      const id = Date.now();
      setItems((current) => [...current, { id, message, tone }]);
      window.setTimeout(
        () => setItems((current) => current.filter((item) => item.id !== id)),
        3200
      );
    },
    []
  );

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-6 right-6 z-[80] space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className={`pointer-events-auto min-w-[16rem] border-l-4 bg-white px-4 py-3 text-sm shadow-lg ${
              item.tone === "error" ? "border-[#ee626b]" : "border-[#18a999]"
            }`}
            role="status"
          >
            {item.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
