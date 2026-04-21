import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { NewCourseForm } from "./new-course-form";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default async function NewCoursePage() {
  const session = await getSession();
  if (!session) redirect("/");
  if (session.user.role === "STUDENT") redirect("/courses");

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-primary text-white px-4 py-5">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Link href="/teacher/courses" className="text-blue-200 hover:text-white">
            <ChevronLeft size={24} />
          </Link>
          <h1 className="text-xl font-bold">New Course</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <NewCourseForm />
        </div>
      </main>

      <Navbar />
    </div>
  );
}
