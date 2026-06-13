"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { TICKET_STATUSES, PRIORITIES } from "@/lib/constants";

interface Member { id: string; name: string; }
interface Ticket { id: string; status: string; priority: string; assignedToId: string | null; }
interface Session { role: string; }

export default function TicketActions({ ticket, members, session }: { ticket: Ticket; members: Member[]; session: Session; }) {
  const router = useRouter();
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const canUpdate = session.role !== "MEMBER" || ticket.assignedToId === null;
  const canDelete = session.role === "SUPER_ADMIN";

  async function update(field: string, value: string) {
    setUpdating(true);
    await fetch(`/api/tickets/${ticket.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    router.refresh();
    setUpdating(false);
  }

  async function handleDelete() {
    if (!confirm("Delete this ticket permanently? This cannot be undone.")) return;
    setDeleting(true);
    await fetch(`/api/tickets/${ticket.id}`, { method: "DELETE" });
    router.push("/tickets");
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h3 className="font-semibold text-slate-900 mb-4 text-sm">Update Ticket</h3>
      <div className="space-y-3">
        <div>
          <label className="text-xs text-slate-500 mb-1 block">Status</label>
          <select defaultValue={ticket.status} onChange={(e) => update("status", e.target.value)}
            disabled={updating}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50">
            {TICKET_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs text-slate-500 mb-1 block">Priority</label>
          <select defaultValue={ticket.priority} onChange={(e) => update("priority", e.target.value)}
            disabled={updating}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50">
            {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>

        {(session.role === "SUPER_ADMIN" || session.role === "DEPT_HEAD") && (
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Assign To</label>
            <select defaultValue={ticket.assignedToId ?? ""} onChange={(e) => update("assignedToId", e.target.value)}
              disabled={updating}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50">
              <option value="">Unassigned</option>
              {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
        )}

        {updating && (
          <div className="flex items-center gap-1.5 text-xs text-blue-600">
            <Loader2 className="w-3 h-3 animate-spin" />
            Updating...
          </div>
        )}
      </div>

      {canDelete && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <button onClick={handleDelete} disabled={deleting}
            className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 transition-colors disabled:opacity-50">
            {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            Delete Ticket
          </button>
        </div>
      )}
    </div>
  );
}
