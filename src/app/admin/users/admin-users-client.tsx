"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: string;
}

const ROLES = ["STUDENT", "TEACHER", "ADMIN"] as const;
type Role = (typeof ROLES)[number];

const roleColors: Record<Role, string> = {
  STUDENT: "bg-gray-100 text-gray-600",
  TEACHER: "bg-blue-100 text-blue-700",
  ADMIN: "bg-purple-100 text-purple-700",
};

export function AdminUsersClient({
  users: initialUsers,
  currentUserId,
}: {
  users: User[];
  currentUserId: string;
}) {
  const [users, setUsers] = useState(initialUsers);
  const [loading, setLoading] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  );

  async function changeRole(userId: string, role: Role) {
    setLoading(userId);
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role }),
    });
    if (res.ok) {
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
    }
    setLoading(null);
  }

  return (
    <div>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name or email..."
        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-primary"
      />

      <div className="space-y-3">
        {filtered.map((user) => (
          <div
            key={user.id}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4"
          >
            <div className="flex items-center gap-3 mb-3">
              {user.image ? (
                <Image
                  src={user.image}
                  alt={user.name ?? "User"}
                  width={36}
                  height={36}
                  className="rounded-full"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                  {user.name?.[0] ?? "?"}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">{user.name ?? "—"}</p>
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
              </div>
              <span
                className={cn(
                  "text-xs font-semibold px-2 py-0.5 rounded-full",
                  roleColors[user.role as Role]
                )}
              >
                {user.role}
              </span>
            </div>

            {user.id !== currentUserId && (
              <div className="flex gap-2">
                {ROLES.map((role) => (
                  <button
                    key={role}
                    onClick={() => changeRole(user.id, role)}
                    disabled={user.role === role || loading === user.id}
                    className={cn(
                      "flex-1 text-xs font-semibold py-1.5 rounded-lg transition-colors",
                      user.role === role
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200",
                      "disabled:opacity-50"
                    )}
                  >
                    {loading === user.id ? "..." : role}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <p className="text-center text-gray-400 py-8">No users found.</p>
        )}
      </div>
    </div>
  );
}
