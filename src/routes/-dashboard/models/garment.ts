export type GarmentCategory = 'shirt' | 'hoodie' | 'cap' | 'trouser' | 'tote'

export interface PrintArea {
  x:      number
  y:      number
  width:  number
  height: number
}

// ── Image map ─────────────────────────────────────────────────────────────────
//  Direct paths served from /public/assets/.
//  front is required; all other views are optional — the selector
//  hides tabs and GarmentNode falls back to front when absent.
export interface GarmentImages {
  front:     string
  back?:     string
  leftArm?:  string
  rightArm?: string
}

// ── Kept for reference — remove once Cloudinary is fully retired ──────────────
// export interface GarmentAssets {
//   front:        string
//   back:         string
//   leftSleeve?:  string
//   rightSleeve?: string
//   leftLeg?:     string
//   rightLeg?:    string
//   hood?:        string
//   collar?:      string
// }

export interface GarmentSupports {
  front:       boolean
  back:        boolean
  leftArm:     boolean
  rightArm:    boolean
}

export interface Garment {
  id:       string
  name:     string
  category: GarmentCategory
  style:    string
  emoji:    string

  sizes:           string[]
  availableColors: string[]

  // Direct asset paths — replaces the old Cloudinary `assets` map
  images:         GarmentImages
  printableAreas: Partial<Record<keyof GarmentImages, PrintArea>>
  supports:       GarmentSupports

  pricing: {
    basePrice:          number
    markupPercentage?:  number
    fixedMarkup?:       number
  }
}
