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
  const updated = await prisma.badge.update({
    where: { id },
    data: {
      ...(name && { name: name.trim() }),
      ...(imageUrl && { imageUrl }),
      ...(missions && { missions: JSON.stringify(missions) }),
    },
  });

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
