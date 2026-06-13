import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, canManageUsers, isSuperAdmin } from "@/lib/auth";
import * as bcrypt from "bcryptjs";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || !canManageUsers(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Dept heads can only manage their department members
  if (session.role === "DEPT_HEAD" && (target.department !== session.department || target.role !== "MEMBER")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updates: Record<string, any> = {};
  if (body.name) updates.name = body.name;
  if (body.mobile !== undefined) updates.mobile = body.mobile;
  if (body.isActive !== undefined) updates.isActive = body.isActive;
  if (body.password) updates.password = await bcrypt.hash(body.password, 12);
  if (isSuperAdmin(session) && body.role) updates.role = body.role;
  if (isSuperAdmin(session) && body.department !== undefined) updates.department = body.department;

  const user = await prisma.user.update({
    where: { id },
    data: updates,
    select: { id: true, name: true, email: true, role: true, department: true, mobile: true, isActive: true },
  });

  return NextResponse.json(user);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || !isSuperAdmin(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  if (id === session.id) return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });

  await prisma.user.update({ where: { id }, data: { isActive: false } });
  return NextResponse.json({ success: true });
}
