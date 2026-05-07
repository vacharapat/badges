import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session || !["TEACHER", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const badge = await prisma.badge.findUnique({
    where: { id },
    include: { course: { include: { teachers: { select: { id: true } } } } },
  });
  if (!badge) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOwner = badge.course.teachers.some((t) => t.id === session.user.id);
  if (!isOwner && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, imageUrl, missions } = await req.json();

  let newMissions: string[] | undefined;
  if (missions !== undefined) {
    if (!Array.isArray(missions)) {
      return NextResponse.json({ error: "Invalid missions" }, { status: 400 });
    }
    newMissions = missions.map((m: string) => m.trim()).filter(Boolean);
    if (newMissions.length === 0) {
      return NextResponse.json({ error: "At least one mission is required" }, { status: 400 });
    }
  }

  const updated = await prisma.badge.update({
    where: { id },
    data: {
      ...(name && { name: name.trim() }),
      ...(imageUrl && { imageUrl }),
      ...(newMissions && { missions: JSON.stringify(newMissions) }),
    },
  });

  if (newMissions) {
    const newLength = newMissions.length;
    await prisma.studentMission.deleteMany({
      where: { badgeId: id, missionIndex: { gte: newLength } },
    });
    const affected = await prisma.studentMission.groupBy({
      by: ["studentId"],
      where: { badgeId: id },
      _count: { _all: true },
    });
    const earnedStudentIds = affected.filter((a) => a._count._all >= newLength).map((a) => a.studentId);
    const unearnedStudentIds = affected.filter((a) => a._count._all < newLength).map((a) => a.studentId);

    if (unearnedStudentIds.length > 0) {
      await prisma.studentBadge.deleteMany({
        where: { badgeId: id, studentId: { in: unearnedStudentIds } },
      });
    }
    for (const studentId of earnedStudentIds) {
      await prisma.studentBadge.upsert({
        where: { studentId_badgeId: { studentId, badgeId: id } },
        update: {},
        create: { studentId, badgeId: id, awardedById: session.user.id },
      });
    }
  }

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session || !["TEACHER", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const badge = await prisma.badge.findUnique({
    where: { id },
    include: { course: { include: { teachers: { select: { id: true } } } } },
  });
  if (!badge) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOwner = badge.course.teachers.some((t) => t.id === session.user.id);
  if (!isOwner && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.badge.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
