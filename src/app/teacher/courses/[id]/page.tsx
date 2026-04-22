import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { TeacherCourseClient } from "./teacher-course-client";

export default async function TeacherCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/");
  if (session.user.role === "STUDENT") redirect(`/courses/${id}`);

  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      teachers: { select: { id: true, name: true, email: true } },
      badges: {
        include: {
          _count: { select: { studentBadges: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      enrollments: {
        include: {
          student: { select: { id: true, name: true, email: true, image: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!course) notFound();

  const isOwner = course.teachers.some((t) => t.id === session.user.id) || session.user.role === "ADMIN";

  const studentIds = course.enrollments.map((e) => e.student.id);
  const studentBadges = await prisma.studentBadge.findMany({
    where: {
      studentId: { in: studentIds },
      badge: { courseId: id },
    },
    select: { studentId: true, badgeId: true },
  });

  const badgeMap: Record<string, Set<string>> = {};
  for (const sb of studentBadges) {
    if (!badgeMap[sb.studentId]) badgeMap[sb.studentId] = new Set();
    badgeMap[sb.studentId].add(sb.badgeId);
  }

  const students = course.enrollments.map((e) => ({
    ...e.student,
    earnedBadgeIds: Array.from(badgeMap[e.student.id] ?? []),
  }));

  const badges = course.badges.map((b) => ({
    id: b.id,
    name: b.name,
    imageUrl: b.imageUrl,
    missions: b.missions,
    awardedCount: b._count.studentBadges,
  }));

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <TeacherCourseClient
        courseId={id}
        courseName={course.name}
        courseDescription={course.description ?? ""}
        badges={badges}
        students={students}
        teachers={course.teachers}
        isOwner={isOwner}
      />

      <Navbar />
    </div>
  );
}
