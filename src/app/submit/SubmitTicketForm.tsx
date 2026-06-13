"use client";

import { useState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { DEPARTMENTS, DEPARTMENT_ISSUE_TYPES, LOCATIONS, PRIORITIES, NO_URGENT_DEPARTMENTS } from "@/lib/constants";

export default function SubmitTicketForm() {
  const [department, setDepartment] = useState("");
  const [priority, setPriority] = useState("");
  const [issueType, setIssueType] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState<{ ticketNo: string } | null>(null);

  const issueTypes = department ? DEPARTMENT_ISSUE_TYPES[department] ?? [] : [];
  const isSecurityDept = department === "SECURITY";
  const availablePriorities = PRIORITIES.filter((p) => {
    if (NO_URGENT_DEPARTMENTS.includes(department) && p.value === "URGENT") return false;
    return true;
  });
  const requiresDeadline = priority === "LOW";

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
      if (!res.ok) throw new Error(data.error ?? "Submission failed");
      setSubmitted({ ticketNo: data.ticketNo });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Ticket Submitted!</h2>
        <p className="text-slate-500 mb-4">Your concern has been received. Please note your ticket number.</p>
        <div className="inline-block bg-blue-50 border border-blue-200 rounded-xl px-6 py-3 mb-6">
          <p className="text-xs text-blue-600 font-medium mb-1">Your Ticket Number</p>
          <p className="text-2xl font-bold text-blue-700 tracking-wider">{submitted.ticketNo}</p>
        </div>
        <p className="text-sm text-slate-500 mb-6">
          Our team will review your concern and respond within the SLA timeframe.
        </p>
        <button
          onClick={() => {
            setSubmitted(null);
            setDepartment("");
            setPriority("");
            setIssueType("");
          }}
          className="text-sm text-blue-600 font-medium hover:underline"
        >
          Submit another ticket
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Your Full Name <span className="text-red-500">*</span>
          </label>
          <input
            name="submitterName"
            required
            placeholder="e.g. Juan dela Cruz"
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Company Email Address <span className="text-red-500">*</span>
          </label>
          <input
            name="submitterEmail"
            type="email"
            required
            placeholder="you@gdvholdings.com"
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Mobile Number <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <input
            name="submitterMobile"
            type="tel"
            placeholder="e.g. 09XX-XXX-XXXX"
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Concerned Department <span className="text-red-500">*</span>
          </label>
          <select
            required
            value={department}
            onChange={(e) => { setDepartment(e.target.value); setIssueType(""); setPriority(""); }}
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Select department</option>
            {DEPARTMENTS.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Priority <span className="text-red-500">*</span>
          </label>
          <select
            required
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            disabled={!department}
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:opacity-50"
          >
            <option value="">Select priority</option>
            {availablePriorities.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
          {department && priority === "LOW" && (
            <p className="mt-1 text-xs text-amber-600">Low priority requires a deadline.</p>
          )}
          {department && NO_URGENT_DEPARTMENTS.includes(department) && (
            <p className="mt-1 text-xs text-slate-400">Urgent priority is not available for this department.</p>
          )}
        </div>
      </div>

      {requiresDeadline && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Deadline <span className="text-red-500">*</span>
          </label>
          <input
            name="customDeadline"
            type="date"
            required
            min={new Date().toISOString().split("T")[0]}
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {!isSecurityDept && issueTypes.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Issue Type <span className="text-red-500">*</span>
          </label>
          <select
            required
            value={issueType}
            onChange={(e) => setIssueType(e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Select issue type</option>
            {issueTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          {issueType === "Others" && (
            <input
              name="issueTypeOther"
              required
              placeholder="Please specify..."
              className="mt-2 w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Issue Title <span className="text-red-500">*</span>
        </label>
        <input
          name="issueTitle"
          required
          placeholder="Brief title for your concern or request"
          className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Location <span className="text-red-500">*</span>
        </label>
        <select
          name="location"
          required
          className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">Select location</option>
          {LOCATIONS.map((loc) => (
            <option key={loc} value={loc}>{loc}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Detailed Description <span className="text-red-500">*</span>
        </label>
        <textarea
          name="description"
          required
          rows={5}
          placeholder="Please describe your concern or request in detail..."
          className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600">
        <p className="font-medium text-slate-700 mb-1">SLA Response Timeframes:</p>
        <ul className="space-y-0.5 text-xs">
          <li>🔴 <strong>Urgent</strong> — 2 hours</li>
          <li>🟠 <strong>High</strong> — within 24 hours</li>
          <li>🟡 <strong>Medium</strong> — within 2–3 days</li>
          <li>🟢 <strong>Low</strong> — based on deadline provided</li>
        </ul>
      </div>

      <button
        type="submit"
        disabled={loading || !department || !priority}
        className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {loading ? "Submitting..." : "Submit Ticket"}
      </button>
    </form>
  );
}
