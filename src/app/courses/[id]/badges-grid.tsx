"use client";

import { useState } from "react";
import { BadgeCard } from "@/components/BadgeCard";
import { BadgeModal } from "@/components/BadgeModal";

interface Badge {
  id: string;
  name: string;
  imageUrl: string;
  missions: string;
  earned: boolean;
}

export function BadgesGrid({ badges }: { badges: Badge[] }) {
  const [selected, setSelected] = useState<Badge | null>(null);

  if (badges.length === 0) {
    return (
      <p className="text-center text-gray-400 py-12">No badges in this course yet.</p>
    );
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {badges.map((badge) => (
          <BadgeCard
            key={badge.id}
            name={badge.name}
            imageUrl={badge.imageUrl}
            earned={badge.earned}
            onClick={() => setSelected(badge)}
          />
        ))}
      </div>

      {selected && (
        <BadgeModal
          badge={selected}
          earned={selected.earned}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
