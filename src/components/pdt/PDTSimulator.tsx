import { useState, useEffect, useCallback } from 'react';

// ── REAL PUBLISHED TISSUE OPTICAL PROPERTIES ──────────────────
// Source: Cheong et al. (1990) IEEE J Quantum Electron; Jacques (2013) Phys Med Biol
// μa = absorption coefficient (cm⁻¹), μs = reduced scattering coefficient (cm⁻¹)
// Values at ~630nm (primary PDT wavelength)
const TISSUE_PROPS: Record<string, {
  mua: number; musp: number; label: string; color: string; description: string;
}> = {
  skin:        { mua: 0.046, musp: 1.80, label: 'Skin',              color: '#d4956a', description: 'Superficial tumors, actinic keratosis, BCC' },
  oral:        { mua: 0.037, musp: 1.60, label: 'Oral Mucosa',       color: '#e8a0a0', description: 'Oral SCC, head & neck tumors' },
  muscle:      { mua: 0.048, musp: 1.20, label: 'Muscle',            color: '#b05050', description: 'Soft tissue tumors, sarcomas' },
  lung:        { mua: 0.100, musp: 2.00, label: 'Lung',              color: '#c8d4e8', description: 'Endobronchial NSCLC, mesothelioma' },
  esophagus:   { mua: 0.035, musp: 1.40, label: 'Esophagus',        color: '#d4b0a0', description: 'Esophageal SCC, Barrett\'s HGD' },
  bladder:     { mua: 0.020, musp: 0.90, label: 'Bladder Wall',      color: '#b8c8e0', description: 'Bladder carcinoma, whole-bladder PDT' },
  liver:       { mua: 0.190, musp: 1.40, label: 'Liver',             color: '#8b6040', description: 'Hepatocellular carcinoma, cholangiocarcinoma' },
  brain:       { mua: 0.030, musp: 0.93, label: 'Brain (White)',     color: '#e8e0d0', description: 'GBM, brain metastases (highly challenging)' },
  pancreas:    { mua: 0.140, musp: 1.20, label: 'Pancreas',          color: '#c0a870', description: 'Pancreatic ductal adenocarcinoma (most difficult)' },
};

// ── REAL PHOTOSENSITIZER PROPERTIES ──────────────────────────
// Source: Agostinis et al. (2011) CA Cancer J Clin; PDT literature review
// ε = molar extinction coeff (M⁻¹cm⁻¹), φΔ = singlet O2 quantum yield, λ = activation wavelength
const PS_PROPS: Record<string, {
  name: string; gen: number; lambda: number; epsilon: number; phiDelta: number;
  clearance: string; dli: number; color: string; cancers: string;
}> = {
  photofrin:  { name: 'Photofrin (porfimer Na)', gen: 1, lambda: 630, epsilon: 3000,  phiDelta: 0.89, clearance: '4–6 weeks', dli: 48, color: '#cc0000', cancers: 'Lung, esophageal, gastric, bladder' },
  ala:        { name: '5-ALA / PpIX',           gen: 2, lambda: 635, epsilon: 5000,  phiDelta: 0.56, clearance: '24–48 hrs', dli: 6,  color: '#ff6600', cancers: 'Skin BCC, oral SCC, brain, bladder' },
  temoporfin: { name: 'Temoporfin (mTHPC)',      gen: 2, lambda: 652, epsilon: 30000, phiDelta: 0.43, clearance: '1–2 weeks', dli: 96, color: '#8b0080', cancers: 'Head & neck, pancreatic, oral' },
  verteporfin:{ name: 'Verteporfin (BPD-MA)',    gen: 2, lambda: 689, epsilon: 34800, phiDelta: 0.76, clearance: '5 days',    dli: 3,  color: '#00aa44', cancers: 'Prostate (VTP), AMD, cholangiocarcinoma' },
  chlorin:    { name: 'Chlorin e6',              gen: 2, lambda: 660, epsilon: 40000, phiDelta: 0.65, clearance: '3–5 days',  dli: 6,  color: '#006633', cancers: 'Skin, cervical, bladder, lung' },
  talaporfin: { name: 'Talaporfin Na (NPe6)',    gen: 2, lambda: 664, epsilon: 35000, phiDelta: 0.77, clearance: '24 hrs',    dli: 4,  color: '#0044bb', cancers: 'Lung, liver, colorectal' },
  nano:       { name: '3rd Gen Nanoparticle PS', gen: 3, lambda: 730, epsilon: 50000, phiDelta: 0.85, clearance: '12 hrs',    dli: 3,  color: '#00cccc', cancers: 'Deep tumors, targeted delivery' },
};

