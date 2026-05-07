import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseMissions } from "@/lib/utils";

async function loadBadgeAndAuthorize(badgeId: string, studentId: string) {
  const session = await getSession();
  if (!session || !["TEACHER", "ADMIN"].includes(session.user.role)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  const badge = await prisma.badge.findUnique({
    where: { id: badgeId },
    include: { course: { include: { teachers: { select: { id: true } } } } },
  });
  if (!badge) {
    return { error: NextResponse.json({ error: "Badge not found" }, { status: 404 }) };
  }

  const isOwner = badge.course.teachers.some((t) => t.id === session.user.id);
  if (!isOwner && session.user.role !== "ADMIN") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId, courseId: badge.courseId } },
  });
  if (!enrollment) {
    return { error: NextResponse.json({ error: "Student not enrolled" }, { status: 400 }) };
  }

  return { session, badge };
}

async function syncBadgeAward(studentId: string, badgeId: string, totalMissions: number, teacherId: string) {
  const completedCount = await prisma.studentMission.count({
    where: { studentId, badgeId },
  });

  if (completedCount >= totalMissions && totalMissions > 0) {
    await prisma.studentBadge.upsert({
      where: { studentId_badgeId: { studentId, badgeId } },
      update: {},
      create: { studentId, badgeId, awardedById: teacherId },
    });
    return true;
  }

  await prisma.studentBadge.deleteMany({ where: { studentId, badgeId } });
  return false;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { studentId, missionIndex } = await req.json();
  if (!studentId || typeof missionIndex !== "number") {
    return NextResponse.json({ error: "studentId and missionIndex required" }, { status: 400 });
  }

  const auth = await loadBadgeAndAuthorize(id, studentId);
  if ("error" in auth) return auth.error;
  const { session, badge } = auth;

  const missions = parseMissions(badge.missions);
  if (missionIndex < 0 || missionIndex >= missions.length) {
    return NextResponse.json({ error: "Invalid missionIndex" }, { status: 400 });
  }

  await prisma.studentMission.upsert({
    where: { studentId_badgeId_missionIndex: { studentId, badgeId: id, missionIndex } },
    update: {},
    create: { studentId, badgeId: id, missionIndex, checkedById: session.user.id },
  });

  const earned = await syncBadgeAward(studentId, id, missions.length, session.user.id);
  return NextResponse.json({ ok: true, earned });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { studentId, missionIndex } = await req.json();
  if (!studentId || typeof missionIndex !== "number") {
    return NextResponse.json({ error: "studentId and missionIndex required" }, { status: 400 });
  }

  const auth = await loadBadgeAndAuthorize(id, studentId);
  if ("error" in auth) return auth.error;
  const { session, badge } = auth;

  const missions = parseMissions(badge.missions);

  await prisma.studentMission.deleteMany({
    where: { studentId, badgeId: id, missionIndex },
  });

  const earned = await syncBadgeAward(studentId, id, missions.length, session.user.id);
  return NextResponse.json({ ok: true, earned });
}
