import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.log("Set ADMIN_EMAIL in .env.local to seed an admin user.");
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existing) {
    console.log(`User ${adminEmail} not found. Log in via Google first, then re-run this seed.`);
    return;
  }

  const admin = await prisma.user.update({
    where: { email: adminEmail },
    data: { role: "ADMIN" },
  });

  console.log(`Admin user ready: ${admin.email}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
