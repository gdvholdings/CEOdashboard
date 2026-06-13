export const DEPARTMENTS = [
  { value: "IT", label: "IT" },
  { value: "FACILITY", label: "Facility" },
  { value: "SECURITY", label: "Security" },
  { value: "MARKETING", label: "Marketing" },
  { value: "HR_FINANCE", label: "HR/Finance" },
] as const;

export const DEPARTMENT_ISSUE_TYPES: Record<string, string[]> = {
  HR_FINANCE: [
    "Onboarding Assistance (EIRIS, Biometrics)",
    "Payroll Dispute",
    "Certificate of Employment",
    "Identification Card",
    "Additional Manpower",
    "GMB Concern",
    "Complaint",
    "Invoice Request",
    "Others",
  ],
  MARKETING: [
    "Page Greetings (Birthdays/Work Anniversaries)",
    "Posting Approval",
    "Boosting Request",
    "Event Assistance",
    "Anniversary Token",
    "Others",
  ],
  IT: [
    "Laptop/Desktop Issue",
    "Slow/No Internet",
    "Equipment/Peripheral Request",
    "Others",
  ],
  FACILITY: [
    "Wet Floor",
    "Aircon Issues",
    "CR Concerns",
    "Others",
  ],
  SECURITY: [],
};

export const LOCATIONS = [
  "Angono Branch",
  "Remote",
  "HQ, Floor 2 - STACKph",
  "HQ, Floor 2 - VVBSI",
  "HQ, Floor 3 - STACKph BackOffice",
  "HQ, Floor 3 - STACKph BPO",
  "HQ, Floor 3 - STACKph CEO Office",
  "HQ, Floor 3 - STACKph Conference",
  "HQ, Floor 4 - STACKph USA",
  "HQ, Floor 4 - VVBSI President's Office",
  "HQ, Floor 4 - VVBSI Training Room",
  "HQ, Floor 4 - VVBSI Metrobank",
  "HQ, Floor 4 - VVBSI Security Bank",
  "HQ, Floor 4 - VVBSI Field",
] as const;

export const PRIORITIES = [
  { value: "LOW", label: "Low", hours: null },
  { value: "MEDIUM", label: "Medium", hours: 72 },
  { value: "HIGH", label: "High", hours: 24 },
  { value: "URGENT", label: "Urgent", hours: 2 },
] as const;

// Marketing and HR/Finance cannot use Urgent
export const NO_URGENT_DEPARTMENTS = ["MARKETING", "HR_FINANCE"];

export const TICKET_STATUSES = [
  { value: "OPEN", label: "Open", color: "bg-blue-100 text-blue-800" },
  { value: "IN_PROGRESS", label: "In Progress", color: "bg-yellow-100 text-yellow-800" },
  { value: "ON_HOLD", label: "On Hold", color: "bg-orange-100 text-orange-800" },
  { value: "RESOLVED", label: "Resolved", color: "bg-green-100 text-green-800" },
  { value: "CLOSED", label: "Closed", color: "bg-slate-100 text-slate-600" },
] as const;

export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  DEPT_HEAD: "DEPT_HEAD",
  MEMBER: "MEMBER",
} as const;

export const MANILA_TZ = "Asia/Manila";

export const SLA_HOURS: Record<string, number | null> = {
  URGENT: 2,
  HIGH: 24,
  MEDIUM: 72,
  LOW: null,
};
