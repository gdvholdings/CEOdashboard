"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Search, X } from "lucide-react";

interface Props {
  statuses: readonly { value: string; label: string }[];
  priorities: readonly { value: string; label: string }[];
  departments: readonly { value: string; label: string }[];
  current: Record<string, string | undefined>;
}

export default function TicketFilters({ statuses, priorities, departments, current }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      params.delete("page");
      router.push(`/tickets?${params.toString()}`);
    },
    [router, searchParams]
  );

  const hasFilters = current.status || current.priority || current.department || current.search || current.overdue;

  return (
    <div className="mb-4 flex flex-wrap gap-3">
      <div className="relative flex-1 min-w-48">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search ticket #, title, email..."
          defaultValue={current.search ?? ""}
          onKeyDown={(e) => { if (e.key === "Enter") update("search", (e.target as HTMLInputElement).value); }}
          onChange={(e) => { if (!e.target.value) update("search", ""); }}
          className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <select value={current.status ?? ""} onChange={(e) => update("status", e.target.value)}
        className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
        <option value="">All Statuses</option>
        {statuses.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
      </select>

      <select value={current.priority ?? ""} onChange={(e) => update("priority", e.target.value)}
        className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
        <option value="">All Priorities</option>
        {priorities.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
      </select>

      {departments.length > 0 && (
        <select value={current.department ?? ""} onChange={(e) => update("department", e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
          <option value="">All Depts</option>
          {departments.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
        </select>
      )}

      {hasFilters && (
        <button onClick={() => router.push("/tickets")}
          className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 transition-colors">
          <X className="w-3.5 h-3.5" />
          Clear
        </button>
      )}
    </div>
  );
}
