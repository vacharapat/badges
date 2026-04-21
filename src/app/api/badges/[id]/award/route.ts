import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session || !["TEACHER", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { studentId } = await req.json();
  if (!studentId) return NextResponse.json({ error: "studentId required" }, { status: 400 });

  const badge = await prisma.badge.findUnique({
    where: { id },
    include: { course: true },
  });
  if (!badge) return NextResponse.json({ error: "Badge not found" }, { status: 404 });

  const enrollment = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId, courseId: badge.courseId } },
  });
  if (!enrollment) {
    return NextResponse.json({ error: "Student not enrolled" }, { status: 400 });
  }

  const awarded = await prisma.studentBadge.upsert({
    where: { studentId_badgeId: { studentId, badgeId: id } },
    update: {},
    create: { studentId, badgeId: id, awardedById: session.user.id },
  });

  return NextResponse.json(awarded, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session || !["TEACHER", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { studentId } = await req.json();

  await prisma.studentBadge.deleteMany({
    where: { badgeId: id, studentId },
  });

  return NextResponse.json({ ok: true });
}
