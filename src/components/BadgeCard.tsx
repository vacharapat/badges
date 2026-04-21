"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface BadgeCardProps {
  name: string;
  imageUrl: string;
  earned: boolean;
  onClick?: () => void;
}

export function BadgeCard({ name, imageUrl, earned, onClick }: BadgeCardProps) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 p-2 rounded-xl hover:bg-gray-50 transition-colors w-full cursor-pointer touch-manipulation"
    >
      <div className={cn("relative w-20 h-20", !earned && "opacity-30 grayscale")}>
        <Image
          src={imageUrl}
          alt={name}
          fill
          className="object-contain drop-shadow-md"
          sizes="80px"
        />
      </div>
      <span
        className={cn(
          "text-xs font-semibold text-center leading-tight max-w-[88px]",
          earned ? "text-gray-800" : "text-gray-400"
        )}
      >
        {name}
      </span>
    </button>
  );
}
