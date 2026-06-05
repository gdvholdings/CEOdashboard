import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const [total, open, inProgress, resolved, closed, onHold, byPriority, byCategory, recent] =
    await Promise.all([
      prisma.ticket.count(),
      prisma.ticket.count({ where: { status: "OPEN" } }),
      prisma.ticket.count({ where: { status: "IN_PROGRESS" } }),
      prisma.ticket.count({ where: { status: "RESOLVED" } }),
      prisma.ticket.count({ where: { status: "CLOSED" } }),
      prisma.ticket.count({ where: { status: "ON_HOLD" } }),
      prisma.ticket.groupBy({ by: ["priority"], _count: true }),
      prisma.ticket.groupBy({ by: ["category"], _count: true }),
      prisma.ticket.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, ticketNo: true, title: true, status: true, priority: true, createdAt: true },
      }),
    ]);

  return NextResponse.json({
    total,
    byStatus: { open, inProgress, resolved, closed, onHold },
    byPriority,
    byCategory,
    recent,
  });
}
