import type { Tool } from '../models/canvas-element'

export interface ToolDef {
  id:   Tool
  icon: string
  tip:  string
}

export const TOOL_DEFS: ToolDef[] = [
  { id: 'select', icon: '↖', tip: 'Select' },
  { id: 'text',   icon: '𝐓',  tip: 'Text'  },
  { id: 'image',  icon: '🖼', tip: 'Image' },
]
