import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session || !["TEACHER", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const enrolled = await prisma.enrollment.findMany({
    where: { courseId: id },
    select: { studentId: true },
  });
  const enrolledIds = enrolled.map((e) => e.studentId);

  const students = await prisma.user.findMany({
    where: {
      role: "STUDENT",
      id: { notIn: enrolledIds },
      OR: [{ email: { endsWith: "@ku.th" } }, { email: { endsWith: ".ku.th" } }],
    },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(students);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session || !["TEACHER", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { studentId } = await req.json();
  if (!studentId) return NextResponse.json({ error: "studentId required" }, { status: 400 });

  const enrollment = await prisma.enrollment.create({
    data: { studentId, courseId: id },
  });

  return NextResponse.json(enrollment, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session || !["TEACHER", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { studentId } = await req.json();

  await prisma.enrollment.deleteMany({
    where: { courseId: id, studentId },
  });

  return NextResponse.json({ ok: true });
}
