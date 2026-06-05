import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const [comment] = await prisma.$transaction([
    prisma.comment.create({
      data: {
        body: body.body,
        author: body.author,
        isInternal: body.isInternal ?? false,
        ticketId: id,
      },
    }),
    prisma.activity.create({
      data: {
        action: "commented",
        actor: body.author,
        ticketId: id,
      },
    }),
  ]);

  return NextResponse.json(comment, { status: 201 });
}
