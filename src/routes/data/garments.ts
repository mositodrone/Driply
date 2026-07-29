// ============================================================
//  app/data/garments.ts
//
//  Color strategy: CSS filter tinting on a single white/light
//  base PNG per view. No per-color image assets needed.
//
//  Each GarmentColor now carries a `filter` string — the CSS
//  filter value applied to the base image to produce that color.
//  White / Cream / Natural have no filter (they ARE the base).
//
//  View images: front is always present. back / leftArm /
//  rightArm are optional — the selector hides tabs for views
//  that aren't supplied, and the canvas falls back to front.
//
//  When you source real PNGs from Vecteezy / Placeit:
//    1. Place them in /public/garments/<id>/
//    2. Replace the placeholder IMG paths below
//    3. The filter system works immediately — no other changes
//
//  DZ coords are relative to STAGE_W 540 × STAGE_H 460.
// ============================================================

export interface GarmentColor {
  label:  string
  hex:    string
  // CSS filter string applied to the white base image.
  // undefined = no filter (white / natural base shown as-is).
  filter?: string
}

export interface GarmentImages {
  front:     string
  back?:     string
  leftArm?:  string
  rightArm?: string
}

export interface GarmentAttribute {
  key:     string
  label:   string
  options: string[]
}

export interface DesignZone {
  id:     string
  label:  string
  x:      number
  y:      number
  width:  number
  height: number
}

export interface Garment {
  id:          string
  name:        string
  category:    string
  emoji:       string
  images:      GarmentImages
  colors:      GarmentColor[]
  sizes:       string[]
  attributes:  GarmentAttribute[]
  designZones: DesignZone[]
  defaultZone: string
}

// ─── CSS filter recipes ───────────────────────────────────────────────────────
//
//  How these work:
//    sepia()      — shifts all pixels toward a warm brown midpoint, giving
//                   hue-rotate something to work with (pure white has no hue)
//    hue-rotate() — spins the hue wheel (0–360deg)
//    saturate()   — boosts color intensity
//    brightness() — compensates for sepia darkening the base
//
//  To tune a color: open DevTools, paste the filter onto your white image,
//  and adjust until it matches your physical swatch. Small brightness tweaks
//  make the biggest difference for light vs dark tones.
//
const F = {
  // Neutrals — no tint needed
  white:    undefined,
  cream:    'brightness(0.97) sepia(0.08)',
  natural:  'brightness(0.95) sepia(0.18)',

  // Blues
  skyBlue:  'sepia(1) hue-rotate(165deg) saturate(3) brightness(1.05)',
  navy:     'sepia(1) hue-rotate(190deg) saturate(4) brightness(0.45)',

  // Warm
  coral:    'sepia(1) hue-rotate(310deg) saturate(3.5) brightness(1.0)',
  amber:    'sepia(1) hue-rotate(5deg)   saturate(4)   brightness(1.05)',
  orange:   'sepia(1) hue-rotate(330deg) saturate(4)   brightness(1.0)',

  // Greens
  lime:     'sepia(1) hue-rotate(55deg)  saturate(4)   brightness(1.1)',
  olive:    'sepia(1) hue-rotate(60deg)  saturate(2.5) brightness(0.75)',

  // Purples / pinks
  violet:   'sepia(1) hue-rotate(230deg) saturate(3.5) brightness(0.85)',
  pink:     'sepia(1) hue-rotate(280deg) saturate(2.5) brightness(1.1)',

  // Darks
  black:    'brightness(0) saturate(0)',
  charcoal: 'brightness(0.18) saturate(0)',
  grey:     'brightness(0.55) saturate(0)',
  beige:    'sepia(1) hue-rotate(10deg)  saturate(1.2) brightness(1.05)',
} as const

// ─── Shared palettes ──────────────────────────────────────────────────────────
const COMMON_COLORS: GarmentColor[] = [
  { label: 'White',    hex: '#FFFFFF',  filter: F.white   },
  { label: 'Black',    hex: '#0E0E0E',  filter: F.black   },
  { label: 'Sky Blue', hex: '#2ECEFF',  filter: F.skyBlue },
  { label: 'Coral',    hex: '#FF5B3A',  filter: F.coral   },
  { label: 'Lime',     hex: '#C8F135',  filter: F.lime    },
  { label: 'Cream',    hex: '#F0EDE8',  filter: F.cream   },
  { label: 'Violet',   hex: '#7B5BFF',  filter: F.violet  },
  { label: 'Grey',     hex: '#8E9196',  filter: F.grey    },
  { label: 'Navy',     hex: '#1B2A4A',  filter: F.navy    },
  { label: 'Amber',    hex: '#FFD60A',  filter: F.amber   },
]

