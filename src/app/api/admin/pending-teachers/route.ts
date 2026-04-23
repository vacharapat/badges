import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(_req: NextRequest) {
  const session = await getSession();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const pending = await prisma.pendingRole.findMany({
    where: { role: "TEACHER" },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(pending);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail.endsWith("@ku.th") && !normalizedEmail.endsWith(".ku.th")) {
    return NextResponse.json({ error: "Only @ku.th emails allowed" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    await prisma.user.update({ where: { email: normalizedEmail }, data: { role: "TEACHER" } });
    return NextResponse.json({ type: "upgraded", email: normalizedEmail });
  }

  await prisma.pendingRole.upsert({
    where: { email: normalizedEmail },
    create: { email: normalizedEmail, role: "TEACHER" },
    update: {},
  });
  return NextResponse.json({ type: "pending", email: normalizedEmail }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

  await prisma.pendingRole.deleteMany({ where: { email } });
  return NextResponse.json({ ok: true });
}
