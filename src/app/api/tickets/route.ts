import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateTicketNo } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");
  const category = searchParams.get("category");
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");

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
      skip: (page - 1) * limit,
      take: limit,
      include: { _count: { select: { comments: true } } },
    }),
    prisma.ticket.count({ where }),
  ]);

  return NextResponse.json({ tickets, total, page, limit });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  let ticketNo = generateTicketNo();
  // Ensure uniqueness
  let existing = await prisma.ticket.findUnique({ where: { ticketNo } });
  while (existing) {
    ticketNo = generateTicketNo();
    existing = await prisma.ticket.findUnique({ where: { ticketNo } });
  }

  const ticket = await prisma.ticket.create({
    data: {
      ticketNo,
      title: body.title,
      description: body.description,
      status: "OPEN",
      priority: body.priority ?? "MEDIUM",
      category: body.category,
      submittedBy: body.submittedBy,
      assignedTo: body.assignedTo ?? null,
      department: body.department ?? null,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      activities: {
        create: {
          action: "created",
          actor: body.submittedBy,
        },
      },
    },
  });

  return NextResponse.json(ticket, { status: 201 });
}
