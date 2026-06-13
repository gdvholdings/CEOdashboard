"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatManila } from "@/lib/utils";
import { Loader2, Lock, MessageSquare, Activity } from "lucide-react";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";

interface Comment {
  id: string;
  body: string;
  isInternal: boolean;
  createdAt: Date | string;
  author: { id: string; name: string; role: string };
}

interface ActivityItem {
  id: string;
  action: string;
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
  actorName: string;
  createdAt: Date | string;
}

interface Session { id: string; name: string; role: string; }

export default function CommentsSection({
  ticket,
  session,
}: {
  ticket: { id: string; comments: Comment[]; activities: ActivityItem[] };
  session: Session;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"comments" | "activity">("comments");
  const [body, setBody] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function addComment() {
    if (!body.trim()) return;
    setSubmitting(true);
    await fetch(`/api/tickets/${ticket.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body, isInternal }),
    });
    setBody("");
    setIsInternal(false);
    router.refresh();
    setSubmitting(false);
  }

  const comments = ticket.comments;
  const activities = ticket.activities;

  return (
    <div className="bg-white rounded-xl border border-slate-200">
      <div className="flex border-b border-slate-100">
        {[
          { key: "comments", label: `Comments (${comments.length})`, icon: MessageSquare },
          { key: "activity", label: `Activity (${activities.length})`, icon: Activity },
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key as "comments" | "activity")}
            className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors border-b-2 ${
              tab === key ? "text-blue-600 border-blue-600" : "text-slate-500 border-transparent hover:text-slate-700"
            }`}>
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === "comments" && (
        <>
          <div className="divide-y divide-slate-100">
            {comments.map((c) => (
              <div key={c.id} className={`px-6 py-4 ${c.isInternal ? "bg-amber-50/60" : ""}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-slate-200 rounded-full flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">
                      {c.author.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-slate-700">{c.author.name}</span>
                    {c.isInternal && (
                      <span className="flex items-center gap-1 text-xs text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full">
                        <Lock className="w-3 h-3" />Internal
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400">{formatManila(c.createdAt, "MMM d, h:mm a")}</span>
                </div>
                <p className="text-sm text-slate-600 pl-9 whitespace-pre-wrap leading-relaxed">{c.body}</p>
              </div>
            ))}
            {comments.length === 0 && (
              <p className="px-6 py-8 text-center text-slate-400 text-sm">No comments yet. Be the first to respond.</p>
            )}
          </div>

          <div className="px-6 py-4 border-t border-slate-100 space-y-3">
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3}
              placeholder="Write a response or note..."
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
                <input type="checkbox" checked={isInternal} onChange={(e) => setIsInternal(e.target.checked)} className="rounded" />
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                Internal note only
              </label>
              <button onClick={addComment} disabled={submitting || !body.trim()}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50">
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {submitting ? "Posting..." : "Add Comment"}
              </button>
            </div>
          </div>
        </>
      )}

      {tab === "activity" && (
        <div className="divide-y divide-slate-100">
          {activities.map((act) => (
            <div key={act.id} className="px-6 py-3.5 flex items-start gap-3">
              <div className="w-1.5 h-1.5 bg-slate-300 rounded-full mt-2 shrink-0" />
              <div className="flex-1 text-sm">
                <span className="font-medium text-slate-700">{act.actorName}</span>{" "}
                {act.action === "created" && <span className="text-slate-500">created this ticket</span>}
                {act.action === "commented" && <span className="text-slate-500">added a comment</span>}
                {act.action === "updated" && act.field && (
                  <span className="text-slate-500">
                    updated <strong className="text-slate-700">{act.field}</strong>
                    {act.oldValue && act.newValue && (
                      <> from{" "}
                        {act.field === "status" ? <StatusBadge status={act.oldValue} /> : act.field === "priority" ? <PriorityBadge priority={act.oldValue} /> : <strong>{act.oldValue || "none"}</strong>}
                        {" "}to{" "}
                        {act.field === "status" ? <StatusBadge status={act.newValue} /> : act.field === "priority" ? <PriorityBadge priority={act.newValue} /> : <strong>{act.newValue || "none"}</strong>}
                      </>
                    )}
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-400 shrink-0">{formatManila(act.createdAt, "MMM d, h:mm a")}</span>
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
