import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LoginButton } from "./login-button";
import { Award } from "lucide-react";

export default async function HomePage() {
  const session = await getSession();

  if (session) {
    const role = session.user.role;
    if (role === "ADMIN") redirect("/admin/users");
    if (role === "TEACHER") redirect("/teacher/courses");
    redirect("/courses");
  }

  return (
    <main className="min-h-screen min-h-[100dvh] bg-primary flex flex-col items-center justify-center p-8">
      <div className="flex flex-col items-center text-white mb-12">
        <div className="bg-white/20 rounded-full p-6 mb-6">
          <Award size={64} className="text-gold" />
        </div>
        <h1 className="text-4xl font-bold mb-2">Badge Tracker</h1>
        <p className="text-blue-200 text-center text-lg">
          Collect badges by completing missions!
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm text-center">
        <h2 className="text-gray-800 font-semibold text-lg mb-2">Welcome</h2>
        <p className="text-gray-500 text-sm mb-6">
          Sign in with your <strong>@ku.th</strong> Google account to continue.
        </p>
        <LoginButton />
      </div>
    </main>
  );
}