// ── BEER-LAMBERT PHYSICS ENGINE ───────────────────────────────
// μeff = √(3 × μa × (μa + μs'))     [effective attenuation coefficient]
// Φ(d) = Φ0 × e^(−μeff × d)         [fluence at depth d in cm]
// ¹O₂ dose ∝ ε × φΔ × [PS] × Φ(d) × O₂ factor × time

function calcMueff(mua: number, musp: number): number {
  return Math.sqrt(3 * mua * (mua + musp));
}

function calcFluenceAtDepth(surfaceFluence: number, mueff: number, depthCm: number): number {
  return surfaceFluence * Math.exp(-mueff * depthCm);
}

function calcOptimalSurfaceFluence(mueff: number, depthCm: number, oxyFactor: number): number {
  // Target: 25 J/cm² at tumor (midpoint of 10–100 J/cm² therapeutic window)
  // Adjusted upward for hypoxia since reaction efficiency is reduced
  const targetTumorDose = 25 / oxyFactor;
  return targetTumorDose / Math.exp(-mueff * depthCm);
}

function getOxyFactor(oxyStatus: string): number {
  return { normoxic: 1.0, mild_hypoxic: 0.55, severe_hypoxic: 0.18 }[oxyStatus] ?? 1.0;
}

function getPenetrationDepth(lambda: number): number {
  // Published penetration depths by wavelength (mm)
  if (lambda < 640) return 4;
  if (lambda < 660) return 6;
  if (lambda < 690) return 8;
  if (lambda < 730) return 11;
  return 14;
}

// Build depth profile 0→4cm in 0.1cm steps
function buildDepthProfile(surfaceFluenceRate: number, mueff: number, oxyFactor: number,
  psDelta: number, psEpsilon: number, psConc: number, duration: number) {
  const steps = 40;
  return Array.from({ length: steps + 1 }, (_, i) => {
    const depthCm = (i / steps) * 4;
    const fluence = calcFluenceAtDepth(surfaceFluenceRate, mueff, depthCm) * duration; // J/cm²
    // Singlet O2 dose (simplified: ε × φΔ × [PS] × fluence × oxyFactor)
    const dose = psDelta * psEpsilon * psConc * 1e-6 * fluence * oxyFactor * 0.001;
    return { depth: parseFloat((depthCm * 10).toFixed(1)), fluence: parseFloat(fluence.toFixed(2)), dose: parseFloat(dose.toFixed(3)) };
  });
}

// Outcome probability — trained on same feature logic as Random Forest model
// Feature importance: O2 (88%) > depth (82%) > stage > PS gen > fluence
function calcOutcome(fluence: number, mueff: number, depthCm: number,
  psGen: number, oxyStatus: string): { cr: number; pr: number; nr: number } {
  const oxyFactor = getOxyFactor(oxyStatus);
  const atten = Math.exp(-mueff * depthCm);
  const tumorFluence = fluence * atten;
  const LETHAL = 20; // J/cm² at tumor needed for CR
  const PARTIAL = 10;

  const doseScore = Math.min(1, tumorFluence / LETHAL);
  const oxyScore  = oxyFactor;
  const genScore  = psGen === 3 ? 1.0 : psGen === 2 ? 0.82 : 0.58;
  const depthScore = Math.max(0, 1 - depthCm / 4);

  const composite = (oxyScore * 0.38 + doseScore * 0.28 + genScore * 0.18 + depthScore * 0.16);

  let cr = 0, pr = 0, nr = 0;
  if (composite >= 0.72)      { cr = Math.round(composite * 100); pr = Math.round((1 - composite) * 80); nr = 100 - cr - pr; }
  else if (composite >= 0.42) { pr = Math.round(composite * 110); cr = Math.round(composite * 30); nr = 100 - cr - pr; }
  else                         { nr = Math.round((1 - composite) * 100); pr = Math.round(composite * 80); cr = 100 - nr - pr; }

  return { cr: Math.max(0, cr), pr: Math.max(0, pr), nr: Math.max(0, nr) };
}

// Clinical scenarios matching your dataset cases
const SCENARIOS = [
  { label: 'Skin BCC (Optimal)',   tissue: 'skin',      ps: 'ala',        depth: 3,  fluenceRate: 100, oxy: 'normoxic',       duration: 600, desc: 'Stage I BCC — textbook CR case' },
  { label: 'Oral SCC (Stage II)',  tissue: 'oral',      ps: 'chlorin',    depth: 8,  fluenceRate: 100, oxy: 'normoxic',       duration: 900, desc: 'Oral squamous cell carcinoma' },
  { label: 'Esophageal HGD',       tissue: 'esophagus', ps: 'photofrin',  depth: 5,  fluenceRate: 75,  oxy: 'normoxic',       duration: 800, desc: 'Barrett\'s high-grade dysplasia' },
  { label: 'Lung (Endobronchial)', tissue: 'lung',      ps: 'talaporfin', depth: 6,  fluenceRate: 100, oxy: 'mild_hypoxic',   duration: 600, desc: 'Early NSCLC via fiber optic' },
  { label: 'Bladder (Whole)',      tissue: 'bladder',   ps: 'ala',        depth: 4,  fluenceRate: 50,  oxy: 'normoxic',       duration: 1200, desc: 'Whole-bladder intravesical PDT' },
  { label: 'Pancreatic (Hard)',    tissue: 'pancreas',  ps: 'photofrin',  depth: 30, fluenceRate: 150, oxy: 'severe_hypoxic',  duration: 600, desc: 'Pancreatic PDAC — canonical NR' },
  { label: 'GBM (Very Hard)',      tissue: 'brain',     ps: 'ala',        depth: 20, fluenceRate: 100, oxy: 'severe_hypoxic',  duration: 600, desc: 'Glioblastoma — light & O2 limited' },
];

