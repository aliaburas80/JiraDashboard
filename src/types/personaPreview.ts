// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Soft-launch feature: lets any signed-in user preview which dashboard pages
// are most relevant to a given professional persona. Purely presentational —
// selecting a persona never changes actual data access or authorization.

export interface PersonaPreviewSettings {
  enabled:   boolean;
  updatedAt: string;
  updatedBy: string;
}

export const DEFAULT_PERSONA_PREVIEW_SETTINGS: PersonaPreviewSettings = {
  enabled:   false,
  updatedAt: '',
  updatedBy: '',
};
