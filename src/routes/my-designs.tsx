// ============================================================
//  app/routes/my-designs.tsx
//  /my-designs — saved designs page
//
//  Fetches from MongoDB via /api/designs.
//  Each card links back to /dashboard?designId=xxx
//  so the draft is restored from localStorage on load.
// ============================================================

import { useUser } from '@clerk/tanstack-start'
import { useGSAP } from '@gsap/react'
import { createFileRoute, Link } from '@tanstack/react-router'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import { useEffect, useRef, useState } from 'react'

gsap.registerPlugin(useGSAP, ScrollTrigger)

export const Route = createFileRoute('/my-designs')({
  component: MyDesignsPage,
})

// ─── Types ────────────────────────────────────────────────────────────────────
interface DesignDoc {
  _id:          string
  designId:     string
  name:         string
  garmentId:    string
  garmentColor: { label: string; hex: string }
  garmentSize:  string
  thumbnail:    string | null
  status:       'draft' | 'ordered' | 'archived'
  updatedAt:    string
  createdAt:    string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const GARMENT_EMOJI: Record<string, string> = {
  tshirt: '👕', cap: '👒', shorts: '🩳',
  hoodie: '🧥', polo: '👔', tote: '👜',
}

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  draft:    { bg: 'rgba(200,241,53,0.15)',  color: '#4a7000', label: 'Draft'    },
  ordered:  { bg: 'rgba(58,186,255,0.15)', color: '#006080', label: 'Ordered'  },
  archived: { bg: 'rgba(14,14,14,0.08)',   color: '#888',    label: 'Archived' },
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60000)
  if (mins < 1)    return 'just now'
  if (mins < 60)   return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)    return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7)    return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-GB', { day:'numeric', month:'short' })
}

// ─── Design card ──────────────────────────────────────────────────────────────
function DesignCard({ doc, onDelete }: {
  doc: DesignDoc
  onDelete: (designId: string) => void
}) {
  const cardRef   = useRef<HTMLDivElement>(null)
  const [confirm, setConfirm] = useState(false)
  const st = STATUS_STYLE[doc.status] ?? STATUS_STYLE.draft

  function handleDelete() {
    if (!confirm) { setConfirm(true); return }
    gsap.to(cardRef.current, {
      scale: 0.92, opacity: 0, height: 0,
      marginBottom: 0, paddingTop: 0, paddingBottom: 0,
      duration: 0.3, ease: 'power2.in',
      onComplete: () => onDelete(doc.designId),
    })
  }

  return (
    <div ref={cardRef} className="md-card">
      {/* Thumbnail */}
      <div className="md-thumb" style={{ background: doc.garmentColor?.hex ? `${doc.garmentColor.hex}22` : '#F2EFEA' }}>
        {doc.thumbnail ? (
          <img src={doc.thumbnail} alt={doc.name}
            style={{ width:'100%', height:'100%', objectFit:'contain', borderRadius:12 }}/>
        ) : (
          <span style={{ fontSize:'3.5rem' }}>
            {GARMENT_EMOJI[doc.garmentId] ?? '👕'}
          </span>
        )}
        {/* Color dot overlay */}
        {doc.garmentColor?.hex && (
          <div style={{
            position:'absolute', bottom:8, right:8,
            width:18, height:18, borderRadius:'50%',
            background: doc.garmentColor.hex,
            border: '2px solid white',
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
          }}/>
        )}
      </div>

      {/* Info */}
      <div className="md-info">
        <div className="md-name">{doc.name}</div>
        <div className="md-meta">
          <span>{doc.garmentId ? doc.garmentId.charAt(0).toUpperCase() + doc.garmentId.slice(1) : '—'}</span>
          {doc.garmentSize && <span>· {doc.garmentSize}</span>}
          <span>· {timeAgo(doc.updatedAt)}</span>
        </div>
        <div style={{ marginTop:'0.5rem' }}>
          <span style={{
            display:'inline-flex', alignItems:'center', gap:4,
            fontSize:'0.68rem', fontWeight:600, letterSpacing:'0.06em',
            textTransform:'uppercase', padding:'0.22rem 0.65rem',
            borderRadius:100, background: st.bg, color: st.color,
          }}>
            {doc.status === 'draft' && <span style={{ width:5,height:5,borderRadius:'50%',background:st.color }}/>}
            {st.label}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="md-actions">
        <Link
          to="/dashboard"
          search={{ designId: doc.designId }}
          className="md-btn-edit"
          onClick={() => {
            // Mark this as the active design so dashboard restores it
            sessionStorage.setItem('driply_active_design', doc.designId)
          }}
        >
          Edit →
        </Link>
        {doc.status === 'draft' && (
          <Link
            to="/dashboard"
            search={{ designId: doc.designId, openFlow: '1' }}
            className="md-btn-order"
            onClick={() => sessionStorage.setItem('driply_active_design', doc.designId)}
          >
            Order
          </Link>
        )}
        <button
          className={`md-btn-delete ${confirm ? 'md-btn-delete-confirm' : ''}`}
          onClick={handleDelete}
          onBlur={() => setConfirm(false)}
        >
          {confirm ? 'Sure?' : '✕'}
        </button>
      </div>
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div style={{ gridColumn:'1/-1', textAlign:'center', padding:'5rem 2rem' }}>
      <div style={{ fontSize:'4rem', marginBottom:'1.25rem' }}>✏️</div>
      <h3 style={{ fontFamily:'Syne,sans-serif', fontSize:'1.35rem', fontWeight:800,
        letterSpacing:'-0.02em', color:'#0E0E0E', marginBottom:'0.5rem' }}>
        No designs yet
      </h3>
      <p style={{ fontSize:'0.95rem', color:'#888', marginBottom:'2rem' }}>
        Head to the studio to create your first design.
      </p>
      <Link to="/dashboard" className="md-btn-new">
        Open Studio →
      </Link>
    </div>
  )
}

