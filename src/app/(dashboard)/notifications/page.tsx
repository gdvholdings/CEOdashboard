import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import NotificationsClient from "./NotificationsClient";

export default async function NotificationsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const notifications = await prisma.notification.findMany({
    where: { userId: session.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: { id: true, type: true, title: true, message: true, isRead: true, ticketId: true, createdAt: true },
  });

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {notifications.filter((n) => !n.isRead).length} unread notification{notifications.filter((n) => !n.isRead).length !== 1 ? "s" : ""}
          </p>
        </div>
        <NotificationsClient notifications={notifications} />
      </div>
    </div>
  );
}
