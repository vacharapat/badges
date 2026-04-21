"use client";

import Image from "next/image";
import { X, Circle } from "lucide-react";
import { parseMissions } from "@/lib/utils";

interface BadgeModalProps {
  badge: {
    name: string;
    imageUrl: string;
    missions: string;
  };
  earned: boolean;
  onClose: () => void;
}

export function BadgeModal({ badge, earned, onClose }: BadgeModalProps) {
  const missions = parseMissions(badge.missions);

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center mb-6">
          <div className={`relative w-28 h-28 mb-3 ${!earned ? "opacity-30 grayscale" : ""}`}>
            <Image
              src={badge.imageUrl}
              alt={badge.name}
              fill
              className="object-contain drop-shadow-lg"
              sizes="112px"
            />
          </div>
          <h2 className="text-lg font-bold text-primary">{badge.name}</h2>
          {earned && (
            <span className="mt-1 text-xs font-semibold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
              Earned
            </span>
          )}
        </div>

        {missions.length > 0 && (
          <div>
            <p className="font-semibold text-gray-700 mb-3">Missions:</p>
            <ul className="space-y-2">
              {missions.map((m, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <Circle size={8} className="mt-1.5 shrink-0 fill-gray-400 text-gray-400" />
                  <span>{m}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
