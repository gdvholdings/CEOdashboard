import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const unreadOnly = searchParams.get("unread") === "true";

  const notifications = await prisma.notification.findMany({
    where: { userId: session.id, ...(unreadOnly ? { isRead: false } : {}) },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true, type: true, title: true, message: true, isRead: true, ticketId: true, createdAt: true },
  });

  const unreadCount = await prisma.notification.count({ where: { userId: session.id, isRead: false } });

  return NextResponse.json({ notifications, unreadCount });
}

export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  if (body.markAllRead) {
    await prisma.notification.updateMany({ where: { userId: session.id, isRead: false }, data: { isRead: true } });
  } else if (body.id) {
    await prisma.notification.updateMany({ where: { id: body.id, userId: session.id }, data: { isRead: true } });
  }

  return NextResponse.json({ success: true });
}
