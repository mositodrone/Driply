// ── View union matches GarmentView in GarmentSelector ────────────────────────
export type View      = 'front' | 'back' | 'leftArm' | 'rightArm'
export type Tool      = 'select' | 'text' | 'image' | 'shape'
export type ELType    = 'text' | 'image' | 'shape'
export type ShapeType = 'rect' | 'circle' | 'triangle'

export interface DriplyEl {
  id:          string
  type:        ELType
  x:           number
  y:           number
  width?:      number
  height?:     number
  // ── Text ──────────────────────────────────────────────────────────────────
  text?:       string
  fontSize?:   number
  fontFamily?: string
  fill?:       string
  fontStyle?:  string
  letterSpacing?: number
  lineHeight?: number
  strokeColor?: string   // text outline colour
  strokeWidth?: number   // text outline width
  // ── Image ─────────────────────────────────────────────────────────────────
  src?:        string    // base64 data URL or path
  // ── Shape ─────────────────────────────────────────────────────────────────
  shapeType?:  ShapeType
  shapeFill?:  string    // fill colour
  shapeStroke?: string   // border colour
  shapeStrokeWidth?: number
  cornerRadius?: number  // rect only
  // ── Universal ─────────────────────────────────────────────────────────────
  opacity?:    number    // 0–1, defaults to 1
  locked?:     boolean   // when true, ignores drag/transform events
  rotation?:   number    // degrees
}

export const uid = () => Math.random().toString(36).slice(2, 8)
