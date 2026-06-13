import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, canDeleteTickets } from "@/lib/auth";
import { notifyAssigned, checkAndMarkOverdue } from "@/lib/tickets";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Check overdue and create notifications if needed
  await checkAndMarkOverdue(id);

  return NextResponse.json(ticket);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const existing = await prisma.ticket.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updates: Record<string, any> = {};
  const activityEntries: Array<{ action: string; field: string; oldValue: string; newValue: string; actorName: string; actorId: string }> = [];

  const trackable = ["status", "priority", "assignedToId", "issueTitle", "description"];
  for (const field of trackable) {
    if (body[field] !== undefined) {
      const oldVal = String(existing[field as keyof typeof existing] ?? "");
      const newVal = String(body[field] ?? "");
      if (oldVal !== newVal) {
        activityEntries.push({ action: "updated", field, oldValue: oldVal, newValue: newVal, actorName: session.name, actorId: session.id });
      }
      updates[field] = body[field] === "" ? null : body[field];
    }
  }

  if (body.status === "RESOLVED" && existing.status !== "RESOLVED") {
    updates.resolvedAt = new Date();
  }
  if (body.status === "CLOSED" && existing.status !== "CLOSED") {
    updates.closedAt = new Date();
  }

  const ticket = await prisma.ticket.update({
    where: { id },
    data: {
      ...updates,
      activities: activityEntries.length > 0 ? { create: activityEntries } : undefined,
    },
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

  // Notify if newly assigned
  if (body.assignedToId && body.assignedToId !== existing.assignedToId) {
    await notifyAssigned(id, ticket.ticketNo, ticket.issueTitle, body.assignedToId);
  }

  return NextResponse.json(ticket);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || !canDeleteTickets(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  await prisma.ticket.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
