import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { CourseHeader } from "@/components/Navbar";
import { Navbar } from "@/components/Navbar";
import { ProgressBar } from "@/components/ProgressBar";
import { BadgesGrid } from "./badges-grid";

export default async function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/");
  if (session.user.role === "TEACHER") redirect(`/teacher/courses/${id}`);
  if (session.user.role === "ADMIN") redirect(`/teacher/courses/${id}`);

  const enrollment = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId: session.user.id, courseId: id } },
  });
  if (!enrollment) notFound();

  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      badges: {
        include: {
          studentBadges: { where: { studentId: session.user.id } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!course) notFound();

  const total = course.badges.length;
  const earned = course.badges.filter((b) => b.studentBadges.length > 0).length;

  const badges = course.badges.map((b) => ({
    id: b.id,
    name: b.name,
    imageUrl: b.imageUrl,
    missions: b.missions,
    earned: b.studentBadges.length > 0,
  }));

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <CourseHeader courseName={course.name} />
      <ProgressBar earned={earned} total={total} />
      <main className="max-w-lg mx-auto px-4 py-4">
        <BadgesGrid badges={badges} />
      </main>
      <Navbar />
    </div>
  );
}
