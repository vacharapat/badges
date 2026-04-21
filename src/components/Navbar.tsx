"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { Home, BookOpen, Award, User, LogOut, ShieldCheck } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  if (!session) return null;

  const role = session.user.role;

  let navItems: NavItem[] = [];

  if (role === "STUDENT") {
    navItems = [
      { href: "/courses", label: "Home", icon: <Home size={22} /> },
      { href: "/courses", label: "Courses", icon: <BookOpen size={22} /> },
      { href: "/profile", label: "Profile", icon: <User size={22} /> },
    ];
  } else if (role === "TEACHER") {
    navItems = [
      { href: "/teacher/courses", label: "Home", icon: <Home size={22} /> },
      { href: "/teacher/courses", label: "Courses", icon: <BookOpen size={22} /> },
      { href: "/profile", label: "Profile", icon: <User size={22} /> },
    ];
  } else if (role === "ADMIN") {
    navItems = [
      { href: "/admin/users", label: "Users", icon: <ShieldCheck size={22} /> },
      { href: "/teacher/courses", label: "Courses", icon: <BookOpen size={22} /> },
      { href: "/profile", label: "Profile", icon: <User size={22} /> },
    ];
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="max-w-lg mx-auto flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-4 py-2 text-xs",
                isActive ? "text-primary" : "text-gray-500"
              )}
            >
              <span className={cn(isActive && "text-primary")}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex flex-col items-center gap-0.5 px-4 py-2 text-xs text-gray-500"
        >
          <LogOut size={22} />
          <span>Sign Out</span>
        </button>
      </div>
    </nav>
  );
}

export function CourseHeader({
  courseName,
  subtitle = "Collect Badges by Completing Missions!",
}: {
  courseName: string;
  subtitle?: string;
}) {
  const { data: session } = useSession();

  return (
    <header className="bg-primary text-white px-4 pt-4 pb-3">
      <div className="max-w-lg mx-auto flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold leading-tight">{courseName}</h1>
          <p className="text-sm text-blue-200 mt-0.5">{subtitle}</p>
        </div>
        {session?.user && (
          <div className="flex flex-col items-center ml-3 shrink-0">
            {session.user.image ? (
              <Image
                src={session.user.image}
                alt={session.user.name ?? "User"}
                width={40}
                height={40}
                className="rounded-full border-2 border-white"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-400 flex items-center justify-center text-white font-bold">
                {session.user.name?.[0] ?? "?"}
              </div>
            )}
            <span className="text-xs mt-0.5 font-medium">{session.user.name?.split(" ")[0]}</span>
          </div>
        )}
      </div>
    </header>
  );
}
