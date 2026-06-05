import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      comments: { orderBy: { createdAt: "asc" } },
      activities: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(ticket);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const actor = body.actor ?? "System";

  const existing = await prisma.ticket.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updates: Record<string, unknown> = {};
  const activities: Array<{ action: string; field: string; oldValue: string; newValue: string; actor: string }> = [];

  const trackableFields = ["status", "priority", "assignedTo", "department", "dueDate", "title"];
  for (const field of trackableFields) {
    if (body[field] !== undefined) {
      const oldVal = String(existing[field as keyof typeof existing] ?? "");
      const newVal = String(body[field] ?? "");
      if (oldVal !== newVal) {
        activities.push({ action: "updated", field, oldValue: oldVal, newValue: newVal, actor });
      }
      updates[field] = field === "dueDate" && body[field] ? new Date(body[field]) : body[field];
    }
  }

  if (body.status === "RESOLVED" && existing.status !== "RESOLVED") {
    updates.resolvedAt = new Date();
  }

  const ticket = await prisma.ticket.update({
    where: { id },
    data: {
      ...updates,
      activities: activities.length > 0 ? { create: activities } : undefined,
    },
    include: {
      comments: { orderBy: { createdAt: "asc" } },
      activities: { orderBy: { createdAt: "desc" } },
    },
  });

  return NextResponse.json(ticket);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.ticket.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
