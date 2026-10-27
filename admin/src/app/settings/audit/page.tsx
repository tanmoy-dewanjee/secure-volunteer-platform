"use client";

import { useMemo, useState } from "react";

import AdminShell from "@/components/layout/AdminShell";
import { useAdminData } from "@/hooks/useAdminData";

export default function AuditPage() {
  return (
    <AdminShell>
      <AuditInner />
    </AdminShell>
  );
}

function AuditInner() {
  const { ops } = useAdminData();
  const [who, setWho] = useState("");
  const [action, setAction] = useState("");
  const rows = useMemo(
    () =>
      ops.audit.filter((row) => {
        if (who && !row.who.toLowerCase().includes(who.toLowerCase())) return false;
        if (action && !row.action.toLowerCase().includes(action.toLowerCase())) return false;
        return true;
      }),
    [ops.audit, who, action]
  );

  return (
    <div className="px-4 py-8 lg:px-8">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-purple-700">
        Audit
      </p>
      <h1 className="mt-2 text-2xl font-semibold">Activity log</h1>
      <p className="mt-2 text-sm text-gray-500">Read-only. Entries cannot be edited or deleted.</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <input
          value={who}
          onChange={(event) => setWho(event.target.value)}
          placeholder="Filter by user"
          className="rounded-md border border-gray-200 px-3 py-2 text-sm"
        />
        <input
          value={action}
          onChange={(event) => setAction(event.target.value)}
          placeholder="Filter by action"
          className="rounded-md border border-gray-200 px-3 py-2 text-sm"
        />
      </div>
      <div className="mt-6 overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[#fafafa]">
            <tr>
              <th className="px-4 py-3 font-semibold">When</th>
              <th className="px-4 py-3 font-semibold">Who</th>
              <th className="px-4 py-3 font-semibold">Action</th>
              <th className="px-4 py-3 font-semibold">Target</th>
              <th className="px-4 py-3 font-semibold">IP</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-gray-100">
                <td className="px-4 py-3">{row.at}</td>
                <td className="px-4 py-3">{row.who}</td>
                <td className="px-4 py-3">{row.action}</td>
                <td className="px-4 py-3">{row.target}</td>
                <td className="px-4 py-3">{row.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