const CAP_COLORS: GarmentColor[] = [
  { label: 'White',    hex: '#FFFFFF',  filter: F.white   },
  { label: 'Black',    hex: '#0E0E0E',  filter: F.black   },
  { label: 'Sky Blue', hex: '#2ECEFF',  filter: F.skyBlue },
  { label: 'Coral',    hex: '#FF5B3A',  filter: F.coral   },
  { label: 'Navy',     hex: '#1B2A4A',  filter: F.navy    },
  { label: 'Beige',    hex: '#D4C5A9',  filter: F.beige   },
  { label: 'Grey',     hex: '#8E9196',  filter: F.grey    },
]

const TOTE_COLORS: GarmentColor[] = [
  { label: 'Natural',  hex: '#F5EED9',  filter: F.natural },
  { label: 'White',    hex: '#FFFFFF',  filter: F.white   },
  { label: 'Black',    hex: '#0E0E0E',  filter: F.black   },
  { label: 'Sky Blue', hex: '#2ECEFF',  filter: F.skyBlue },
  { label: 'Olive',    hex: '#6B6E3A',  filter: F.olive   },
  { label: 'Pink',     hex: '#F4A7C3',  filter: F.pink    },
]

// ─── Image placeholders ───────────────────────────────────────────────────────
//
//  All files live in /public/assets/ and are served at /assets/<filename>.
//  When you rename or replace images, update the paths in IMG below.
//  All images should be:
//    - White / very light base (so CSS filters work correctly)
//    - Transparent background (PNG)
//    - Ghost mannequin or flat lay style
//    - Consistent dimensions per garment where possible
//
const IMG = {
  tshirt: {
    front:   '/assets/tshirt_front-removebg-preview.png',
    back:    '/assets/tshirt_back-removebg-preview.png',
  },
  cap: {
    front:   '/assets/cap_front-removebg-preview.png',
    back:    '/assets/cap_back-removebg-preview.png',
  },
  shorts: {
    front:   '/assets/shorts_front-removebg-preview.png',
    back:    '/assets/shorts_back-removebg-preview.png',
  },
  hoodie: {
    front:   '/assets/hoodie_front-removebg-preview.png',
    back:    '/assets/hoodie_back-removebg-preview.png',
  },
  polo: {
    front:   '/assets/polo_front-removebg-preview.png',
    back:    '/assets/polo_back-removebg-preview.png',
  },
  tote: {
    front:   '/assets/Totebag-front.png',
    back:    '/assets/Totebag-back.png',
  },
}

