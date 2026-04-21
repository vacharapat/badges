import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Image from "next/image";
import { Navbar } from "@/components/Navbar";
import { Award, BookOpen } from "lucide-react";

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      _count: {
        select: { badgesEarned: true, enrollments: true },
      },
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-primary text-white px-4 py-5">
        <div className="max-w-lg mx-auto">
          <h1 className="text-2xl font-bold">Profile</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center mb-6">
          {session.user.image ? (
            <Image
              src={session.user.image}
              alt={session.user.name ?? "User"}
              width={80}
              height={80}
              className="rounded-full mx-auto mb-3 border-4 border-primary"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3">
              {session.user.name?.[0] ?? "?"}
            </div>
          )}
          <h2 className="text-xl font-bold text-gray-900">{session.user.name}</h2>
          <p className="text-gray-500 text-sm">{session.user.email}</p>
          <span className="inline-block mt-2 text-xs font-semibold bg-blue-100 text-primary px-3 py-1 rounded-full">
            {user?.role ?? "STUDENT"}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-center">
            <Award size={28} className="text-gold mx-auto mb-2" />
            <p className="text-3xl font-bold text-gray-900">{user?._count.badgesEarned ?? 0}</p>
            <p className="text-sm text-gray-500">Badges Earned</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-center">
            <BookOpen size={28} className="text-primary mx-auto mb-2" />
            <p className="text-3xl font-bold text-gray-900">{user?._count.enrollments ?? 0}</p>
            <p className="text-sm text-gray-500">Courses</p>
          </div>
        </div>
      </main>

      <Navbar />
    </div>
  );
}
