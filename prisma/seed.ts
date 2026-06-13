import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import * as bcrypt from "bcryptjs";

const adapter = new PrismaLibSql({ url: "file:/home/user/CEOdashboard/dev.db" });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new PrismaClient({ adapter } as any);

const DEFAULT_PASSWORD = "GDV@2026!";

async function main() {
  console.log("Seeding GDV Holdings Help Desk...");

  const hash = await bcrypt.hash(DEFAULT_PASSWORD, 12);

  // Initialize ticket counter
  await prisma.counter.upsert({
    where: { id: "ticket" },
    update: {},
    create: { id: "ticket", value: 0 },
  });

  // Super Admins
  const superAdmins = [
    { name: "JC Cunanan", email: "jcunanan@stackph.com" },
    { name: "GDV Admin 2", email: "admin2@gdvholdings.com" },
    { name: "GDV Admin 3", email: "admin3@gdvholdings.com" },
  ];

  for (const admin of superAdmins) {
    await prisma.user.upsert({
      where: { email: admin.email },
      update: {},
      create: { ...admin, password: hash, role: "SUPER_ADMIN" },
    });
  }

  // Department Heads
  const deptHeads = [
    { name: "IT Head", email: "it.head@gdvholdings.com", department: "IT" },
    { name: "Facility Head", email: "facility.head@gdvholdings.com", department: "FACILITY" },
    { name: "Security Head", email: "security.head@gdvholdings.com", department: "SECURITY" },
    { name: "Marketing Head", email: "marketing.head@gdvholdings.com", department: "MARKETING" },
    { name: "HR/Finance Head", email: "hrfinance.head@gdvholdings.com", department: "HR_FINANCE" },
  ];

  for (const head of deptHeads) {
    await prisma.user.upsert({
      where: { email: head.email },
      update: {},
      create: { ...head, password: hash, role: "DEPT_HEAD" },
    });
  }

  console.log("✓ Created 3 super admins and 5 department heads");
  console.log(`  Default password: ${DEFAULT_PASSWORD}`);
  console.log("  Super admins:", superAdmins.map((a) => a.email).join(", "));
  console.log("  Dept heads:", deptHeads.map((h) => h.email).join(", "));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
