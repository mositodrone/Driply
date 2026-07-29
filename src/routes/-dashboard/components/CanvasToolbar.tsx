import gsap from 'gsap'
import { TOOL_DEFS } from '../data/toolbar'
import type { Tool } from '../models/canvas-element'

interface CanvasToolbarProps {
  tool: Tool
  setTool: (t: Tool) => void
  zoom: number
  setZoom: (z: number) => void
}

export function CanvasToolbar({ tool, setTool, zoom, setZoom }: CanvasToolbarProps) {
  function handleToolClick(e: React.MouseEvent<HTMLButtonElement>, id: Tool) {
    setTool(id)
    gsap.fromTo(e.currentTarget,
      { scale: 0.88 },
      { scale: 1, duration: 0.4, ease: 'elastic.out(1.4, 0.5)' }
    )
  }

  return (
    <div className="dash-canvas-toolbar">
      <div className="flex gap-1">
        {TOOL_DEFS.map(t => (
          <button
            key={t.id} title={t.tip}
            onClick={e => handleToolClick(e, t.id)}
            className={`dash-tool-btn ${tool === t.id ? 'dash-tool-active' : ''}`}
          >
            {t.icon}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <button className="dash-zoom-btn"
          onClick={() => setZoom(Math.max(0.5, parseFloat((zoom - 0.1).toFixed(1))))}>−</button>
        <span className="text-[0.72rem] text-white/40 w-10 text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button className="dash-zoom-btn"
          onClick={() => setZoom(Math.min(1.8, parseFloat((zoom + 0.1).toFixed(1))))}>+</button>
        <button
          className="text-[0.68rem] text-white/30 hover:text-white/60 transition-colors ml-1"
          onClick={() => setZoom(1)}
        >Reset</button>
      </div>
    </div>
  )
}