// ─── Garment catalog ─────────────────────────────────────────────────────────
export const GARMENTS: Garment[] = [

  // 1. T-SHIRT
  {
    id:       'tshirt',
    name:     'T-Shirt',
    category: 'Tops',
    emoji:    '👕',
    images:   IMG.tshirt,
    colors:   COMMON_COLORS,
    sizes:    ['XS','S','M','L','XL','XXL'],
    attributes: [
      { key: 'fit',    label: 'Fit',    options: ['Oversized','Regular','Slim'] },
      { key: 'collar', label: 'Collar', options: ['Crew neck','V-neck','Polo'] },
    ],
    designZones: [
      { id: 'front-chest', label: 'Front (Chest)',  x: 185, y: 95,  width: 170, height: 120 },
      { id: 'front-full',  label: 'Front (Full)',   x: 160, y: 80,  width: 220, height: 200 },
      { id: 'back-center', label: 'Back (Center)',  x: 170, y: 90,  width: 200, height: 160 },
      { id: 'left-sleeve', label: 'Left Sleeve',    x: 80,  y: 110, width: 70,  height: 60  },
    ],
    defaultZone: 'front-chest',
  },

  // 2. FACE CAP
  {
    id:       'cap',
    name:     'Face Cap',
    category: 'Headwear',
    emoji:    '👒',
    images:   IMG.cap,
    colors:   CAP_COLORS,
    sizes:    ['One Size','S/M','L/XL'],
    attributes: [
      { key: 'style',   label: 'Style',   options: ['6-Panel','5-Panel','Trucker'] },
      { key: 'closure', label: 'Closure', options: ['Snapback','Strapback','Fitted'] },
      { key: 'profile', label: 'Profile', options: ['Structured','Unstructured'] },
    ],
    designZones: [
      { id: 'front-panel', label: 'Front Panel', x: 185, y: 120, width: 170, height: 100 },
      { id: 'side-panel',  label: 'Side Panel',  x: 130, y: 130, width: 80,  height: 80  },
      { id: 'back-strap',  label: 'Back Strap',  x: 210, y: 180, width: 120, height: 50  },
    ],
    defaultZone: 'front-panel',
  },

  // 3. SHORTS
  {
    id:       'shorts',
    name:     'Shorts',
    category: 'Bottoms',
    emoji:    '🩳',
    images:   IMG.shorts,
    colors:   COMMON_COLORS,
    sizes:    ['XS','S','M','L','XL','XXL'],
    attributes: [
      { key: 'length', label: 'Length',  options: ['Short (5")','Mid (7")','Long (9")'] },
      { key: 'style',  label: 'Style',   options: ['Athletic','Casual','Board'] },
      { key: 'pocket', label: 'Pockets', options: ['Side only','Side + Back','None'] },
    ],
    designZones: [
      { id: 'left-leg',    label: 'Left Leg',    x: 155, y: 160, width: 100, height: 120 },
      { id: 'right-leg',   label: 'Right Leg',   x: 285, y: 160, width: 100, height: 120 },
      { id: 'waistband',   label: 'Waistband',   x: 160, y: 90,  width: 220, height: 40  },
      { id: 'back-pocket', label: 'Back Pocket', x: 200, y: 160, width: 80,  height: 70  },
    ],
    defaultZone: 'left-leg',
  },

  // 4. HOODIE
  {
    id:       'hoodie',
    name:     'Hoodie',
    category: 'Tops',
    emoji:    '🧥',
    images:   IMG.hoodie,
    colors:   COMMON_COLORS,
    sizes:    ['XS','S','M','L','XL','XXL'],
    attributes: [
      { key: 'style',  label: 'Style',  options: ['Pullover','Zip-up','Coach jacket'] },
      { key: 'fit',    label: 'Fit',    options: ['Oversized','Regular'] },
      { key: 'pocket', label: 'Pocket', options: ['Kangaroo','No pocket','Side pockets'] },
    ],
    designZones: [
      { id: 'front-chest', label: 'Front (Chest)', x: 185, y: 110, width: 170, height: 120 },
      { id: 'front-full',  label: 'Front (Full)',  x: 160, y: 90,  width: 220, height: 200 },
      { id: 'back-center', label: 'Back (Center)', x: 170, y: 95,  width: 200, height: 180 },
      { id: 'left-sleeve', label: 'Left Sleeve',   x: 75,  y: 120, width: 75,  height: 70  },
      { id: 'hood',        label: 'Hood',          x: 185, y: 40,  width: 170, height: 60  },
    ],
    defaultZone: 'front-chest',
  },

  // 5. POLO SHIRT
  {
    id:       'polo',
    name:     'Polo Shirt',
    category: 'Tops',
    emoji:    '👔',
    images:   IMG.polo,
    colors:   COMMON_COLORS.filter(c => c.label !== 'Lime'),
    sizes:    ['XS','S','M','L','XL','XXL'],
    attributes: [
      { key: 'fit',    label: 'Fit',    options: ['Classic','Slim','Athletic'] },
      { key: 'sleeve', label: 'Sleeve', options: ['Short','Long'] },
      { key: 'collar', label: 'Collar', options: ['Standard','Button-down'] },
    ],
    designZones: [
      { id: 'left-chest',  label: 'Left Chest',   x: 195, y: 120, width: 80,  height: 70  },
      { id: 'right-chest', label: 'Right Chest',  x: 265, y: 120, width: 80,  height: 70  },
      { id: 'back-center', label: 'Back (Center)',x: 170, y: 110, width: 200, height: 140 },
      { id: 'left-sleeve', label: 'Left Sleeve',  x: 80,  y: 130, width: 70,  height: 55  },
    ],
    defaultZone: 'left-chest',
  },

  // 6. TOTE BAG
  {
    id:       'tote',
    name:     'Tote Bag',
    category: 'Accessories',
    emoji:    '👜',
    images:   IMG.tote,
    colors:   TOTE_COLORS,
    sizes:    ['Standard (38×42cm)','Large (42×48cm)'],
    attributes: [
      { key: 'material', label: 'Material', options: ['Cotton','Canvas','Jute'] },
      { key: 'handle',   label: 'Handle',   options: ['Short','Long','Both'] },
      { key: 'gusset',   label: 'Gusset',   options: ['Flat','Boxed bottom'] },
    ],
    designZones: [
      { id: 'front-center', label: 'Front (Center)', x: 175, y: 100, width: 190, height: 200 },
      { id: 'front-top',    label: 'Front (Top)',    x: 195, y: 90,  width: 150, height: 80  },
      { id: 'back-center',  label: 'Back (Center)',  x: 175, y: 100, width: 190, height: 200 },
    ],
    defaultZone: 'front-center',
  },
]

export const GARMENT_MAP = Object.fromEntries(GARMENTS.map(g => [g.id, g]))

export function getDefaultColor(garment: Garment): GarmentColor {
  return garment.colors[0]
}

export function getDefaultSize(garment: Garment): string {
  return garment.sizes.find(s => s === 'M' || s === 'One Size') ?? garment.sizes[0]
}

// ─── Helper used by GarmentSelector and GarmentNode ──────────────────────────
//
//  Returns the CSS filter string for a given color.
//  Pass this as the `style` on the <img> or Konva <Image> filter prop.
//
//  GarmentSelector usage (plain <img>):
//    <img src={src} style={{ filter: getColorFilter(color) }} />
//
//  GarmentNode usage (Konva — filters are applied differently):
//    Konva doesn't support CSS filters natively. Use a hidden <canvas>
//    with the filter applied via drawImage, then pass that canvas as the
//    Konva image source. See GarmentNode implementation notes.
//
export function getColorFilter(color: GarmentColor): string {
  return color.filter ?? 'none'
}
