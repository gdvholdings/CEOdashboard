import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Sidebar from "@/components/Sidebar";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";
import TicketDetailClient from "./TicketDetailClient";
import { ArrowLeft, Calendar, User, Building2, Tag } from "lucide-react";
import { format } from "date-fns";

async function getTicket(id: string) {
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      comments: { orderBy: { createdAt: "asc" } },
      activities: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });
  return ticket;
}

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ticket = await getTicket(id);

  if (!ticket) notFound();

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6">
            <Link
              href="/tickets"
              className="flex items-center gap-1.5 text-slate-500 text-sm hover:text-slate-700 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Tickets
            </Link>

            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-slate-400 text-sm mb-1">{ticket.ticketNo}</p>
                <h1 className="text-2xl font-bold text-slate-900">{ticket.title}</h1>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <PriorityBadge priority={ticket.priority} />
                <StatusBadge status={ticket.status} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Description */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h2 className="font-semibold text-slate-900 mb-3">Description</h2>
                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
              </div>

              {/* Comments & Activity */}
              <TicketDetailClient ticket={ticket} />
            </div>

            {/* Sidebar details */}
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h3 className="font-semibold text-slate-900 mb-4">Details</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2.5">
                    <User className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-slate-400 text-xs mb-0.5">Submitted by</p>
                      <p className="text-slate-700 font-medium">{ticket.submittedBy}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <User className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-slate-400 text-xs mb-0.5">Assigned to</p>
                      <p className="text-slate-700 font-medium">{ticket.assignedTo ?? "Unassigned"}</p>
                    </div>
                  </div>

                  {ticket.department && (
                    <div className="flex items-start gap-2.5">
                      <Building2 className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-slate-400 text-xs mb-0.5">Department</p>
                        <p className="text-slate-700 font-medium">{ticket.department}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-2.5">
                    <Tag className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-slate-400 text-xs mb-0.5">Category</p>
                      <p className="text-slate-700 font-medium">{ticket.category}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Calendar className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-slate-400 text-xs mb-0.5">Created</p>
                      <p className="text-slate-700 font-medium">{format(new Date(ticket.createdAt), "MMM d, yyyy 'at' h:mm a")}</p>
                    </div>
                  </div>

                  {ticket.dueDate && (
                    <div className="flex items-start gap-2.5">
                      <Calendar className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-slate-400 text-xs mb-0.5">Due date</p>
                        <p className="text-slate-700 font-medium">{format(new Date(ticket.dueDate), "MMM d, yyyy")}</p>
                      </div>
                    </div>
                  )}

                  {ticket.resolvedAt && (
                    <div className="flex items-start gap-2.5">
                      <Calendar className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-slate-400 text-xs mb-0.5">Resolved</p>
                        <p className="text-slate-700 font-medium">{format(new Date(ticket.resolvedAt), "MMM d, yyyy")}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Update Panel */}
              <TicketUpdatePanel ticketId={ticket.id} currentStatus={ticket.status} currentPriority={ticket.priority} currentAssignedTo={ticket.assignedTo ?? ""} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function TicketUpdatePanel({
  ticketId,
  currentStatus,
  currentPriority,
  currentAssignedTo,
}: {
  ticketId: string;
  currentStatus: string;
  currentPriority: string;
  currentAssignedTo: string;
}) {
  return (
    <TicketDetailClient
      ticket={{ id: ticketId, status: currentStatus, priority: currentPriority, assignedTo: currentAssignedTo } as Parameters<typeof TicketDetailClient>[0]["ticket"]}
      panelOnly
    />
  );
}
