type Tool = 'oncoscan' | 'pdt' | 'dosimetry';

const NAV: { id: Tool; label: string; sub: string }[] = [
  { id: 'oncoscan',  label: 'OncoScan AI',    sub: 'X-Ray Analysis' },
  { id: 'pdt',       label: 'PDT Simulator',  sub: 'Treatment Planning' },
  { id: 'dosimetry', label: 'AI Dosimetry',   sub: 'Dose Optimization' },
];

export default function Navigation({ active, onChange }: { active: Tool; onChange: (t: Tool) => void }) {
  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
      height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px', borderBottom: '1px solid rgba(141,171,168,0.15)',
      background: 'rgba(9,29,46,0.95)', backdropFilter: 'blur(16px)',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'linear-gradient(135deg, #5c7f7c, #4ecdc4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="4" stroke="#091d2e" strokeWidth="2.5" />
            <path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="#091d2e" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <div>
          <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: 16, color: '#e4eeee', lineHeight: 1.1 }}>Lumina</div>
          <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: '#5c7f7c', letterSpacing: '0.18em', textTransform: 'uppercase' }}>Medical AI Suite</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6 }}>
        {NAV.map(({ id, label, sub }) => (
          <button key={id} onClick={() => onChange(id)} style={{
            padding: '8px 16px', borderRadius: 8, cursor: 'pointer', textAlign: 'left',
            background: active === id ? 'rgba(78,205,196,0.1)' : 'transparent',
            border: active === id ? '1px solid rgba(78,205,196,0.3)' : '1px solid transparent',
            transition: 'all 0.2s',
          }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: active === id ? '#b8cece' : '#8daba8', lineHeight: 1.2 }}>{label}</div>
            <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: active === id ? '#5c7f7c' : '#3a5552', letterSpacing: '0.14em', textTransform: 'uppercase' }}>{sub}</div>
          </button>
        ))}
      </div>

      {/* Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px rgba(34,197,94,0.6)' }} />
        <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#5c7f7c', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          Manveer Singh Tib · ISM
        </span>
      </div>
    </nav>
  );
}
