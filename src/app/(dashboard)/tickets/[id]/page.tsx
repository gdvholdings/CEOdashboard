import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatusBadge, PriorityBadge, OverdueBadge } from "@/components/StatusBadge";
import { formatManila, isOverdue, getDeptLabel } from "@/lib/utils";
import { ArrowLeft, Calendar, User, MapPin, Tag, Mail, Phone } from "lucide-react";
import TicketActions from "./TicketActions";
import CommentsSection from "./CommentsSection";

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { id: true, name: true, role: true } } },
      },
      activities: {
        orderBy: { createdAt: "desc" },
        take: 30,
        include: { actor: { select: { id: true, name: true } } },
      },
    },
  });

  if (!ticket) notFound();

  const members = await prisma.user.findMany({
    where: { isActive: true, role: { in: ["DEPT_HEAD", "MEMBER"] }, department: ticket.department },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  const active = !["RESOLVED", "CLOSED"].includes(ticket.status);
  const overdueTicket = active && (isOverdue(ticket.slaDeadline) || isOverdue(ticket.customDeadline));
  const deadline = ticket.slaDeadline ?? ticket.customDeadline;

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <Link href="/tickets" className="flex items-center gap-1.5 text-slate-500 text-sm hover:text-slate-700 mb-4 w-fit">
            <ArrowLeft className="w-4 h-4" />
            Back to Tickets
          </Link>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-mono text-sm text-slate-400 font-medium">{ticket.ticketNo}</span>
                {overdueTicket && <OverdueBadge />}
              </div>
              <h1 className="text-xl font-bold text-slate-900">{ticket.issueTitle}</h1>
              <p className="text-slate-500 text-sm mt-1">{getDeptLabel(ticket.department)} · {ticket.location}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <PriorityBadge priority={ticket.priority} />
              <StatusBadge status={ticket.status} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {overdueTicket && deadline && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                ⚠️ This ticket exceeded its SLA deadline on <strong>{formatManila(deadline)}</strong>.
              </div>
            )}

            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="font-semibold text-slate-900 mb-1 text-sm text-slate-500 uppercase tracking-wide">Issue Type</h2>
              <p className="text-slate-700 font-medium mt-2">
                {ticket.issueType === "Others" && ticket.issueTypeOther
                  ? `Others: ${ticket.issueTypeOther}`
                  : ticket.issueType}
              </p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="font-semibold text-slate-900 mb-3">Description</h2>
              <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
            </div>

            <CommentsSection ticket={ticket} session={session} />
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-900 mb-4 text-sm">Ticket Details</h3>
              <div className="space-y-3 text-sm">
                <DetailRow icon={<Mail className="w-4 h-4 text-slate-400" />} label="Submitted by">
                  <p className="font-medium text-slate-700">{ticket.submitterName}</p>
                  <p className="text-xs text-slate-400">{ticket.submitterEmail}</p>
                  {ticket.submitterMobile && <p className="text-xs text-slate-400">{ticket.submitterMobile}</p>}
                </DetailRow>

                <DetailRow icon={<User className="w-4 h-4 text-slate-400" />} label="Assigned to">
                  <p className="font-medium text-slate-700">{ticket.assignedTo?.name ?? "Unassigned"}</p>
                </DetailRow>

                <DetailRow icon={<Tag className="w-4 h-4 text-slate-400" />} label="Category">
                  <p className="font-medium text-slate-700">{getDeptLabel(ticket.department)}</p>
                </DetailRow>

                <DetailRow icon={<MapPin className="w-4 h-4 text-slate-400" />} label="Location">
                  <p className="font-medium text-slate-700">{ticket.location}</p>
                </DetailRow>

                <DetailRow icon={<Calendar className="w-4 h-4 text-slate-400" />} label="Created">
                  <p className="font-medium text-slate-700">{formatManila(ticket.createdAt)}</p>
                </DetailRow>

                {deadline && (
                  <DetailRow icon={<Calendar className="w-4 h-4 text-slate-400" />} label="SLA Deadline">
                    <p className={`font-medium ${overdueTicket ? "text-red-600" : "text-slate-700"}`}>
                      {formatManila(deadline)}
                    </p>
                  </DetailRow>
                )}

                {ticket.resolvedAt && (
                  <DetailRow icon={<Calendar className="w-4 h-4 text-slate-400" />} label="Resolved">
                    <p className="font-medium text-green-600">{formatManila(ticket.resolvedAt)}</p>
                  </DetailRow>
                )}
              </div>
            </div>

            <TicketActions ticket={ticket} members={members} session={session} />
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div>
        <p className="text-slate-400 text-xs mb-0.5">{label}</p>
        {children}
      </div>
    </div>
  );
}
