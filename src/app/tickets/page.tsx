import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Sidebar from "@/components/Sidebar";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";
import TicketFilters from "./TicketFilters";
import { PlusCircle, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { TICKET_STATUSES, TICKET_PRIORITIES, TICKET_CATEGORIES } from "@/lib/constants";

interface SearchParams {
  status?: string;
  priority?: string;
  category?: string;
  search?: string;
  page?: string;
  [key: string]: string | undefined;
}

async function getTickets(params: SearchParams) {
  const { status, priority, category, search, page = "1" } = params;
  const pageNum = parseInt(page);
  const limit = 15;

  const where: Record<string, unknown> = {};
  if (status && status !== "ALL") where.status = status;
  if (priority && priority !== "ALL") where.priority = priority;
  if (category && category !== "ALL") where.category = category;
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { ticketNo: { contains: search } },
      { submittedBy: { contains: search } },
    ];
  }

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (pageNum - 1) * limit,
      take: limit,
      include: { _count: { select: { comments: true } } },
    }),
    prisma.ticket.count({ where }),
  ]);

  return { tickets, total, page: pageNum, limit };
}

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const { tickets, total, page, limit } = await getTickets(params);
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">All Tickets</h1>
              <p className="text-slate-500 text-sm mt-1">{total} ticket{total !== 1 ? "s" : ""} found</p>
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
            priorities={TICKET_PRIORITIES}
            categories={TICKET_CATEGORIES}
            current={params}
          />

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-5 py-3 text-slate-500 font-medium">Ticket</th>
                  <th className="text-left px-5 py-3 text-slate-500 font-medium">Category</th>
                  <th className="text-left px-5 py-3 text-slate-500 font-medium">Priority</th>
                  <th className="text-left px-5 py-3 text-slate-500 font-medium">Status</th>
                  <th className="text-left px-5 py-3 text-slate-500 font-medium">Assigned To</th>
                  <th className="text-left px-5 py-3 text-slate-500 font-medium">Created</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-900 max-w-xs truncate">{ticket.title}</p>
                      <p className="text-slate-400 text-xs mt-0.5">{ticket.ticketNo}</p>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{ticket.category}</td>
                    <td className="px-5 py-4">
                      <PriorityBadge priority={ticket.priority} />
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={ticket.status} />
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {ticket.assignedTo ?? <span className="text-slate-300">Unassigned</span>}
                    </td>
                    <td className="px-5 py-4 text-slate-400 text-xs whitespace-nowrap">
                      {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {ticket._count.comments > 0 && (
                          <span className="flex items-center gap-1 text-slate-400 text-xs">
                            <MessageSquare className="w-3.5 h-3.5" />
                            {ticket._count.comments}
                          </span>
                        )}
                        <Link
                          href={`/tickets/${ticket.id}`}
                          className="text-blue-600 text-xs font-medium hover:underline whitespace-nowrap"
                        >
                          View →
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
                {tickets.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                      No tickets found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-slate-500">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link
                    href={`/tickets?${new URLSearchParams({ ...params, page: String(page - 1) })}`}
                    className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50"
                  >
                    Previous
                  </Link>
                )}
                {page < totalPages && (
                  <Link
                    href={`/tickets?${new URLSearchParams({ ...params, page: String(page + 1) })}`}
                    className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50"
                  >
                    Next
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
