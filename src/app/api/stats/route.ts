import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { buildTicketWhere } from "@/lib/tickets";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const baseWhere = buildTicketWhere(session, {});

  const [total, open, inProgress, onHold, resolved, closed, overdue, byDept, byPriority, recent] = await Promise.all([
    prisma.ticket.count({ where: baseWhere }),
    prisma.ticket.count({ where: { ...baseWhere, status: "OPEN" } }),
    prisma.ticket.count({ where: { ...baseWhere, status: "IN_PROGRESS" } }),
    prisma.ticket.count({ where: { ...baseWhere, status: "ON_HOLD" } }),
    prisma.ticket.count({ where: { ...baseWhere, status: "RESOLVED" } }),
    prisma.ticket.count({ where: { ...baseWhere, status: "CLOSED" } }),
    prisma.ticket.count({
      where: {
        ...baseWhere,
        status: { notIn: ["RESOLVED", "CLOSED"] },
        OR: [
          { slaDeadline: { lt: new Date() } },
          { customDeadline: { lt: new Date() } },
        ],
      },
    }),
    prisma.ticket.groupBy({ by: ["department"], _count: { id: true }, where: baseWhere }),
    prisma.ticket.groupBy({ by: ["priority"], _count: { id: true }, where: baseWhere }),
    prisma.ticket.findMany({
      where: baseWhere,
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, ticketNo: true, issueTitle: true, status: true, priority: true, department: true, createdAt: true, slaDeadline: true },
    }),
  ]);

  return NextResponse.json({ total, byStatus: { open, inProgress, onHold, resolved, closed }, overdue, byDept, byPriority, recent });
}
