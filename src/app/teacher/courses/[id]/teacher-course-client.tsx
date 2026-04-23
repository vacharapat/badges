"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Award, Users, ChevronDown, ChevronUp, Check, UserPlus, Trash2, GraduationCap, Pencil, Plus, Upload, X, ChevronLeft } from "lucide-react";
import { BadgeModal } from "@/components/BadgeModal";
import { cn } from "@/lib/utils";
import { parseMissions } from "@/lib/utils";

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
  courseName: string;
  courseDescription: string;
  badges: Badge[];
  students: Student[];
  pendingEmails: string[];
  teachers: Teacher[];
  isOwner: boolean;
}

export function TeacherCourseClient({ courseId, courseName, courseDescription, badges, students, pendingEmails, teachers, isOwner }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<"badges" | "students" | "teachers">("badges");
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
  const [localStudents, setLocalStudents] = useState(students);
  const [localPendingEmails, setLocalPendingEmails] = useState(pendingEmails);
  const [localBadges, setLocalBadges] = useState(badges);
  const [localTeachers, setLocalTeachers] = useState(teachers);

  // Edit course modal state
  const [showEditCourse, setShowEditCourse] = useState(false);
  const [localCourseName, setLocalCourseName] = useState(courseName);
  const [localCourseDescription, setLocalCourseDescription] = useState(courseDescription);
  const [editCourseName, setEditCourseName] = useState("");
  const [editCourseDescription, setEditCourseDescription] = useState("");
  const [savingCourse, setSavingCourse] = useState(false);
  const [deletingCourse, setDeletingCourse] = useState(false);
  const [courseError, setCourseError] = useState("");

  // Edit badge modal state
  const [editingBadge, setEditingBadge] = useState<Badge | null>(null);
  const [editName, setEditName] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editImagePreview, setEditImagePreview] = useState("");
  const [editMissions, setEditMissions] = useState<string[]>([]);
  const [editUploading, setEditUploading] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

  // For adding students
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [enrollEmail, setEnrollEmail] = useState("");
  const [enrolling, setEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState("");

  // For adding teachers
  const [showAddTeacher, setShowAddTeacher] = useState(false);
  const [teacherEmail, setTeacherEmail] = useState("");
  const [teacherResults, setTeacherResults] = useState<Teacher[]>([]);
  const [searchingTeacher, setSearchingTeacher] = useState(false);
  const [teacherError, setTeacherError] = useState("");

  function openEditCourse() {
    setEditCourseName(localCourseName);
    setEditCourseDescription(localCourseDescription);
    setCourseError("");
    setShowEditCourse(true);
  }

  async function saveEditCourse() {
    if (!editCourseName.trim()) return;
    setSavingCourse(true);
    setCourseError("");
    const res = await fetch(`/api/courses/${courseId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editCourseName, description: editCourseDescription }),
    });
    if (res.ok) {
      setLocalCourseName(editCourseName.trim());
      setLocalCourseDescription(editCourseDescription.trim());
      setShowEditCourse(false);
    } else {
      const data = await res.json();
      setCourseError(data.error ?? "Failed to save course");
    }
    setSavingCourse(false);
  }

  async function deleteCourse() {
    if (!confirm(`Delete "${localCourseName}"? This will permanently remove all badges and student progress for this course.`)) return;
    setDeletingCourse(true);
    const res = await fetch(`/api/courses/${courseId}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/teacher/courses");
    } else {
      const data = await res.json();
      setCourseError(data.error ?? "Failed to delete course");
      setDeletingCourse(false);
    }
  }

  function openEditBadge(badge: Badge) {
    setEditingBadge(badge);
    setEditName(badge.name);
    setEditImageUrl(badge.imageUrl);
    setEditImagePreview(badge.imageUrl);
    const parsed = parseMissions(badge.missions);
    setEditMissions(parsed.length > 0 ? parsed : [""]);
    setEditError("");
  }

  function closeEditBadge() {
    setEditingBadge(null);
  }

  async function handleEditImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setEditUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (res.ok) {
      const { url } = await res.json();
      setEditImageUrl(url);
      setEditImagePreview(url);
    } else {
      setEditError("Image upload failed");
    }
    setEditUploading(false);
  }

  async function saveEditBadge() {
    if (!editingBadge || !editName.trim()) return;
    setEditSaving(true);
    setEditError("");
    const res = await fetch(`/api/badges/${editingBadge.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editName,
        imageUrl: editImageUrl,
        missions: editMissions.filter((m) => m.trim()),
      }),
    });
    if (res.ok) {
      setLocalBadges((prev) =>
        prev.map((b) =>
          b.id === editingBadge.id
            ? { ...b, name: editName, imageUrl: editImageUrl, missions: JSON.stringify(editMissions.filter((m) => m.trim())) }
            : b
        )
      );
      closeEditBadge();
    } else {
      const data = await res.json();
      setEditError(data.error ?? "Failed to save badge");
    }
    setEditSaving(false);
  }

  async function deleteBadge(id: string) {
    if (!confirm("Delete this badge? This will also remove all awards for it.")) return;
    const res = await fetch(`/api/badges/${id}`, { method: "DELETE" });
    if (res.ok) {
      setLocalBadges((prev) => prev.filter((b) => b.id !== id));
      setLocalStudents((prev) =>
        prev.map((s) => ({ ...s, earnedBadgeIds: s.earnedBadgeIds.filter((bid) => bid !== id) }))
      );
    }
  }

  async function enrollByEmail() {
    const email = enrollEmail.trim().toLowerCase();
    if (!email) return;
    setEnrolling(true);
    setEnrollError("");
    const res = await fetch(`/api/courses/${courseId}/enrollments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (res.ok) {
      if (data.type === "enrolled") {
        setLocalStudents((prev) => [...prev, { ...data.student, earnedBadgeIds: [] }]);
      } else {
        setLocalPendingEmails((prev) => [...prev, data.email]);
      }
      setEnrollEmail("");
    } else {
      setEnrollError(data.error ?? "Failed to enroll");
    }
    setEnrolling(false);
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

  async function removePendingEmail(email: string) {
    if (!confirm(`Remove pending enrollment for ${email}?`)) return;
    const res = await fetch(`/api/courses/${courseId}/enrollments`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (res.ok) {
      setLocalPendingEmails((prev) => prev.filter((e) => e !== email));
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
    <div>
      {/* Header */}
      <header className="bg-primary text-white px-4 py-5">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Link href="/teacher/courses" className="text-blue-200 hover:text-white">
            <ChevronLeft size={24} />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold truncate">{localCourseName}</h1>
            {localCourseDescription && (
              <p className="text-blue-200 text-sm truncate">{localCourseDescription}</p>
            )}
          </div>
          {isOwner && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={openEditCourse}
                className="text-blue-200 hover:text-white transition-colors"
                title="Edit course"
              >
                <Pencil size={18} />
              </button>
              <Link
                href={`/teacher/courses/${courseId}/badges/new`}
                className="flex items-center gap-1.5 bg-white text-primary font-semibold text-sm px-3 py-2 rounded-xl hover:bg-blue-50 transition-colors"
              >
                <Plus size={16} />
                Badge
              </Link>
            </div>
          )}
        </div>
      </header>

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
          Students ({localStudents.length + localPendingEmails.length})
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
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedBadge(badge)}
                    className="text-xs text-primary font-semibold hover:underline"
                  >
                    View
                  </button>
                  {isOwner && (
                    <>
                      <button
                        onClick={() => openEditBadge(badge)}
                        className="text-gray-400 hover:text-primary transition-colors"
                        title="Edit badge"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => deleteBadge(badge.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        title="Delete badge"
                      >
                        <Trash2 size={15} />
                      </button>
                    </>
                  )}
                </div>
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
                onClick={() => { setShowAddStudent(!showAddStudent); setEnrollError(""); }}
                className="flex items-center gap-2 text-primary font-semibold text-sm"
              >
                <UserPlus size={16} />
                Add Student
              </button>

              {showAddStudent && (
                <div className="mt-3 bg-white rounded-2xl border border-gray-200 p-4">
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={enrollEmail}
                      onChange={(e) => { setEnrollEmail(e.target.value); setEnrollError(""); }}
                      onKeyDown={(e) => e.key === "Enter" && enrollByEmail()}
                      placeholder="student@ku.th"
                      className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button
                      onClick={enrollByEmail}
                      disabled={enrolling || !enrollEmail.trim()}
                      className="bg-primary text-white px-3 py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
                    >
                      {enrolling ? "..." : "Enroll"}
                    </button>
                  </div>
                  {enrollError && <p className="mt-2 text-sm text-red-500">{enrollError}</p>}
                  <p className="mt-2 text-xs text-gray-400">
                    If the student hasn&apos;t signed in yet, they&apos;ll be enrolled automatically on first login.
                  </p>
                </div>
              )}
            </div>
          )}

          {localStudents.length === 0 && localPendingEmails.length === 0 ? (
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

          {localPendingEmails.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
                Pending — will enroll on first sign-in
              </p>
              {localPendingEmails.map((email) => (
                <div
                  key={email}
                  className="bg-white rounded-2xl border border-dashed border-gray-200 p-4 flex items-center gap-3"
                >
                  <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                    <GraduationCap size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-500 truncate">{email}</p>
                    <p className="text-xs text-amber-500 font-medium">Pending</p>
                  </div>
                  {isOwner && (
                    <button
                      onClick={() => removePendingEmail(email)}
                      className="text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              ))}
            </div>
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

      {/* Badge view modal */}
      {selectedBadge && (
        <BadgeModal
          badge={selectedBadge}
          earned={false}
          onClose={() => setSelectedBadge(null)}
        />
      )}

      {/* Edit badge modal */}
      {editingBadge && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Edit Badge</h2>
              <button onClick={closeEditBadge} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            {/* Image */}
            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Badge Image</label>
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 shrink-0">
                  <Image src={editImagePreview} alt="Badge" fill className="object-contain p-1" sizes="80px" />
                </div>
                <label className="cursor-pointer bg-primary/10 text-primary font-semibold text-sm px-4 py-2 rounded-xl hover:bg-primary/20 transition-colors">
                  {editUploading ? "Uploading..." : <span className="flex items-center gap-1"><Upload size={14} /> Change Image</span>}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleEditImageUpload}
                    disabled={editUploading}
                  />
                </label>
              </div>
            </div>

            {/* Name */}
            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Badge Name *</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Missions */}
            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Missions</label>
              <div className="space-y-2">
                {editMissions.map((mission, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      type="text"
                      value={mission}
                      onChange={(e) => setEditMissions((prev) => prev.map((m, idx) => idx === i ? e.target.value : m))}
                      placeholder={`Mission ${i + 1}...`}
                      className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    {editMissions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setEditMissions((prev) => prev.filter((_, idx) => idx !== i))}
                        className="text-red-400 hover:text-red-600 px-2"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setEditMissions((prev) => [...prev, ""])}
                className="mt-2 flex items-center gap-1 text-sm text-primary font-semibold hover:underline"
              >
                <Plus size={14} /> Add mission
              </button>
            </div>

            {editError && <p className="text-red-500 text-sm mb-4">{editError}</p>}

            <div className="flex gap-3">
              <button
                onClick={closeEditBadge}
                className="flex-1 border border-gray-300 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveEditBadge}
                disabled={editSaving || editUploading || !editName.trim()}
                className="flex-1 bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                {editSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

      {/* Edit course modal */}
      {showEditCourse && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Edit Course</h2>
              <button onClick={() => setShowEditCourse(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Course Name *</label>
              <input
                type="text"
                value={editCourseName}
                onChange={(e) => setEditCourseName(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
              <textarea
                value={editCourseDescription}
                onChange={(e) => setEditCourseDescription(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>

            {courseError && <p className="text-red-500 text-sm mb-4">{courseError}</p>}

            <div className="flex gap-3 mb-4">
              <button
                onClick={() => setShowEditCourse(false)}
                className="flex-1 border border-gray-300 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveEditCourse}
                disabled={savingCourse || !editCourseName.trim()}
                className="flex-1 bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                {savingCourse ? "Saving..." : "Save Changes"}
              </button>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <button
                onClick={deleteCourse}
                disabled={deletingCourse}
                className="flex items-center gap-2 text-red-500 hover:text-red-700 text-sm font-semibold disabled:opacity-50"
              >
                <Trash2 size={15} />
                {deletingCourse ? "Deleting..." : "Delete this course"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
