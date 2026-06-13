import { redirect } from "next/navigation";
import { getSession, canManageUsers } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDeptLabel } from "@/lib/utils";
import UsersClient from "./UsersClient";

export default async function UsersPage() {
  const session = await getSession();
  if (!session || !canManageUsers(session)) redirect("/dashboard");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (session.role === "DEPT_HEAD") {
    where.role = "MEMBER";
    where.department = session.department;
  }

  const users = await prisma.user.findMany({
    where,
    orderBy: [{ role: "asc" }, { department: "asc" }, { name: "asc" }],
    select: { id: true, name: true, email: true, role: true, department: true, mobile: true, isActive: true, createdAt: true },
  });

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Team Members</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {session.role === "DEPT_HEAD"
              ? `Managing members of ${getDeptLabel(session.department ?? "")}`
              : "Manage all users across departments"}
          </p>
        </div>
        <UsersClient users={users} session={session} />
      </div>
    </div>
  );
}
