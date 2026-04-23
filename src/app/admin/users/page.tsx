import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { Navbar } from "@/components/Navbar";
import { AdminUsersClient } from "./admin-users-client";

export default async function AdminUsersPage() {
  const session = await getSession();
  if (!session) redirect("/");
  if (session.user.role !== "ADMIN") redirect("/courses");

  const [users, pendingTeachers] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true, image: true, role: true },
    }),
    prisma.pendingRole.findMany({
      where: { role: "TEACHER" },
      orderBy: { createdAt: "asc" },
      select: { email: true },
    }),
  ]);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-primary text-white px-4 py-5">
        <div className="max-w-lg mx-auto">
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-blue-200 text-sm mt-0.5">Manage roles for @ku.th users</p>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        <AdminUsersClient
          users={users}
          currentUserId={session.user.id}
          pendingTeacherEmails={pendingTeachers.map((p) => p.email)}
        />
      </main>

      <Navbar />
    </div>
  );
}
