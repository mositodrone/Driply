import type { DriplyEl, View } from './canvas-element'

/**
 * Persisted shape of a design draft — what gets written to
 * localStorage on autosave and read back on restore.
 *
 * Note: garment selection is NOT part of this yet. The original
 * dashboard only ever persisted `elements` + `view`, so a page
 * reload restores the artwork but not the chosen garment/size/color.
 * If that should survive a reload too, add a field here once
 * GarmentSelection's shape is available in this layer (it currently
 * lives in the pre-existing GarmentSelector component).
 */
export interface DesignDraft {
  elements: DriplyEl[]
  view: View
  savedAt: string // ISO timestamp
}
