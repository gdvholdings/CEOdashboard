import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";
import Sidebar from "@/components/Sidebar";
import { Ticket, AlertTriangle, CheckCircle2, Clock, PlusCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

async function getStats() {
  const [total, open, inProgress, resolved, closed, onHold, critical, byCategory, recent] =
    await Promise.all([
      prisma.ticket.count(),
      prisma.ticket.count({ where: { status: "OPEN" } }),
      prisma.ticket.count({ where: { status: "IN_PROGRESS" } }),
      prisma.ticket.count({ where: { status: "RESOLVED" } }),
      prisma.ticket.count({ where: { status: "CLOSED" } }),
      prisma.ticket.count({ where: { status: "ON_HOLD" } }),
      prisma.ticket.count({ where: { priority: "CRITICAL", status: { notIn: ["RESOLVED", "CLOSED"] } } }),
      prisma.ticket.groupBy({ by: ["category"], _count: { id: true }, orderBy: { _count: { id: "desc" } }, take: 5 }),
      prisma.ticket.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        select: { id: true, ticketNo: true, title: true, status: true, priority: true, category: true, createdAt: true, submittedBy: true },
      }),
    ]);
  return { total, open, inProgress, resolved, closed, onHold, critical, byCategory, recent };
}

export default async function DashboardPage() {
  const stats = await getStats();

  const statCards = [
    { label: "Total Tickets", value: stats.total, icon: Ticket, iconColor: "text-blue-500", iconBg: "bg-blue-50" },
    { label: "Open", value: stats.open, icon: Clock, iconColor: "text-orange-500", iconBg: "bg-orange-50" },
    { label: "In Progress", value: stats.inProgress, icon: AlertTriangle, iconColor: "text-yellow-500", iconBg: "bg-yellow-50" },
    { label: "Resolved", value: stats.resolved + stats.closed, icon: CheckCircle2, iconColor: "text-green-500", iconBg: "bg-green-50" },
  ];

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
              <p className="text-slate-500 text-sm mt-1">Overview of all support tickets</p>
            </div>
            <Link
              href="/tickets/new"
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              New Ticket
            </Link>
          </div>

          {stats.critical > 0 && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
              <p className="text-red-700 text-sm font-medium">
                {stats.critical} critical ticket{stats.critical > 1 ? "s" : ""} require{stats.critical === 1 ? "s" : ""} immediate attention
              </p>
              <Link href="/tickets?priority=CRITICAL" className="ml-auto text-red-600 text-sm font-medium hover:underline">
                View →
              </Link>
            </div>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {statCards.map(({ label, value, icon: Icon, iconColor, iconBg }) => (
              <div key={label} className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-slate-500 text-sm">{label}</span>
                  <div className={`${iconBg} p-2 rounded-lg`}>
                    <Icon className={`w-4 h-4 ${iconColor}`} />
                  </div>
                </div>
                <p className="text-3xl font-bold text-slate-900">{value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-semibold text-slate-900">Recent Tickets</h2>
                <Link href="/tickets" className="text-blue-600 text-sm hover:underline">View all</Link>
              </div>
              <div className="divide-y divide-slate-100">
                {stats.recent.map((ticket) => (
                  <Link
                    key={ticket.id}
                    href={`/tickets/${ticket.id}`}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 text-sm truncate">{ticket.title}</p>
                      <p className="text-slate-400 text-xs mt-0.5">
                        {ticket.ticketNo} · {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <PriorityBadge priority={ticket.priority} />
                      <StatusBadge status={ticket.status} />
                    </div>
                  </Link>
                ))}
                {stats.recent.length === 0 && (
                  <p className="px-6 py-8 text-center text-slate-400 text-sm">No tickets yet</p>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h2 className="font-semibold text-slate-900 mb-4">Status Breakdown</h2>
                <div className="space-y-3">
                  {[
                    { label: "Open", value: stats.open, color: "bg-blue-500" },
                    { label: "In Progress", value: stats.inProgress, color: "bg-yellow-500" },
                    { label: "On Hold", value: stats.onHold, color: "bg-orange-500" },
                    { label: "Resolved", value: stats.resolved, color: "bg-green-500" },
                    { label: "Closed", value: stats.closed, color: "bg-slate-400" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
                      <span className="text-sm text-slate-600 flex-1">{label}</span>
                      <span className="text-sm font-semibold text-slate-900">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h2 className="font-semibold text-slate-900 mb-4">Top Categories</h2>
                <div className="space-y-3">
                  {stats.byCategory.map((cat) => (
                    <div key={cat.category} className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 truncate pr-2">{cat.category}</span>
                      <span className="text-sm font-semibold text-slate-900 shrink-0">{cat._count.id}</span>
                    </div>
                  ))}
                  {stats.byCategory.length === 0 && (
                    <p className="text-slate-400 text-sm">No data yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
