// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
// Filter preset persistence — save/load/delete named filter combinations.

const STORAGE_KEY = 'dc_filter_presets';

export interface FilterState {
  keyFilter: string;
  summaryFilter: string;
  statusFilter: string;
  sprintFilter: string;
  assigneeFilter: string;
  healthFilter: string;
  typeFilter: string;
  leadMaxFilter: string;
  cycleMaxFilter: string;
  openAgeMaxFilter: string;
  reasonFilter: string;
  labelFilter: string;
  activeQuickFilter: string;
}

export interface FilterPreset {
  id: string;
  name: string;
  filters: FilterState;
  createdAt: string;
}

export function loadPresets(): FilterPreset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as FilterPreset[]) : [];
  } catch {
    return [];
  }
}

export function savePreset(name: string, filters: FilterState): FilterPreset {
  const preset: FilterPreset = {
    id: `preset-${Date.now()}`,
    name: name.trim(),
    filters,
    createdAt: new Date().toISOString(),
  };
  const existing = loadPresets().filter(p => p.name !== preset.name); // replace same name
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...existing, preset]));
  return preset;
}

export function deletePreset(id: string): void {
  const updated = loadPresets().filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export const EMPTY_FILTERS: FilterState = {
  keyFilter: '', summaryFilter: '', statusFilter: 'all',
  sprintFilter: 'all', assigneeFilter: 'all', healthFilter: 'all',
  typeFilter: 'all',
  leadMaxFilter: '', cycleMaxFilter: '', openAgeMaxFilter: '',
  reasonFilter: '', labelFilter: '', activeQuickFilter: 'all',
};
