import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import type { GarmentSelection } from '../../components/GarmentSelector'
import type { DriplyEl } from '../models/canvas-element'
import { STAGE_W, STAGE_H } from '../constants/canvas'

interface ExportPreviewModalProps {
  open:          boolean
  onClose:       () => void
  stageRef:      React.RefObject<any>   // Konva Stage ref
  activeGarment: GarmentSelection | null
  elements:      DriplyEl[]
  projectName:   string
}

type Format     = 'PNG' | 'JPG' | 'WebP'
type Resolution = '50%' | '100%' | '2x'

const FORMAT_META: Record<Format, string> = {
  PNG:  'Lossless, transparency',
  JPG:  'Best for photos',
  WebP: 'Smallest size',
}

const RES_META: Record<Resolution, string> = {
  '50%': `${Math.round(STAGE_W * 0.5)} × ${Math.round(STAGE_H * 0.5)} px`,
  '100%': `${STAGE_W} × ${STAGE_H} px`,
  '2x':  `${STAGE_W * 2} × ${STAGE_H * 2} px`,
}

const RES_SCALE: Record<Resolution, number> = {
  '50%': 0.5,
  '100%': 1,
  '2x': 2,
}

export function ExportPreviewModal({
  open, onClose, stageRef, activeGarment, elements, projectName,
}: ExportPreviewModalProps) {
  const overlayRef  = useRef<HTMLDivElement>(null)
  const dialogRef   = useRef<HTMLDivElement>(null)

  const [format,     setFormat]     = useState<Format>('PNG')
  const [quality,    setQuality]    = useState(92)           // 0–100, JPG/WebP only
  const [resolution, setResolution] = useState<Resolution>('100%')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [fileSize,   setFileSize]   = useState<string>('')
  const [exporting,  setExporting]  = useState(false)

  // ── Snapshot the Konva stage into a preview thumbnail ──────────────────────
  useEffect(() => {
    if (!open || !stageRef.current) return

    // Short rAF so the modal has painted before we read the stage
    const id = requestAnimationFrame(() => {
      try {
        const dataUrl = stageRef.current.toDataURL({
          mimeType:  'image/png',
          pixelRatio: 1,
        })
        setPreviewUrl(dataUrl)
      } catch { /* cross-origin image in stage — skip preview */ }
    })
    return () => cancelAnimationFrame(id)
  }, [open, stageRef])

  // ── Recompute estimated file size when options change ──────────────────────
  useEffect(() => {
    if (!previewUrl) return
    // Rough heuristic: base64 length → bytes → scale by quality factor
    const base64Len  = previewUrl.length - (previewUrl.indexOf(',') + 1)
    const bytes      = Math.round(base64Len * 0.75)
    const scale      = RES_SCALE[resolution]
    const qualFactor = format === 'PNG' ? 1 : quality / 100
    const estimated  = bytes * scale * scale * qualFactor
    setFileSize(estimated < 1_000_000
      ? `~${Math.round(estimated / 1024)} KB`
      : `~${(estimated / 1_048_576).toFixed(1)} MB`)
  }, [previewUrl, format, quality, resolution])

  // ── Animate in/out ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!overlayRef.current || !dialogRef.current) return
    if (open) {
      overlayRef.current.style.display = 'flex'
      // small tick so display:flex has applied before we animate
      requestAnimationFrame(() => {
        if (!overlayRef.current || !dialogRef.current) return
        overlayRef.current.animate(
          [{ opacity: 0 }, { opacity: 1 }],
          { duration: 180, fill: 'forwards', easing: 'ease-out' }
        )
        dialogRef.current.animate(
          [{ opacity: 0, transform: 'scale(0.94) translateY(8px)' },
           { opacity: 1, transform: 'scale(1)   translateY(0px)' }],
          { duration: 240, fill: 'forwards', easing: 'cubic-bezier(0.34,1.56,0.64,1)' }
        )
      })
    } else {
      const a = overlayRef.current.animate(
        [{ opacity: 1 }, { opacity: 0 }],
        { duration: 160, fill: 'forwards', easing: 'ease-in' }
      )
      a.onfinish = () => {
        if (overlayRef.current) overlayRef.current.style.display = 'none'
      }
    }
  }, [open])

  // ── Download ──────────────────────────────────────────────────────────────
  async function handleExport() {
    if (!stageRef.current) return
    setExporting(true)

    try {
      const mimeMap: Record<Format, string> = {
        PNG:  'image/png',
        JPG:  'image/jpeg',
        WebP: 'image/webp',
      }

      const dataUrl = stageRef.current.toDataURL({
        mimeType:   mimeMap[format],
        quality:    format === 'PNG' ? 1 : quality / 100,
        pixelRatio: RES_SCALE[resolution],
      })

      const ext      = format.toLowerCase()
      const slug     = projectName.trim().replace(/\s+/g, '-').toLowerCase() || 'design'
      const filename = `${slug}-export.${ext}`

      const a    = document.createElement('a')
      a.href     = dataUrl
      a.download = filename
      a.click()

      onClose()
    } finally {
      setExporting(false)
    }
  }

  const qualityApplies = format !== 'PNG'

  // Always rendered, visibility controlled by display + animation
  return (
    <div
      ref={overlayRef}
      onClick={e => { if (e.target === overlayRef.current) onClose() }}
      style={{
        display:         'none',   // JS flips this to flex
        position:        'fixed',
        inset:           0,
        zIndex:          60,
        alignItems:      'center',
        justifyContent:  'center',
        background:      'rgba(0,0,0,0.65)',
        backdropFilter:  'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
      }}
    >
      <div
        ref={dialogRef}
        style={{
          width:        '100%',
          maxWidth:     '480px',
          margin:       '0 1rem',
          background:   '#18181B',
          border:       '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px',
          overflow:     'hidden',
          boxShadow:    '0 32px 80px rgba(0,0,0,0.7)',
          color:        '#fff',
          fontFamily:   'inherit',
        }}
      >
        {/* ── Header ── */}
        <div style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          padding:        '18px 20px 16px',
          borderBottom:   '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Thumbnail */}
            <div style={{
              width: 44, height: 44, borderRadius: 10, overflow: 'hidden',
              background: '#27272A', flexShrink: 0,
              border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {previewUrl
                ? <img src={previewUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="preview" />
                : <span style={{ fontSize: '1.3rem' }}>{activeGarment?.garment.emoji ?? '👕'}</span>
              }
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', letterSpacing: '-0.01em' }}>
                Export design
              </div>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.38)', marginTop: 2 }}>
                {projectName} · {elements.length} element{elements.length !== 1 ? 's' : ''}
                {fileSize ? ` · ${fileSize}` : ''}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 30, height: 30, borderRadius: 8,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'rgba(255,255,255,0.5)',
              transition: 'background 0.15s',
            }}
            onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
            onMouseOut={e  => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
          >
            <X size={14} />
          </button>
        </div>

        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* ── Format ── */}
          <Section label="Format">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
              {(['PNG', 'JPG', 'WebP'] as Format[]).map(f => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  style={{
                    padding:       '10px 8px',
                    borderRadius:  10,
                    border:        `1.5px solid ${format === f ? '#C8F135' : 'rgba(255,255,255,0.08)'}`,
                    background:    format === f ? 'rgba(200,241,53,0.08)' : 'rgba(255,255,255,0.03)',
                    color:         format === f ? '#C8F135' : 'rgba(255,255,255,0.55)',
                    cursor:        'pointer',
                    textAlign:     'left',
                    transition:    'all 0.15s',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{f}</div>
                  <div style={{ fontSize: '0.65rem', marginTop: 3, opacity: 0.7 }}>
                    {FORMAT_META[f]}
                  </div>
                </button>
              ))}
            </div>
          </Section>

          {/* ── Quality (JPG / WebP only) ── */}
          <Section label={`Quality${!qualityApplies ? ' (PNG is lossless)' : ''}`}>
            <div style={{ opacity: qualityApplies ? 1 : 0.3, transition: 'opacity 0.2s' }}>
              <input
                type="range" min={10} max={100} step={1}
                value={quality}
                disabled={!qualityApplies}
                onChange={e => setQuality(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#C8F135', cursor: qualityApplies ? 'pointer' : 'not-allowed' }}
              />
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)', marginTop: 4,
              }}>
                <span>Smaller file</span>
                <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{quality}%</span>
                <span>Best quality</span>
              </div>
            </div>
          </Section>

          {/* ── Resolution ── */}
          <Section label="Resolution">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
              {(['50%', '100%', '2x'] as Resolution[]).map(r => (
                <button
                  key={r}
                  onClick={() => setResolution(r)}
                  style={{
                    padding:      '10px 8px',
                    borderRadius: 10,
                    border:       `1.5px solid ${resolution === r ? '#C8F135' : 'rgba(255,255,255,0.08)'}`,
                    background:   resolution === r ? 'rgba(200,241,53,0.08)' : 'rgba(255,255,255,0.03)',
                    color:        resolution === r ? '#C8F135' : 'rgba(255,255,255,0.55)',
                    cursor:       'pointer',
                    textAlign:    'left',
                    transition:   'all 0.15s',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{r}</div>
                  <div style={{ fontSize: '0.65rem', marginTop: 3, opacity: 0.7 }}>
                    {RES_META[r]}
                  </div>
                </button>
              ))}
            </div>
          </Section>

        </div>

        {/* ── Footer ── */}
        <div style={{
          display:        'flex',
          justifyContent: 'flex-end',
          alignItems:     'center',
          gap:            10,
          padding:        '14px 20px',
          borderTop:      '1px solid rgba(255,255,255,0.06)',
        }}>
          <button
            onClick={onClose}
            style={{
              padding:      '9px 18px',
              borderRadius: 10,
              border:       '1px solid rgba(255,255,255,0.1)',
              background:   'transparent',
              color:        'rgba(255,255,255,0.55)',
              fontSize:     '0.85rem',
              fontWeight:   600,
              cursor:       'pointer',
              transition:   'all 0.15s',
            }}
            onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
            onMouseOut={e  => (e.currentTarget.style.background = 'transparent')}
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            style={{
              padding:      '9px 22px',
              borderRadius: 10,
              border:       'none',
              background:   exporting ? 'rgba(200,241,53,0.5)' : '#C8F135',
              color:        '#0E0E0E',
              fontSize:     '0.85rem',
              fontWeight:   700,
              cursor:       exporting ? 'not-allowed' : 'pointer',
              transition:   'all 0.15s',
              letterSpacing: '0.01em',
            }}
            onMouseOver={e => { if (!exporting) e.currentTarget.style.background = '#d4f54d' }}
            onMouseOut={e  => { if (!exporting) e.currentTarget.style.background = '#C8F135' }}
          >
            {exporting ? 'Saving…' : `Save as ${format}`}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Section wrapper ────────────────────────────────────────────────────────────
function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{
        fontSize:      '0.7rem',
        fontWeight:    700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color:         'rgba(255,255,255,0.35)',
        marginBottom:  10,
      }}>
        {label}
      </div>
      {children}
    </div>
  )
}
