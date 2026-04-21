import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

// POST: add a teacher to the course
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session || !["TEACHER", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const course = await prisma.course.findUnique({ where: { id }, include: { teachers: { select: { id: true } } } });
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

  const isOwner = course.teachers.some((t) => t.id === session.user.id);
  if (!isOwner && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { teacherId } = await req.json();
  if (!teacherId) return NextResponse.json({ error: "teacherId required" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: teacherId } });
  if (!user || !["TEACHER", "ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "User not found or not a teacher" }, { status: 400 });
  }

  await prisma.course.update({
    where: { id },
    data: { teachers: { connect: { id: teacherId } } },
  });

  return NextResponse.json({ ok: true });
}

// DELETE: remove a teacher from the course
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session || !["TEACHER", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const course = await prisma.course.findUnique({ where: { id }, include: { teachers: { select: { id: true } } } });
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

  const isOwner = course.teachers.some((t) => t.id === session.user.id);
  if (!isOwner && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { teacherId } = await req.json();

  if (course.teachers.length <= 1) {
    return NextResponse.json({ error: "A course must have at least one teacher" }, { status: 400 });
  }

  await prisma.course.update({
    where: { id },
    data: { teachers: { disconnect: { id: teacherId } } },
  });

  return NextResponse.json({ ok: true });
}
