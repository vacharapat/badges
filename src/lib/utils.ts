import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseMissions(raw: string): string[] {
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}
