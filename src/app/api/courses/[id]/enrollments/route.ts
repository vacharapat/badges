import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session || !["TEACHER", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const pending = await prisma.pendingEnrollment.findMany({
    where: { courseId: id },
    select: { email: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ pendingEmails: pending.map((p) => p.email) });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session || !["TEACHER", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail.endsWith("@ku.th") && !normalizedEmail.endsWith(".ku.th")) {
    return NextResponse.json({ error: "Only @ku.th emails can be enrolled" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (user) {
    try {
      await prisma.enrollment.create({ data: { studentId: user.id, courseId: id } });
      return NextResponse.json({
        type: "enrolled",
        student: { id: user.id, name: user.name, email: user.email, image: user.image },
      }, { status: 201 });
    } catch {
      return NextResponse.json({ error: "Already enrolled" }, { status: 409 });
    }
  }

  await prisma.pendingEnrollment.upsert({
    where: { email_courseId: { email: normalizedEmail, courseId: id } },
    create: { email: normalizedEmail, courseId: id },
    update: {},
  });
  return NextResponse.json({ type: "pending", email: normalizedEmail }, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session || !["TEACHER", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { studentId, email } = await req.json();

  if (studentId) {
    await prisma.enrollment.deleteMany({ where: { courseId: id, studentId } });
  } else if (email) {
    await prisma.pendingEnrollment.deleteMany({ where: { courseId: id, email } });
  }

  return NextResponse.json({ ok: true });
}
