export const FONTS = ['Syne', 'DM Sans', 'serif', 'monospace', 'cursive'] as const

export type FontValue = (typeof FONTS)[number]

export const FONT_LABELS: Record<FontValue, string> = {
  'Syne':      'Syne',
  'DM Sans':   'DM Sans',
  'serif':     'Playfair',
  'monospace': 'Mono',
  'cursive':   'Script',
}
