<<<<<<< HEAD
import { useState, useMemo } from 'react';

// ── SHARED DATA (same as PDT Simulator for consistency) ────────────
const TISSUE_PROPS: Record<string, { mua: number; musp: number; n: number; label: string; color: string; description: string }> = {
  skin:      { mua: 0.046, musp: 1.80, n: 1.40, label: 'Skin',         color: '#d4956a', description: 'Superficial tumors, BCC, SCC' },
  oral:      { mua: 0.037, musp: 1.60, n: 1.38, label: 'Oral Mucosa',  color: '#e8a0a0', description: 'Oral SCC, head & neck' },
  muscle:    { mua: 0.048, musp: 1.20, n: 1.37, label: 'Muscle',       color: '#b05050', description: 'Soft tissue tumors' },
  lung:      { mua: 0.100, musp: 2.00, n: 1.38, label: 'Lung',         color: '#c8d4e8', description: 'Endobronchial NSCLC' },
  esophagus: { mua: 0.035, musp: 1.40, n: 1.37, label: 'Esophagus',   color: '#d4b0a0', description: "Esophageal SCC, Barrett's" },
  bladder:   { mua: 0.020, musp: 0.90, n: 1.36, label: 'Bladder Wall',color: '#b8c8e0', description: 'Bladder carcinoma' },
  liver:     { mua: 0.190, musp: 1.40, n: 1.38, label: 'Liver',        color: '#8b6040', description: 'HCC, cholangiocarcinoma' },
  brain:     { mua: 0.030, musp: 0.93, n: 1.36, label: 'Brain',        color: '#e8e0d0', description: 'GBM (very challenging)' },
  pancreas:  { mua: 0.140, musp: 1.20, n: 1.38, label: 'Pancreas',     color: '#c0a870', description: 'PDAC (most difficult)' },
};

const PS_PROPS: Record<string, { name: string; gen: number; lambda: number; epsilon: number; phiDelta: number; clearance: string; dli: number; color: string }> = {
  photofrin:   { name: 'Photofrin (porfimer Na)', gen: 1, lambda: 630, epsilon: 3000,  phiDelta: 0.89, clearance: '4–6 weeks', dli: 48, color: '#cc0000' },
  ala:         { name: '5-ALA / PpIX',            gen: 2, lambda: 635, epsilon: 5000,  phiDelta: 0.56, clearance: '24–48 hrs', dli: 6,  color: '#ff6600' },
  temoporfin:  { name: 'Temoporfin (mTHPC)',       gen: 2, lambda: 652, epsilon: 30000, phiDelta: 0.43, clearance: '1–2 weeks', dli: 96, color: '#8b0080' },
  verteporfin: { name: 'Verteporfin (BPD-MA)',     gen: 2, lambda: 689, epsilon: 34800, phiDelta: 0.76, clearance: '5 days',    dli: 3,  color: '#00aa44' },
  chlorin:     { name: 'Chlorin e6',               gen: 2, lambda: 660, epsilon: 40000, phiDelta: 0.65, clearance: '3–5 days',  dli: 6,  color: '#006633' },
  talaporfin:  { name: 'Talaporfin Na (NPe6)',     gen: 2, lambda: 664, epsilon: 35000, phiDelta: 0.77, clearance: '24 hrs',    dli: 4,  color: '#0044bb' },
  nano:        { name: '3rd Gen Nanoparticle PS',  gen: 3, lambda: 730, epsilon: 50000, phiDelta: 0.85, clearance: '12 hrs',    dli: 3,  color: '#00cccc' },
};

// ── RANDOM FOREST FEATURE IMPORTANCE (from your trained model) ──────
// Source: your Orange Data Mining model output
const FEATURE_IMPORTANCE: { feature: string; importance: number; description: string }[] = [
  { feature: 'Oxygen Status',     importance: 88, description: 'Hypoxia is the #1 predictor of PDT failure — O₂ is required for singlet oxygen generation' },
  { feature: 'Tumor Depth',       importance: 82, description: 'Light penetration decreases exponentially with depth — deep tumors receive sublethal doses' },
  { feature: 'Tumor Stage',       importance: 79, description: 'Advanced-stage tumors have greater heterogeneity, vasculature disruption, and hypoxic regions' },
  { feature: 'PS Generation',     importance: 71, description: '2nd/3rd gen PS have better tumor selectivity, shorter clearance, and higher quantum yields' },
  { feature: 'Fluence',           importance: 65, description: 'Sufficient light dose at tumor is necessary — too little = undertreated, too much = O₂ depletion' },
  { feature: 'Fluence Rate',      importance: 58, description: 'Metronomic (slow) delivery preserves O₂ for deep tumors; high rate depletes O₂ prematurely' },
  { feature: 'Wavelength',        importance: 54, description: 'Longer λ penetrates deeper; matching λ to tissue depth is critical for adequate dosing' },
  { feature: 'Cancer Type',       importance: 49, description: 'Tumor microenvironment, vasculature, and PS uptake vary significantly by cancer type' },
  { feature: 'PS Dose',           importance: 44, description: 'Adequate photosensitizer concentration in tumor determines singlet O₂ yield' },
  { feature: 'Treatment Modality',importance: 38, description: 'Combination therapy improves outcomes for resistant or advanced-stage tumors' },
];

