import { formatInTimeZone, toZonedTime } from "date-fns-tz";
import { TICKET_STATUSES, PRIORITIES, MANILA_TZ, SLA_HOURS } from "./constants";

export const TIMEZONE = MANILA_TZ;

export function getStatusConfig(status: string) {
  return TICKET_STATUSES.find((s) => s.value === status) ?? TICKET_STATUSES[0];
}

export function getPriorityConfig(priority: string) {
  return PRIORITIES.find((p) => p.value === priority) ?? PRIORITIES[1];
}

export function formatManila(date: Date | string, fmt = "MMM d, yyyy h:mm a") {
  return formatInTimeZone(new Date(date), MANILA_TZ, fmt);
}

export function nowManila() {
  return toZonedTime(new Date(), MANILA_TZ);
}

export function computeSlaDeadline(priority: string, createdAt: Date, customDeadline?: Date | null): Date | null {
  const hours = SLA_HOURS[priority];
  if (hours === null) {
    return customDeadline ?? null;
  }
  const deadline = new Date(createdAt);
  deadline.setHours(deadline.getHours() + hours);
  return deadline;
}

export function isOverdue(slaDeadline: Date | string | null): boolean {
  if (!slaDeadline) return false;
  return new Date() > new Date(slaDeadline);
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case "URGENT": return "bg-red-100 text-red-800";
    case "HIGH": return "bg-orange-100 text-orange-800";
    case "MEDIUM": return "bg-blue-100 text-blue-800";
    case "LOW": return "bg-slate-100 text-slate-600";
    default: return "bg-slate-100 text-slate-600";
  }
}

export function getDeptLabel(dept: string): string {
  const map: Record<string, string> = {
    IT: "IT",
    FACILITY: "Facility",
    SECURITY: "Security",
    MARKETING: "Marketing",
    HR_FINANCE: "HR/Finance",
  };
  return map[dept] ?? dept;
}
