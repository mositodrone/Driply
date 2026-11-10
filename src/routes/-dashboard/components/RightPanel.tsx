import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { FONTS, FONT_LABELS } from '../data/fonts'
import { COLOR_SWATCHES } from '../data/swatches'
import type { DriplyEl } from '../models/canvas-element'

interface RightPanelProps {
  selected:       DriplyEl | null
  onChange:       (attrs: Partial<DriplyEl>) => void
  onToggleLock?:  () => void
}

// ── Shared slider row ─────────────────────────────────────────────────────────
function SliderRow({
  label, value, min, max, step = 1, unit = '', onChange,
}: {
  label: string; value: number; min: number; max: number
  step?: number; unit?: string; onChange: (v: number) => void
}) {
  return (
    <div className="prop-group">
      <div className="flex justify-between items-center mb-2">
        <label className="dash-prop-label">{label}</label>
        <span className="text-[0.7rem] text-white/40">{Math.round(value * 100) / 100}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="dash-range" />
    </div>
  )
}

// ── Color swatch + hex input row ──────────────────────────────────────────────
function ColorPicker({
  label, value, onChange,
}: {
  label: string; value: string; onChange: (hex: string) => void
}) {
  return (
    <div className="prop-group">
      <label className="dash-prop-label">{label}</label>
      <div className="flex gap-2 flex-wrap mb-2">
        {COLOR_SWATCHES.map(c => (
          <button key={c} onClick={() => onChange(c)}
            className="w-7 h-7 rounded-full border-2 transition-all"
            style={{
              background:  c,
              borderColor: value === c ? 'white' : 'transparent',
              boxShadow:   value === c ? '0 0 0 2px #1E1E1E, 0 0 0 3.5px white' : 'none',
              transform:   value === c ? 'scale(1.2)' : 'scale(1)',
            }} />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg flex-shrink-0 border border-white/10"
          style={{ background: value }} />
        <input className="dash-prop-input flex-1"
          value={value} maxLength={20} placeholder="#FFFFFF"
          onChange={e => onChange(e.target.value)} />
      </div>
    </div>
  )
}

export function RightPanel({ selected, onChange, onToggleLock }: RightPanelProps) {
  const contentRef  = useRef<HTMLDivElement>(null)
  const prevTypeRef = useRef<string | null>(null)
  const currentType = selected?.type ?? null

  useEffect(() => {
    if (prevTypeRef.current === currentType) return
    prevTypeRef.current = currentType
    if (!contentRef.current) return
    gsap.fromTo(contentRef.current,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.28, ease: 'power2.out' }
    )
  }, [currentType, selected?.id])

  if (!selected) {
    return (
      <aside data-dash="right" className="dash-panel-right flex flex-col items-center justify-center gap-3 px-6">
        <div ref={contentRef}>
          <span className="text-4xl opacity-20 block text-center mb-2">↖</span>
          <p className="text-[0.78rem] text-white/25 text-center leading-relaxed">
            Select an element<br />to edit its properties
          </p>
        </div>
      </aside>
    )
  }

  const typeLabel = selected.type === 'text'
    ? '🔤 Text Layer'
    : selected.type === 'shape'
    ? `${selected.shapeType === 'circle' ? '○' : selected.shapeType === 'triangle' ? '△' : '▭'} Shape Layer`
    : '🖼 Image Layer'

  return (
    <aside data-dash="right" className="dash-panel-right overflow-y-auto">

      {/* Header */}
      <div className="p-4 border-b border-white/[0.06] flex-shrink-0 flex items-center justify-between">
        <div>
          <p className="dash-panel-label">Properties</p>
          <div className="text-[0.72rem] text-white/35 mt-0.5">{typeLabel}</div>
        </div>
        {/* Lock toggle */}
        {onToggleLock && (
          <button
            onClick={onToggleLock}
            title={selected.locked ? 'Unlock layer' : 'Lock layer'}
            className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all text-sm ${
              selected.locked
                ? 'bg-[#FF5B3A]/15 border-[#FF5B3A]/30 text-[#FF5B3A]'
                : 'bg-white/[0.06] border-white/[0.06] text-white/30 hover:border-white/20 hover:text-white/60'
            }`}
          >
            {selected.locked ? '🔒' : '🔓'}
          </button>
        )}
      </div>

      <div ref={contentRef} className="p-4 space-y-5">

        {/* ── TEXT properties ─────────────────────────────────────────────── */}
        {selected.type === 'text' && (
          <>
            <div className="prop-group">
              <label className="dash-prop-label">Text Content</label>
              <input className="dash-prop-input"
                value={selected.text ?? ''} placeholder="Your text…"
                onChange={e => onChange({ text: e.target.value })} />
            </div>

            <div className="prop-group">
              <label className="dash-prop-label">Font</label>
              <div className="flex gap-1.5 flex-wrap">
                {FONTS.map(f => (
                  <button key={f} onClick={() => onChange({ fontFamily: f })}
                    className={`text-[0.7rem] px-2.5 py-1.5 rounded-lg border transition-all ${
                      selected.fontFamily === f
                        ? 'bg-[#C8F135]/15 text-[#C8F135] border-[#C8F135]/30'
                        : 'bg-white/[0.06] text-white/50 border-white/[0.06] hover:border-white/20'
                    }`}>{FONT_LABELS[f]}</button>
                ))}
              </div>
            </div>

            <SliderRow label="Size"         value={selected.fontSize ?? 22}      min={10} max={120} onChange={v => onChange({ fontSize: v })} unit="px"/>
            <SliderRow label="Letter Spacing" value={selected.letterSpacing ?? 0}  min={-10} max={40} onChange={v => onChange({ letterSpacing: v })} unit="px"/>
            <SliderRow label="Line Height"  value={selected.lineHeight ?? 1.2}   min={0.8} max={3} step={0.05} onChange={v => onChange({ lineHeight: v })}/>

            <div className="prop-group">
              <label className="dash-prop-label">Style</label>
              <div className="flex gap-2">
                {[
                  { val: 'bold',        label: 'B'  },
                  { val: 'italic',      label: 'I'  },
                  { val: 'bold italic', label: 'BI' },
                  { val: 'normal',      label: '—'  },
                ].map(s => (
                  <button key={s.val} onClick={() => onChange({ fontStyle: s.val })}
                    className={`w-9 h-9 rounded-lg text-sm border transition-all ${
                      selected.fontStyle === s.val
                        ? 'bg-[#C8F135]/15 text-[#C8F135] border-[#C8F135]/30'
                        : 'bg-white/[0.06] text-white/50 border-white/[0.06] hover:border-white/20'
                    }`}>{s.label}</button>
                ))}
              </div>
            </div>

            <ColorPicker label="Fill Color" value={selected.fill ?? '#FFFFFF'} onChange={v => onChange({ fill: v })}/>

            {/* Text outline */}
            <div className="prop-group">
              <label className="dash-prop-label">Outline</label>
              <div className="flex gap-2 items-center mb-2">
                <div className="w-7 h-7 rounded-lg flex-shrink-0 border border-white/10"
                  style={{ background: selected.strokeColor ?? 'transparent' }} />
                <input className="dash-prop-input flex-1"
                  value={selected.strokeColor ?? ''} maxLength={7} placeholder="None"
                  onChange={e => onChange({ strokeColor: e.target.value })} />
              </div>
              <SliderRow label="Outline Width" value={selected.strokeWidth ?? 0} min={0} max={12} onChange={v => onChange({ strokeWidth: v })} unit="px"/>
            </div>
          </>
        )}

        {/* ── SHAPE properties ─────────────────────────────────────────────── */}
        {selected.type === 'shape' && (
          <>
            <ColorPicker
              label="Fill Color"
              value={selected.shapeFill ?? '#C8F135'}
              onChange={v => onChange({ shapeFill: v })}
            />

            <ColorPicker
              label="Border Color"
              value={selected.shapeStroke ?? 'transparent'}
              onChange={v => onChange({ shapeStroke: v })}
            />

            <SliderRow
              label="Border Width"
              value={selected.shapeStrokeWidth ?? 0}
              min={0} max={24}
              onChange={v => onChange({ shapeStrokeWidth: v })}
              unit="px"
            />

            {/* Corner radius — only meaningful for rect */}
            {selected.shapeType === 'rect' && (
              <SliderRow
                label="Corner Radius"
                value={selected.cornerRadius ?? 0}
                min={0} max={80}
                onChange={v => onChange({ cornerRadius: v })}
                unit="px"
              />
            )}

            <SliderRow label="Width"  value={selected.width  ?? 120} min={10} max={500} onChange={v => onChange({ width: v })}  unit="px"/>
            <SliderRow label="Height" value={selected.height ?? 120} min={10} max={500} onChange={v => onChange({ height: v })} unit="px"/>
          </>
        )}

        {/* ── IMAGE properties ─────────────────────────────────────────────── */}
        {selected.type === 'image' && (
          <>
            <SliderRow label="Width"  value={selected.width  ?? 120} min={30} max={500} onChange={v => onChange({ width: v })}  unit="px"/>
            <SliderRow label="Height" value={selected.height ?? 120} min={30} max={500} onChange={v => onChange({ height: v })} unit="px"/>
            <p className="text-[0.7rem] text-white/25 leading-relaxed">
              Drag corner handles to resize freely, or use sliders above.
            </p>
          </>
        )}

        {/* ── UNIVERSAL: opacity, rotation, position ────────────────────────── */}
        <div className="border-t border-white/[0.06] pt-4 space-y-5">

          <SliderRow
            label="Opacity"
            value={Math.round((selected.opacity ?? 1) * 100)}
            min={0} max={100}
            onChange={v => onChange({ opacity: v / 100 })}
            unit="%"
          />

          <SliderRow
            label="Rotation"
            value={selected.rotation ?? 0}
            min={-180} max={180}
            onChange={v => onChange({ rotation: v })}
            unit="°"
          />

          <div className="prop-group">
            <label className="dash-prop-label">Position</label>
            <div className="grid grid-cols-2 gap-2">
              {([['X', 'x'], ['Y', 'y']] as const).map(([lbl, key]) => (
                <div key={lbl} className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[0.62rem] text-white/30 font-bold">
                    {lbl}
                  </span>
                  <input className="dash-prop-input pl-6" type="number"
                    value={Math.round(selected[key])}
                    onChange={e => onChange({ [key]: Number(e.target.value) })} />
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </aside>
  )
}
