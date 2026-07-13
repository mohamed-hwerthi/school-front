import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const STORAGE_KEY = "selected_annee_label";

export function getSelectedAnneeScolaire(): string {
  return localStorage.getItem(STORAGE_KEY) ?? "";
}

export function getDefaultAnneeScolaire(): string {
  return localStorage.getItem(STORAGE_KEY) ?? "";
}
