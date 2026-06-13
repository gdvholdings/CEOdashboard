import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Sidebar from "@/components/Sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const unreadCount = await prisma.notification.count({
    where: { userId: session.id, isRead: false },
  });

  return (
    <div className="flex min-h-screen">
      <Sidebar user={session} unreadCount={unreadCount} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
