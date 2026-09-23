import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

function csvCell(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      teachers: { select: { id: true } },
      badges: { orderBy: { createdAt: "asc" } },
      enrollments: {
        include: { student: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isTeacher = course.teachers.some((t) => t.id === session.user.id);
  if (!isTeacher && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const studentIds = course.enrollments.map((e) => e.student.id);
  const studentBadges = await prisma.studentBadge.findMany({
    where: { studentId: { in: studentIds }, badge: { courseId: id } },
    select: { studentId: true, badgeId: true },
  });

  const earnedMap: Record<string, Set<string>> = {};
  for (const sb of studentBadges) {
    if (!earnedMap[sb.studentId]) earnedMap[sb.studentId] = new Set();
    earnedMap[sb.studentId].add(sb.badgeId);
  }

  const badges = course.badges;
  const header = [
    "Name",
    "Email",
    ...badges.map((b) => `${b.name} (${b.type === "OPTIONAL" ? "Optional" : "Required"})`),
  ];

  const rows = course.enrollments.map((e) => {
    const earned = earnedMap[e.student.id] ?? new Set<string>();
    return [
      e.student.name ?? "",
      e.student.email ?? "",
      ...badges.map((b) => (earned.has(b.id) ? "Yes" : "No")),
    ];
  });

  const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
  const filename = `${course.name.replace(/[^a-z0-9]+/gi, "-")}-badge-report.csv`;

  return new NextResponse(`﻿${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
