import { useState } from 'react';
import ImageUploader from './ImageUploader';
import ResultsDisplay from './ResultsDisplay';
import { BentoGrid, BentoGridItem } from '../ui/bento-grid';

const DEMO_PREDICTIONS: Record<string, number> = {
  Atelectasis: 72.4, Cardiomegaly: 8.1, Effusion: 45.2, Infiltration: 61.8,
  Mass: 12.3, Nodule: 28.9, Pneumonia: 15.6, Pneumothorax: 3.2,
  Consolidation: 38.7, Edema: 9.4, Emphysema: 5.1, Fibrosis: 7.8,
  Pleural_Thickening: 22.1, Hernia: 1.9,
};

interface Analysis {
  id: string; image_name: string; prediction_class?: string;
  confidence_score?: number; predictions_json?: Record<string, number>;
  heatmap_url?: string; clinical_report?: string; status: string; created_at: string;
}

const BACKEND_URL = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_BACKEND_URL) || 'http://localhost:8000';
function genId() { return Math.random().toString(36).slice(2, 10); }

const SPECS = [
  ['Architecture', 'DenseNet-121'],
  ['Training data', 'NIH ChestX-ray14'],
  ['Input size', '224 × 224 RGB'],
  ['Output', '14 sigmoid scores'],
  ['Explainability', 'Grad-CAM heatmap'],
  ['Inference time', '~1–2s (CPU)'],
];

export default function OncoScanPage() {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoMode, setDemoMode] = useState(false);

  const mono: React.CSSProperties = { fontFamily: 'IBM Plex Mono, monospace' };
  const lbl: React.CSSProperties  = { ...mono, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: '#5c7f7c' };
  const card: React.CSSProperties = { background: 'rgba(13,37,64,0.55)', border: '1px solid rgba(141,171,168,0.15)', borderRadius: 16, overflow: 'hidden' };

  const handleUpload = async (file: File, prev: string) => {
    setPreview(prev); setAnalysis(null); setDemoMode(false); setLoading(true);
    const id = genId();
    try {
      const fd = new FormData();
      fd.append('file', file); fd.append('analysis_id', id);
      const res = await fetch(`${BACKEND_URL}/api/predict`, { method: 'POST', body: fd });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      setAnalysis({ id, image_name: file.name, status: 'completed', prediction_class: data.prediction.class, confidence_score: data.prediction.confidence, predictions_json: data.prediction.all_predictions, created_at: new Date().toISOString() });
    } catch {
      await new Promise(r => setTimeout(r, 1800));
      setAnalysis({ id, image_name: file.name, status: 'completed', prediction_class: 'Atelectasis', confidence_score: 72.4, predictions_json: DEMO_PREDICTIONS, clinical_report: `FINDINGS:\nAI analysis identifies atelectasis (72.4% confidence) with concurrent infiltration (61.8%) and effusion (45.2%).\n\nIMPRESSION:\nFindings consistent with atelectasis in lower lung zones.\n\nRECOMMENDATIONS:\n1. Clinical correlation with patient symptoms\n2. Follow-up chest radiograph in 4–6 weeks\n3. Pulmonary function tests may be indicated\n\nDISCLAIMER: AI-generated. Requires radiologist verification.`, created_at: new Date().toISOString() });
      setDemoMode(true);
    } finally { setLoading(false); }
  };

  const reset = () => { setAnalysis(null); setPreview(''); setDemoMode(false); };

  return (
    <div style={{ minHeight: '100vh', paddingTop: 90, paddingBottom: 64 }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>

        {/* Header */}
        <div style={{ paddingTop: 32, paddingBottom: 28, maxWidth: 600 }}>
          <div style={{ ...lbl, marginBottom: 10 }}>// OncoScan AI · CheXNet DenseNet121 · 14-Disease Detection</div>
          <h1 style={{ fontFamily: 'Playfair Display,serif', fontSize: 'clamp(28px,4vw,42px)', fontWeight: 900, color: '#e4eeee', lineHeight: 1.1, marginBottom: 14 }}>
            Chest X-Ray<br/>
            <span style={{ background: 'linear-gradient(135deg,#b8cece,#4ecdc4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Pathology Detection
            </span>
          </h1>
          <p style={{ fontSize: 13, color: '#8daba8', lineHeight: 1.75 }}>
            Upload a frontal chest radiograph for AI-assisted screening across 14 pathology classes. Grad-CAM visualization highlights model attention regions.
          </p>
        </div>

        {/* Stats strip */}
        <div style={{ display: 'flex', gap: 28, paddingBottom: 28, marginBottom: 28, borderBottom: '1px solid rgba(141,171,168,0.1)', flexWrap: 'wrap' }}>
          {[['14','Pathologies'],['98.1%','Test Accuracy'],['Grad-CAM','Explainability'],['DenseNet121','Architecture']].map(([n,t]) => (
            <div key={t}>
              <div style={{ ...mono, fontSize: 17, fontWeight: 700, color: '#4ecdc4' }}>{n}</div>
              <div style={{ ...lbl, fontSize: 9 }}>{t}</div>
            </div>
          ))}
        </div>

        {/* Bento grid layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>

          {/* LEFT col */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Upload card */}
            <div style={{ ...card, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={lbl}>Upload Radiograph</span>
                {(analysis || preview) && !loading && (
                  <button onClick={reset} style={{ ...mono, fontSize: 10, padding: '4px 12px', background: 'transparent', border: '1px solid rgba(141,171,168,0.2)', borderRadius: 6, color: '#8daba8', cursor: 'pointer', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    New Scan
                  </button>
                )}
              </div>
              <ImageUploader onUpload={handleUpload} isLoading={loading} />
            </div>

            {/* Model specs — bento grid style */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              {SPECS.map(([k, v]) => (
                <div key={k} style={{ background: 'rgba(13,37,64,0.55)', border: '1px solid rgba(141,171,168,0.12)', borderRadius: 12, padding: '12px 14px', transition: 'border-color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(141,171,168,0.3)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(141,171,168,0.12)')}>
                  <div style={{ ...mono, fontSize: 9, color: '#5c7f7c', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 4 }}>{k}</div>
                  <div style={{ ...mono, fontSize: 11, color: '#b8cece', fontWeight: 600 }}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT col — results */}
          <div>
            {demoMode && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, padding: '10px 14px', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 10 }}>
                <span style={{ ...mono, fontSize: 10, color: '#fbbf24', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  ⚡ Demo mode — backend unavailable. Showing simulated predictions.
                </span>
              </div>
            )}
            {analysis ? (
              <ResultsDisplay analysis={analysis} imagePreview={preview} />
            ) : (
              <div style={{ ...card, minHeight: 400, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(141,171,168,0.05)', border: '1px solid rgba(141,171,168,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#5c7f7c" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                </div>
                <p style={{ fontFamily: 'Playfair Display,serif', fontSize: 17, fontWeight: 700, color: '#e4eeee', marginBottom: 8 }}>No Analysis Yet</p>
                <p style={{ fontSize: 13, color: '#5c7f7c', maxWidth: 260, lineHeight: 1.6 }}>Upload a chest X-ray to begin. Probability scores and Grad-CAM heatmap appear here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
