"use client";

import { useEffect, useState } from "react";

import {
  VIEW_HISTORY_EVENT,
  getViewHistory,
  type ViewRecord,
} from "@/lib/view-history";

export function useViewHistory() {
  const [history, setHistory] = useState<ViewRecord[]>([]);

  useEffect(() => {
    const sync = () => setHistory(getViewHistory());
    sync();

    window.addEventListener(VIEW_HISTORY_EVENT, sync);
    window.addEventListener("storage", sync);

    return () => {
      window.removeEventListener(VIEW_HISTORY_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return history;
}
