// src/routes/-dashboard/constants/canvas.ts

export const STAGE_W = 540
export const STAGE_H = 460

// Garment image bounds on canvas — the image fills most of the stage
export const G = {
  x: 70,
  y: 20,
  w: 400,
  h: 420,
}

// Design zone — centered within the garment's printable chest area
// These values position the zone in the center of the garment image
export const DZ = {
  x: G.x + G.w * 0.25,                    // 25% from garment left
  y: G.y + G.h * 0.2,                     // 20% from garment top
  w: G.w * 0.5,                           // 50% of garment width
  h: G.h * 0.45,                          // 45% of garment height
}