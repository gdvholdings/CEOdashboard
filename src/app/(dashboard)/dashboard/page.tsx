import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildTicketWhere } from "@/lib/tickets";
import { StatusBadge, PriorityBadge, OverdueBadge } from "@/components/StatusBadge";
import { formatManila, isOverdue, getDeptLabel } from "@/lib/utils";
import { Ticket, AlertTriangle, CheckCircle2, Clock, PlusCircle, Timer } from "lucide-react";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const baseWhere = buildTicketWhere(session, {});

  const [total, open, inProgress, resolved, overdue, byDept, recent] = await Promise.all([
    prisma.ticket.count({ where: baseWhere }),
    prisma.ticket.count({ where: { ...baseWhere, status: "OPEN" } }),
    prisma.ticket.count({ where: { ...baseWhere, status: "IN_PROGRESS" } }),
    prisma.ticket.count({ where: { ...baseWhere, status: { in: ["RESOLVED", "CLOSED"] } } }),
    prisma.ticket.count({
      where: {
        ...baseWhere,
        status: { notIn: ["RESOLVED", "CLOSED"] },
        OR: [{ slaDeadline: { lt: new Date() } }, { customDeadline: { lt: new Date() } }],
      },
    }),
    prisma.ticket.groupBy({ by: ["department"], _count: { id: true }, where: baseWhere, orderBy: { _count: { id: "desc" } } }),
    prisma.ticket.findMany({
      where: baseWhere,
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { assignedTo: { select: { name: true } } },
    }),
  ]);

  const stats = [
    { label: "Total Tickets", value: total, icon: Ticket, iconColor: "text-blue-500", iconBg: "bg-blue-50" },
    { label: "Open", value: open, icon: Clock, iconColor: "text-orange-500", iconBg: "bg-orange-50" },
    { label: "In Progress", value: inProgress, icon: Timer, iconColor: "text-yellow-500", iconBg: "bg-yellow-50" },
    { label: "Resolved", value: resolved, icon: CheckCircle2, iconColor: "text-green-500", iconBg: "bg-green-50" },
  ];

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Welcome back, {session.name} · {formatManila(new Date(), "EEE, MMM d, yyyy h:mm a")} PHT
            </p>
          </div>
          <Link
            href="/tickets/new"
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            New Ticket
          </Link>
        </div>

        {overdue > 0 && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            <p className="text-red-700 text-sm font-medium">
              {overdue} ticket{overdue > 1 ? "s have" : " has"} exceeded the SLA deadline and require immediate attention.
            </p>
            <Link href="/tickets?overdue=true" className="ml-auto text-red-600 text-sm font-semibold hover:underline whitespace-nowrap">
              View overdue →
            </Link>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map(({ label, value, icon: Icon, iconColor, iconBg }) => (
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
              {recent.map((t) => {
                const overdueTk = isOverdue(t.slaDeadline) || isOverdue(t.customDeadline);
                const active = !["RESOLVED", "CLOSED"].includes(t.status);
                return (
                  <Link
                    key={t.id}
                    href={`/tickets/${t.id}`}
                    className="flex items-start gap-4 px-6 py-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-slate-900 text-sm truncate">{t.issueTitle}</p>
                        {active && overdueTk && <OverdueBadge />}
                      </div>
                      <p className="text-slate-400 text-xs mt-0.5">
                        {t.ticketNo} · {getDeptLabel(t.department)} · {formatManila(t.createdAt, "MMM d, h:mm a")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                      <PriorityBadge priority={t.priority} />
                      <StatusBadge status={t.status} />
                    </div>
                  </Link>
                );
              })}
              {recent.length === 0 && (
                <p className="px-6 py-10 text-center text-slate-400 text-sm">No tickets yet. <Link href="/submit" className="text-blue-600 hover:underline">Submit the first one →</Link></p>
              )}
            </div>
          </div>

          <div className="space-y-5">
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h2 className="font-semibold text-slate-900 mb-4">Tickets by Department</h2>
              <div className="space-y-3">
                {byDept.map((d) => (
                  <div key={d.department} className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">{getDeptLabel(d.department)}</span>
                    <span className="text-sm font-semibold text-slate-900">{d._count.id}</span>
                  </div>
                ))}
                {byDept.length === 0 && <p className="text-slate-400 text-sm">No data yet</p>}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h2 className="font-semibold text-slate-900 mb-3">Quick Actions</h2>
              <div className="space-y-2">
                <Link href="/submit" className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition-colors border border-slate-200">
                  <PlusCircle className="w-4 h-4 text-blue-500" />
                  Submit a ticket (public)
                </Link>
                <Link href="/tickets?status=OPEN" className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition-colors border border-slate-200">
                  <Clock className="w-4 h-4 text-orange-500" />
                  View open tickets
                </Link>
                {(session.role === "SUPER_ADMIN" || session.role === "DEPT_HEAD") && (
                  <Link href="/reports" className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition-colors border border-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    Download reports
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