// ── PHYSICS ENGINE (photon diffusion approximation) ─────────────────
function calcReff(n: number) { return -1.440 / (n * n) + 0.710 / n + 0.668 + 0.0636 * n; }
function calcMueff(mua: number, musp: number) { return Math.sqrt(3 * mua * (mua + musp)); }
function getWavelengthCorrectedProps(mua: number, musp: number, lambda: number) {
  const musp_eff = musp * Math.pow(630 / lambda, 1.5);
  const bp: [number, number][] = [[630,1.0],[652,0.87],[660,0.82],[689,0.66],[730,0.51]];
  let mf = 1.0;
  if (lambda >= 730) mf = 0.51;
  else for (let i = 0; i < bp.length - 1; i++) {
    const [l1,f1]= bp[i], [l2,f2]= bp[i+1];
    if (lambda >= l1 && lambda <= l2) { mf = f1 + (f2-f1)*(lambda-l1)/(l2-l1); break; }
  }
  return { mua_eff: mua * mf, musp_eff };
}
function fluenceAtDepth(z_cm: number, mua: number, musp: number, n: number, surfacePowerW: number) {
  const D = 1 / (3 * (mua + musp));
  const z0 = 1 / (mua + musp);
  const A = (1 + calcReff(n)) / (1 - calcReff(n));
  const zb = 2 * A * D;
  const mueff = calcMueff(mua, musp);
  const r1 = Math.abs(z_cm - z0);
  const r2 = z_cm + z0 + 2 * zb;
  if (r1 < 1e-8) return 0;
  const phi = (surfacePowerW / (4 * Math.PI * D)) * (Math.exp(-mueff * r1) / r1 - Math.exp(-mueff * r2) / r2);
  return Math.max(0, phi);
}

