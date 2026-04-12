import { useState } from 'react';

const SEVERITY: Record<string, 'high' | 'medium' | 'low'> = {
  Mass: 'high', Pneumonia: 'high', Pneumothorax: 'high', Edema: 'high',
  Atelectasis: 'medium', Cardiomegaly: 'medium', Effusion: 'medium', Infiltration: 'medium',
  Nodule: 'medium', Consolidation: 'medium', Emphysema: 'medium', Fibrosis: 'medium',
  Pleural_Thickening: 'low', Hernia: 'low',
};
const DESCRIPTIONS: Record<string, string> = {
  Atelectasis: 'Partial or complete collapse of lung tissue',
  Cardiomegaly: 'Enlargement of the heart',
  Effusion: 'Abnormal accumulation of fluid around the lungs',
  Infiltration: 'Substance denser than air in the lungs',
  Mass: 'Abnormal growth or tumor in the chest',
  Nodule: 'Small rounded growth in the lung',
  Pneumonia: 'Infection causing lung inflammation',
  Pneumothorax: 'Air in the space around the lungs',
  Consolidation: 'Lung tissue filled with liquid instead of air',
  Edema: 'Excess fluid in the lungs',
  Emphysema: 'Damage to the air sacs in the lungs',
  Fibrosis: 'Scarring of lung tissue',
  Pleural_Thickening: 'Thickening of the lining around the lungs',
  Hernia: 'Organ protrusion through chest wall',
};
const SEV_COLOR = {
  high:   '#ff6b6b',
  medium: '#4ecdc4',
  low:    '#5c7f7c',
};

interface Analysis {
  id: string; image_name: string; prediction_class?: string;
  confidence_score?: number; predictions_json?: Record<string, number>;
  heatmap_url?: string; clinical_report?: string; status: string; created_at: string;
}

export default function ResultsDisplay({ analysis, imagePreview }: { analysis: Analysis; imagePreview: string }) {
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [showReport, setShowReport] = useState(false);

  const preds = analysis.predictions_json ?? {};
  const sorted = Object.entries(preds).sort((a, b) => b[1] - a[1]);
  const primary = sorted[0];
  const sev = SEVERITY[primary?.[0] ?? ''] ?? 'medium';
  const col = SEV_COLOR[sev];

  const card: React.CSSProperties = { background: 'rgba(13,37,64,0.6)', border: '1px solid rgba(141,171,168,0.15)', borderRadius: 16, overflow: 'hidden' };
  const mono = { fontFamily: 'IBM Plex Mono, monospace' } as React.CSSProperties;
  const label: React.CSSProperties = { ...mono, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase' as const, color: '#5c7f7c' };

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Primary finding */}
      <div style={{ ...card, background: `rgba(${sev === 'high' ? '255,107,107' : sev === 'medium' ? '78,205,196' : '92,127,124'},0.08)`, border: `1px solid ${col}44` }}>
        <div style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
            <div>
              <div style={{ ...label, color: col, marginBottom: 6 }}>Primary Finding</div>
              <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 24, fontWeight: 700, color: '#e4eeee', marginBottom: 4 }}>
                {primary?.[0]?.replace('_', ' ')}
              </h2>
              <p style={{ fontSize: 13, color: '#8daba8' }}>{DESCRIPTIONS[primary?.[0] ?? ''] ?? ''}</p>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ ...mono, fontSize: 28, fontWeight: 700, color: col }}>{primary?.[1].toFixed(1)}%</div>
              <div style={{ ...label }}>confidence</div>
            </div>
          </div>
          {sev === 'high' && (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${col}33`, display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ff6b6b" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              <span style={{ ...label, color: '#ff6b6b', fontSize: 9 }}>High priority — radiologist review required</span>
            </div>
          )}
        </div>
      </div>

      {/* Image */}
      <div style={card}>
        <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(141,171,168,0.12)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(13,37,64,0.4)' }}>
          <span style={label}>Imaging</span>
          {analysis.heatmap_url && (
            <button onClick={() => setShowHeatmap(v => !v)} style={{ ...mono, fontSize: 10, padding: '4px 12px', background: 'transparent', border: '1px solid rgba(141,171,168,0.2)', borderRadius: 6, color: '#8daba8', cursor: 'pointer' }}>
              {showHeatmap ? 'Show Original' : 'Show Grad-CAM'}
            </button>
          )}
        </div>
        <img src={showHeatmap && analysis.heatmap_url ? analysis.heatmap_url : imagePreview}
          alt={showHeatmap ? 'Heatmap' : 'X-ray'}
          style={{ width: '100%', maxHeight: 280, objectFit: 'contain', background: '#000', display: 'block' }} />
        {showHeatmap && (
          <div style={{ padding: '8px 16px', background: 'rgba(78,205,196,0.04)', borderTop: '1px solid rgba(141,171,168,0.1)' }}>
            <p style={{ ...label, fontSize: 9, color: '#5c7f7c' }}>Grad-CAM — bright regions = highest model attention for predicted class</p>
          </div>
        )}
      </div>

      {/* All 14 scores */}
      <div style={card}>
        <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(141,171,168,0.12)', background: 'rgba(13,37,64,0.4)' }}>
          <span style={label}>All Pathology Scores</span>
        </div>
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {(showAll ? sorted : sorted.slice(0, 5)).map(([name, prob]) => {
            const s = SEVERITY[name] ?? 'medium';
            const c = prob > 50 ? SEV_COLOR[s] : '#5c7f7c';
            return (
              <div key={name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: prob > 50 ? '#e4eeee' : '#8daba8' }}>{name.replace('_', ' ')}</span>
                  <span style={{ ...mono, fontSize: 12, color: c }}>{prob.toFixed(1)}%</span>
                </div>
                <div className="prob-bar">
                  <div className="prob-fill" style={{ width: `${prob}%`, background: c }} />
                </div>
              </div>
            );
          })}
          <button onClick={() => setShowAll(v => !v)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', ...label, color: '#5c7f7c', textAlign: 'left', paddingTop: 4 }}>
            {showAll ? '↑ Show less' : `↓ Show ${sorted.length - 5} more`}
          </button>
        </div>
      </div>

      {/* Clinical report */}
      {analysis.clinical_report && (
        <div style={card}>
          <button onClick={() => setShowReport(v => !v)}
            style={{ width: '100%', padding: '12px 16px', background: 'rgba(13,37,64,0.4)', border: 'none', borderBottom: showReport ? '1px solid rgba(141,171,168,0.12)' : 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={label}>AI Clinical Report</span>
            <span style={{ color: '#5c7f7c', fontSize: 14 }}>{showReport ? '▲' : '▼'}</span>
          </button>
          {showReport && (
            <div style={{ padding: 16 }}>
              <div style={{ padding: 10, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 8, marginBottom: 12, fontSize: 11, color: '#fbbf24', lineHeight: 1.6 }}>
                ⚠ AI-generated — must be verified by a qualified radiologist before any clinical use.
              </div>
              <pre style={{ fontSize: 12, color: '#8daba8', whiteSpace: 'pre-wrap', lineHeight: 1.7, fontFamily: 'IBM Plex Sans, sans-serif' }}>
                {analysis.clinical_report}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Disclaimer */}
      <div style={{ padding: 12, background: 'rgba(141,171,168,0.04)', border: '1px solid rgba(141,171,168,0.12)', borderRadius: 10, fontSize: 11, color: '#5c7f7c', lineHeight: 1.6 }}>
        OncoScan AI is a research screening tool — not a diagnostic instrument. Model: CheXNet DenseNet121. All results require radiologist verification.
      </div>
    </div>
  );
}
