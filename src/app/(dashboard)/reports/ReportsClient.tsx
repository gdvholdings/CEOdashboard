"use client";

import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { DEPARTMENTS, TICKET_STATUSES, PRIORITIES } from "@/lib/constants";

interface Session { role: string; department: string | null; }

export default function ReportsClient({ session }: { session: Session }) {
  const [loading, setLoading] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [department, setDepartment] = useState("");

  async function download() {
    setLoading(true);
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (status) params.set("status", status);
    if (priority) params.set("priority", priority);
    if (department) params.set("department", department);

    const res = await fetch(`/api/reports?${params.toString()}`);
    if (!res.ok) { setLoading(false); return; }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `GDV_Helpdesk_Report.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setLoading(false);
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
      <div>
        <h2 className="font-semibold text-slate-900 mb-1">Ticket Report</h2>
        <p className="text-sm text-slate-500">Filter and download all ticket data. Leaves fields empty to include all.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Date From</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Date To</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="">All Statuses</option>
            {TICKET_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Priority</label>
          <select value={priority} onChange={(e) => setPriority(e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="">All Priorities</option>
            {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>
      </div>

      {session.role === "SUPER_ADMIN" && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Department</label>
          <select value={department} onChange={(e) => setDepartment(e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="">All Departments</option>
            {DEPARTMENTS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
        </div>
      )}

      <div className="pt-2">
        <button onClick={download} disabled={loading}
          className="flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
          {loading ? "Generating..." : "Download CSV Report"}
        </button>
      </div>

      <div className="bg-slate-50 rounded-xl p-4 text-xs text-slate-500">
        <p className="font-medium text-slate-600 mb-1">Report includes:</p>
        <p>Ticket No, Status, Priority, Department, Issue Type, Issue Title, Submitted By, Email, Mobile, Location, Assigned To, SLA Deadline, Custom Deadline, Resolved At, Created At, Description</p>
        <p className="mt-2">All dates are in <strong>Manila Time (PHT, GMT+8)</strong>.</p>
      </div>
    </div>
  );
}