// ─── Skeleton card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="md-card md-skeleton">
      <div className="md-thumb" style={{ background:'#F0EDE8' }}>
        <div className="md-skel-block" style={{ width:'60%', height:'60%', borderRadius:12 }}/>
      </div>
      <div className="md-info">
        <div className="md-skel-block" style={{ width:'70%', height:14, borderRadius:6, marginBottom:8 }}/>
        <div className="md-skel-block" style={{ width:'45%', height:11, borderRadius:6, marginBottom:8 }}/>
        <div className="md-skel-block" style={{ width:'30%', height:18, borderRadius:100 }}/>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function MyDesignsPage() {
  const { user, isLoaded } = useUser()
  const pageRef   = useRef<HTMLDivElement>(null)
  const [docs,    setDocs]    = useState<DesignDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)
  const [search,  setSearch]  = useState('')
  const [filter,  setFilter]  = useState<'all'|'draft'|'ordered'>('all')

  // ── Fetch designs ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoaded || !user) return
    setLoading(true)
    fetch('/api/designs')
      .then(r => r.json())
      .then(data => { setDocs(data); setLoading(false) })
      .catch(() => { setError('Failed to load designs'); setLoading(false) })
  }, [isLoaded, user])

  // ── Page entrance ─────────────────────────────────────────────────────────
  useGSAP(() => {
    gsap.from('.md-heading-line', {
      yPercent: 100, stagger: 0.08, duration: 0.7, ease: 'power4.out',
    })
    gsap.from('.md-toolbar', {
      y: 16, opacity: 0, duration: 0.5, ease: 'power3.out', delay: 0.3,
    })
  }, { scope: pageRef })

  // ── Cards stagger in when loaded ─────────────────────────────────────────
  useEffect(() => {
    if (!loading && docs.length) {
      gsap.from('.md-card', {
        y: 24, opacity: 0, scale: 0.97,
        stagger: 0.06, duration: 0.5, ease: 'power3.out', delay: 0.1,
      })
    }
  }, [loading])

  function handleDelete(designId: string) {
    fetch('/api/designs', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ designId }),
    })
    setDocs(d => d.filter(x => x.designId !== designId))
  }

  const filtered = docs.filter(d => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || d.status === filter
    return matchSearch && matchFilter
  })

  if (!isLoaded) return null

  if (!user) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center',
      justifyContent:'center', background:'#F8F5EF' }}>
      <p style={{ color:'#888' }}>Sign in to view your designs.</p>
    </div>
  )

  return (
    <div ref={pageRef} style={{ minHeight:'100vh', background:'#F8F5EF', fontFamily:'DM Sans,sans-serif' }}>
      <style>{`
        .md-topbar {
          position: sticky; top: 0; z-index: 50;
          background: rgba(248,245,239,0.92); backdrop-filter: blur(14px);
          border-bottom: 1px solid rgba(14,14,14,0.06);
          padding: 0 2.5rem; height: 56px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .md-logo { font-family:'Syne',sans-serif; font-size:1.35rem; font-weight:800;
          letter-spacing:-0.03em; text-decoration:none; color:#0E0E0E; }
        .md-nav-links { display:flex; gap:1.5rem; }
        .md-nav-link { font-size:0.85rem; color:#888; text-decoration:none; transition:color 0.15s; }
        .md-nav-link:hover { color:#0E0E0E; }
        .md-nav-link.active { color:#0E0E0E; font-weight:600; }

        .md-container { max-width:1140px; margin:0 auto; padding:3.5rem 2rem 6rem; }

        .md-heading { overflow:hidden; margin-bottom:0.5rem; }
        .md-h1 { font-family:'Syne',sans-serif; font-size:clamp(2.5rem,5vw,4rem);
          font-weight:800; letter-spacing:-0.04em; line-height:0.95; color:#0E0E0E; }
        .md-heading-line { display:block; }
        .md-sub { font-size:0.95rem; font-weight:300; color:#888; margin-bottom:2.5rem; }

        .md-toolbar {
          display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem;
          flex-wrap: wrap;
        }
        .md-search {
          flex:1; min-width:200px; max-width:320px;
          background:white; border:1.5px solid rgba(14,14,14,0.1); border-radius:12px;
          padding:0.6rem 1rem 0.6rem 2.5rem;
          font-family:'DM Sans',sans-serif; font-size:0.88rem; color:#0E0E0E;
          outline:none; transition:border-color 0.15s;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' fill='none' viewBox='0 0 24 24'%3E%3Ccircle cx='11' cy='11' r='8' stroke='%23aaa' stroke-width='2'/%3E%3Cpath d='M21 21l-4.35-4.35' stroke='%23aaa' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E");
          background-repeat:no-repeat; background-position:0.75rem center;
        }
        .md-search:focus { border-color:rgba(14,14,14,0.25); }
        .md-search::placeholder { color:#C0BBB4; }

        .md-filters { display:flex; gap:6px; }
        .md-filter-btn {
          padding:0.5rem 1rem; border-radius:100px;
          font-size:0.78rem; font-weight:500; cursor:pointer;
          border:1.5px solid rgba(14,14,14,0.1); background:none; color:#888;
          transition:all 0.15s;
        }
        .md-filter-btn:hover { border-color:rgba(14,14,14,0.25); color:#0E0E0E; }
        .md-filter-btn.active { background:#0E0E0E; color:white; border-color:#0E0E0E; }

        .md-btn-new {
          margin-left:auto; padding:0.6rem 1.25rem;
          background:#C8F135; color:#0E0E0E;
          font-family:'Syne',sans-serif; font-size:0.85rem; font-weight:700;
          border:none; border-radius:100px; cursor:pointer; text-decoration:none;
          transition:background 0.15s; display:inline-flex; align-items:center;
        }
        .md-btn-new:hover { background:#9BBF10; color:white; }

        .md-grid {
          display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:1.25rem;
        }

        .md-card {
          background:white; border-radius:20px; border:1px solid rgba(14,14,14,0.06);
          overflow:hidden; display:flex; flex-direction:column;
          transition:box-shadow 0.2s; will-change:transform;
        }
        .md-card:hover { box-shadow:0 12px 32px rgba(0,0,0,0.08); }

        .md-thumb {
          height:180px; display:flex; align-items:center; justify-content:center;
          position:relative; border-bottom:1px solid rgba(14,14,14,0.04);
        }
        .md-info { padding:1rem 1.25rem 0.75rem; flex:1; }
        .md-name {
          font-family:'Syne',sans-serif; font-size:0.95rem; font-weight:700;
          letter-spacing:-0.02em; color:#0E0E0E; margin-bottom:0.25rem;
          white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
        }
        .md-meta { font-size:0.72rem; color:#aaa; display:flex; gap:0.25rem; flex-wrap:wrap; }

        .md-actions {
          display:flex; gap:6px; padding:0.75rem 1.25rem 1rem;
        }
        .md-btn-edit {
          flex:1; text-align:center; padding:0.55rem 0;
          background:#0E0E0E; color:white;
          font-family:'Syne',sans-serif; font-size:0.78rem; font-weight:700;
          border-radius:10px; text-decoration:none; border:none; cursor:pointer;
          transition:background 0.15s;
        }
        .md-btn-edit:hover { background:#222; }
        .md-btn-order {
          flex:1; text-align:center; padding:0.55rem 0;
          background:#C8F135; color:#0E0E0E;
          font-family:'Syne',sans-serif; font-size:0.78rem; font-weight:700;
          border-radius:10px; text-decoration:none; border:none; cursor:pointer;
          transition:background 0.15s;
        }
        .md-btn-order:hover { background:#9BBF10; color:white; }
        .md-btn-delete {
          width:34px; padding:0.55rem;
          background:rgba(255,91,58,0.08); color:#FF5B3A;
          font-size:0.75rem; font-weight:600;
          border:1px solid rgba(255,91,58,0.15); border-radius:10px;
          cursor:pointer; flex-shrink:0; transition:all 0.15s;
        }
        .md-btn-delete-confirm { background:#FF5B3A; color:white; width:auto; padding:0.55rem 0.6rem; }

        .md-skel-block {
          background:linear-gradient(90deg,#E8E5E0 0%,#F0EDE8 50%,#E8E5E0 100%);
          background-size:200% 100%;
          animation:skelShimmer 1.4s ease-in-out infinite;
        }
        @keyframes skelShimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

        .md-error {
          grid-column:1/-1; text-align:center; padding:3rem;
          color:#FF5B3A; font-size:0.9rem;
        }

        .md-count { font-size:0.82rem; color:#888; margin-left:auto; align-self:center; }
      `}</style>

      {/* Topbar */}
      <header className="md-topbar">
        <Link to="/" className="md-logo">Drip<span style={{color:'#FF5B3A'}}>ly</span></Link>
        <nav className="md-nav-links">
          <Link to="/dashboard"  className="md-nav-link">Studio</Link>
          <Link to="/my-designs" className="md-nav-link active">My Designs</Link>
        </nav>
      </header>

      <div className="md-container">

        {/* Heading */}
        <div className="md-heading">
          <h1 className="md-h1">
            <span className="md-heading-line">My</span>
            <span className="md-heading-line">Designs.</span>
          </h1>
        </div>
        <p className="md-sub">
          {loading ? 'Loading…' : `${docs.length} design${docs.length !== 1 ? 's' : ''} saved to your account`}
        </p>

        {/* Toolbar */}
        <div className="md-toolbar">
          <input
            className="md-search"
            placeholder="Search designs…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className="md-filters">
            {(['all','draft','ordered'] as const).map(f => (
              <button key={f}
                className={`md-filter-btn ${filter===f?'active':''}`}
                onClick={() => setFilter(f)}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          {!loading && filtered.length > 0 && (
            <span className="md-count">{filtered.length} result{filtered.length!==1?'s':''}</span>
          )}
          <Link to="/dashboard" className="md-btn-new">+ New Design</Link>
        </div>

        {/* Grid */}
        <div className="md-grid">
          {error && <div className="md-error">{error} — <button onClick={() => window.location.reload()} style={{background:'none',border:'none',cursor:'pointer',color:'#FF5B3A',textDecoration:'underline'}}>Retry</button></div>}

          {loading && !error && Array.from({length:6}).map((_,i) => <SkeletonCard key={i}/>)}

          {!loading && !error && filtered.length === 0 && <EmptyState/>}

          {!loading && !error && filtered.map(doc => (
            <DesignCard key={doc.designId} doc={doc} onDelete={handleDelete}/>
          ))}
        </div>
      </div>
    </div>
  )
}
