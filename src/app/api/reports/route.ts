import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, canDownloadReports } from "@/lib/auth";
import { buildTicketWhere } from "@/lib/tickets";
import { formatManila, getDeptLabel } from "@/lib/utils";

function escapeCsv(val: string | null | undefined): string {
  const s = String(val ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || !canDownloadReports(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const filters: Record<string, string | undefined> = {
    status: searchParams.get("status") ?? undefined,
    priority: searchParams.get("priority") ?? undefined,
    department: searchParams.get("department") ?? undefined,
  };

  const where = buildTicketWhere(session, filters);

  // Date range filter
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  if (from || to) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (where as any).createdAt = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to + "T23:59:59") } : {}),
    };
  }

  const tickets = await prisma.ticket.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { assignedTo: { select: { name: true } } },
  });

  const headers = [
    "Ticket No", "Status", "Priority", "Department", "Issue Type", "Issue Title",
    "Submitted By", "Email", "Mobile", "Location", "Assigned To",
    "SLA Deadline", "Custom Deadline", "Resolved At", "Created At", "Description",
  ];

  const rows = tickets.map((t) => [
    t.ticketNo,
    t.status,
    t.priority,
    getDeptLabel(t.department),
    t.issueType === "Others" && t.issueTypeOther ? `Others: ${t.issueTypeOther}` : t.issueType,
    t.issueTitle,
    t.submitterName,
    t.submitterEmail,
    t.submitterMobile ?? "",
    t.location,
    t.assignedTo?.name ?? "Unassigned",
    t.slaDeadline ? formatManila(t.slaDeadline) : "",
    t.customDeadline ? formatManila(t.customDeadline) : "",
    t.resolvedAt ? formatManila(t.resolvedAt) : "",
    formatManila(t.createdAt),
    t.description,
  ].map(escapeCsv));

  const csv = [headers.map(escapeCsv).join(","), ...rows.map((r) => r.join(","))].join("\n");
  const filename = `GDV_Helpdesk_Report_${formatManila(new Date(), "yyyyMMdd_HHmmss")}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
