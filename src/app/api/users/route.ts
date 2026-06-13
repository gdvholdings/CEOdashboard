import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, canManageUsers } from "@/lib/auth";
import * as bcrypt from "bcryptjs";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || !canManageUsers(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = {};

  // Dept heads can only manage their department's members
  if (session.role === "DEPT_HEAD") {
    where.role = "MEMBER";
    where.department = session.department;
  } else {
    const dept = searchParams.get("department");
    const role = searchParams.get("role");
    if (dept) where.department = dept;
    if (role) where.role = role;
  }

  const users = await prisma.user.findMany({
    where,
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true, role: true, department: true, mobile: true, isActive: true, createdAt: true },
  });

  return NextResponse.json(users);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || !canManageUsers(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();

  // Dept heads can only add members to their department
  if (session.role === "DEPT_HEAD") {
    if (body.role !== "MEMBER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    body.department = session.department;
  }

  const existing = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } });
  if (existing) return NextResponse.json({ error: "Email already registered" }, { status: 409 });

  const password = await bcrypt.hash(body.password ?? "GDV@2026!", 12);

  const user = await prisma.user.create({
    data: {
      name: body.name,
      email: body.email.toLowerCase(),
      password,
      role: body.role ?? "MEMBER",
      department: body.department ?? null,
      mobile: body.mobile ?? null,
    },
    select: { id: true, name: true, email: true, role: true, department: true, mobile: true, isActive: true, createdAt: true },
  });

  return NextResponse.json(user, { status: 201 });
}
