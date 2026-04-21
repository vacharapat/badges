"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Plus, Trash2, Upload } from "lucide-react";

export function NewBadgeForm({ courseId }: { courseId: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [missions, setMissions] = useState<string[]>([""]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (res.ok) {
      const { url } = await res.json();
      setImageUrl(url);
      setImagePreview(url);
    } else {
      setError("Image upload failed");
    }
    setUploading(false);
  }

  function addMission() {
    setMissions((prev) => [...prev, ""]);
  }

  function updateMission(i: number, val: string) {
    setMissions((prev) => prev.map((m, idx) => (idx === i ? val : m)));
  }

  function removeMission(i: number) {
    setMissions((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !imageUrl) return;

    setLoading(true);
    setError("");

    const res = await fetch(`/api/courses/${courseId}/badges`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        imageUrl,
        missions: missions.filter((m) => m.trim()),
      }),
    });

    if (res.ok) {
      router.push(`/teacher/courses/${courseId}`);
    } else {
      const data = await res.json();
      setError(data.error ?? "Failed to create badge");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Badge Image */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Badge Image *</label>
        <div className="flex items-center gap-4">
          {imagePreview ? (
            <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200">
              <Image src={imagePreview} alt="Badge preview" fill className="object-contain p-1" sizes="80px" />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
              <Upload size={24} className="text-gray-400" />
            </div>
          )}
          <div>
            <label className="cursor-pointer bg-primary/10 text-primary font-semibold text-sm px-4 py-2 rounded-xl hover:bg-primary/20 transition-colors">
              {uploading ? "Uploading..." : "Choose Image"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
                disabled={uploading}
              />
            </label>
            <p className="text-xs text-gray-400 mt-1">JPG, PNG, GIF, WebP</p>
          </div>
        </div>
      </div>

      {/* Badge Name */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Badge Name *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Hello World!"
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          required
        />
      </div>

      {/* Missions */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Missions</label>
        <div className="space-y-2">
          {missions.map((mission, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="text"
                value={mission}
                onChange={(e) => updateMission(i, e.target.value)}
                placeholder={`Mission ${i + 1}...`}
                className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {missions.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeMission(i)}
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
          onClick={addMission}
          className="mt-2 flex items-center gap-1 text-sm text-primary font-semibold hover:underline"
        >
          <Plus size={14} /> Add mission
        </button>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading || uploading || !name.trim() || !imageUrl}
        className="w-full bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50"
      >
        {loading ? "Creating..." : "Create Badge"}
      </button>
    </form>
  );
}
