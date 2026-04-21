import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { BookOpen, Award } from "lucide-react";

export default async function CoursesPage() {
  const session = await getSession();
  if (!session) redirect("/");
  if (session.user.role === "ADMIN") redirect("/admin/users");
  if (session.user.role === "TEACHER") redirect("/teacher/courses");

  const enrollments = await prisma.enrollment.findMany({
    where: { studentId: session.user.id },
    include: {
      course: {
        include: {
          teachers: { select: { name: true } },
          badges: {
            include: {
              studentBadges: { where: { studentId: session.user.id } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-primary text-white px-4 py-5 shadow">
        <div className="max-w-lg mx-auto">
          <h1 className="text-2xl font-bold">My Courses</h1>
          <p className="text-blue-200 text-sm mt-0.5">Track your badge progress</p>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {enrollments.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <BookOpen size={48} className="mx-auto mb-3 opacity-40" />
            <p className="font-medium">No courses yet</p>
            <p className="text-sm">Ask your teacher to enroll you.</p>
          </div>
        ) : (
          enrollments.map(({ course }) => {
            const total = course.badges.length;
            const earned = course.badges.filter((b) => b.studentBadges.length > 0).length;
            const pct = total === 0 ? 0 : Math.round((earned / total) * 100);

            return (
              <Link
                key={course.id}
                href={`/courses/${course.id}`}
                className="block bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h2 className="font-bold text-gray-900 text-lg leading-tight">{course.name}</h2>
                    {course.description && (
                      <p className="text-gray-500 text-sm mt-0.5 line-clamp-2">
                        {course.description}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">by {course.teachers.map((t) => t.name).join(", ")}</p>
                  </div>
                  <div className="flex items-center gap-1 text-primary bg-blue-50 px-2 py-1 rounded-lg shrink-0 ml-3">
                    <Award size={14} />
                    <span className="text-xs font-semibold">
                      {earned}/{total}
                    </span>
                  </div>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gold rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1.5">{pct}% complete</p>
              </Link>
            );
          })
        )}
      </main>

      <Navbar />
    </div>
  );
}
