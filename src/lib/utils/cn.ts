import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Safely merges Tailwind CSS class names with conditional class resolution.
 * Combines clsx expressions and resolves Tailwind precedence conflicts.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
