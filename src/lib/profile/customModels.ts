// Custom model storage. User-defined models persist locally per browser.
// Extracted from src/App.tsx as part of Phase 2 of the file split refactor.
// Behavior is byte-for-byte identical.
//
// TODO(backend): replace localStorage with a real per-workspace store and add
// secure secret storage for API keys (KMS / encrypted vault).

import type { CustomModelEntry } from '../types/appTypes';

export const CUSTOM_MODELS_STORAGE_KEY = 'colony.customModels.v1';

export function loadCustomModels(): CustomModelEntry[] {
  try {
    const raw = localStorage.getItem(CUSTOM_MODELS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as CustomModelEntry[];
    }
  } catch { /* ignore corrupt storage */ }
  return [];
}