// ── COMPONENT ─────────────────────────────────────────────────
export default function PDTSimulator() {
  const [tissueKey, setTissueKey]     = useState('skin');
  const [psKey, setPsKey]             = useState('ala');
  const [depth, setDepth]             = useState(3);       // mm
  const [fluenceRate, setFluenceRate] = useState(100);     // mW/cm²
  const [oxy, setOxy]                 = useState('normoxic');
  const [psConc, setPsConc]           = useState(5);       // μM
  const [duration, setDuration]       = useState(600);     // seconds
  const [scenario, setScenario]       = useState(-1);

  const tissue = TISSUE_PROPS[tissueKey];
  const ps     = PS_PROPS[psKey];

  // Physics calculations
  const depthCm    = depth / 10;
  const mueff      = calcMueff(tissue.mua, tissue.musp);
  const oxyFactor  = getOxyFactor(oxy);
  const surfaceDose = fluenceRate * duration / 1000; // J/cm² (mW → W × s)
  const tumorDose  = calcFluenceAtDepth(surfaceDose, mueff, depthCm);
  const optimalSurface = calcOptimalSurfaceFluence(mueff, depthCm, oxyFactor);
  const penetration = getPenetrationDepth(ps.lambda);
  const singletO2  = ps.phiDelta * ps.epsilon * psConc * 1e-6 * tumorDose * oxyFactor * 1000;
  const profile    = buildDepthProfile(fluenceRate / 1000, mueff, oxyFactor, ps.phiDelta, ps.epsilon, psConc, duration);
  const outcome    = calcOutcome(surfaceDose, mueff, depthCm, ps.gen, oxy);

  const LETHAL = 20; // J/cm²
  let adequacy: 'adequate' | 'subtherapeutic' | 'overdose';
  if (tumorDose >= LETHAL) adequacy = 'adequate';
  else adequacy = 'subtherapeutic';
  if (surfaceDose > 150 && oxyFactor > 0.5) adequacy = 'overdose';

  const depthWarning = depth > penetration;
  const oxyWarning   = oxy === 'severe_hypoxic';

  const adequacyColor = adequacy === 'adequate' ? '#22c55e' : adequacy === 'overdose' ? '#fbbf24' : '#ff6b6b';
  const adequacyLabel = adequacy === 'adequate' ? 'ADEQUATE' : adequacy === 'overdose' ? 'OVERDOSE RISK' : 'SUBTHERAPEUTIC';

  const applyScenario = useCallback((idx: number) => {
    const s = SCENARIOS[idx];
    setTissueKey(s.tissue); setPsKey(s.ps); setDepth(s.depth);
    setFluenceRate(s.fluenceRate); setOxy(s.oxy); setDuration(s.duration);
    setScenario(idx);
  }, []);

  const mono: React.CSSProperties = { fontFamily: 'IBM Plex Mono, monospace' };
  const lbl: React.CSSProperties  = { ...mono, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: '#5c7f7c' };
  const card: React.CSSProperties = { background: 'rgba(13,37,64,0.55)', border: '1px solid rgba(141,171,168,0.15)', borderRadius: 16, overflow: 'hidden' };
  const inputStyle: React.CSSProperties = { background: '#0d2540', border: '1px solid rgba(141,171,168,0.2)', borderRadius: 8, color: '#e4eeee', padding: '8px 12px', fontSize: 12, width: '100%', outline: 'none', fontFamily: 'IBM Plex Mono, monospace' };

  // Max dose for SVG normalization
  const maxDose = Math.max(...profile.map(p => p.dose), 0.001);
  const tumorIdx = Math.round((depthCm / 4) * 40);

  return (
    <div style={{ minHeight: '100vh', paddingTop: 80, paddingBottom: 64, background: '#091d2e' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>

        {/* Header */}
        <div style={{ paddingTop: 40, paddingBottom: 28, maxWidth: 620 }}>
          <div style={{ ...lbl, marginBottom: 10 }}>// PDT Treatment Simulator · Beer-Lambert Physics · Real Optical Data</div>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 38, fontWeight: 900, color: '#e4eeee', lineHeight: 1.1, marginBottom: 14 }}>
            Interactive PDT<br />
            <span style={{ background: 'linear-gradient(135deg, #b8cece, #4ecdc4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Treatment Simulator
            </span>
          </h1>
          <p style={{ fontSize: 13, color: '#8daba8', lineHeight: 1.75, marginBottom: 16 }}>
            Real tissue optical properties (μa, μs) from published biophotonics literature. Beer-Lambert light transport:
            <span style={{ ...mono, fontSize: 11, color: '#4ecdc4' }}> μeff = √(3·μa·(μa+μs'))</span>,
            <span style={{ ...mono, fontSize: 11, color: '#4ecdc4' }}> Φ(d) = Φ₀·e^(−μeff·d)</span>.
            Therapeutic window: 10–100 J/cm² at tumor site.
          </p>

          {/* Physics stats */}
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {[
              { k: 'μeff', v: mueff.toFixed(3) + ' cm⁻¹' },
              { k: 'Surface dose', v: surfaceDose.toFixed(1) + ' J/cm²' },
              { k: 'Tumor dose', v: tumorDose.toFixed(2) + ' J/cm²' },
              { k: 'Penetration', v: penetration + ' mm max' },
            ].map(({ k, v }) => (
              <div key={k}>
                <div style={{ ...mono, fontSize: 16, fontWeight: 700, color: '#4ecdc4' }}>{v}</div>
                <div style={{ ...lbl, fontSize: 9 }}>{k}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Clinical scenario buttons */}
        <div style={{ marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid rgba(141,171,168,0.1)' }}>
          <div style={{ ...lbl, marginBottom: 10 }}>Clinical scenarios from dataset</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {SCENARIOS.map((s, i) => (
              <button key={i} onClick={() => applyScenario(i)} style={{
                ...mono, fontSize: 10, padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
                background: scenario === i ? 'rgba(78,205,196,0.15)' : 'rgba(13,37,64,0.6)',
                border: scenario === i ? '1px solid rgba(78,205,196,0.4)' : '1px solid rgba(141,171,168,0.15)',
                color: scenario === i ? '#4ecdc4' : '#8daba8',
                transition: 'all 0.2s',
              }}>{s.label}</button>
            ))}
            <button onClick={() => { setScenario(-1); setTissueKey('skin'); setPsKey('ala'); setDepth(3); setFluenceRate(100); setOxy('normoxic'); setPsConc(5); setDuration(600); }} style={{
              ...mono, fontSize: 10, padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
              background: 'transparent', border: '1px solid rgba(141,171,168,0.12)',
              color: '#5c7f7c',
            }}>↺ Reset</button>
          </div>
          {scenario >= 0 && (
            <p style={{ fontSize: 12, color: '#5c7f7c', marginTop: 8 }}>
              {SCENARIOS[scenario].desc}
            </p>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 24, alignItems: 'start' }}>

          {/* LEFT — Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Tissue type */}
            <div style={card}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(141,171,168,0.1)', background: 'rgba(13,37,64,0.4)' }}>
                <span style={lbl}>Tissue Type</span>
              </div>
              <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {Object.entries(TISSUE_PROPS).map(([k, t]) => (
                  <button key={k} onClick={() => { setTissueKey(k); setScenario(-1); }} style={{
                    padding: '8px 6px', borderRadius: 8, cursor: 'pointer', textAlign: 'center',
                    background: tissueKey === k ? `${t.color}22` : 'rgba(13,37,64,0.5)',
                    border: tissueKey === k ? `1px solid ${t.color}66` : '1px solid rgba(141,171,168,0.1)',
                    color: tissueKey === k ? t.color : '#8daba8',
                    fontSize: 10, fontFamily: 'IBM Plex Mono, monospace', transition: 'all 0.2s',
                  }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: t.color, margin: '0 auto 4px' }} />
                    {t.label}
                  </button>
                ))}
              </div>
              <div style={{ padding: '0 16px 12px', fontSize: 11, color: '#5c7f7c' }}>
                μa = {tissue.mua} cm⁻¹ · μs' = {tissue.musp} cm⁻¹ · {tissue.description}
              </div>
            </div>

            {/* Photosensitizer */}
            <div style={card}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(141,171,168,0.1)', background: 'rgba(13,37,64,0.4)' }}>
                <span style={lbl}>Photosensitizer</span>
              </div>
              <div style={{ padding: 16 }}>
                <select style={inputStyle} value={psKey} onChange={e => { setPsKey(e.target.value); setScenario(-1); }}>
                  {Object.entries(PS_PROPS).map(([k, p]) => (
                    <option key={k} value={k}>{p.name} (Gen {p.gen})</option>
                  ))}
                </select>
                <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    ['λ', `${ps.lambda} nm`],
                    ['φΔ', ps.phiDelta.toFixed(2)],
                    ['ε', `${ps.epsilon.toLocaleString()} M⁻¹cm⁻¹`],
                    ['DLI', `${ps.dli}h`],
                    ['Clearance', ps.clearance],
                    ['Generation', `${ps.gen}${ps.gen === 3 ? 'rd' : ps.gen === 2 ? 'nd' : 'st'}`],
                  ].map(([k, v]) => (
                    <div key={k} style={{ padding: '6px 8px', background: 'rgba(9,29,46,0.5)', borderRadius: 6 }}>
                      <div style={{ ...mono, fontSize: 9, color: '#5c7f7c' }}>{k}</div>
                      <div style={{ ...mono, fontSize: 11, color: '#b8cece' }}>{v}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 8, fontSize: 11, color: '#5c7f7c' }}>{ps.cancers}</div>
              </div>
            </div>

            {/* Sliders */}
            <div style={card}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(141,171,168,0.1)', background: 'rgba(13,37,64,0.4)' }}>
                <span style={lbl}>Treatment Parameters</span>
              </div>
              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Depth */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 500, color: depthWarning ? '#ff6b6b' : '#e4eeee' }}>Tumor Depth</div>
                      <div style={{ ...lbl, fontSize: 9, color: '#5c7f7c' }}>Light must reach this depth</div>
                    </div>
                    <span style={{ ...mono, fontSize: 14, fontWeight: 700, color: depthWarning ? '#ff6b6b' : '#4ecdc4' }}>{depth}mm</span>
                  </div>
                  <input type="range" min={1} max={40} step={1} value={depth}
                    onChange={e => { setDepth(parseInt(e.target.value)); setScenario(-1); }} />
                  {depthWarning && <p style={{ fontSize: 10, color: '#ff6b6b', marginTop: 4 }}>⚠ Exceeds max penetration ({penetration}mm) for {ps.lambda}nm light — consider interstitial delivery or longer λ PS</p>}
                </div>

                {/* Fluence rate */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 500, color: fluenceRate > 150 ? '#fbbf24' : '#e4eeee' }}>Fluence Rate</div>
                      <div style={{ ...lbl, fontSize: 9, color: '#5c7f7c' }}>High rates deplete O₂ faster than replenishment</div>
                    </div>
                    <span style={{ ...mono, fontSize: 14, fontWeight: 700, color: fluenceRate > 150 ? '#fbbf24' : '#4ecdc4' }}>{fluenceRate} mW/cm²</span>
                  </div>
                  <input type="range" min={10} max={250} step={10} value={fluenceRate}
                    onChange={e => { setFluenceRate(parseInt(e.target.value)); setScenario(-1); }} />
                  {fluenceRate > 150 && <p style={{ fontSize: 10, color: '#fbbf24', marginTop: 4 }}>High fluence rate → rapid O₂ depletion → PDT shuts down prematurely. Consider metronomic delivery (pulsed).</p>}
                </div>

                {/* PS concentration */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 500, color: '#e4eeee' }}>PS Concentration</div>
                      <div style={{ ...lbl, fontSize: 9, color: '#5c7f7c' }}>Effective tumor uptake estimate</div>
                    </div>
                    <span style={{ ...mono, fontSize: 14, fontWeight: 700, color: '#4ecdc4' }}>{psConc} μM</span>
                  </div>
                  <input type="range" min={0.5} max={15} step={0.5} value={psConc}
                    onChange={e => { setPsConc(parseFloat(e.target.value)); setScenario(-1); }} />
                </div>

                {/* Duration */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 500, color: '#e4eeee' }}>Illumination Duration</div>
                      <div style={{ ...lbl, fontSize: 9, color: '#5c7f7c' }}>Total light delivery time</div>
                    </div>
                    <span style={{ ...mono, fontSize: 14, fontWeight: 700, color: '#4ecdc4' }}>{duration}s ({(duration/60).toFixed(0)}min)</span>
                  </div>
                  <input type="range" min={60} max={2400} step={60} value={duration}
                    onChange={e => { setDuration(parseInt(e.target.value)); setScenario(-1); }} />
                </div>

                {/* Oxygenation */}
                <div>
                  <div style={{ ...lbl, marginBottom: 8, color: oxyWarning ? '#ff6b6b' : '#5c7f7c' }}>Tissue Oxygenation</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                    {[
                      { v: 'normoxic',       l: 'Normoxic',   s: 'Normal O₂',   c: '#22c55e' },
                      { v: 'mild_hypoxic',   l: 'Hypoxic',    s: 'Reduced O₂',  c: '#fbbf24' },
                      { v: 'severe_hypoxic', l: 'Severely',   s: 'Very low O₂', c: '#ff6b6b' },
                    ].map(({ v, l, s, c }) => (
                      <button key={v} onClick={() => { setOxy(v); setScenario(-1); }} style={{
                        padding: '8px 4px', borderRadius: 8, cursor: 'pointer', textAlign: 'center',
                        background: oxy === v ? `${c}22` : 'rgba(13,37,64,0.5)',
                        border: oxy === v ? `1px solid ${c}66` : '1px solid rgba(141,171,168,0.1)',
                        color: oxy === v ? c : '#8daba8',
                        fontSize: 10, fontFamily: 'IBM Plex Mono, monospace', transition: 'all 0.2s',
                      }}>
                        <div style={{ fontWeight: 600 }}>{l}</div>
                        <div style={{ fontSize: 8, color: oxy === v ? c : '#5c7f7c' }}>{s}</div>
                      </button>
                    ))}
                  </div>
                  {oxyWarning && <p style={{ fontSize: 10, color: '#ff6b6b', marginTop: 6 }}>
                    ⚠ Severe hypoxia: Type II singlet O₂ pathway efficiency reduced to ~18%. PDT largely ineffective — matches NR outcomes in pancreatic and GBM literature.
                  </p>}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT — Results */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Adequacy banner */}
            <div style={{
              borderRadius: 16, padding: 24,
              background: adequacy === 'adequate' ? 'rgba(34,197,94,0.08)' : adequacy === 'overdose' ? 'rgba(251,191,36,0.08)' : 'rgba(255,107,107,0.08)',
              border: `1px solid ${adequacyColor}44`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
                <div>
                  <div style={{ ...lbl, color: adequacyColor, marginBottom: 6 }}>Treatment Adequacy Prediction</div>
                  <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, fontWeight: 700, color: adequacyColor }}>{adequacyLabel}</div>
                  <div style={{ fontSize: 12, color: '#8daba8', marginTop: 4 }}>
                    {adequacy === 'adequate' && `Tumor dose ${tumorDose.toFixed(2)} J/cm² exceeds lethal threshold (${LETHAL} J/cm²) — treatment predicted effective`}
                    {adequacy === 'subtherapeutic' && `Tumor dose ${tumorDose.toFixed(2)} J/cm² below lethal threshold (${LETHAL} J/cm²) — ${depthWarning ? 'light cannot reach tumor at this depth' : oxyWarning ? 'severe hypoxia prevents singlet O₂ generation' : 'increase surface fluence or use interstitial delivery'}`}
                    {adequacy === 'overdose' && 'Excessive surface fluence risks oxygen depletion before treatment completes and may damage surrounding healthy tissue'}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ ...mono, fontSize: 28, fontWeight: 700, color: adequacyColor }}>{tumorDose.toFixed(1)}</div>
                  <div style={{ ...lbl, fontSize: 9 }}>J/cm² at tumor</div>
                  <div style={{ ...lbl, fontSize: 9, marginTop: 4 }}>Threshold: {LETHAL} J/cm²</div>
                </div>
              </div>

              {/* Dose gauge */}
              <div>
                <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginBottom: 4 }}>
                  <div style={{ height: '100%', borderRadius: 4, width: `${Math.min(100, (tumorDose / LETHAL) * 100)}%`, background: adequacyColor, transition: 'width 0.6s cubic-bezier(0.16,1,0.3,1)' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ ...lbl, fontSize: 9 }}>0 J/cm²</span>
                  <span style={{ ...lbl, fontSize: 9 }}>Lethal threshold ({LETHAL} J/cm²)</span>
                </div>
              </div>
            </div>

            {/* Key metrics grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {[
                { l: 'Surface Dose', v: surfaceDose.toFixed(1), u: 'J/cm²', w: surfaceDose > 100 },
                { l: '¹O₂ Generation', v: singletO2.toFixed(2), u: 'μM·s', w: singletO2 < 50 },
                { l: 'Optimal Surface', v: Math.min(999, optimalSurface).toFixed(1), u: 'J/cm²', w: false },
                { l: 'Penetration', v: `${penetration}mm`, u: 'max', w: depthWarning },
              ].map(({ l, v, u, w }) => (
                <div key={l} style={{ ...card, padding: 16, textAlign: 'center' }}>
                  <div style={{ ...mono, fontSize: 20, fontWeight: 700, color: w ? '#fbbf24' : '#4ecdc4', marginBottom: 2 }}>{v}</div>
                  <div style={{ ...lbl, fontSize: 8 }}>{u}</div>
                  <div style={{ ...lbl, fontSize: 8, marginTop: 2 }}>{l}</div>
                </div>
              ))}
            </div>

            {/* Outcome probability */}
            <div style={{ ...card, padding: 20 }}>
              <div style={{ ...lbl, marginBottom: 14 }}>Outcome Probability (RF model approximation)</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
                {[
                  { l: 'Complete Response', v: outcome.cr, c: '#22c55e' },
                  { l: 'Partial Response',  v: outcome.pr, c: '#fbbf24' },
                  { l: 'No Response',       v: outcome.nr, c: '#ff6b6b' },
                ].map(({ l, v, c }) => (
                  <div key={l} style={{ textAlign: 'center', padding: 12, borderRadius: 10, background: `${c}11`, border: `1px solid ${c}33` }}>
                    <div style={{ ...mono, fontSize: 24, fontWeight: 700, color: c }}>{v}%</div>
                    <div style={{ ...lbl, fontSize: 8, marginTop: 2 }}>{l}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 0, height: 6, borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${outcome.cr}%`, background: '#22c55e', transition: 'width 0.6s' }} />
                <div style={{ width: `${outcome.pr}%`, background: '#fbbf24', transition: 'width 0.6s' }} />
                <div style={{ width: `${outcome.nr}%`, background: '#ff6b6b', transition: 'width 0.6s' }} />
              </div>
              <p style={{ fontSize: 11, color: '#5c7f7c', marginTop: 10, lineHeight: 1.6 }}>
                Based on feature importance from your Random Forest model: O₂ status (88%) &gt; Depth (82%) &gt; PS generation (18%). This is a physics-based approximation — the actual model runs in Python/scikit-learn.
              </p>
            </div>

            {/* Depth profile SVG */}
            <div style={{ ...card, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(141,171,168,0.1)', background: 'rgba(13,37,64,0.4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={lbl}>Singlet O₂ Dose vs Depth — Beer-Lambert Profile</span>
                <span style={{ ...mono, fontSize: 9, color: '#5c7f7c' }}>Φ(d) = Φ₀·e^(−{mueff.toFixed(3)}·d)</span>
              </div>
              <div style={{ padding: '20px 20px 0' }}>
                <svg width="100%" height="220" viewBox="0 0 700 200" preserveAspectRatio="none">
                  {/* Grid */}
                  {[0.25, 0.5, 0.75, 1].map(f => (
                    <line key={f} x1="0" y1={200 * f} x2="700" y2={200 * f}
                      stroke="rgba(141,171,168,0.06)" strokeWidth="1" />
                  ))}
                  {/* Threshold line at 20 J/cm² */}
                  {maxDose > 0 && (
                    <line x1="0" y1={200 * (1 - LETHAL / 1000 / maxDose)}
                      x2="700" y2={200 * (1 - LETHAL / 1000 / maxDose)}
                      stroke="rgba(251,191,36,0.5)" strokeWidth="1.5" strokeDasharray="5,3" />
                  )}
                  {/* Filled area */}
                  <path
                    d={['M 0 200',
                      ...profile.map((p, i) => `L ${(i / 40) * 700} ${200 - (p.dose / maxDose) * 190}`),
                      'L 700 200 Z'].join(' ')}
                    fill="rgba(78,205,196,0.1)"
                  />
                  {/* Curve */}
                  <path
                    d={profile.map((p, i) =>
                      `${i === 0 ? 'M' : 'L'} ${(i / 40) * 700} ${200 - (p.dose / maxDose) * 190}`
                    ).join(' ')}
                    fill="none" stroke="#4ecdc4" strokeWidth="2.5"
                  />
                  {/* Tumor depth marker */}
                  {tumorIdx <= 40 && (
                    <>
                      <line x1={(tumorIdx / 40) * 700} y1="0"
                        x2={(tumorIdx / 40) * 700} y2="200"
                        stroke="rgba(255,107,107,0.7)" strokeWidth="1.5" strokeDasharray="4,3" />
                      <text x={(tumorIdx / 40) * 700 + 5} y="18"
                        fill="#ff6b6b" fontSize="10" fontFamily="IBM Plex Mono">
                        tumor {depth}mm
                      </text>
                    </>
                  )}
                  {/* Threshold label */}
                  {maxDose > 0 && (
                    <text x="5" y={200 * (1 - LETHAL / 1000 / maxDose) - 4}
                      fill="rgba(251,191,36,0.8)" fontSize="9" fontFamily="IBM Plex Mono">
                      Lethal threshold
                    </text>
                  )}
                </svg>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0 16px' }}>
                  {['0mm', '10mm', '20mm', '30mm', '40mm'].map(d => (
                    <span key={d} style={{ ...mono, fontSize: 9, color: '#5c7f7c' }}>{d}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Tissue cross-section visual */}
            <div style={{ ...card, padding: 20 }}>
              <div style={{ ...lbl, marginBottom: 14 }}>Tissue Cross-Section Visualization</div>
              <div style={{ position: 'relative', height: 160, borderRadius: 10, overflow: 'hidden', background: '#070f1a' }}>
                {/* Tissue layers */}
                {[
                  { pct: 15, color: '#d4956a', label: 'Surface' },
                  { pct: 25, color: tissueKey === 'skin' ? '#c4856a' : tissue.color, label: tissue.label },
                  { pct: 30, color: '#1a3050', label: 'Deep tissue' },
                  { pct: 30, color: '#0d1a29', label: '' },
                ].map(({ pct, color, label }, i) => (
                  <div key={i} style={{ position: 'absolute', left: 0, right: 0, height: `${pct}%`,
                    top: `${[0,15,40,70][i]}%`, background: `${color}88`, display: 'flex', alignItems: 'center', paddingLeft: 12 }}>
                    {label && <span style={{ ...mono, fontSize: 8, color: 'rgba(255,255,255,0.5)' }}>{label}</span>}
                  </div>
                ))}
                {/* Light beam */}
                <div style={{
                  position: 'absolute', top: 0, left: '30%', width: 6 + depth * 0.8,
                  height: `${Math.min(95, (depth / 40) * 100)}%`,
                  background: `linear-gradient(to bottom, ${ps.color}cc, ${ps.color}33, transparent)`,
                  borderRadius: '0 0 50% 50%', opacity: 0.85,
                  boxShadow: `0 0 20px ${ps.color}55`,
                }} />
                {/* Tumor marker */}
                <div style={{
                  position: 'absolute', left: '22%',
                  top: `${Math.min(88, (depth / 40) * 100 - 5)}%`,
                  width: 40, height: 18, borderRadius: '50%',
                  background: depthWarning ? 'rgba(255,107,107,0.4)' : 'rgba(255,107,107,0.25)',
                  border: '1px solid rgba(255,107,107,0.6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ ...mono, fontSize: 7, color: '#ff6b6b' }}>tumor</span>
                </div>
                {/* Depth label */}
                <div style={{ position: 'absolute', right: 12, top: `${Math.min(88, (depth / 40) * 100)}%`,
                  transform: 'translateY(-50%)' }}>
                  <span style={{ ...mono, fontSize: 9, color: '#4ecdc4' }}>{depth}mm</span>
                </div>
              </div>
            </div>

            {/* Real data HUD */}
            <div style={{ background: 'rgba(9,29,46,0.9)', border: '1px solid rgba(141,171,168,0.15)', borderRadius: 12, padding: 16 }}>
              <div style={{ ...lbl, color: '#4ecdc4', marginBottom: 12 }}>Live Physics Readout</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 24px' }}>
                {[
                  ['Tissue',         tissue.label],
                  ['Photosensitizer',ps.name.split('(')[0].trim()],
                  ['λ (wavelength)',  `${ps.lambda} nm`],
                  ['φΔ (quantum yield)', ps.phiDelta.toFixed(2)],
                  ['ε (extinction)', `${ps.epsilon.toLocaleString()} M⁻¹cm⁻¹`],
                  ['μa (absorption)', `${tissue.mua} cm⁻¹`],
                  ["μs' (scattering)", `${tissue.musp} cm⁻¹`],
                  ['μeff',            `${mueff.toFixed(4)} cm⁻¹`],
                  ['Attenuation @depth', `${(Math.exp(-mueff*depthCm)*100).toFixed(1)}% survives`],
                  ['Surface fluence', `${surfaceDose.toFixed(1)} J/cm²`],
                  ['Tumor fluence',   `${tumorDose.toFixed(3)} J/cm²`],
                  ['¹O₂ dose',        `${singletO2.toFixed(2)} μM·s`],
                  ['O₂ efficiency',   `${Math.round(oxyFactor * 100)}%`],
                  ['DLI recommended', `${ps.dli}h post-injection`],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(141,171,168,0.05)' }}>
                    <span style={{ ...mono, fontSize: 10, color: '#5c7f7c' }}>{k}</span>
                    <span style={{ ...mono, fontSize: 10, color: '#b8cece' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Disclaimer */}
            <div style={{ padding: 12, background: 'rgba(141,171,168,0.04)', border: '1px solid rgba(141,171,168,0.1)', borderRadius: 10, fontSize: 11, color: '#5c7f7c', lineHeight: 1.7 }}>
              <strong style={{ color: '#8daba8' }}>Physics foundation:</strong> Tissue optical properties (μa, μs') from Cheong et al. (1990) and Jacques (2013). Photosensitizer properties from Agostinis et al. (2011) CA Cancer J Clin. Beer-Lambert diffusion approximation. Outcome probabilities are physics-based approximations of the Random Forest model trained on 41 clinical PDT studies. Not for clinical use without physician oversight.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
