import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { notifyUsers } from "@/lib/tickets";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    select: { id: true, ticketNo: true, issueTitle: true, department: true, assignedToId: true },
  });
  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [comment] = await prisma.$transaction([
    prisma.comment.create({
      data: {
        body: body.body,
        authorId: session.id,
        isInternal: body.isInternal ?? false,
        ticketId: id,
      },
      include: { author: { select: { id: true, name: true, role: true } } },
    }),
    prisma.activity.create({
      data: { action: "commented", actorId: session.id, actorName: session.name, ticketId: id },
    }),
  ]);

  // Notify dept heads and assigned member
  const deptHeads = await prisma.user.findMany({
    where: { role: "DEPT_HEAD", department: ticket.department, isActive: true, NOT: { id: session.id } },
    select: { id: true },
  });
  const ids = deptHeads.map((u) => u.id);
  if (ticket.assignedToId && ticket.assignedToId !== session.id) ids.push(ticket.assignedToId);

  if (ids.length > 0) {
    await notifyUsers(
      [...new Set(ids)],
      "COMMENT_ADDED",
      `New comment on ${ticket.ticketNo}`,
      `${session.name} commented on "${ticket.issueTitle}"`,
      id
    );
  }

  return NextResponse.json(comment, { status: 201 });
}
