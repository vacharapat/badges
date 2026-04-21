import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { ChevronLeft } from "lucide-react";
import { NewBadgeForm } from "./new-badge-form";

export default async function NewBadgePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/");
  if (session.user.role === "STUDENT") redirect("/courses");

  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) notFound();

  const isOwner = course.teacherId === session.user.id || session.user.role === "ADMIN";
  if (!isOwner) redirect("/teacher/courses");

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-primary text-white px-4 py-5">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Link href={`/teacher/courses/${id}`} className="text-blue-200 hover:text-white">
            <ChevronLeft size={24} />
          </Link>
          <h1 className="text-xl font-bold">New Badge</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <NewBadgeForm courseId={id} />
        </div>
      </main>

      <Navbar />
    </div>
  );
}
