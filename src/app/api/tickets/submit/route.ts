import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateTicketNo, notifyTicketCreated } from "@/lib/tickets";
import { computeSlaDeadline } from "@/lib/utils";

export async function POST(request: NextRequest) {
  const body = await request.json();

  const required = ["submitterName", "submitterEmail", "department", "priority", "issueTitle", "issueType", "location", "description"];
  for (const field of required) {
    if (!body[field]?.trim()) {
      return NextResponse.json({ error: `${field} is required` }, { status: 400 });
    }
  }

  if (body.priority === "LOW" && !body.customDeadline) {
    return NextResponse.json({ error: "Deadline is required for Low priority tickets" }, { status: 400 });
  }

  const ticketNo = await generateTicketNo();
  const now = new Date();
  const slaDeadline = computeSlaDeadline(body.priority, now, body.customDeadline ? new Date(body.customDeadline) : null);

  const ticket = await prisma.ticket.create({
    data: {
      ticketNo,
      submitterName: body.submitterName.trim(),
      submitterEmail: body.submitterEmail.trim().toLowerCase(),
      submitterMobile: body.submitterMobile?.trim() || null,
      department: body.department,
      priority: body.priority,
      issueType: body.issueType,
      issueTypeOther: body.issueTypeOther?.trim() || null,
      issueTitle: body.issueTitle.trim(),
      location: body.location,
      description: body.description.trim(),
      slaDeadline,
      customDeadline: body.customDeadline ? new Date(body.customDeadline) : null,
      activities: {
        create: {
          action: "created",
          actorName: body.submitterName.trim(),
        },
      },
    },
  });

  await notifyTicketCreated(ticket.id, ticket.ticketNo, ticket.department, ticket.issueTitle);

  return NextResponse.json({ ticketNo: ticket.ticketNo, id: ticket.id }, { status: 201 });
}
