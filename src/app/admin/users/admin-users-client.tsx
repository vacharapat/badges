"use client";

import { useState } from "react";
import Image from "next/image";
import { Trash2, UserPlus } from "lucide-react";
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
  pendingTeacherEmails: initialPendingTeacherEmails,
}: {
  users: User[];
  currentUserId: string;
  pendingTeacherEmails: string[];
}) {
  const [users, setUsers] = useState(initialUsers);
  const [loading, setLoading] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [pendingTeacherEmails, setPendingTeacherEmails] = useState(initialPendingTeacherEmails);
  const [preregEmail, setPreregEmail] = useState("");
  const [preregLoading, setPreregLoading] = useState(false);
  const [preregError, setPreregError] = useState("");
  const [preregSuccess, setPreregSuccess] = useState("");

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

  async function preregisterTeacher() {
    const email = preregEmail.trim().toLowerCase();
    if (!email) return;
    setPreregLoading(true);
    setPreregError("");
    setPreregSuccess("");
    const res = await fetch("/api/admin/pending-teachers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (res.ok) {
      if (data.type === "upgraded") {
        setUsers((prev) => prev.map((u) => u.email === email ? { ...u, role: "TEACHER" } : u));
        setPreregSuccess(`${email} already had an account — role upgraded to TEACHER.`);
      } else {
        setPendingTeacherEmails((prev) => [...prev, email]);
        setPreregSuccess(`${email} will be registered as TEACHER on first sign-in.`);
      }
      setPreregEmail("");
    } else {
      setPreregError(data.error ?? "Failed to pre-register");
    }
    setPreregLoading(false);
  }

  async function removePendingTeacher(email: string) {
    const res = await fetch("/api/admin/pending-teachers", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (res.ok) {
      setPendingTeacherEmails((prev) => prev.filter((e) => e !== email));
    }
  }

  return (
    <div>
      {/* Pre-register teacher section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <UserPlus size={16} className="text-primary" />
          <h2 className="text-sm font-bold text-gray-800">Pre-register Teacher</h2>
        </div>
        <p className="text-xs text-gray-400 mb-3">
          Enter a @ku.th email to grant Teacher access on first sign-in. If they already have an account, their role is upgraded immediately.
        </p>
        <div className="flex gap-2">
          <input
            type="email"
            value={preregEmail}
            onChange={(e) => { setPreregEmail(e.target.value); setPreregError(""); setPreregSuccess(""); }}
            onKeyDown={(e) => e.key === "Enter" && preregisterTeacher()}
            placeholder="teacher@ku.th"
            className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={preregisterTeacher}
            disabled={preregLoading || !preregEmail.trim()}
            className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
          >
            {preregLoading ? "..." : "Add"}
          </button>
        </div>
        {preregError && <p className="mt-2 text-sm text-red-500">{preregError}</p>}
        {preregSuccess && <p className="mt-2 text-sm text-green-600">{preregSuccess}</p>}

        {pendingTeacherEmails.length > 0 && (
          <div className="mt-4 border-t border-gray-100 pt-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Pending — waiting for first sign-in
            </p>
            <div className="space-y-1.5">
              {pendingTeacherEmails.map((email) => (
                <div key={email} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 truncate">{email}</span>
                  <button
                    onClick={() => removePendingTeacher(email)}
                    className="text-gray-300 hover:text-red-500 transition-colors ml-2 shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

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
