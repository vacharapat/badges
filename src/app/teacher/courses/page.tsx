import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Plus, BookOpen, Users, Award } from "lucide-react";

export default async function TeacherCoursesPage() {
  const session = await getSession();
  if (!session) redirect("/");
  if (session.user.role === "STUDENT") redirect("/courses");

  const courses = await prisma.course.findMany({
    where: session.user.role === "ADMIN" ? {} : { teachers: { some: { id: session.user.id } } },
    include: {
      teachers: { select: { name: true } },
      _count: { select: { badges: true, enrollments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-primary text-white px-4 py-5">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">My Courses</h1>
            <p className="text-blue-200 text-sm mt-0.5">Manage your courses and badges</p>
          </div>
          <Link
            href="/teacher/courses/new"
            className="flex items-center gap-1.5 bg-white text-primary font-semibold text-sm px-3 py-2 rounded-xl hover:bg-blue-50 transition-colors"
          >
            <Plus size={16} />
            New
          </Link>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {courses.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <BookOpen size={48} className="mx-auto mb-3 opacity-40" />
            <p className="font-medium">No courses yet</p>
            <Link
              href="/teacher/courses/new"
              className="inline-flex items-center gap-1 mt-3 text-primary font-semibold text-sm"
            >
              <Plus size={14} /> Create your first course
            </Link>
          </div>
        ) : (
          courses.map((course) => (
            <Link
              key={course.id}
              href={`/teacher/courses/${course.id}`}
              className="block bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow"
            >
              <h2 className="font-bold text-gray-900 text-lg leading-tight">{course.name}</h2>
              {course.description && (
                <p className="text-gray-500 text-sm mt-1 line-clamp-2">{course.description}</p>
              )}
              {session.user.role === "ADMIN" && (
                <p className="text-xs text-gray-400 mt-1">by {course.teachers.map((t) => t.name).join(", ")}</p>
              )}
              <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                <span className="flex items-center gap-1.5">
                  <Award size={14} className="text-gold" />
                  {course._count.badges} badges
                </span>
                <span className="flex items-center gap-1.5">
                  <Users size={14} className="text-primary" />
                  {course._count.enrollments} students
                </span>
              </div>
            </Link>
          ))
        )}
      </main>

      <Navbar />
    </div>
  );
}
