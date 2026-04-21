import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

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

  const { name, imageUrl, missions } = await req.json();
  if (!name?.trim() || !imageUrl || !Array.isArray(missions)) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const badge = await prisma.badge.create({
    data: {
      name: name.trim(),
      imageUrl,
      missions: JSON.stringify(missions.filter((m: string) => m.trim())),
      courseId: id,
    },
  });

  return NextResponse.json(badge, { status: 201 });
}
