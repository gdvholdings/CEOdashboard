import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import NewTicketForm from "./NewTicketForm";

export default async function NewTicketPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  // Get members for assignment dropdown
  const members = await prisma.user.findMany({
    where: { isActive: true, role: { in: ["DEPT_HEAD", "MEMBER"] } },
    orderBy: [{ department: "asc" }, { name: "asc" }],
    select: { id: true, name: true, department: true, role: true },
  });

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Create New Ticket</h1>
          <p className="text-slate-500 text-sm mt-1">Submit an internal support ticket on behalf of a user</p>
        </div>
        <NewTicketForm members={members} currentUser={session} />
      </div>
    </div>
  );
}
