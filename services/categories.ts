import { Category } from '../types';

const STORAGE_KEY = (userId: string) => `pollen-custom-categories-${userId}`;

export const BUILT_IN_CATEGORIES = Object.values(Category);

export function getCustomCategories(userId: string): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getAllCategories(userId: string): string[] {
  return [...BUILT_IN_CATEGORIES, ...getCustomCategories(userId)];
}

export function addCustomCategory(userId: string, name: string): string[] {
  const trimmed = name.trim();
  const existing = getCustomCategories(userId);
  const all = getAllCategories(userId);
  if (!trimmed || all.map(c => c.toLowerCase()).includes(trimmed.toLowerCase())) {
    return existing;
  }
  const updated = [...existing, trimmed];
  localStorage.setItem(STORAGE_KEY(userId), JSON.stringify(updated));
  return updated;
}

export function removeCustomCategory(userId: string, name: string): string[] {
  const updated = getCustomCategories(userId).filter(c => c !== name);
  localStorage.setItem(STORAGE_KEY(userId), JSON.stringify(updated));
  return updated;
}
