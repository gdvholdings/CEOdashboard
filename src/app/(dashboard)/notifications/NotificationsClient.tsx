"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatManila } from "@/lib/utils";
import { Bell, AlertTriangle, UserCheck, MessageSquare, Ticket, CheckCheck } from "lucide-react";

interface Notification {
  id: string; type: string; title: string; message: string;
  isRead: boolean; ticketId: string | null; createdAt: Date | string;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  TICKET_CREATED: <Ticket className="w-4 h-4 text-blue-500" />,
  TICKET_OVERDUE: <AlertTriangle className="w-4 h-4 text-red-500" />,
  ASSIGNED: <UserCheck className="w-4 h-4 text-green-500" />,
  COMMENT_ADDED: <MessageSquare className="w-4 h-4 text-purple-500" />,
  STATUS_CHANGED: <Bell className="w-4 h-4 text-orange-500" />,
};

export default function NotificationsClient({ notifications: initial }: { notifications: Notification[] }) {
  const router = useRouter();
  const [notifications, setNotifications] = useState(initial);
  const [marking, setMarking] = useState(false);

  async function markRead(id: string) {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    await fetch("/api/notifications", {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }),
    });
    router.refresh();
  }

  async function markAllRead() {
    setMarking(true);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    await fetch("/api/notifications", {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ markAllRead: true }),
    });
    router.refresh();
    setMarking(false);
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div>
      {unreadCount > 0 && (
        <div className="flex justify-end mb-3">
          <button onClick={markAllRead} disabled={marking}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
            <CheckCheck className="w-4 h-4" />
            Mark all as read
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
        {notifications.map((n) => (
          <div key={n.id} className={`flex gap-4 px-5 py-4 transition-colors ${!n.isRead ? "bg-blue-50/40" : ""}`}>
            <div className="mt-0.5 shrink-0 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
              {TYPE_ICONS[n.type] ?? <Bell className="w-4 h-4 text-slate-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${!n.isRead ? "font-semibold text-slate-900" : "font-medium text-slate-700"}`}>{n.title}</p>
              <p className="text-sm text-slate-500 mt-0.5">{n.message}</p>
              <p className="text-xs text-slate-400 mt-1">{formatManila(n.createdAt, "MMM d, yyyy h:mm a")}</p>
              {n.ticketId && (
                <Link href={`/tickets/${n.ticketId}`} onClick={() => !n.isRead && markRead(n.id)}
                  className="text-xs text-blue-600 hover:underline mt-1 inline-block">
                  View ticket →
                </Link>
              )}
            </div>
            {!n.isRead && (
              <button onClick={() => markRead(n.id)}
                className="shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2 hover:bg-blue-600 transition-colors" title="Mark as read" />
            )}
          </div>
        ))}

        {notifications.length === 0 && (
          <div className="px-5 py-12 text-center">
            <Bell className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">No notifications yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
