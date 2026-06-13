"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { DEPARTMENTS, DEPARTMENT_ISSUE_TYPES, LOCATIONS, PRIORITIES, NO_URGENT_DEPARTMENTS } from "@/lib/constants";

interface Member { id: string; name: string; department: string | null; role: string; }
interface CurrentUser { name: string; email: string; role: string; department: string | null; }

export default function NewTicketForm({ members, currentUser }: { members: Member[]; currentUser: CurrentUser }) {
  const router = useRouter();
  const [department, setDepartment] = useState("");
  const [priority, setPriority] = useState("");
  const [issueType, setIssueType] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const issueTypes = department ? DEPARTMENT_ISSUE_TYPES[department] ?? [] : [];
  const isSecurityDept = department === "SECURITY";
  const availablePriorities = PRIORITIES.filter((p) =>
    !(NO_URGENT_DEPARTMENTS.includes(department) && p.value === "URGENT")
  );
  const requiresDeadline = priority === "LOW";

  const deptMembers = department ? members.filter((m) => m.department === department) : members;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = e.currentTarget;
    const get = (name: string) => (form.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null)?.value ?? "";

    const body = {
      submitterName: get("submitterName"),
      submitterEmail: get("submitterEmail"),
      submitterMobile: get("submitterMobile"),
      department,
      priority,
      issueType: isSecurityDept ? "Security Concern" : issueType,
      issueTypeOther: issueType === "Others" ? get("issueTypeOther") : null,
      issueTitle: get("issueTitle"),
      location: get("location"),
      description: get("description"),
      customDeadline: requiresDeadline ? get("customDeadline") : null,
    };

    try {
      const res = await fetch("/api/tickets/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create ticket");

      // Assign if selected
      const assignedToId = get("assignedToId");
      if (assignedToId && data.id) {
        await fetch(`/api/tickets/${data.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assignedToId }),
        });
      }

      router.push(`/tickets/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed. Please try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Submitter Name <span className="text-red-500">*</span></label>
          <input name="submitterName" required defaultValue={currentUser.name}
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Email <span className="text-red-500">*</span></label>
          <input name="submitterEmail" type="email" required defaultValue={currentUser.email}
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Mobile</label>
          <input name="submitterMobile" type="tel" placeholder="09XX-XXX-XXXX"
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Department <span className="text-red-500">*</span></label>
          <select required value={department} onChange={(e) => { setDepartment(e.target.value); setIssueType(""); setPriority(""); }}
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="">Select</option>
            {DEPARTMENTS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Priority <span className="text-red-500">*</span></label>
          <select required value={priority} onChange={(e) => setPriority(e.target.value)} disabled={!department}
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:opacity-50">
            <option value="">Select</option>
            {availablePriorities.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>
      </div>

      {requiresDeadline && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Deadline <span className="text-red-500">*</span></label>
          <input name="customDeadline" type="date" required min={new Date().toISOString().split("T")[0]}
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      )}

      {!isSecurityDept && issueTypes.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Issue Type <span className="text-red-500">*</span></label>
          <select required value={issueType} onChange={(e) => setIssueType(e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="">Select issue type</option>
            {issueTypes.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          {issueType === "Others" && (
            <input name="issueTypeOther" required placeholder="Please specify..."
              className="mt-2 w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          )}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Issue Title <span className="text-red-500">*</span></label>
        <input name="issueTitle" required placeholder="Brief description"
          className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Location <span className="text-red-500">*</span></label>
          <select name="location" required
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="">Select location</option>
            {LOCATIONS.map((loc) => <option key={loc} value={loc}>{loc}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Assign To</label>
          <select name="assignedToId"
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="">Unassigned</option>
            {deptMembers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Description <span className="text-red-500">*</span></label>
        <textarea name="description" required rows={4} placeholder="Detailed description..."
          className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={() => router.back()}
          className="flex-1 px-4 py-2.5 text-sm border border-slate-200 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={loading || !department || !priority}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? "Creating..." : "Create Ticket"}
        </button>
      </div>
    </form>
  );
}
