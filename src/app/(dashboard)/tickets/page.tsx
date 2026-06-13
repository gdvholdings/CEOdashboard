import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildTicketWhere } from "@/lib/tickets";
import { StatusBadge, PriorityBadge, OverdueBadge } from "@/components/StatusBadge";
import { formatManila, isOverdue, getDeptLabel } from "@/lib/utils";
import { TICKET_STATUSES, PRIORITIES, DEPARTMENTS } from "@/lib/constants";
import TicketFilters from "./TicketFilters";
import { PlusCircle, MessageSquare } from "lucide-react";
import { redirect } from "next/navigation";

interface SearchParams {
  status?: string;
  priority?: string;
  department?: string;
  search?: string;
  overdue?: string;
  page?: string;
  [key: string]: string | undefined;
}

export default async function TicketsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const params = await searchParams;
  const page = parseInt(params.page ?? "1");
  const limit = 20;

  const filters = {
    status: params.status,
    priority: params.priority,
    department: params.department,
    search: params.search,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let where: any = buildTicketWhere(session, filters);

  if (params.overdue === "true") {
    where = {
      ...where,
      status: { notIn: ["RESOLVED", "CLOSED"] },
      OR: [{ slaDeadline: { lt: new Date() } }, { customDeadline: { lt: new Date() } }],
    };
  }

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        assignedTo: { select: { name: true } },
        _count: { select: { comments: true } },
      },
    }),
    prisma.ticket.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Tickets</h1>
            <p className="text-slate-500 text-sm mt-0.5">{total} ticket{total !== 1 ? "s" : ""} found</p>
          </div>
          <Link
            href="/tickets/new"
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            New Ticket
          </Link>
        </div>

        <TicketFilters
          statuses={TICKET_STATUSES}
          priorities={PRIORITIES}
          departments={session.role === "SUPER_ADMIN" ? DEPARTMENTS : []}
          current={params}
        />

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-5 py-3 text-slate-500 font-medium text-xs uppercase tracking-wide">Ticket</th>
                  <th className="text-left px-5 py-3 text-slate-500 font-medium text-xs uppercase tracking-wide">Dept</th>
                  <th className="text-left px-5 py-3 text-slate-500 font-medium text-xs uppercase tracking-wide">Priority</th>
                  <th className="text-left px-5 py-3 text-slate-500 font-medium text-xs uppercase tracking-wide">Status</th>
                  <th className="text-left px-5 py-3 text-slate-500 font-medium text-xs uppercase tracking-wide">Assigned To</th>
                  <th className="text-left px-5 py-3 text-slate-500 font-medium text-xs uppercase tracking-wide">SLA</th>
                  <th className="text-left px-5 py-3 text-slate-500 font-medium text-xs uppercase tracking-wide">Created</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tickets.map((ticket) => {
                  const active = !["RESOLVED", "CLOSED"].includes(ticket.status);
                  const overdueTk = active && (isOverdue(ticket.slaDeadline) || isOverdue(ticket.customDeadline));
                  return (
                    <tr key={ticket.id} className={`hover:bg-slate-50 transition-colors ${overdueTk ? "bg-red-50/40" : ""}`}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="font-medium text-slate-900 max-w-[220px] truncate">{ticket.issueTitle}</p>
                            <p className="text-slate-400 text-xs mt-0.5 font-mono">{ticket.ticketNo}</p>
                          </div>
                          {overdueTk && <OverdueBadge />}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-600 text-xs">{getDeptLabel(ticket.department)}</td>
                      <td className="px-5 py-4"><PriorityBadge priority={ticket.priority} /></td>
                      <td className="px-5 py-4"><StatusBadge status={ticket.status} /></td>
                      <td className="px-5 py-4 text-slate-600 text-xs">{ticket.assignedTo?.name ?? <span className="text-slate-300">Unassigned</span>}</td>
                      <td className="px-5 py-4 text-xs">
                        {ticket.slaDeadline || ticket.customDeadline ? (
                          <span className={overdueTk ? "text-red-600 font-medium" : "text-slate-500"}>
                            {formatManila(ticket.slaDeadline ?? ticket.customDeadline!, "MMM d, h:mm a")}
                          </span>
                        ) : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-5 py-4 text-slate-400 text-xs whitespace-nowrap">
                        {formatManila(ticket.createdAt, "MMM d, h:mm a")}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {ticket._count.comments > 0 && (
                            <span className="flex items-center gap-1 text-slate-400 text-xs">
                              <MessageSquare className="w-3.5 h-3.5" />
                              {ticket._count.comments}
                            </span>
                          )}
                          <Link href={`/tickets/${ticket.id}`} className="text-blue-600 text-xs font-medium hover:underline whitespace-nowrap">
                            View →
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {tickets.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-slate-400">No tickets found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-slate-500">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link href={`/tickets?${new URLSearchParams({ ...params, page: String(page - 1) })}`}
                  className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 bg-white">
                  Previous
                </Link>
              )}
              {page < totalPages && (
                <Link href={`/tickets?${new URLSearchParams({ ...params, page: String(page + 1) })}`}
                  className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 bg-white">
                  Next
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
