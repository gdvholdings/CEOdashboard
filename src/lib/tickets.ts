import { prisma } from "./prisma";
import { computeSlaDeadline } from "./utils";

export async function generateTicketNo(): Promise<string> {
  const counter = await prisma.counter.upsert({
    where: { id: "ticket" },
    update: { value: { increment: 1 } },
    create: { id: "ticket", value: 1 },
  });
  return `GDV${counter.value.toString().padStart(5, "0")}`;
}

export async function notifyUsers(
  userIds: string[],
  type: string,
  title: string,
  message: string,
  ticketId?: string
) {
  if (userIds.length === 0) return;
  await prisma.notification.createMany({
    data: userIds.map((userId) => ({
      type,
      title,
      message,
      userId,
      ticketId: ticketId ?? null,
    })),
  });
}

export async function notifyTicketCreated(ticketId: string, ticketNo: string, department: string, issueTitle: string) {
  // Notify all super admins
  const superAdmins = await prisma.user.findMany({
    where: { role: "SUPER_ADMIN", isActive: true },
    select: { id: true },
  });

  // Notify dept head(s) of the concerned department
  const deptHeads = await prisma.user.findMany({
    where: { role: "DEPT_HEAD", department, isActive: true },
    select: { id: true },
  });

  const ids = [...superAdmins, ...deptHeads].map((u) => u.id);
  if (ids.length === 0) return;

  await notifyUsers(
    [...new Set(ids)],
    "TICKET_CREATED",
    `New ticket: ${ticketNo}`,
    `A new ticket has been submitted — "${issueTitle}"`,
    ticketId
  );
}

export async function notifyAssigned(ticketId: string, ticketNo: string, issueTitle: string, assignedToId: string) {
  await notifyUsers(
    [assignedToId],
    "ASSIGNED",
    `Ticket assigned to you: ${ticketNo}`,
    `You have been assigned to ticket — "${issueTitle}"`,
    ticketId
  );
}

export async function checkAndMarkOverdue(ticketId: string) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: { id: true, ticketNo: true, issueTitle: true, slaDeadline: true, customDeadline: true, status: true, overdueNotified: true, assignedToId: true, department: true },
  });

  if (!ticket) return;
  if (ticket.overdueNotified) return;
  if (["RESOLVED", "CLOSED"].includes(ticket.status)) return;

  const deadline = ticket.slaDeadline ?? ticket.customDeadline;
  if (!deadline || new Date() <= new Date(deadline)) return;

  // Mark as overdue notified
  await prisma.ticket.update({ where: { id: ticketId }, data: { overdueNotified: true } });

  // Notify super admins, dept heads, assigned member
  const superAdmins = await prisma.user.findMany({ where: { role: "SUPER_ADMIN", isActive: true }, select: { id: true } });
  const deptHeads = await prisma.user.findMany({ where: { role: "DEPT_HEAD", department: ticket.department, isActive: true }, select: { id: true } });

  const ids: string[] = [...superAdmins, ...deptHeads].map((u) => u.id);
  if (ticket.assignedToId) ids.push(ticket.assignedToId);

  await notifyUsers(
    [...new Set(ids)],
    "TICKET_OVERDUE",
    `Overdue: ${ticket.ticketNo}`,
    `Ticket "${ticket.issueTitle}" has exceeded its SLA deadline`,
    ticketId
  );
}

export function buildTicketWhere(session: { role: string; department: string | null; id: string }, filters: Record<string, string | undefined>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = {};

  // Scope by role
  if (session.role === "DEPT_HEAD" && session.department) {
    where.department = session.department;
  } else if (session.role === "MEMBER") {
    where.assignedToId = session.id;
  }

  if (filters.status && filters.status !== "ALL") where.status = filters.status;
  if (filters.priority && filters.priority !== "ALL") where.priority = filters.priority;
  if (filters.department && filters.department !== "ALL" && session.role === "SUPER_ADMIN") where.department = filters.department;
  if (filters.search) {
    where.OR = [
      { ticketNo: { contains: filters.search } },
      { issueTitle: { contains: filters.search } },
      { submitterName: { contains: filters.search } },
      { submitterEmail: { contains: filters.search } },
    ];
  }

  return where;
}