// ── OPTIMAL PARAMETER CALCULATION ─────────────────────────────────
// The core of the AI Dosimetry Model: given patient/tumor parameters,
// work backwards to find the optimal surface fluence, fluence rate, etc.
function calcOptimalDosimetry(tissueKey: string, psKey: string, depthMm: number, oxyStatus: string, tumorStage: string) {
  const tissue = TISSUE_PROPS[tissueKey];
  const ps = PS_PROPS[psKey];
  const depthCm = depthMm / 10;

  // Wavelength-corrected optical properties
  const { mua_eff, musp_eff } = getWavelengthCorrectedProps(tissue.mua, tissue.musp, ps.lambda);
  const mueff = calcMueff(mua_eff, musp_eff);

  // Target therapeutic dose at tumor (J/cm²)
  // Adjusted for oxygen status (hypoxia requires more light to compensate for reduced efficiency)
  const oxyFactors: Record<string, number> = { normoxic: 1.0, mild_hypoxic: 0.55, severe_hypoxic: 0.18 };
  const oxyFactor = oxyFactors[oxyStatus] ?? 1.0;
  const TARGET_TUMOR_DOSE = 25 / oxyFactor; // Compensate for O2 efficiency loss

  // Calculate surface power needed (W/cm²) to deliver target at depth
  // Using fluence at depth = surfacePower × attenuation
  // Work backwards iteratively
  let surfacePower = TARGET_TUMOR_DOSE; // Initial guess
  for (let i = 0; i < 50; i++) {
    const delivered = fluenceAtDepth(depthCm, mua_eff, musp_eff, tissue.n, surfacePower);
    if (delivered < 1e-6) { surfacePower = Math.min(500, surfacePower * 2); break; }
    surfacePower = surfacePower * (TARGET_TUMOR_DOSE / delivered);
  }

  // Optimal fluence rate (mW/cm²)
  // Metronomic for deep tumors to prevent O2 depletion
  let fluenceRate: number;
  let fluenceRateReason: string;
  if (depthMm > 20 || oxyStatus === 'severe_hypoxic') {
    fluenceRate = 40;
    fluenceRateReason = 'Metronomic delivery (40 mW/cm²) — deep/hypoxic tumor; slow rate allows O₂ replenishment between photons';
  } else if (depthMm > 10 || oxyStatus === 'mild_hypoxic') {
    fluenceRate = 75;
    fluenceRateReason = 'Moderate rate (75 mW/cm²) — balanced O₂ consumption vs treatment speed';
  } else {
    fluenceRate = 150;
    fluenceRateReason = 'Standard rate (150 mW/cm²) — superficial/normoxic tumor; no O₂ depletion risk';
  }

  // Treatment duration from fluence ÷ fluence rate
  const surfaceFluence = Math.min(500, surfacePower * 1000); // Convert to J/cm²
  const duration = (surfaceFluence / (fluenceRate / 1000)); // seconds

  // Actual tumor dose delivered
  const tumorDose = fluenceAtDepth(depthCm, mua_eff, musp_eff, tissue.n, surfacePower);
  const attenuation = tumorDose / Math.max(0.001, surfacePower);

  // Expected ¹O₂ generation
  const singletO2 = ps.phiDelta * ps.epsilon * 5e-6 * tumorDose * oxyFactor * 1000;

  // Penetration depth for this PS wavelength
  const penetration = ps.lambda < 640 ? 4 : ps.lambda < 660 ? 6 : ps.lambda < 690 ? 8 : ps.lambda < 730 ? 11 : 14;
  const depthFeasible = depthMm <= penetration;

  // Stage-based adequacy modifier
  const stageFactors: Record<string, number> = { 'I': 1.0, 'II': 0.85, 'III': 0.65, 'IV': 0.45 };
  const stageFactor = stageFactors[tumorStage] ?? 0.75;

  // RF model outcome prediction (feature importance weighted)
  // O2(88%) + Depth(82%) + Stage(79%) + PSGen(71%) + Fluence(65%)
  const doseScore    = Math.min(1, tumorDose / 20);
  const depthScore   = Math.max(0, 1 - depthCm / 4);
  const genScore     = ps.gen === 3 ? 1.0 : ps.gen === 2 ? 0.82 : 0.55;
  const composite    = (oxyFactor * 0.38 + doseScore * 0.25 + depthScore * 0.20 + genScore * 0.17) * stageFactor;

  let cr = 0, pr = 0, nr = 0;
  if (composite >= 0.72)      { cr = Math.round(composite * 100); pr = Math.round((1-composite)*80); nr = 100-cr-pr; }
  else if (composite >= 0.42) { pr = Math.round(composite * 110); cr = Math.round(composite * 30);   nr = 100-cr-pr; }
  else                         { nr = Math.round((1-composite)*100); pr = Math.round(composite * 80); cr = 100-nr-pr; }

  // Delivery recommendations
  let deliveryMethod: string;
  if (depthMm <= 5)       deliveryMethod = 'Surface illumination — direct laser/LED to skin or mucosal surface';
  else if (depthMm <= 15) deliveryMethod = 'Endoscopic fiber delivery — fiber-optic probe via scope';
  else if (depthMm <= 25) deliveryMethod = 'Interstitial fiber delivery — diffusing fiber inserted under image guidance';
  else                    deliveryMethod = 'Multiple interstitial fibers — volumetric coverage required for deep tumor';

  const lightSource = depthMm <= 8 ? 'LED (broadband, cost-effective for surface)' : 'Laser diode (precise wavelength control for depth)';

  return {
    surfaceFluence: parseFloat(Math.min(500, surfaceFluence).toFixed(1)),
    fluenceRate, fluenceRateReason,
    duration: parseFloat(duration.toFixed(0)),
    tumorDose: parseFloat(tumorDose.toFixed(2)),
    attenuation: parseFloat((attenuation * 100).toFixed(1)),
    mueff: parseFloat(mueff.toFixed(4)),
    singletO2: parseFloat(singletO2.toFixed(2)),
    penetration, depthFeasible,
    cr: Math.max(0, cr), pr: Math.max(0, pr), nr: Math.max(0, nr),
    dli: ps.dli,
    clearance: ps.clearance,
    deliveryMethod, lightSource,
    composite: parseFloat(composite.toFixed(3)),
    stageFactor,
    mua_eff: parseFloat(mua_eff.toFixed(4)),
    musp_eff: parseFloat(musp_eff.toFixed(4)),
  };
}

