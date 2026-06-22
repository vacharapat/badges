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
          studentMissions: { where: { studentId: session.user.id }, select: { missionIndex: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!course) notFound();

  const badges = course.badges.map((b) => ({
    id: b.id,
    name: b.name,
    imageUrl: b.imageUrl,
    missions: b.missions,
    type: b.type,
    earned: b.studentBadges.length > 0,
    completedMissionIndices: b.studentMissions.map((m) => m.missionIndex),
  }));

  const requiredBadges = badges.filter((b) => b.type !== "OPTIONAL");
  const optionalBadges = badges.filter((b) => b.type === "OPTIONAL");

  const requiredEarned = requiredBadges.filter((b) => b.earned).length;
  const optionalEarned = optionalBadges.filter((b) => b.earned).length;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <CourseHeader courseName={course.name} />
      <main className="max-w-lg mx-auto pb-4">
        {badges.length === 0 ? (
          <p className="text-center text-gray-400 py-12">No badges in this course yet.</p>
        ) : (
          <>
            {requiredBadges.length > 0 && (
              <section>
                <ProgressBar
                  earned={requiredEarned}
                  total={requiredBadges.length}
                  label="Required"
                />
                <div className="px-4 py-4">
                  <BadgesGrid badges={requiredBadges} />
                </div>
              </section>
            )}

            {optionalBadges.length > 0 && (
              <section>
                <ProgressBar
                  earned={optionalEarned}
                  total={optionalBadges.length}
                  label="Optional"
                />
                <div className="px-4 py-4">
                  <BadgesGrid badges={optionalBadges} />
                </div>
              </section>
            )}
          </>
        )}
      </main>
      <Navbar />
    </div>
  );
}
