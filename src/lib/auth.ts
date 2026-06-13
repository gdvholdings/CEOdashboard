import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "gdv-holdings-helpdesk-secret-2026"
);
const COOKIE = "gdv_session";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string | null;
}

export async function createSession(user: SessionUser): Promise<void> {
  const token = await new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(SECRET);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 8, // 8 hours
    path: "/",
  });
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
}

export async function requireSession(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return session;
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE);
}

export async function getSessionFromRequest(request: Request): Promise<SessionUser | null> {
  try {
    const cookieHeader = request.headers.get("cookie") ?? "";
    const match = cookieHeader.match(new RegExp(`${COOKIE}=([^;]+)`));
    if (!match) return null;
    const { payload } = await jwtVerify(match[1], SECRET);
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
}

export async function validateCredentials(email: string, password: string): Promise<SessionUser | null> {
  const bcrypt = await import("bcryptjs");
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user || !user.isActive) return null;
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
  };
}

export function isSuperAdmin(user: SessionUser): boolean {
  return user.role === "SUPER_ADMIN";
}

export function isDeptHead(user: SessionUser): boolean {
  return user.role === "DEPT_HEAD";
}

export function canManageUsers(user: SessionUser): boolean {
  return user.role === "SUPER_ADMIN" || user.role === "DEPT_HEAD";
}

export function canDeleteTickets(user: SessionUser): boolean {
  return user.role === "SUPER_ADMIN";
}

export function canDownloadReports(user: SessionUser): boolean {
  return user.role === "SUPER_ADMIN" || user.role === "DEPT_HEAD";
}