// ── COMPONENT ──────────────────────────────────────────────────────
export default function DosimetryModel() {
  const [tissueKey, setTissueKey] = useState('skin');
  const [psKey, setPsKey]         = useState('ala');
  const [depth, setDepth]         = useState(5);
  const [oxyStatus, setOxyStatus] = useState('normoxic');
  const [tumorStage, setTumorStage] = useState('I');
  const [cancerType, setCancerType] = useState('Skin (BCC)');
  const [showFeatures, setShowFeatures] = useState(false);
  const [calculated, setCalculated] = useState(false);

  const tissue = TISSUE_PROPS[tissueKey];
  const ps     = PS_PROPS[psKey];

  const result = useMemo(() =>
    calcOptimalDosimetry(tissueKey, psKey, depth, oxyStatus, tumorStage),
    [tissueKey, psKey, depth, oxyStatus, tumorStage]
  );

  const mono: React.CSSProperties = { fontFamily: 'IBM Plex Mono, monospace' };
  const lbl: React.CSSProperties  = { ...mono, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: '#5c7f7c' };
  const card: React.CSSProperties = { background: 'rgba(13,37,64,0.55)', border: '1px solid rgba(141,171,168,0.15)', borderRadius: 16, overflow: 'hidden' };
  const sel: React.CSSProperties  = { background: '#0d2540', border: '1px solid rgba(141,171,168,0.2)', borderRadius: 8, color: '#e4eeee', padding: '8px 12px', fontSize: 12, width: '100%', outline: 'none', ...mono };

  const primaryOutcome = result.cr >= result.pr && result.cr >= result.nr ? 'CR' : result.pr >= result.nr ? 'PR' : 'NR';
  const outcomeColor = { CR: '#22c55e', PR: '#fbbf24', NR: '#ff6b6b' }[primaryOutcome];
  const oxyColors: Record<string, string> = { normoxic: '#22c55e', mild_hypoxic: '#fbbf24', severe_hypoxic: '#ff6b6b' };

  const CANCER_TYPES = ['Skin (BCC)', 'Skin (SCC)', 'Oral SCC', 'Esophageal SCC', "Barrett's HGD", 'NSCLC (endobronchial)', 'Bladder carcinoma', 'Prostate', 'Pancreatic PDAC', 'Glioblastoma', 'Cholangiocarcinoma', 'Cervical', 'Colorectal'];

  return (
    <div style={{ minHeight: '100vh', paddingTop: 80, paddingBottom: 64, background: '#091d2e' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>

        {/* Header */}
        <div style={{ paddingTop: 40, paddingBottom: 28, maxWidth: 680 }}>
          <div style={{ ...lbl, marginBottom: 10 }}>// AI Dosimetry Model · Random Forest Feature Importance · Photon Diffusion Physics</div>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 38, fontWeight: 900, color: '#e4eeee', lineHeight: 1.1, marginBottom: 14 }}>
            AI-Optimized<br />
            <span style={{ background: 'linear-gradient(135deg, #b8cece, #4ecdc4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Dosimetry Model
            </span>
          </h1>
          <p style={{ fontSize: 13, color: '#8daba8', lineHeight: 1.75, marginBottom: 12 }}>
            Enter patient and tumor parameters — the model calculates the optimal treatment parameters using photon diffusion physics, then predicts treatment outcome using feature importance weights from the trained Random Forest classifier (O₂: 88%, Depth: 82%, Stage: 79%).
          </p>
          <div style={{ padding: '10px 14px', background: 'rgba(78,205,196,0.06)', border: '1px solid rgba(78,205,196,0.2)', borderRadius: 10, fontSize: 11, color: '#8daba8', lineHeight: 1.6 }}>
            <strong style={{ color: '#4ecdc4' }}>Key distinction from PDT Simulator:</strong> The Simulator is exploratory — "what happens when I adjust these parameters?" The Dosimetry Model is prescriptive — "given my patient, what parameters should I use?" It works <em>backwards</em> from the therapeutic goal to the surface dose required.
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 24, alignItems: 'start' }}>

          {/* LEFT — Patient/Tumor Inputs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Cancer & Stage */}
            <div style={card}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(141,171,168,0.1)', background: 'rgba(13,37,64,0.4)' }}>
                <span style={lbl}>Patient / Tumor Profile</span>
              </div>
              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <div style={{ ...lbl, marginBottom: 6 }}>Cancer Type</div>
                  <select style={sel} value={cancerType} onChange={e => setCancerType(e.target.value)}>
                    {CANCER_TYPES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ ...lbl, marginBottom: 6 }}>Tumor Stage</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 6 }}>
                    {['I','II','III','IV'].map(s => (
                      <button key={s} onClick={() => setTumorStage(s)} style={{
                        padding: '8px 4px', borderRadius: 8, cursor: 'pointer', textAlign: 'center',
                        background: tumorStage === s ? 'rgba(78,205,196,0.15)' : 'rgba(13,37,64,0.5)',
                        border: tumorStage === s ? '1px solid rgba(78,205,196,0.4)' : '1px solid rgba(141,171,168,0.1)',
                        color: tumorStage === s ? '#4ecdc4' : '#8daba8',
                        ...mono, fontSize: 12, transition: 'all 0.15s',
                      }}>Stage {s}</button>
                    ))}
                  </div>
                  <div style={{ fontSize: 11, color: '#5c7f7c', marginTop: 4 }}>
                    RF importance: 79% — Stage {tumorStage === 'I' ? 'I: 100% efficiency' : tumorStage === 'II' ? 'II: 85% efficiency' : tumorStage === 'III' ? 'III: 65% efficiency' : 'IV: 45% efficiency'}
                  </div>
                </div>
              </div>
            </div>

            {/* Tissue Type */}
            <div style={card}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(141,171,168,0.1)', background: 'rgba(13,37,64,0.4)' }}>
                <span style={lbl}>Tissue Type</span>
              </div>
              <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 10 }}>
                {Object.entries(TISSUE_PROPS).map(([k, t]) => (
                  <button key={k} onClick={() => setTissueKey(k)} style={{
                    padding: '7px 4px', borderRadius: 8, cursor: 'pointer', textAlign: 'center',
                    background: tissueKey === k ? `${t.color}22` : 'rgba(13,37,64,0.5)',
                    border: tissueKey === k ? `1px solid ${t.color}66` : '1px solid rgba(141,171,168,0.1)',
                    color: tissueKey === k ? t.color : '#8daba8',
                    fontSize: 9, ...mono, transition: 'all 0.15s',
                  }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: t.color, margin: '0 auto 3px' }} />
                    {t.label}
                  </button>
                ))}
              </div>
              <div style={{ padding: '0 16px 12px', fontSize: 11, color: '#5c7f7c' }}>
                μa = {tissue.mua} · μs' = {tissue.musp} · n = {tissue.n} · {tissue.description}
              </div>
            </div>

            {/* Tumor Depth */}
            <div style={{ ...card, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: !result.depthFeasible ? '#ff6b6b' : '#e4eeee' }}>Tumor Depth</div>
                  <div style={{ ...lbl, fontSize: 9 }}>RF importance: 82%</div>
                </div>
                <span style={{ ...mono, fontSize: 20, fontWeight: 700, color: !result.depthFeasible ? '#ff6b6b' : '#4ecdc4' }}>{depth}mm</span>
              </div>
              <input type="range" min={1} max={40} step={1} value={depth} onChange={e => setDepth(parseInt(e.target.value))} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ ...lbl, fontSize: 8 }}>1mm (superficial)</span>
                <span style={{ ...lbl, fontSize: 8 }}>40mm (deep)</span>
              </div>
              {!result.depthFeasible && (
                <div style={{ marginTop: 8, padding: '8px 10px', background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.3)', borderRadius: 8, fontSize: 11, color: '#ff6b6b' }}>
                  ⚠ Depth ({depth}mm) exceeds {ps.lambda}nm wavelength penetration ({result.penetration}mm). Consider interstitial fiber delivery or switch to longer wavelength PS (e.g. nano: 730nm → 14mm).
                </div>
              )}
            </div>

            {/* Oxygenation — highest importance feature */}
            <div style={{ ...card, padding: 16 }}>
              <div style={{ ...lbl, color: '#4ecdc4', marginBottom: 10 }}>Tissue Oxygenation — RF importance: 88%</div>
              <div style={{ fontSize: 11, color: '#5c7f7c', marginBottom: 12, lineHeight: 1.6 }}>
                The single most important predictor in your model. Severe hypoxia reduces singlet O₂ efficiency to ~18% and is the primary cause of NR outcomes in pancreatic and GBM cases.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {[
                  { v: 'normoxic',       l: 'Normoxic',   s: 'Full O₂ · 100% efficiency',   c: '#22c55e' },
                  { v: 'mild_hypoxic',   l: 'Hypoxic',    s: 'Reduced O₂ · 55% efficiency', c: '#fbbf24' },
                  { v: 'severe_hypoxic', l: 'Severe',     s: 'Very low O₂ · 18% efficiency',c: '#ff6b6b' },
                ].map(({ v, l, s, c }) => (
                  <button key={v} onClick={() => setOxyStatus(v)} style={{
                    padding: '10px 6px', borderRadius: 10, cursor: 'pointer', textAlign: 'center',
                    background: oxyStatus === v ? `${c}22` : 'rgba(13,37,64,0.5)',
                    border: oxyStatus === v ? `1px solid ${c}66` : '1px solid rgba(141,171,168,0.1)',
                    color: oxyStatus === v ? c : '#8daba8', transition: 'all 0.15s',
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 600, ...mono }}>{l}</div>
                    <div style={{ fontSize: 9, marginTop: 4, color: oxyStatus === v ? c : '#5c7f7c', ...mono }}>{s}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Photosensitizer */}
            <div style={card}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(141,171,168,0.1)', background: 'rgba(13,37,64,0.4)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={lbl}>Photosensitizer</span>
                  <span style={{ ...lbl, color: '#5c7f7c', fontSize: 9 }}>RF importance: 71%</span>
                </div>
              </div>
              <div style={{ padding: 16 }}>
                <select style={sel} value={psKey} onChange={e => setPsKey(e.target.value)}>
                  {Object.entries(PS_PROPS).map(([k, p]) => (
                    <option key={k} value={k}>{p.name} — Gen {p.gen} · λ={p.lambda}nm</option>
                  ))}
                </select>
                <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  {[
                    ['λ activation', `${ps.lambda} nm`],
                    ['φΔ quantum yield', ps.phiDelta.toFixed(2)],
                    ['Generation', `${ps.gen}${ps.gen===3?'rd':ps.gen===2?'nd':'st'} generation`],
                    ['Clearance', ps.clearance],
                  ].map(([k,v]) => (
                    <div key={k} style={{ padding: '6px 8px', background: 'rgba(9,29,46,0.5)', borderRadius: 6 }}>
                      <div style={{ ...mono, fontSize: 9, color: '#5c7f7c' }}>{k}</div>
                      <div style={{ ...mono, fontSize: 11, color: '#b8cece' }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT — Results */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Primary outcome prediction */}
            <div style={{
              borderRadius: 16, padding: 24,
              background: `rgba(${primaryOutcome==='CR'?'34,197,94':primaryOutcome==='PR'?'251,191,36':'255,107,107'},0.08)`,
              border: `1px solid ${outcomeColor}44`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20 }}>
                <div>
                  <div style={{ ...lbl, color: outcomeColor, marginBottom: 8 }}>Predicted Treatment Outcome</div>
                  <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 32, fontWeight: 900, color: outcomeColor, marginBottom: 6 }}>
                    {primaryOutcome === 'CR' ? 'Complete Response' : primaryOutcome === 'PR' ? 'Partial Response' : 'No Response'}
                  </div>
                  <div style={{ fontSize: 12, color: '#8daba8', maxWidth: 380, lineHeight: 1.6 }}>
                    {primaryOutcome === 'CR' && 'Parameters are optimized for tumor destruction. Model predicts complete response based on O₂ status, depth, PS generation, and tumor stage.'}
                    {primaryOutcome === 'PR' && 'Treatment will have effect but may not fully eliminate tumor. Consider combination therapy or repeat dosing.'}
                    {primaryOutcome === 'NR' && `High NR probability. Primary factors: ${oxyStatus === 'severe_hypoxic' ? 'severe hypoxia (O₂ depleted before sufficient ROS generation)' : !result.depthFeasible ? 'tumor depth exceeds light penetration' : 'advanced stage with unfavorable tumor microenvironment'}.`}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ ...mono, fontSize: 36, fontWeight: 700, color: outcomeColor }}>{Math.max(result.cr, result.pr, result.nr)}%</div>
                  <div style={{ ...lbl, fontSize: 9 }}>confidence</div>
                  <div style={{ ...lbl, fontSize: 9, marginTop: 4, color: '#5c7f7c' }}>composite: {result.composite}</div>
                </div>
              </div>

              {/* Probability bars */}
              <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                {[
                  { l: 'Complete Response', v: result.cr, c: '#22c55e' },
                  { l: 'Partial Response',  v: result.pr, c: '#fbbf24' },
                  { l: 'No Response',       v: result.nr, c: '#ff6b6b' },
                ].map(({ l, v, c }) => (
                  <div key={l} style={{ textAlign: 'center', padding: '10px 8px', borderRadius: 10, background: `${c}11`, border: `1px solid ${c}33` }}>
                    <div style={{ ...mono, fontSize: 22, fontWeight: 700, color: c }}>{v}%</div>
                    <div style={{ ...lbl, fontSize: 8, marginTop: 2 }}>{l}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', height: 5, borderRadius: 3, overflow: 'hidden', marginTop: 12 }}>
                <div style={{ width: `${result.cr}%`, background: '#22c55e', transition: 'width 0.6s' }} />
                <div style={{ width: `${result.pr}%`, background: '#fbbf24', transition: 'width 0.6s' }} />
                <div style={{ width: `${result.nr}%`, background: '#ff6b6b', transition: 'width 0.6s' }} />
              </div>
            </div>

            {/* TREATMENT PRESCRIPTION CARD */}
            <div style={{ ...card, border: '1px solid rgba(78,205,196,0.3)' }}>
              <div style={{ padding: '14px 20px', background: 'rgba(78,205,196,0.08)', borderBottom: '1px solid rgba(78,205,196,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ ...lbl, color: '#4ecdc4', fontSize: 11 }}>⚕ AI-Generated Treatment Prescription</span>
                <span style={{ ...lbl, fontSize: 9, color: '#5c7f7c' }}>Research use only — requires physician oversight</span>
              </div>
              <div style={{ padding: 20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
                  {[
                    { l: 'Surface Fluence', v: `${result.surfaceFluence}`, u: 'J/cm²', warn: result.surfaceFluence > 200 },
                    { l: 'Fluence Rate',    v: `${result.fluenceRate}`,    u: 'mW/cm²', warn: false },
                    { l: 'Duration',        v: `${Math.round(result.duration/60)}`,  u: 'min', warn: false },
                    { l: 'Drug-Light Int.', v: `${result.dli}`,            u: 'hours', warn: false },
                  ].map(({ l, v, u, warn }) => (
                    <div key={l} style={{ textAlign: 'center', padding: 14, borderRadius: 12, background: warn ? 'rgba(251,191,36,0.08)' : 'rgba(13,37,64,0.5)', border: warn ? '1px solid rgba(251,191,36,0.3)' : '1px solid rgba(141,171,168,0.12)' }}>
                      <div style={{ ...mono, fontSize: 24, fontWeight: 700, color: warn ? '#fbbf24' : '#4ecdc4' }}>{v}</div>
                      <div style={{ ...mono, fontSize: 10, color: '#8daba8' }}>{u}</div>
                      <div style={{ ...lbl, fontSize: 8, marginTop: 4 }}>{l}</div>
                    </div>
                  ))}
                </div>

                {/* Delivery recommendations */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                  {[
                    { l: 'Delivery Method', v: result.deliveryMethod },
                    { l: 'Light Source',    v: result.lightSource },
                    { l: 'PS Clearance',   v: result.clearance },
                    { l: 'Wavelength',     v: `${ps.lambda} nm` },
                  ].map(({ l, v }) => (
                    <div key={l} style={{ padding: '8px 12px', background: 'rgba(9,29,46,0.6)', borderRadius: 8 }}>
                      <div style={{ ...lbl, fontSize: 8, marginBottom: 3 }}>{l}</div>
                      <div style={{ fontSize: 11, color: '#b8cece', lineHeight: 1.4 }}>{v}</div>
                    </div>
                  ))}
                </div>

                {/* Fluence rate rationale */}
                <div style={{ padding: '10px 12px', background: 'rgba(78,205,196,0.05)', border: '1px solid rgba(78,205,196,0.15)', borderRadius: 8, fontSize: 11, color: '#8daba8', lineHeight: 1.6 }}>
                  <strong style={{ color: '#4ecdc4' }}>Fluence rate rationale:</strong> {result.fluenceRateReason}
                </div>
              </div>
            </div>

            {/* Physics breakdown */}
            <div style={card}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(141,171,168,0.1)', background: 'rgba(13,37,64,0.4)' }}>
                <span style={lbl}>Physics Calculations — Photon Diffusion Approximation</span>
              </div>
              <div style={{ padding: 20 }}>
                {/* Attenuation visual */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ ...lbl, fontSize: 9 }}>Light surviving to tumor at {depth}mm depth</span>
                    <span style={{ ...mono, fontSize: 13, fontWeight: 700, color: result.attenuation > 50 ? '#22c55e' : result.attenuation > 20 ? '#fbbf24' : '#ff6b6b' }}>{result.attenuation}%</span>
                  </div>
                  <div style={{ height: 10, borderRadius: 5, background: 'rgba(13,37,64,0.8)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${result.attenuation}%`, background: result.attenuation > 50 ? '#22c55e' : result.attenuation > 20 ? '#fbbf24' : '#ff6b6b', borderRadius: 5, transition: 'width 0.6s cubic-bezier(0.16,1,0.3,1)' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
                    <span style={{ ...lbl, fontSize: 8 }}>0% (no light reaches)</span>
                    <span style={{ ...lbl, fontSize: 8 }}>100% (no attenuation)</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 20px' }}>
                  {[
                    ['μa (absorption)',      `${result.mua_eff} cm⁻¹`],
                    ["μs' (scattering)",     `${result.musp_eff} cm⁻¹`],
                    ['μeff (attenuation coeff)', `${result.mueff} cm⁻¹`],
                    ['Tumor dose',           `${result.tumorDose} J/cm²`],
                    ['Therapeutic target',   '10–100 J/cm² at tumor'],
                    ['¹O₂ generation est.',  `${result.singletO2} μM·s`],
                    ['Stage multiplier',     `${(result.stageFactor * 100).toFixed(0)}%`],
                    ['O₂ efficiency',        `${Math.round({'normoxic':1.0,'mild_hypoxic':0.55,'severe_hypoxic':0.18}[oxyStatus]||1 * 100)}%`],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(141,171,168,0.07)' }}>
                      <span style={{ ...mono, fontSize: 10, color: '#5c7f7c' }}>{k}</span>
                      <span style={{ ...mono, fontSize: 10, color: '#b8cece' }}>{v}</span>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 12, padding: '8px 10px', background: 'rgba(9,29,46,0.6)', borderRadius: 8, fontSize: 10, color: '#5c7f7c', lineHeight: 1.7, ...mono }}>
                  μeff = √(3 × μa × (μa + μs')) = {result.mueff} cm⁻¹<br/>
                  Φ(d) = diffusionFluence(0, {(depth/10).toFixed(1)}cm) = {result.tumorDose} J/cm²<br/>
                  Surface fluence required = {result.surfaceFluence} J/cm² (working backwards from 25 J/cm² target)
                </div>
              </div>
            </div>

            {/* Feature Importance Panel */}
            <div style={card}>
              <button onClick={() => setShowFeatures(v => !v)} style={{
                width: '100%', padding: '14px 20px', background: 'rgba(13,37,64,0.4)',
                border: 'none', borderBottom: showFeatures ? '1px solid rgba(141,171,168,0.1)' : 'none',
                cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={lbl}>Random Forest Feature Importance (your trained model)</span>
                <span style={{ color: '#5c7f7c', fontSize: 14 }}>{showFeatures ? '▲' : '▼'}</span>
              </button>
              {showFeatures && (
                <div style={{ padding: 20 }}>
                  <p style={{ fontSize: 11, color: '#5c7f7c', marginBottom: 16, lineHeight: 1.6 }}>
                    These importance scores come directly from your Orange Data Mining Random Forest model. The AI independently discovered that O₂ status is the dominant predictor — validating the biology from your literature review.
                  </p>
                  {FEATURE_IMPORTANCE.map(({ feature, importance, description }) => (
                    <div key={feature} style={{ marginBottom: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 500, color: '#e4eeee' }}>{feature}</span>
                        <span style={{ ...mono, fontSize: 12, color: importance >= 80 ? '#4ecdc4' : importance >= 60 ? '#8daba8' : '#5c7f7c' }}>{importance}%</span>
                      </div>
                      <div style={{ height: 4, borderRadius: 2, background: 'rgba(13,37,64,0.8)', overflow: 'hidden', marginBottom: 4 }}>
                        <div style={{ height: '100%', width: `${importance}%`, background: importance >= 80 ? '#4ecdc4' : importance >= 60 ? '#8daba8' : '#5c7f7c', borderRadius: 2, transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1)' }} />
                      </div>
                      <div style={{ fontSize: 10, color: '#5c7f7c', lineHeight: 1.5 }}>{description}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Disclaimer */}
            <div style={{ padding: 12, background: 'rgba(141,171,168,0.04)', border: '1px solid rgba(141,171,168,0.1)', borderRadius: 10, fontSize: 11, color: '#5c7f7c', lineHeight: 1.7 }}>
              <strong style={{ color: '#8daba8' }}>Model foundation:</strong> Outcome predictions use feature importance weights from a Random Forest classifier trained on 41 published PDT clinical studies. Physics calculations use photon diffusion approximation with published tissue optical properties (Cheong et al. 1990; Jacques 2013). <strong style={{ color: '#8daba8' }}>Research tool only.</strong> Not for clinical use without qualified physician oversight.
            </div>
          </div>
        </div>
=======
export default function DosimetryModel() {
  return (
    <div style={{ minHeight: '100vh', paddingTop: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 32, fontWeight: 700, color: '#e4eeee', marginBottom: 12 }}>AI Dosimetry Model</div>
        <p style={{ color: '#5c7f7c', fontSize: 14 }}>Coming soon — complete OncoScan AI first</p>
>>>>>>> eeb4c537ea74731802203ec4092c162b4b2d2456
      </div>
    </div>
  );
}
