import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role === "STUDENT") {
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: session.user.id },
      include: {
        course: {
          include: {
            teachers: { select: { name: true } },
            _count: { select: { badges: true } },
          },
        },
      },
    });
    return NextResponse.json(enrollments.map((e) => e.course));
  }

  if (session.user.role === "TEACHER") {
    const courses = await prisma.course.findMany({
      where: { teachers: { some: { id: session.user.id } } },
      include: {
        _count: { select: { badges: true, enrollments: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(courses);
  }

  if (session.user.role === "ADMIN") {
    const courses = await prisma.course.findMany({
      include: {
        teachers: { select: { name: true, email: true } },
        _count: { select: { badges: true, enrollments: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(courses);
  }

  return NextResponse.json([]);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !["TEACHER", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, description } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const course = await prisma.course.create({
    data: {
      name: name.trim(),
      description: description?.trim(),
      teachers: { connect: { id: session.user.id } },
    },
  });

  return NextResponse.json(course, { status: 201 });
}
