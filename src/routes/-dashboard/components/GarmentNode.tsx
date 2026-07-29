import { Image as KonvaImage } from 'react-konva'
import useImage from 'use-image'
import { G } from '../constants/canvas'
import type { View } from '../models/canvas-element'
import type { Garment } from '../../data/garments'

interface GarmentNodeProps {
  garment: Garment | null
  view:    View
  // Optional CSS filter string from the selected GarmentColor —
  // applied via an offscreen canvas so Konva can render the tint.
  // Pass getColorFilter(activeColor) from dashboard.tsx.
  // If omitted, the garment renders untinted (white base).
  colorFilter?: string
}

export function GarmentNode({ garment, view, colorFilter }: GarmentNodeProps) {
  // Resolve the image path from garment.images — falls back to front
  // if the requested view doesn't have an image supplied.
  const src = garment
    ? (garment.images?.[view] ?? garment.images?.front ?? null)
    : null

  const [img, status] = useImage(src ?? '', 'anonymous')

  if (!src || status === 'loading' || !img) return null

  // If a color filter is provided, draw the image through an offscreen
  // canvas with the CSS filter applied, then use that as the Konva source.
  // This is the same filter string from GarmentColor.filter in garments.ts.
  if (colorFilter && colorFilter !== 'none') {
    const offscreen = document.createElement('canvas')
    offscreen.width  = img.width
    offscreen.height = img.height
    const ctx = offscreen.getContext('2d')
    if (ctx) {
      ctx.filter = colorFilter
      ctx.drawImage(img, 0, 0)
    }
    return (
      <KonvaImage
        image={offscreen}
        x={G.x} y={G.y}
        width={G.w} height={G.h}
        listening={false}
      />
    )
  }

  return (
    <KonvaImage
      image={img}
      x={G.x} y={G.y}
      width={G.w} height={G.h}
      listening={false}
    />
  )
}

