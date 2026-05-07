import { PrismaClient } from "@prisma/client";
import { parseMissions } from "../src/lib/utils";

const prisma = new PrismaClient();

async function seedAdmin() {
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

async function backfillMissionsFromAwards() {
  const awards = await prisma.studentBadge.findMany({
    select: { studentId: true, badgeId: true, awardedById: true },
  });
  if (awards.length === 0) return;

  const badgeIds = Array.from(new Set(awards.map((a) => a.badgeId)));
  const badges = await prisma.badge.findMany({
    where: { id: { in: badgeIds } },
    select: { id: true, missions: true },
  });
  const missionCountByBadge = new Map<string, number>(
    badges.map((b) => [b.id, parseMissions(b.missions).length]),
  );

  let created = 0;
  for (const award of awards) {
    const total = missionCountByBadge.get(award.badgeId) ?? 0;
    for (let i = 0; i < total; i++) {
      const result = await prisma.studentMission.upsert({
        where: {
          studentId_badgeId_missionIndex: {
            studentId: award.studentId,
            badgeId: award.badgeId,
            missionIndex: i,
          },
        },
        update: {},
        create: {
          studentId: award.studentId,
          badgeId: award.badgeId,
          missionIndex: i,
          checkedById: award.awardedById,
        },
      });
      if (result.completedAt.getTime() > Date.now() - 5000) created++;
    }
  }

  if (created > 0) {
    console.log(`Backfilled ${created} StudentMission row(s) from existing awards.`);
  }
}

async function main() {
  await seedAdmin();
  await backfillMissionsFromAwards();
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
