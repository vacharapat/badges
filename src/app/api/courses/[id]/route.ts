import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      teachers: { select: { id: true, name: true, email: true } },
      badges: { orderBy: { createdAt: "asc" } },
      enrollments: {
        include: { student: { select: { id: true, name: true, email: true, image: true } } },
      },
    },
  });

  if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(course);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const course = await prisma.course.findUnique({ where: { id }, include: { teachers: { select: { id: true } } } });
  if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOwner = course.teachers.some((t) => t.id === session.user.id);
  if (!isOwner && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, description } = await req.json();
  const updated = await prisma.course.update({
    where: { id },
    data: { name: name?.trim(), description: description?.trim() },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const course = await prisma.course.findUnique({ where: { id }, include: { teachers: { select: { id: true } } } });
  if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOwner = course.teachers.some((t) => t.id === session.user.id);
  if (!isOwner && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.course.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
