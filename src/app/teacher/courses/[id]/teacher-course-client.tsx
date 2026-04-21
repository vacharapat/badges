"use client";

import { useState } from "react";
import Image from "next/image";
import { Award, Users, ChevronDown, ChevronUp, Check, UserPlus, Trash2, GraduationCap } from "lucide-react";
import { BadgeModal } from "@/components/BadgeModal";
import { cn } from "@/lib/utils";

interface Badge {
  id: string;
  name: string;
  imageUrl: string;
  missions: string;
  awardedCount: number;
}

interface Student {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  earnedBadgeIds: string[];
}

interface Teacher {
  id: string;
  name: string | null;
  email: string | null;
}

interface Props {
  courseId: string;
  badges: Badge[];
  students: Student[];
  teachers: Teacher[];
  isOwner: boolean;
}

export function TeacherCourseClient({ courseId, badges, students, teachers, isOwner }: Props) {
  const [tab, setTab] = useState<"badges" | "students" | "teachers">("badges");
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
  const [localStudents, setLocalStudents] = useState(students);
  const [localBadges] = useState(badges);
  const [localTeachers, setLocalTeachers] = useState(teachers);

  // For adding students
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [searchEmail, setSearchEmail] = useState("");
  const [searchResults, setSearchResults] = useState<{ id: string; name: string | null; email: string | null }[]>([]);
  const [searching, setSearching] = useState(false);

  // For adding teachers
  const [showAddTeacher, setShowAddTeacher] = useState(false);
  const [teacherEmail, setTeacherEmail] = useState("");
  const [teacherResults, setTeacherResults] = useState<Teacher[]>([]);
  const [searchingTeacher, setSearchingTeacher] = useState(false);
  const [teacherError, setTeacherError] = useState("");

  async function searchStudents() {
    setSearching(true);
    const res = await fetch(`/api/courses/${courseId}/enrollments`);
    if (res.ok) {
      const all = await res.json();
      const q = searchEmail.toLowerCase();
      setSearchResults(
        q ? all.filter((u: { email: string | null }) => u.email?.toLowerCase().includes(q)) : all
      );
    }
    setSearching(false);
  }

  async function enrollStudent(studentId: string) {
    const res = await fetch(`/api/courses/${courseId}/enrollments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId }),
    });
    if (res.ok) {
      const newStudent = searchResults.find((s) => s.id === studentId);
      if (newStudent) {
        setLocalStudents((prev) => [...prev, { ...newStudent, earnedBadgeIds: [] }]);
        setSearchResults((prev) => prev.filter((s) => s.id !== studentId));
      }
    }
  }

  async function removeStudent(studentId: string) {
    if (!confirm("Remove this student from the course?")) return;
    const res = await fetch(`/api/courses/${courseId}/enrollments`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId }),
    });
    if (res.ok) {
      setLocalStudents((prev) => prev.filter((s) => s.id !== studentId));
    }
  }

  async function toggleAward(studentId: string, badgeId: string, currentlyEarned: boolean) {
    const method = currentlyEarned ? "DELETE" : "POST";
    const res = await fetch(`/api/badges/${badgeId}/award`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId }),
    });
    if (res.ok) {
      setLocalStudents((prev) =>
        prev.map((s) => {
          if (s.id !== studentId) return s;
          return {
            ...s,
            earnedBadgeIds: currentlyEarned
              ? s.earnedBadgeIds.filter((id) => id !== badgeId)
              : [...s.earnedBadgeIds, badgeId],
          };
        })
      );
    }
  }

  async function searchTeachers() {
    setSearchingTeacher(true);
    setTeacherError("");
    const res = await fetch(`/api/users?role=TEACHER&email=${encodeURIComponent(teacherEmail)}`);
    if (res.ok) {
      const all: Teacher[] = await res.json();
      const currentIds = new Set(localTeachers.map((t) => t.id));
      setTeacherResults(all.filter((u) => !currentIds.has(u.id)));
    }
    setSearchingTeacher(false);
  }

  async function addTeacher(teacherId: string) {
    setTeacherError("");
    const res = await fetch(`/api/courses/${courseId}/teachers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teacherId }),
    });
    if (res.ok) {
      const added = teacherResults.find((t) => t.id === teacherId);
      if (added) {
        setLocalTeachers((prev) => [...prev, added]);
        setTeacherResults((prev) => prev.filter((t) => t.id !== teacherId));
      }
    } else {
      const data = await res.json();
      setTeacherError(data.error ?? "Failed to add teacher");
    }
  }

  async function removeTeacher(teacherId: string) {
    if (!confirm("Remove this teacher from the course?")) return;
    setTeacherError("");
    const res = await fetch(`/api/courses/${courseId}/teachers`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teacherId }),
    });
    if (res.ok) {
      setLocalTeachers((prev) => prev.filter((t) => t.id !== teacherId));
    } else {
      const data = await res.json();
      setTeacherError(data.error ?? "Failed to remove teacher");
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white px-4">
        <button
          onClick={() => setTab("badges")}
          className={cn(
            "flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors",
            tab === "badges"
              ? "border-primary text-primary"
              : "border-transparent text-gray-500 hover:text-gray-700"
          )}
        >
          <Award size={16} />
          Badges ({localBadges.length})
        </button>
        <button
          onClick={() => setTab("students")}
          className={cn(
            "flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors",
            tab === "students"
              ? "border-primary text-primary"
              : "border-transparent text-gray-500 hover:text-gray-700"
          )}
        >
          <Users size={16} />
          Students ({localStudents.length})
        </button>
        <button
          onClick={() => setTab("teachers")}
          className={cn(
            "flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors",
            tab === "teachers"
              ? "border-primary text-primary"
              : "border-transparent text-gray-500 hover:text-gray-700"
          )}
        >
          <GraduationCap size={16} />
          Teachers ({localTeachers.length})
        </button>
      </div>

      {/* Badges tab */}
      {tab === "badges" && (
        <div className="px-4 py-4 space-y-3">
          {localBadges.length === 0 ? (
            <p className="text-center text-gray-400 py-12">No badges yet. Add your first badge.</p>
          ) : (
            localBadges.map((badge) => (
              <div
                key={badge.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4"
              >
                <div className="relative w-14 h-14 shrink-0">
                  <Image
                    src={badge.imageUrl}
                    alt={badge.name}
                    fill
                    className="object-contain"
                    sizes="56px"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{badge.name}</p>
                  <p className="text-sm text-gray-500">{badge.awardedCount} awarded</p>
                </div>
                <button
                  onClick={() => setSelectedBadge(badge)}
                  className="text-xs text-primary font-semibold hover:underline"
                >
                  View
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Students tab */}
      {tab === "students" && (
        <div className="px-4 py-4 space-y-3">
          {isOwner && (
            <div className="mb-4">
              <button
                onClick={() => setShowAddStudent(!showAddStudent)}
                className="flex items-center gap-2 text-primary font-semibold text-sm"
              >
                <UserPlus size={16} />
                Add Student
              </button>

              {showAddStudent && (
                <div className="mt-3 bg-white rounded-2xl border border-gray-200 p-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={searchEmail}
                      onChange={(e) => setSearchEmail(e.target.value)}
                      placeholder="Search by email..."
                      className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button
                      onClick={searchStudents}
                      disabled={searching}
                      className="bg-primary text-white px-3 py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
                    >
                      {searching ? "..." : "Search"}
                    </button>
                  </div>
                  {searchResults.length > 0 && (
                    <ul className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                      {searchResults.map((s) => (
                        <li
                          key={s.id}
                          className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-gray-50"
                        >
                          <span className="text-gray-700">{s.name ?? s.email}</span>
                          <button
                            onClick={() => enrollStudent(s.id)}
                            className="text-primary font-semibold hover:underline"
                          >
                            Enroll
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {searchResults.length === 0 && searchEmail && !searching && (
                    <p className="mt-2 text-sm text-gray-400">No students found.</p>
                  )}
                </div>
              )}
            </div>
          )}

          {localStudents.length === 0 ? (
            <p className="text-center text-gray-400 py-8">No students enrolled yet.</p>
          ) : (
            localStudents.map((student) => {
              const isExpanded = expandedStudent === student.id;
              return (
                <div key={student.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <button
                    className="w-full flex items-center gap-3 p-4 text-left"
                    onClick={() => setExpandedStudent(isExpanded ? null : student.id)}
                  >
                    {student.image ? (
                      <Image
                        src={student.image}
                        alt={student.name ?? "Student"}
                        width={36}
                        height={36}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                        {student.name?.[0] ?? "?"}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">{student.name}</p>
                      <p className="text-xs text-gray-400 truncate">{student.email}</p>
                    </div>
                    <span className="text-xs text-gray-500 mr-2">
                      {student.earnedBadgeIds.length}/{localBadges.length}
                    </span>
                    {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                  </button>

                  {isExpanded && (
                    <div className="border-t border-gray-100 px-4 py-3">
                      <p className="text-xs font-semibold text-gray-500 mb-2">Award Badges</p>
                      <div className="space-y-2">
                        {localBadges.map((badge) => {
                          const earned = student.earnedBadgeIds.includes(badge.id);
                          return (
                            <div key={badge.id} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="relative w-8 h-8">
                                  <Image src={badge.imageUrl} alt={badge.name} fill className={cn("object-contain", !earned && "grayscale opacity-40")} sizes="32px" />
                                </div>
                                <span className="text-sm text-gray-700">{badge.name}</span>
                              </div>
                              {isOwner && (
                                <button
                                  onClick={() => toggleAward(student.id, badge.id, earned)}
                                  className={cn(
                                    "flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors",
                                    earned
                                      ? "bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-600"
                                      : "bg-gray-100 text-gray-600 hover:bg-primary hover:text-white"
                                  )}
                                >
                                  {earned ? <><Check size={12} /> Earned</> : "Award"}
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      {isOwner && (
                        <button
                          onClick={() => removeStudent(student.id)}
                          className="mt-3 flex items-center gap-1 text-xs text-red-400 hover:text-red-600"
                        >
                          <Trash2 size={12} /> Remove from course
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Teachers tab */}
      {tab === "teachers" && (
        <div className="px-4 py-4 space-y-3">
          {isOwner && (
            <div className="mb-4">
              <button
                onClick={() => setShowAddTeacher(!showAddTeacher)}
                className="flex items-center gap-2 text-primary font-semibold text-sm"
              >
                <UserPlus size={16} />
                Add Teacher
              </button>

              {showAddTeacher && (
                <div className="mt-3 bg-white rounded-2xl border border-gray-200 p-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={teacherEmail}
                      onChange={(e) => setTeacherEmail(e.target.value)}
                      placeholder="Search by email..."
                      className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button
                      onClick={searchTeachers}
                      disabled={searchingTeacher}
                      className="bg-primary text-white px-3 py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
                    >
                      {searchingTeacher ? "..." : "Search"}
                    </button>
                  </div>
                  {teacherResults.length > 0 && (
                    <ul className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                      {teacherResults.map((t) => (
                        <li
                          key={t.id}
                          className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-gray-50"
                        >
                          <div>
                            <p className="text-gray-700 font-medium">{t.name ?? t.email}</p>
                            {t.name && <p className="text-xs text-gray-400">{t.email}</p>}
                          </div>
                          <button
                            onClick={() => addTeacher(t.id)}
                            className="text-primary font-semibold hover:underline"
                          >
                            Add
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {teacherResults.length === 0 && teacherEmail && !searchingTeacher && (
                    <p className="mt-2 text-sm text-gray-400">No teachers found.</p>
                  )}
                  {teacherError && <p className="mt-2 text-sm text-red-500">{teacherError}</p>}
                </div>
              )}
            </div>
          )}

          {localTeachers.length === 0 ? (
            <p className="text-center text-gray-400 py-8">No teachers assigned.</p>
          ) : (
            localTeachers.map((teacher) => (
              <div key={teacher.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                  {teacher.name?.[0] ?? "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{teacher.name}</p>
                  <p className="text-xs text-gray-400 truncate">{teacher.email}</p>
                </div>
                {isOwner && localTeachers.length > 1 && (
                  <button
                    onClick={() => removeTeacher(teacher.id)}
                    className="text-red-400 hover:text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {selectedBadge && (
        <BadgeModal
          badge={selectedBadge}
          earned={false}
          onClose={() => setSelectedBadge(null)}
        />
      )}
    </div>
  );
}
