"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TICKET_STATUSES, TICKET_PRIORITIES, STAFF_MEMBERS } from "@/lib/constants";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";
import { MessageSquare, Lock, Loader2, Activity, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Comment {
  id: string;
  body: string;
  author: string;
  isInternal: boolean;
  createdAt: Date | string;
}

interface ActivityItem {
  id: string;
  action: string;
  field?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  actor: string;
  createdAt: Date | string;
}

interface Ticket {
  id: string;
  status: string;
  priority: string;
  assignedTo?: string | null;
  comments?: Comment[];
  activities?: ActivityItem[];
}

interface Props {
  ticket: Ticket;
  panelOnly?: boolean;
}

export default function TicketDetailClient({ ticket, panelOnly = false }: Props) {
  const router = useRouter();
  const [updating, setUpdating] = useState(false);
  const [commenting, setCommenting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [commenterName, setCommenterName] = useState("");
  const [activeTab, setActiveTab] = useState<"comments" | "activity">("comments");

  async function updateField(field: string, value: string) {
    setUpdating(true);
    await fetch(`/api/tickets/${ticket.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value, actor: "Support Team" }),
    });
    router.refresh();
    setUpdating(false);
  }

  async function addComment() {
    if (!commentText.trim() || !commenterName.trim()) return;
    setCommenting(true);
    await fetch(`/api/tickets/${ticket.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: commentText, author: commenterName, isInternal }),
    });
    setCommentText("");
    setIsInternal(false);
    router.refresh();
    setCommenting(false);
  }

  async function deleteTicket() {
    if (!confirm("Are you sure you want to delete this ticket? This action cannot be undone.")) return;
    setDeleting(true);
    await fetch(`/api/tickets/${ticket.id}`, { method: "DELETE" });
    router.push("/tickets");
  }

  if (panelOnly) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-900 mb-4">Update Ticket</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Status</label>
            <select
              defaultValue={ticket.status}
              onChange={(e) => updateField("status", e.target.value)}
              disabled={updating}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {TICKET_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-500 mb-1 block">Priority</label>
            <select
              defaultValue={ticket.priority}
              onChange={(e) => updateField("priority", e.target.value)}
              disabled={updating}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {TICKET_PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-500 mb-1 block">Assign To</label>
            <select
              defaultValue={ticket.assignedTo ?? ""}
              onChange={(e) => updateField("assignedTo", e.target.value)}
              disabled={updating}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <option value="">Unassigned</option>
              {STAFF_MEMBERS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {updating && (
            <p className="text-xs text-blue-600 flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              Updating...
            </p>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100">
          <button
            onClick={deleteTicket}
            disabled={deleting}
            className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
          >
            {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            Delete Ticket
          </button>
        </div>
      </div>
    );
  }

  const comments = ticket.comments ?? [];
  const activities = ticket.activities ?? [];

  return (
    <div className="bg-white rounded-xl border border-slate-200">
      <div className="flex border-b border-slate-100">
        <button
          onClick={() => setActiveTab("comments")}
          className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors ${
            activeTab === "comments"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Comments ({comments.length})
        </button>
        <button
          onClick={() => setActiveTab("activity")}
          className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors ${
            activeTab === "activity"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Activity className="w-4 h-4" />
          Activity ({activities.length})
        </button>
      </div>

      {activeTab === "comments" && (
        <div>
          <div className="divide-y divide-slate-100">
            {comments.map((comment) => (
              <div key={comment.id} className={`px-6 py-4 ${comment.isInternal ? "bg-amber-50" : ""}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-slate-200 rounded-full flex items-center justify-center text-xs font-bold text-slate-600">
                      {comment.author.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-slate-700">{comment.author}</span>
                    {comment.isInternal && (
                      <span className="flex items-center gap-1 text-xs text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                        <Lock className="w-3 h-3" />
                        Internal
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400">
                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-slate-600 pl-9 whitespace-pre-wrap">{comment.body}</p>
              </div>
            ))}
            {comments.length === 0 && (
              <p className="px-6 py-8 text-center text-slate-400 text-sm">No comments yet</p>
            )}
          </div>

          <div className="px-6 py-4 border-t border-slate-100">
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Your name"
                value={commenterName}
                onChange={(e) => setCommenterName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <textarea
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isInternal}
                    onChange={(e) => setIsInternal(e.target.checked)}
                    className="rounded"
                  />
                  <Lock className="w-3.5 h-3.5" />
                  Internal note
                </label>
                <button
                  onClick={addComment}
                  disabled={commenting || !commentText.trim() || !commenterName.trim()}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {commenting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Add Comment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "activity" && (
        <div className="divide-y divide-slate-100">
          {activities.map((act) => (
            <div key={act.id} className="px-6 py-3.5 flex items-start gap-3">
              <div className="w-1.5 h-1.5 bg-slate-300 rounded-full mt-2 shrink-0" />
              <div className="flex-1 text-sm">
                <span className="font-medium text-slate-700">{act.actor}</span>{" "}
                {act.action === "created" && <span className="text-slate-500">created this ticket</span>}
                {act.action === "commented" && <span className="text-slate-500">added a comment</span>}
                {act.action === "updated" && act.field && (
                  <span className="text-slate-500">
                    updated <strong className="text-slate-700">{act.field}</strong>
                    {act.oldValue && act.newValue && (
                      <> from <StatusOrText value={act.oldValue} field={act.field} /> to <StatusOrText value={act.newValue} field={act.field} /></>
                    )}
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-400 shrink-0">
                {formatDistanceToNow(new Date(act.createdAt), { addSuffix: true })}
              </span>
            </div>
          ))}
          {activities.length === 0 && (
            <p className="px-6 py-8 text-center text-slate-400 text-sm">No activity yet</p>
          )}
        </div>
      )}
    </div>
  );
}

function StatusOrText({ value, field }: { value: string; field: string }) {
  if (field === "status") return <StatusBadge status={value} />;
  if (field === "priority") return <PriorityBadge priority={value} />;
  return <strong className="text-slate-700">{value || "none"}</strong>;
}
