"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TICKET_CATEGORIES, TICKET_PRIORITIES, DEPARTMENTS, STAFF_MEMBERS } from "@/lib/constants";
import { Loader2 } from "lucide-react";

export default function NewTicketForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = e.currentTarget;
    const data = {
      title: (form.elements.namedItem("title") as HTMLInputElement).value,
      description: (form.elements.namedItem("description") as HTMLTextAreaElement).value,
      category: (form.elements.namedItem("category") as HTMLSelectElement).value,
      priority: (form.elements.namedItem("priority") as HTMLSelectElement).value,
      submittedBy: (form.elements.namedItem("submittedBy") as HTMLInputElement).value,
      assignedTo: (form.elements.namedItem("assignedTo") as HTMLSelectElement).value || null,
      department: (form.elements.namedItem("department") as HTMLSelectElement).value || null,
      dueDate: (form.elements.namedItem("dueDate") as HTMLInputElement).value || null,
    };

    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Failed to create ticket");
      const ticket = await res.json();
      router.push(`/tickets/${ticket.id}`);
    } catch {
      setError("Failed to create ticket. Please try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">{error}</div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          name="title"
          required
          placeholder="Brief description of the issue"
          className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          name="description"
          required
          rows={4}
          placeholder="Provide detailed information about the issue..."
          className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            name="category"
            required
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Select category</option>
            {TICKET_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Priority</label>
          <select
            name="priority"
            defaultValue="MEDIUM"
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            {TICKET_PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Submitted By <span className="text-red-500">*</span>
        </label>
        <input
          name="submittedBy"
          required
          placeholder="Your full name"
          className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Assign To</label>
          <select
            name="assignedTo"
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Unassigned</option>
            {STAFF_MEMBERS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Department</label>
          <select
            name="department"
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Select department</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Due Date</label>
        <input
          name="dueDate"
          type="date"
          className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 px-4 py-2.5 text-sm border border-slate-200 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? "Creating..." : "Create Ticket"}
        </button>
      </div>
    </form>
  );
}
