import { TICKET_STATUSES, TICKET_PRIORITIES } from "./constants";

export function getStatusConfig(status: string) {
  return TICKET_STATUSES.find((s) => s.value === status) ?? TICKET_STATUSES[0];
}

export function getPriorityConfig(priority: string) {
  return TICKET_PRIORITIES.find((p) => p.value === priority) ?? TICKET_PRIORITIES[1];
}

export function generateTicketNo(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `GDV-${year}${month}-${random}`;
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ");
}
