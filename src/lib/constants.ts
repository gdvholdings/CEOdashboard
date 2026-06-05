export const TICKET_STATUSES = [
  { value: "OPEN", label: "Open", color: "bg-blue-100 text-blue-800" },
  { value: "IN_PROGRESS", label: "In Progress", color: "bg-yellow-100 text-yellow-800" },
  { value: "RESOLVED", label: "Resolved", color: "bg-green-100 text-green-800" },
  { value: "CLOSED", label: "Closed", color: "bg-gray-100 text-gray-700" },
  { value: "ON_HOLD", label: "On Hold", color: "bg-orange-100 text-orange-800" },
] as const;

export const TICKET_PRIORITIES = [
  { value: "LOW", label: "Low", color: "bg-slate-100 text-slate-700" },
  { value: "MEDIUM", label: "Medium", color: "bg-blue-100 text-blue-800" },
  { value: "HIGH", label: "High", color: "bg-orange-100 text-orange-800" },
  { value: "CRITICAL", label: "Critical", color: "bg-red-100 text-red-800" },
] as const;

export const TICKET_CATEGORIES = [
  "IT Support",
  "HR & People",
  "Finance",
  "Operations",
  "Customer Service",
  "Legal & Compliance",
  "Facilities",
  "Procurement",
  "Marketing",
  "General",
] as const;

export const DEPARTMENTS = [
  "Executive",
  "Information Technology",
  "Human Resources",
  "Finance & Accounting",
  "Operations",
  "Sales",
  "Marketing",
  "Legal",
  "Facilities",
  "Customer Support",
] as const;

export const STAFF_MEMBERS = [
  "John Santos",
  "Maria Reyes",
  "Carlos Mendoza",
  "Ana Garcia",
  "Roberto Cruz",
  "Elena Torres",
  "Miguel Ramos",
  "Sofia Bautista",
  "Luis Dela Cruz",
  "Carmen Villanueva",
] as const;
