import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const adapter = new PrismaLibSql({ url: "file:/home/user/CEOdashboard/dev.db" });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new PrismaClient({ adapter } as any);

const sampleTickets = [
  {
    ticketNo: "GDV-2601-1001",
    title: "Email server not responding",
    description: "The company email server has been down since 8 AM. Multiple employees cannot send or receive emails.",
    status: "IN_PROGRESS",
    priority: "CRITICAL",
    category: "IT Support",
    submittedBy: "Maria Reyes",
    assignedTo: "Carlos Mendoza",
    department: "Information Technology",
  },
  {
    ticketNo: "GDV-2601-1002",
    title: "Request for new laptop for new hire",
    description: "New employee starting next Monday needs a laptop setup with standard software.",
    status: "OPEN",
    priority: "MEDIUM",
    category: "IT Support",
    submittedBy: "Elena Torres",
    department: "Human Resources",
  },
  {
    ticketNo: "GDV-2601-1003",
    title: "Payroll discrepancy for December",
    description: "Several employees reported incorrect overtime calculations in December payroll.",
    status: "OPEN",
    priority: "HIGH",
    category: "Finance",
    submittedBy: "John Santos",
    assignedTo: "Sofia Bautista",
    department: "Finance & Accounting",
  },
  {
    ticketNo: "GDV-2601-1004",
    title: "Air conditioning malfunction in floor 3",
    description: "The AC unit on the 3rd floor has been malfunctioning for 2 days.",
    status: "RESOLVED",
    priority: "MEDIUM",
    category: "Facilities",
    submittedBy: "Roberto Cruz",
    assignedTo: "Miguel Ramos",
    department: "Facilities",
    resolvedAt: new Date(),
  },
  {
    ticketNo: "GDV-2601-1005",
    title: "VPN access request for remote work",
    description: "Requesting VPN access setup for the remote sales team members joining this quarter.",
    status: "OPEN",
    priority: "LOW",
    category: "IT Support",
    submittedBy: "Ana Garcia",
    department: "Sales",
  },
  {
    ticketNo: "GDV-2601-1006",
    title: "Contract renewal documentation missing",
    description: "Vendor contract renewal documents for Q1 suppliers are missing from the shared drive.",
    status: "ON_HOLD",
    priority: "HIGH",
    category: "Legal & Compliance",
    submittedBy: "Carmen Villanueva",
    assignedTo: "Luis Dela Cruz",
    department: "Legal",
  },
  {
    ticketNo: "GDV-2601-1007",
    title: "Office supplies restock needed",
    description: "Multiple departments have reported running low on basic office supplies.",
    status: "CLOSED",
    priority: "LOW",
    category: "Procurement",
    submittedBy: "Miguel Ramos",
    assignedTo: "Ana Garcia",
    department: "Operations",
    resolvedAt: new Date(Date.now() - 86400000),
  },
  {
    ticketNo: "GDV-2601-1008",
    title: "Customer complaint escalation - Account #4521",
    description: "Key client GDV Account #4521 has escalated a service delivery complaint that needs immediate attention.",
    status: "IN_PROGRESS",
    priority: "CRITICAL",
    category: "Customer Service",
    submittedBy: "John Santos",
    assignedTo: "Elena Torres",
    department: "Customer Support",
  },
];

async function main() {
  console.log("Seeding database...");
  for (const ticket of sampleTickets) {
    await prisma.ticket.create({
      data: {
        ...ticket,
        activities: { create: { action: "created", actor: ticket.submittedBy } },
        comments:
          ticket.status === "RESOLVED" || ticket.status === "CLOSED"
            ? {
                create: {
                  body: "Issue has been resolved. Please let us know if you experience any further problems.",
                  author: ticket.assignedTo ?? "Support Team",
                },
              }
            : undefined,
      },
    });
  }
  console.log(`Seeded ${sampleTickets.length} tickets.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
