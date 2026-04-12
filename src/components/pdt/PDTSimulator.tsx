<<<<<<< HEAD
// ════════════════════════════════════════════════════════════════════════
//  PDT SIMULATOR — DARK MEDICAL EDITION
//  Upgrades: Background Beams + Stars · Bento Grid · Moving Border ·
//            Animated Numbers · Physics Tooltips
// ════════════════════════════════════════════════════════════════════════
import {
  useState, useEffect, useRef, useCallback, useId,
  type FC, type ReactNode, type RefObject,
} from "react";
import {
  motion, useAnimationFrame, useMotionTemplate,
  useMotionValue, useTransform, useSpring,
  AnimatePresence, useAnimate, stagger as motionStagger,
} from "motion/react";

// ═══════════════════════════════════════════════════════════════════
// TISSUE OPTICAL PROPERTIES — at reference λ=630nm
// ═══════════════════════════════════════════════════════════════════
const TISSUE_PROPS: Record<string, { mua: number; musp: number; n: number; label: string; color: string; description: string }> = {
  skin:      { mua: 0.046, musp: 1.80, n: 1.40, label: 'Skin',          color: '#d4956a', description: 'Superficial tumors, actinic keratosis, BCC' },
  oral:      { mua: 0.037, musp: 1.60, n: 1.38, label: 'Oral Mucosa',   color: '#e8a0a0', description: 'Oral SCC, head & neck tumors' },
  muscle:    { mua: 0.048, musp: 1.20, n: 1.37, label: 'Muscle',        color: '#b05050', description: 'Soft tissue tumors, sarcomas' },
  lung:      { mua: 0.100, musp: 2.00, n: 1.38, label: 'Lung',          color: '#c8d4e8', description: 'Endobronchial NSCLC, mesothelioma' },
  esophagus: { mua: 0.035, musp: 1.40, n: 1.37, label: 'Esophagus',    color: '#d4b0a0', description: "Esophageal SCC, Barrett's HGD" },
  bladder:   { mua: 0.020, musp: 0.90, n: 1.36, label: 'Bladder Wall', color: '#b8c8e0', description: 'Bladder carcinoma, whole-bladder PDT' },
  liver:     { mua: 0.190, musp: 1.40, n: 1.38, label: 'Liver',         color: '#8b6040', description: 'Hepatocellular carcinoma, cholangiocarcinoma' },
  brain:     { mua: 0.030, musp: 0.93, n: 1.36, label: 'Brain (White)', color: '#e8e0d0', description: 'GBM, brain metastases (highly challenging)' },
  pancreas:  { mua: 0.140, musp: 1.20, n: 1.38, label: 'Pancreas',      color: '#c0a870', description: 'Pancreatic ductal adenocarcinoma (most difficult)' },
};

const PS_PROPS: Record<string, { name: string; gen: number; lambda: number; epsilon: number; phiDelta: number; beta: number; clearance: string; dli: number; color: string; cancers: string }> = {
  photofrin:   { name: 'Photofrin (porfimer Na)', gen: 1, lambda: 630, epsilon: 3000,  phiDelta: 0.89, beta: 0.017, clearance: '4–6 weeks', dli: 48, color: '#cc0000', cancers: 'Lung, esophageal, gastric, bladder' },
  ala:         { name: '5-ALA / PpIX',            gen: 2, lambda: 635, epsilon: 5000,  phiDelta: 0.56, beta: 0.054, clearance: '24–48 hrs', dli: 6,  color: '#ff6600', cancers: 'Skin BCC, oral SCC, brain, bladder' },
  temoporfin:  { name: 'Temoporfin (mTHPC)',       gen: 2, lambda: 652, epsilon: 30000, phiDelta: 0.43, beta: 0.008, clearance: '1–2 weeks', dli: 96, color: '#8b0080', cancers: 'Head & neck, pancreatic, oral' },
  verteporfin: { name: 'Verteporfin (BPD-MA)',     gen: 2, lambda: 689, epsilon: 34800, phiDelta: 0.76, beta: 0.012, clearance: '5 days',    dli: 3,  color: '#00aa44', cancers: 'Prostate (VTP), AMD, cholangiocarcinoma' },
  chlorin:     { name: 'Chlorin e6',               gen: 2, lambda: 660, epsilon: 40000, phiDelta: 0.65, beta: 0.030, clearance: '3–5 days',  dli: 6,  color: '#006633', cancers: 'Skin, cervical, bladder, lung' },
  talaporfin:  { name: 'Talaporfin Na (NPe6)',     gen: 2, lambda: 664, epsilon: 35000, phiDelta: 0.77, beta: 0.025, clearance: '24 hrs',    dli: 4,  color: '#0044bb', cancers: 'Lung, liver, colorectal' },
  nano:        { name: '3rd Gen Nanoparticle PS',  gen: 3, lambda: 730, epsilon: 50000, phiDelta: 0.85, beta: 0.005, clearance: '12 hrs',    dli: 3,  color: '#00cccc', cancers: 'Deep tumors, targeted delivery' },
};

function getWavelengthCorrectedProps(mua: number, musp: number, lambda: number) {
  const b = 1.5;
  const musp_eff = musp * Math.pow(630 / lambda, b);
  const breakpoints: [number, number][] = [[630, 1.000],[652, 0.870],[660, 0.820],[689, 0.660],[730, 0.510]];
  let mua_factor = 1.0;
  if (lambda <= 630) { mua_factor = 1.0; }
  else if (lambda >= 730) { mua_factor = 0.51; }
  else {
    for (let i = 0; i < breakpoints.length - 1; i++) {
      const [l1, f1] = breakpoints[i], [l2, f2] = breakpoints[i + 1];
      if (lambda >= l1 && lambda <= l2) { mua_factor = f1 + (f2 - f1) * (lambda - l1) / (l2 - l1); break; }
    }
  }
  return { mua_eff: mua * mua_factor, musp_eff };
}

function calcReff(n: number) { return -1.440 / (n * n) + 0.710 / n + 0.668 + 0.0636 * n; }
function calcDiffusionParams(mua: number, musp: number, n: number) {
  const mueff = Math.sqrt(3 * mua * (mua + musp));
  const D = 1 / (3 * (mua + musp));
  const z0 = 1 / (mua + musp);
  const Reff = calcReff(n);
  const A = (1 + Reff) / (1 - Reff);
  const zb = 2 * A * D;
  return { mueff, D, z0, zb, A };
}
function diffusionFluence(rho: number, z: number, mua: number, musp: number, n: number, surfacePower: number) {
  const { mueff, D, z0, zb } = calcDiffusionParams(mua, musp, n);
  const r1 = Math.sqrt(rho * rho + (z - z0) * (z - z0));
  const r2 = Math.sqrt(rho * rho + (z + z0 + 2 * zb) * (z + z0 + 2 * zb));
  if (r1 < 1e-8) return 0;
  const phi = (surfacePower / (4 * Math.PI * D)) * (Math.exp(-mueff * r1) / r1 - Math.exp(-mueff * r2) / r2);
  return Math.max(0, phi);
}
function fluenceAtDepth(z_cm: number, mua: number, musp: number, n: number, surfacePowerW: number) {
  return diffusionFluence(0, z_cm, mua, musp, n, surfacePowerW);
}
function calcMueff(mua: number, musp: number) { return Math.sqrt(3 * mua * (mua + musp)); }
function fluenceFromFiber(r_cm: number, mua: number, musp: number, n: number, fiberPowerW: number) {
  if (r_cm < 0.005) return 0;
  const { mueff, D } = calcDiffusionParams(mua, musp, n);
  return (fiberPowerW / (4 * Math.PI * D)) * Math.exp(-mueff * r_cm) / r_cm;
}
function singletO2WithBleaching(phiDelta: number, epsilon: number, psConc_uM: number, beta: number, fluence_J_cm2: number, oxyFactor: number) {
  const concM = psConc_uM * 1e-6;
  const betaF = beta * fluence_J_cm2;
  if (betaF < 0.001) return phiDelta * epsilon * concM * fluence_J_cm2 * oxyFactor * 1000;
  return phiDelta * epsilon * concM * oxyFactor * (1 - Math.exp(-betaF)) / beta * 1000;
}
function psRemainingFraction(beta: number, fluence_J_cm2: number) { return Math.exp(-beta * fluence_J_cm2); }
function calcFractionatedDose(surfacePowerW: number, mua: number, musp: number, n: number, depthCm: number, baseOxyFactor: number, params: { pulseDuration: number; darkInterval: number; numCycles: number; reoxRate: number }) {
  const { pulseDuration, darkInterval, numCycles, reoxRate } = params;
  const fluenceRateAtTumor = fluenceAtDepth(depthCm, mua, musp, n, surfacePowerW);
  let oxyFactor = baseOxyFactor, totalDose = 0, effectiveDose = 0;
  const oxyProfile: number[] = [];
  for (let c = 0; c < numCycles; c++) {
    const depletionPerSecond = 0.006 * fluenceRateAtTumor;
    const oxyAtPulseEnd = Math.max(0.05, oxyFactor - depletionPerSecond * pulseDuration);
    totalDose += fluenceRateAtTumor * pulseDuration;
    effectiveDose += fluenceRateAtTumor * pulseDuration * ((oxyFactor + oxyAtPulseEnd) / 2);
    oxyFactor = oxyAtPulseEnd;
    oxyProfile.push(oxyFactor);
    if (c < numCycles - 1) {
      const recovery = 1 - Math.exp(-darkInterval / reoxRate);
      oxyFactor = oxyAtPulseEnd + (baseOxyFactor - oxyAtPulseEnd) * recovery;
      oxyProfile.push(oxyFactor);
    }
  }
  return { totalDose, effectiveDose, oxyProfile };
}
function buildDepthProfile(surfacePowerW: number, mua: number, musp: number, n: number, oxyFactor: number, psDelta: number, psEpsilon: number, psConc: number, beta: number, duration: number, isFractionated: boolean, fracParams: { pulseDuration: number; darkInterval: number; numCycles: number; reoxRate: number }) {
  return Array.from({ length: 61 }, (_, i) => {
    const depthCm = (i / 60) * 5;
    if (isFractionated) {
      const { effectiveDose } = calcFractionatedDose(surfacePowerW, mua, musp, n, depthCm, oxyFactor, fracParams);
      return { depth: parseFloat((depthCm * 10).toFixed(1)), fluence: effectiveDose, dose: parseFloat(singletO2WithBleaching(psDelta, psEpsilon, psConc, beta, effectiveDose, 1.0).toFixed(4)) };
    }
    const fluenceRate = fluenceAtDepth(depthCm, mua, musp, n, surfacePowerW);
    const F = fluenceRate * duration;
    return { depth: parseFloat((depthCm * 10).toFixed(1)), fluence: parseFloat(F.toFixed(3)), dose: parseFloat(singletO2WithBleaching(psDelta, psEpsilon, psConc, beta, F, oxyFactor).toFixed(4)) };
  });
}
function buildInterstitialProfile(surfacePowerW: number, mua: number, musp: number, n: number, oxyFactor: number, psDelta: number, psEpsilon: number, psConc: number, beta: number, duration: number) {
  return Array.from({ length: 61 }, (_, i) => {
    const offset_cm = (i / 60) * 5 - 2.5;
    const r = Math.abs(offset_cm);
    const fluenceRate = r < 0.01 ? 0 : fluenceFromFiber(r, mua, musp, n, surfacePowerW);
    const F = fluenceRate * duration;
    return { depth: parseFloat((offset_cm * 10).toFixed(1)), fluence: parseFloat(F.toFixed(3)), dose: parseFloat(singletO2WithBleaching(psDelta, psEpsilon, psConc, beta, F, oxyFactor).toFixed(4)) };
  });
}

const TISSUE_OUTCOME: Record<string, { sensitivity: number; max_cr: number; ref: string }> = {
  skin:      { sensitivity: 1.00, max_cr: 0.95, ref: 'AK/BCC: 80–92% CR (Agostinis 2011)' },
  oral:      { sensitivity: 0.90, max_cr: 0.92, ref: 'Oral SCC T1: 100% CR (Biel 2006)' },
  esophagus: { sensitivity: 1.05, max_cr: 0.82, ref: 'HGD: 77% (Overholt 2007)' },
  bladder:   { sensitivity: 0.68, max_cr: 0.82, ref: 'CIS: 74% CR (Prout 1987)' },
  lung:      { sensitivity: 0.80, max_cr: 0.92, ref: 'Early NSCLC: 85% CR (Furuse 1993)' },
  liver:     { sensitivity: 1.50, max_cr: 0.65, ref: 'CC stenting (Ortner 2003)' },
  brain:     { sensitivity: 2.50, max_cr: 0.15, ref: 'GBM: 52.8wk vs 24.6wk (Eljamel 2008)' },
  pancreas:  { sensitivity: 3.00, max_cr: 0.05, ref: 'PDAC: palliative intent (Bown 2002)' },
  muscle:    { sensitivity: 1.40, max_cr: 0.70, ref: 'Sarcoma: limited phase I/II data' },
};

function calcOutcomeLiterature(singletO2: number, tissueKey: string, oxyStatus: string) {
  const { sensitivity, max_cr, ref } = TISSUE_OUTCOME[tissueKey] ?? { sensitivity: 1.0, max_cr: 0.85, ref: '' };
  const effectiveX = singletO2 / sensitivity;
  const k = 0.015, x50 = 150;
  const pCR_logistic = 1 / (1 + Math.exp(-k * (effectiveX - x50)));
  const cr = Math.round(Math.min(max_cr, pCR_logistic) * 100);
  const pPR = (1 - pCR_logistic) * 0.58 * (1 - Math.exp(-0.008 * singletO2));
  const pr = Math.round(Math.min(0.60, pPR) * 100);
  const nr = Math.max(0, 100 - cr - pr);
  let clinNote = '';
  if (oxyStatus === 'severe_hypoxic') clinNote = 'Severe hypoxia: ¹O₂ limited to 18% efficiency. Fractionated dosing strongly recommended.';
  else if (tissueKey === 'brain') clinNote = `GBM: Interstitial fibers + protracted delivery may improve outcomes. ${ref}`;
  else if (tissueKey === 'pancreas') clinNote = `PDAC: PDT is palliative — interstitial fiber delivery required. ${ref}`;
  else if (tissueKey === 'esophagus') clinNote = `Barrett HGD: PDT + omeprazole → 77% HGD elimination vs 39% omeprazole alone. ${ref}`;
  return { cr: Math.max(0, cr), pr: Math.max(0, pr), nr: Math.max(0, nr), ref, clinNote };
}

const LETHAL = 20;
function getOxyFactor(s: string) { return ({ normoxic: 1.0, mild_hypoxic: 0.55, severe_hypoxic: 0.18 } as Record<string, number>)[s] ?? 1.0; }
function getPenetrationDepth(lambda: number) {
  if (lambda < 640) return 4; if (lambda < 660) return 6;
  if (lambda < 690) return 8; if (lambda < 730) return 11; return 14;
}

function draw2DFluenceMap(canvas: HTMLCanvasElement, mua: number, musp: number, n: number, surfacePowerW: number, depthCm: number, psColor: string, deliveryMode: string) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const W = canvas.width, H = canvas.height;
  const maxDepth = 5.0, halfLateral = 3.0, ROWS = H, COLS = W;
  const grid: number[][] = [];
  let maxVal = 0;
  for (let row = 0; row < ROWS; row++) {
    grid[row] = [];
    const z = (row / ROWS) * maxDepth;
    for (let col = 0; col < COLS; col++) {
      const rho = Math.abs(((col / COLS) - 0.5) * 2 * halfLateral);
      let phi = deliveryMode === 'interstitial'
        ? (Math.sqrt(rho*rho+(z-depthCm)*(z-depthCm)) < 0.01 ? 0 : fluenceFromFiber(Math.sqrt(rho*rho+(z-depthCm)*(z-depthCm)), mua, musp, n, surfacePowerW))
        : diffusionFluence(rho, z, mua, musp, n, surfacePowerW);
      grid[row][col] = phi;
      if (phi > maxVal) maxVal = phi;
    }
  }
  let r = 78, g = 205, b = 196;
  const m = psColor.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (m) { r = parseInt(m[1], 16); g = parseInt(m[2], 16); b = parseInt(m[3], 16); }
  const imageData = ctx.createImageData(W, H);
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const norm = maxVal > 0 ? grid[row][col] / maxVal : 0;
      const t = Math.pow(norm, 0.45);
      const pr2 = Math.round(t < 0.5 ? r * t * 2 : r + (255 - r) * (t - 0.5) * 2);
      const pg = Math.round(t < 0.5 ? g * t * 2 : g + (255 - g) * (t - 0.5) * 2);
      const pb = Math.round(t < 0.5 ? b * t * 2 : b + (255 - b) * (t - 0.5) * 2);
      const idx = (row * W + col) * 4;
      imageData.data[idx] = Math.min(255, pr2);
      imageData.data[idx+1] = Math.min(255, pg);
      imageData.data[idx+2] = Math.min(255, pb);
      imageData.data[idx+3] = 255;
    }
  }
  ctx.putImageData(imageData, 0, 0);
  const lethalDepthCm = (() => {
    for (let row = 0; row < ROWS; row++) {
      const z = (row / ROWS) * maxDepth;
      const phi = deliveryMode === 'interstitial'
        ? fluenceFromFiber(Math.abs(z - depthCm) + 0.01, mua, musp, n, surfacePowerW)
        : fluenceAtDepth(z, mua, musp, n, surfacePowerW);
      if (phi * 600 <= LETHAL) return z;
    }
    return maxDepth;
  })();
  const lethalY = (lethalDepthCm / maxDepth) * H;
  ctx.strokeStyle = 'rgba(251,191,36,0.85)'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 3]);
  ctx.beginPath(); ctx.moveTo(0, lethalY); ctx.lineTo(W, lethalY); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(251,191,36,0.9)'; ctx.font = '11px IBM Plex Mono';
  ctx.fillText('Lethal threshold', 6, lethalY - 3);
  const tumorY = (depthCm / maxDepth) * H;
  ctx.beginPath(); ctx.arc(W / 2, tumorY, 8, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,107,107,0.95)'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = 'rgba(255,107,107,0.25)'; ctx.fill();
  ctx.fillStyle = 'rgba(255,107,107,1)'; ctx.font = 'bold 9px IBM Plex Mono';
  ctx.fillText(`tumor ${(depthCm * 10).toFixed(0)}mm`, W / 2 + 11, tumorY + 3);
  if (deliveryMode === 'interstitial') {
    ctx.fillStyle = 'rgba(78,205,196,0.9)'; ctx.font = 'bold 9px IBM Plex Mono';
    ctx.fillText('⊕ fiber', W / 2 + 11, tumorY - 8);
  }
  ctx.fillStyle = 'rgba(184,206,206,0.9)'; ctx.font = '11px IBM Plex Mono';
  ctx.fillText('surface', W / 2 - 18, 10);
  ctx.fillText('5cm depth', 4, H - 4);
}

const SCENARIOS = [
  { label: 'Skin BCC (Optimal)',        tissue: 'skin',      ps: 'ala',        depth: 3,  fluenceRate: 100, oxy: 'normoxic',       duration: 600,  isFrac: false, delivery: 'surface',       desc: 'Stage I BCC — textbook CR case' },
  { label: 'Oral SCC (Stage II)',        tissue: 'oral',      ps: 'chlorin',    depth: 8,  fluenceRate: 100, oxy: 'normoxic',       duration: 900,  isFrac: false, delivery: 'surface',       desc: 'Oral squamous cell carcinoma' },
  { label: 'Esophageal HGD',            tissue: 'esophagus', ps: 'photofrin',  depth: 5,  fluenceRate: 75,  oxy: 'normoxic',       duration: 800,  isFrac: false, delivery: 'surface',       desc: "Barrett's high-grade dysplasia" },
  { label: 'Lung (Interstitial)',        tissue: 'lung',      ps: 'talaporfin', depth: 6,  fluenceRate: 100, oxy: 'mild_hypoxic',   duration: 600,  isFrac: false, delivery: 'interstitial',  desc: 'Early NSCLC — fiber-optic delivery at tumor' },
  { label: 'Bladder (Whole)',            tissue: 'bladder',   ps: 'ala',        depth: 4,  fluenceRate: 50,  oxy: 'normoxic',       duration: 1200, isFrac: false, delivery: 'surface',       desc: 'Whole-bladder intravesical PDT' },
  { label: 'Pancreatic (Interstitial)', tissue: 'pancreas',  ps: 'photofrin',  depth: 25, fluenceRate: 150, oxy: 'severe_hypoxic', duration: 600,  isFrac: false, delivery: 'interstitial',  desc: 'Pancreatic PDAC — requires interstitial fibers; largely palliative' },
  { label: 'GBM (Interstitial)',        tissue: 'brain',     ps: 'ala',        depth: 20, fluenceRate: 100, oxy: 'severe_hypoxic', duration: 600,  isFrac: false, delivery: 'interstitial',  desc: 'Glioblastoma — interstitial fiber mode; survival benefit shown but CR limited' },
  { label: 'BCC (Fractionated)',        tissue: 'skin',      ps: 'ala',        depth: 3,  fluenceRate: 100, oxy: 'normoxic',       duration: 600,  isFrac: true,  delivery: 'surface',       desc: 'BCC with metronomic pulsed delivery — improved O₂ utilization' },
];

// ════════════════════════════════════════════════════════════════════
//  UI COMPONENTS — INLINE IMPLEMENTATIONS
// ════════════════════════════════════════════════════════════════════

// ── Stars Background ───────────────────────────────────────────────
const StarsBackground: FC<{ className?: string }> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    let raf: number;
    interface Star { x: number; y: number; r: number; opacity: number; speed: number | null }
    let stars: Star[] = [];
    const init = () => {
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = width; canvas.height = height;
      const numStars = Math.floor(width * height * 0.00015);
      stars = Array.from({ length: numStars }, () => ({
        x: Math.random() * width, y: Math.random() * height,
        r: Math.random() * 0.6 + 0.4,
        opacity: Math.random() * 0.5 + 0.4,
        speed: Math.random() < 0.7 ? 0.5 + Math.random() * 0.8 : null,
      }));
    };
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach(s => {
        if (s.speed !== null) s.opacity = 0.4 + Math.abs(Math.sin(Date.now() * 0.001 / s.speed) * 0.5);
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200,220,240,${s.opacity})`; ctx.fill();
      });
      raf = requestAnimationFrame(render);
    };
    init(); render();
    const ro = new ResizeObserver(init); ro.observe(canvas);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);
  return <canvas ref={canvasRef} className={`absolute inset-0 w-full h-full ${className}`} />;
};

// ── Shooting Stars ─────────────────────────────────────────────────
const ShootingStars: FC = () => {
  interface Star { id: number; x: number; y: number; angle: number; scale: number; speed: number; distance: number }
  const [star, setStar] = useState<Star | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const create = () => {
      const sides = [
        { x: Math.random() * window.innerWidth, y: 0, angle: 45 },
        { x: window.innerWidth, y: Math.random() * window.innerHeight, angle: 135 },
      ];
      const s = sides[Math.floor(Math.random() * sides.length)];
      setStar({ id: Date.now(), ...s, scale: 1, speed: Math.random() * 20 + 8, distance: 0 });
      timeout = setTimeout(create, Math.random() * 3000 + 1500);
    };
    create();
    return () => clearTimeout(timeout);
  }, []);
  useEffect(() => {
    if (!star) return;
    const raf = requestAnimationFrame(() => {
      setStar(prev => {
        if (!prev) return null;
        const nx = prev.x + prev.speed * Math.cos((prev.angle * Math.PI) / 180);
        const ny = prev.y + prev.speed * Math.sin((prev.angle * Math.PI) / 180);
        if (nx < -20 || nx > window.innerWidth + 20 || ny < -20 || ny > window.innerHeight + 20) return null;
        return { ...prev, x: nx, y: ny, distance: prev.distance + prev.speed, scale: 1 + prev.distance / 100 };
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [star]);
  return (
    <svg ref={svgRef} className="absolute inset-0 w-full h-full pointer-events-none">
      {star && (
        <rect x={star.x} y={star.y} width={10 * star.scale} height={1}
          fill="url(#shootgrad)"
          transform={`rotate(${star.angle}, ${star.x + 5 * star.scale}, ${star.y + 0.5})`} />
      )}
      <defs>
        <linearGradient id="shootgrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2EB9DF" stopOpacity={0} />
          <stop offset="100%" stopColor="#00e5ff" stopOpacity={1} />
        </linearGradient>
      </defs>
    </svg>
  );
};

// ── Background Beams ───────────────────────────────────────────────
const BackgroundBeams: FC = () => {
  const paths = [
    "M-380 -189C-380 -189 -312 216 152 343C616 470 684 875 684 875",
    "M-480 -100C-480 -100 -412 305 52 432C516 559 784 875 784 875",
    "M-180 -300C-180 -300 -112 105 352 232C816 359 884 764 884 764",
    "M-280 -230C-280 -230 -212 175 252 302C716 429 784 834 784 834",
    "M480 -189C480 -189 412 216 -52 343C-516 470 -584 875 -584 875",
    "M380 -100C380 -100 312 305 -152 432C-616 559 -684 875 -684 875",
  ];
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20"
      viewBox="0 0 696 316" fill="none" preserveAspectRatio="xMidYMid slice">
      <defs>
        {paths.map((_, i) => (
          <linearGradient key={i} id={`bg${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity={0} />
            <stop offset="50%" stopColor="#0891b2" stopOpacity={0.6} />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
          </linearGradient>
        ))}
      </defs>
      {paths.map((d, i) => (
        <motion.path key={i} d={d} stroke={`url(#bg${i})`} strokeWidth={0.5}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: [0, 0.3, 0.1] }}
          transition={{ duration: 4 + i * 0.8, repeat: Infinity, repeatType: 'loop', ease: 'linear', delay: i * 0.6 }} />
      ))}
    </svg>
  );
};

// ── Moving Border ──────────────────────────────────────────────────
const MovingBorderWrapper: FC<{ children: ReactNode; color: string; duration?: number; className?: string }> = ({
  children, color, duration = 3000, className = '',
}) => {
  const pathRef = useRef<SVGRectElement>(null);
  const progress = useMotionValue<number>(0);
  useAnimationFrame((time) => {
    const length = (pathRef.current as any)?.getTotalLength?.();
    if (length) progress.set((time * (length / duration)) % length);
  });
  const x = useTransform(progress, (val) => (pathRef.current as any)?.getPointAtLength?.(val)?.x ?? 0);
  const y = useTransform(progress, (val) => (pathRef.current as any)?.getPointAtLength?.(val)?.y ?? 0);
  const transform = useMotionTemplate`translateX(${x}px) translateY(${y}px) translateX(-50%) translateY(-50%)`;
  return (
    <div className={`relative overflow-hidden rounded-2xl p-px ${className}`}>
      <div className="absolute inset-0 rounded-2xl" style={{ borderRadius: 16 }}>
        <svg className="absolute w-full h-full" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <rect ref={pathRef as any} fill="none" width="100%" height="100%" rx="16" ry="16" />
        </svg>
        <motion.div style={{ position: 'absolute', top: 0, left: 0, display: 'inline-block', transform }}>
          <div style={{
            width: 80, height: 80,
            background: `radial-gradient(${color} 0%, transparent 70%)`,
            opacity: 0.9,
          }} />
        </motion.div>
      </div>
      <div className="relative" style={{ borderRadius: 15 }}>{children}</div>
    </div>
  );
};

// ── Animated Number (TextGenerateEffect for numbers) ───────────────
const AnimatedNumber: FC<{ value: number; decimals?: number; suffix?: string }> = ({
  value, decimals = 1, suffix = '',
}) => {
  const spring = useSpring(value, { stiffness: 50, damping: 12 });
  const [display, setDisplay] = useState(value.toFixed(decimals));
  useEffect(() => { spring.set(value); }, [value, spring]);
  useEffect(() => spring.on('change', v => setDisplay(v.toFixed(decimals))), [spring, decimals]);
  return (
    <motion.span
      key={Math.round(value * 10)}
      initial={{ opacity: 0, filter: 'blur(8px)', y: 6 }}
      animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {display}{suffix}
    </motion.span>
  );
};

// ── Physics Tooltip (Animated Tooltip) ────────────────────────────
const PHYSICS_DEFS: Record<string, { def: string; formula: string }> = {
  'μeff':  { def: 'Effective attenuation coefficient', formula: 'μeff = √(3·μa·(μa+μs\'))' },
  'D':     { def: 'Photon diffusion coefficient',      formula: 'D = 1 / (3·(μa+μs\'))' },
  'z₀':   { def: 'Isotropic source depth',             formula: 'z₀ = 1 / (μa+μs\')' },
  'φΔ':   { def: 'Singlet oxygen quantum yield',       formula: 'φΔ = ¹O₂ generated / photons absorbed' },
  'ε':    { def: 'Molar extinction coefficient',       formula: 'Beer-Lambert: A = ε·c·l' },
  'β':    { def: 'Photobleaching rate constant',       formula: '[PS](t) = [PS]₀·exp(−β·F)' },
  'μa':   { def: 'Absorption coefficient',             formula: 'μa = ln(10)·ε·c (M⁻¹cm⁻¹→cm⁻¹)' },
  "μs'":  { def: 'Reduced scattering coefficient',     formula: "μs' = μs·(1−g), g=anisotropy" },
};
const PhysicsTooltip: FC<{ label: string; children?: ReactNode }> = ({ label, children }) => {
  const [show, setShow] = useState(false);
  const def = PHYSICS_DEFS[label];
  return (
    <span className="relative inline-block" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <span style={{ cursor: 'help', borderBottom: '1px dashed rgba(141,171,168,0.4)', color: '#8daba8' }}>
        {children ?? label}
      </span>
      <AnimatePresence>
        {show && def && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            style={{
              position: 'absolute', bottom: '130%', left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(9,29,46,0.97)', border: '1px solid rgba(78,205,196,0.3)',
              borderRadius: 10, padding: '10px 14px', zIndex: 100, minWidth: 220, maxWidth: 280,
              boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            }}
          >
            <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: '#4ecdc4', marginBottom: 4, fontWeight: 700 }}>{label}</div>
            <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#b8cece', marginBottom: 6, lineHeight: 1.5 }}>{def.def}</div>
            <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: '#5c7f7c', background: 'rgba(78,205,196,0.06)', padding: '4px 8px', borderRadius: 6 }}>{def.formula}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
};

// ── Bento Grid Item ────────────────────────────────────────────────
const BentoCard: FC<{ children: ReactNode; className?: string; colSpan?: number; rowSpan?: number; glowColor?: string }> = ({
  children, className = '', colSpan = 1, rowSpan = 1, glowColor = 'rgba(78,205,196,0.08)',
}) => (
  <motion.div
    whileHover={{ scale: 1.01, boxShadow: `0 0 40px ${glowColor}` }}
    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    style={{
      gridColumn: colSpan > 1 ? `span ${colSpan}` : undefined,
      gridRow: rowSpan > 1 ? `span ${rowSpan}` : undefined,
      background: 'rgba(13,37,64,0.55)',
      border: '1px solid rgba(141,171,168,0.15)',
      borderRadius: 16, overflow: 'hidden',
    }}
    className={className}
  >
    {children}
  </motion.div>
);

// ════════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════
export default function PDTSimulator() {
  const [tissueKey, setTissueKey]     = useState('skin');
  const [psKey, setPsKey]             = useState('ala');
  const [depth, setDepth]             = useState(3);
  const [fluenceRate, setFluenceRate] = useState(100);
  const [oxy, setOxy]                 = useState('normoxic');
  const [psConc, setPsConc]           = useState(5);
  const [duration, setDuration]       = useState(600);
  const [scenario, setScenario]       = useState(-1);
  const [isFractionated, setIsFractionated] = useState(false);
  const [pulseDuration, setPulseDuration]   = useState(60);
  const [darkInterval, setDarkInterval]     = useState(120);
  const [numCycles, setNumCycles]           = useState(5);
  const [reoxRate, setReoxRate]             = useState(60);
  const [activeTab, setActiveTab]     = useState('controls');
  const [deliveryMode, setDeliveryMode] = useState('surface');
  const [baseline, setBaseline]       = useState<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const tissue = TISSUE_PROPS[tissueKey];
  const ps     = PS_PROPS[psKey];
  const depthCm       = depth / 10;
  const surfacePowerW = fluenceRate / 1000;
  const oxyFactor     = getOxyFactor(oxy);
  const penetration   = getPenetrationDepth(ps.lambda);
  const depthWarning  = depth > penetration;
  const oxyWarning    = oxy === 'severe_hypoxic';
  const { mua_eff, musp_eff } = getWavelengthCorrectedProps(tissue.mua, tissue.musp, ps.lambda);
  const mueff = calcMueff(mua_eff, musp_eff);
  const { D, z0 } = calcDiffusionParams(mua_eff, musp_eff, tissue.n);
  const tumorFluenceRate = deliveryMode === 'interstitial'
    ? fluenceFromFiber(0.3, mua_eff, musp_eff, tissue.n, surfacePowerW)
    : fluenceAtDepth(depthCm, mua_eff, musp_eff, tissue.n, surfacePowerW);
  const surfaceDose = fluenceRate * duration / 1000;
  const fracParams = { pulseDuration, darkInterval, numCycles, reoxRate };
  const fracResult = isFractionated
    ? calcFractionatedDose(surfacePowerW, mua_eff, musp_eff, tissue.n, depthCm, oxyFactor, fracParams)
    : null;
  const tumorFluence = isFractionated && fracResult ? fracResult.effectiveDose : tumorFluenceRate * duration;
  const singletO2 = singletO2WithBleaching(ps.phiDelta, ps.epsilon, psConc, ps.beta, tumorFluence, oxyFactor);
  const singletO2Linear = ps.phiDelta * ps.epsilon * psConc * 1e-6 * tumorFluence * oxyFactor * 1000;
  const psRemaining = psRemainingFraction(ps.beta, tumorFluence);
  const outcome = calcOutcomeLiterature(singletO2, tissueKey, oxy);
  let adequacy = tumorFluence >= LETHAL ? 'adequate' : 'subtherapeutic';
  if (surfaceDose > 150 && oxyFactor > 0.5) adequacy = 'overdose';
  const adequacyColor = adequacy === 'adequate' ? '#22c55e' : adequacy === 'overdose' ? '#fbbf24' : '#ff6b6b';
  const adequacyLabel = adequacy === 'adequate' ? 'ADEQUATE' : adequacy === 'overdose' ? 'OVERDOSE RISK' : 'SUBTHERAPEUTIC';

  const profile = deliveryMode === 'interstitial'
    ? buildInterstitialProfile(surfacePowerW, mua_eff, musp_eff, tissue.n, oxyFactor, ps.phiDelta, ps.epsilon, psConc, ps.beta, duration)
    : buildDepthProfile(surfacePowerW, mua_eff, musp_eff, tissue.n, oxyFactor, ps.phiDelta, ps.epsilon, psConc, ps.beta, duration, isFractionated, fracParams);
  const maxDose = Math.max(...profile.map(p => p.dose), 0.001);
  const tumorIdx = deliveryMode === 'interstitial' ? 30 : Math.round((depthCm / 5) * 60);
  const totalFracTime = isFractionated ? (pulseDuration + darkInterval) * numCycles : duration;

  useEffect(() => {
    if (activeTab !== 'map2d' || !canvasRef.current) return;
    draw2DFluenceMap(canvasRef.current, mua_eff, musp_eff, tissue.n, surfacePowerW, depthCm, ps.color, deliveryMode);
  }, [activeTab, tissueKey, psKey, depth, fluenceRate, mua_eff, musp_eff, tissue.n, surfacePowerW, depthCm, ps.color, deliveryMode]);

=======
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

>>>>>>> eeb4c537ea74731802203ec4092c162b4b2d2456
  const applyScenario = useCallback((idx: number) => {
    const s = SCENARIOS[idx];
    setTissueKey(s.tissue); setPsKey(s.ps); setDepth(s.depth);
    setFluenceRate(s.fluenceRate); setOxy(s.oxy); setDuration(s.duration);
<<<<<<< HEAD
    setIsFractionated(s.isFrac); setScenario(idx);
    setDeliveryMode(s.delivery || 'surface');
    if (s.isFrac) setActiveTab('fractionated');
  }, []);

  const lockBaseline = () => setBaseline({
    label: `${tissue.label} / ${ps.name.split('(')[0].trim()} / ${depth}mm / ${oxy}`,
    cr: outcome.cr, pr: outcome.pr, nr: outcome.nr,
    singletO2: singletO2.toFixed(1), tumorFluence: tumorFluence.toFixed(2),
    psRemaining: Math.round(psRemaining * 100), adequacy, mueff: mueff.toFixed(4), deliveryMode,
  });

  const mono = { fontFamily: 'IBM Plex Mono, monospace' };
  const lbl  = { ...mono, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: '#5c7f7c' };
  const card = { background: 'rgba(13,37,64,0.55)', border: '1px solid rgba(141,171,168,0.15)', borderRadius: 16, overflow: 'hidden' as const };
  const inp  = { background: '#0d2540', border: '1px solid rgba(141,171,168,0.2)', borderRadius: 8, color: '#e4eeee', padding: '8px 12px', fontSize: 12, width: '100%', outline: 'none', ...mono };

  return (
    // ── Root: fixed Dark Medical background ─────────────────────────
    <div style={{ minHeight: '100vh', background: '#091d2e', position: 'relative' }}>

      {/* Fixed starfield layer */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <StarsBackground />
        <ShootingStars />
        <BackgroundBeams />
        {/* Deep navy vignette */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(9,29,46,0) 0%, rgba(9,29,46,0.7) 100%)',
        }} />
      </div>

      {/* Scrollable content */}
      <div style={{ position: 'relative', zIndex: 1, paddingTop: 80, paddingBottom: 64 }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 24px' }}>

          {/* ── HEADER ─────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            style={{ paddingTop: 40, paddingBottom: 28, maxWidth: 760 }}
          >
            <div style={{ ...lbl, marginBottom: 10 }}>
              // PDT Simulator · Diffusion Approx · Photobleaching · λ-Corrected Optics · Literature Outcomes
            </div>
            <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 38, fontWeight: 900, color: '#e4eeee', lineHeight: 1.1, marginBottom: 14 }}>
              Interactive PDT<br />
              <span style={{ background: 'linear-gradient(135deg, #b8cece, #4ecdc4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Treatment Simulator
              </span>
            </h1>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
              {[
                { l: 'Photobleaching', c: '#4ecdc4', tip: '[PS](t)=[PS]₀·e^(−βF)' },
                { l: 'λ-Corrected Optics', c: '#22c55e', tip: "μs'(λ)=μs'₀·(630/λ)^1.5" },
                { l: 'Literature Outcomes', c: '#fbbf24', tip: 'Calibrated to Agostinis 2011' },
                { l: deliveryMode === 'interstitial' ? '⊕ Interstitial Mode' : 'Surface Mode', c: deliveryMode === 'interstitial' ? '#ff6b6b' : '#8daba8', tip: 'Toggle in controls' },
              ].map(({ l, c, tip }) => (
                <div key={l} title={tip} style={{ ...mono, fontSize: 9, padding: '3px 10px', borderRadius: 6, background: `${c}18`, border: `1px solid ${c}44`, color: c }}>{l}</div>
              ))}
            </div>

            {/* Physics quick-stats with animated numbers + tooltips */}
            <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
              {[
                { k: 'μeff', v: mueff, decimals: 3, u: 'cm⁻¹', tooltip: true },
                { k: 'D', v: D, decimals: 4, u: 'cm', tooltip: true },
                { k: 'z₀', v: z0 * 10, decimals: 2, u: 'mm', tooltip: true },
                { k: 'Tumor fluence', v: tumorFluence, decimals: 2, u: 'J/cm²', tooltip: false },
                { k: '[PS] remaining', v: Math.round(psRemaining * 100), decimals: 0, u: '%', tooltip: false },
              ].map(({ k, v, decimals, u, tooltip }) => (
                <div key={k}>
                  <div style={{ ...mono, fontSize: 16, fontWeight: 700, color: '#4ecdc4' }}>
                    <AnimatedNumber value={v} decimals={decimals} suffix={u} />
                  </div>
                  <div style={{ ...lbl, fontSize: 9 }}>
                    {tooltip ? <PhysicsTooltip label={k} /> : k}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ── SCENARIOS ──────────────────────────────────────────── */}
          <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid rgba(141,171,168,0.1)' }}>
            <div style={{ ...lbl, marginBottom: 10 }}>Clinical scenarios</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {SCENARIOS.map((s, i) => (
                <motion.button key={i} onClick={() => applyScenario(i)}
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                  style={{
                    ...mono, fontSize: 10, padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
                    background: scenario === i ? 'rgba(78,205,196,0.15)' : 'rgba(13,37,64,0.6)',
                    border: scenario === i ? '1px solid rgba(78,205,196,0.4)' : '1px solid rgba(141,171,168,0.15)',
                    color: scenario === i ? '#4ecdc4' : '#8daba8',
                  }}
                >
                  {s.delivery === 'interstitial' ? '⊕ ' : ''}{s.label}
                </motion.button>
              ))}
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                onClick={() => { setScenario(-1); setTissueKey('skin'); setPsKey('ala'); setDepth(3); setFluenceRate(100); setOxy('normoxic'); setPsConc(5); setDuration(600); setIsFractionated(false); setActiveTab('controls'); setDeliveryMode('surface'); }}
                style={{ ...mono, fontSize: 10, padding: '6px 14px', borderRadius: 8, cursor: 'pointer', background: 'transparent', border: '1px solid rgba(141,171,168,0.12)', color: '#5c7f7c' }}
              >↺ Reset</motion.button>
            </div>
            {scenario >= 0 && <p style={{ fontSize: 12, color: '#5c7f7c', marginTop: 8 }}>{SCENARIOS[scenario].desc}</p>}
          </div>

          {/* ── TAB BAR ─────────────────────────────────────────────── */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
            {[
              { id: 'controls',     label: '⚙ Parameters' },
              { id: 'map2d',        label: '🗺 2D Fluence Map' },
              { id: 'fractionated', label: '⚡ Fractionated Dosing' },
            ].map(t => (
              <motion.button key={t.id} onClick={() => setActiveTab(t.id)}
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                style={{
                  ...mono, fontSize: 11, padding: '8px 18px', borderRadius: 10, cursor: 'pointer',
                  background: activeTab === t.id ? 'rgba(78,205,196,0.15)' : 'rgba(13,37,64,0.5)',
                  border: activeTab === t.id ? '1px solid rgba(78,205,196,0.5)' : '1px solid rgba(141,171,168,0.12)',
                  color: activeTab === t.id ? '#4ecdc4' : '#8daba8',
                }}>{t.label}</motion.button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: activeTab === 'map2d' ? '1fr' : '340px 1fr', gap: 24, alignItems: 'start' }}>

            {/* ── LEFT CONTROLS ───────────────────────────────────── */}
            {activeTab !== 'map2d' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Tissue selector */}
                <BentoCard>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(141,171,168,0.1)', background: 'rgba(13,37,64,0.4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={lbl}>Tissue Type</span>
                    <span style={{ ...mono, fontSize: 9, color: '#4ecdc4' }}>λ-corrected optics ✓</span>
                  </div>
                  <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    {Object.entries(TISSUE_PROPS).map(([k, t]) => (
                      <motion.button key={k} onClick={() => { setTissueKey(k); setScenario(-1); }}
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        style={{
                          padding: '8px 6px', borderRadius: 8, cursor: 'pointer', textAlign: 'center',
                          background: tissueKey === k ? `${t.color}22` : 'rgba(13,37,64,0.5)',
                          border: tissueKey === k ? `1px solid ${t.color}66` : '1px solid rgba(141,171,168,0.1)',
                          color: tissueKey === k ? t.color : '#8daba8', fontSize: 10, ...mono,
                        }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: t.color, margin: '0 auto 4px' }} />
                        {t.label}
                      </motion.button>
                    ))}
                  </div>
                  <div style={{ padding: '0 16px 12px', fontSize: 10, color: '#5c7f7c', ...mono }}>
                    <PhysicsTooltip label="μa">μa</PhysicsTooltip>@630={tissue.mua} → <PhysicsTooltip label="μa">μa</PhysicsTooltip>@{ps.lambda}nm≈{mua_eff.toFixed(3)} · <PhysicsTooltip label="μs'">μs'</PhysicsTooltip>@{ps.lambda}nm≈{musp_eff.toFixed(2)}
                  </div>
                </BentoCard>

                {/* PS selector */}
                <BentoCard>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(141,171,168,0.1)', background: 'rgba(13,37,64,0.4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={lbl}>Photosensitizer</span>
                    <span style={{ ...mono, fontSize: 9, color: '#4ecdc4' }}>
                      bleaching <PhysicsTooltip label="β">β</PhysicsTooltip>={ps.beta} cm²/J
                    </span>
                  </div>
                  <div style={{ padding: 16 }}>
                    <select style={inp} value={psKey} onChange={e => { setPsKey(e.target.value); setScenario(-1); }}>
                      {Object.entries(PS_PROPS).map(([k, p]) => (
                        <option key={k} value={k}>{p.name} (Gen {p.gen})</option>
                      ))}
                    </select>
                    <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {([
                        ['λ', `${ps.lambda} nm`],
                        ['φΔ', ps.phiDelta.toFixed(2)],
                        ['ε', `${ps.epsilon.toLocaleString()} M⁻¹cm⁻¹`],
                        ['β (bleach)', `${ps.beta} cm²/J`],
                        ['DLI', `${ps.dli}h`],
                        ['Clearance', ps.clearance],
                      ] as [string, string][]).map(([k, v]) => (
                        <div key={k} style={{ padding: '6px 8px', background: 'rgba(9,29,46,0.5)', borderRadius: 6 }}>
                          <div style={{ ...mono, fontSize: 9, color: '#5c7f7c' }}>
                            {['φΔ', 'ε', 'β (bleach)'].includes(k) ? <PhysicsTooltip label={k.split(' ')[0]}>{k}</PhysicsTooltip> : k}
                          </div>
                          <div style={{ ...mono, fontSize: 11, color: '#b8cece' }}>{v}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: 8, fontSize: 11, color: '#5c7f7c' }}>{ps.cancers}</div>
                  </div>
                </BentoCard>

                {/* Delivery mode */}
                <BentoCard>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(141,171,168,0.1)', background: 'rgba(13,37,64,0.4)' }}>
                    <span style={lbl}>Light Delivery Mode</span>
                  </div>
                  <div style={{ padding: 16 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {[
                        { v: 'surface', l: 'Surface', s: 'Lamp / external laser', c: '#8daba8' },
                        { v: 'interstitial', l: '⊕ Interstitial', s: 'Fiber at tumor depth', c: '#ff6b6b' },
                      ].map(({ v, l, s, c }) => (
                        <motion.button key={v} onClick={() => { setDeliveryMode(v); setScenario(-1); }}
                          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                          style={{
                            padding: '10px 8px', borderRadius: 8, cursor: 'pointer', textAlign: 'center',
                            background: deliveryMode === v ? `${c}22` : 'rgba(13,37,64,0.5)',
                            border: deliveryMode === v ? `1px solid ${c}66` : '1px solid rgba(141,171,168,0.1)',
                            color: deliveryMode === v ? c : '#8daba8', fontSize: 11, ...mono,
                          }}>
                          <div style={{ fontWeight: 600 }}>{l}</div>
                          <div style={{ fontSize: 9, marginTop: 2 }}>{s}</div>
                        </motion.button>
                      ))}
                    </div>
                    {deliveryMode === 'interstitial' && (
                      <p style={{ fontSize: 10, color: '#ff6b6b', marginTop: 10, lineHeight: 1.6 }}>
                        ⊕ Fiber tip placed at tumor depth. Used clinically for lung, pancreatic, GBM, prostate.
                      </p>
                    )}
                  </div>
                </BentoCard>

                {/* Treatment params — controls tab */}
                {activeTab === 'controls' && (
                  <BentoCard>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(141,171,168,0.1)', background: 'rgba(13,37,64,0.4)' }}>
                      <span style={lbl}>Treatment Parameters</span>
                    </div>
                    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 20 }}>
                      {[
                        { label: 'Tumor Depth', val: depth, set: (v: number) => setDepth(v), min: 1, max: 50, step: 1, display: `${depth}mm`, warn: depthWarning, note: depthWarning && deliveryMode === 'surface' ? `⚠ Exceeds ${penetration}mm max penetration for ${ps.lambda}nm` : '' },
                        { label: 'Fluence Rate', val: fluenceRate, set: (v: number) => setFluenceRate(v), min: 10, max: 250, step: 10, display: `${fluenceRate} mW/cm²`, warn: fluenceRate > 150, note: fluenceRate > 150 ? 'High rate → rapid O₂ depletion → consider metronomic' : '' },
                        { label: 'PS Concentration', val: psConc, set: (v: number) => setPsConc(v), min: 0.5, max: 15, step: 0.5, display: `${psConc} μM`, warn: false, note: '' },
                        { label: 'Duration', val: duration, set: (v: number) => setDuration(v), min: 60, max: 2400, step: 60, display: `${duration}s (${(duration/60).toFixed(0)}min)`, warn: false, note: '' },
                      ].map(({ label, val, set, min, max, step, display, warn, note }) => (
                        <div key={label}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            <div style={{ fontSize: 12, fontWeight: 500, color: warn ? '#ff6b6b' : '#e4eeee' }}>{label}</div>
                            <span style={{ ...mono, fontSize: 14, fontWeight: 700, color: warn ? '#ff6b6b' : '#4ecdc4' }}>{display}</span>
                          </div>
                          <input type="range" min={min} max={max} step={step} value={val}
                            onChange={e => { set(parseFloat(e.target.value)); setScenario(-1); }}
                            style={{ width: '100%' }} />
                          {note && <p style={{ fontSize: 10, color: '#ff6b6b', marginTop: 4 }}>{note}</p>}
                        </div>
                      ))}
                      <div>
                        <div style={{ ...lbl, marginBottom: 8, color: oxyWarning ? '#ff6b6b' : '#5c7f7c' }}>Tissue Oxygenation</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                          {[
                            { v: 'normoxic', l: 'Normoxic', s: 'Normal O₂', c: '#22c55e' },
                            { v: 'mild_hypoxic', l: 'Hypoxic', s: 'Reduced O₂', c: '#fbbf24' },
                            { v: 'severe_hypoxic', l: 'Severely', s: 'Very low O₂', c: '#ff6b6b' },
                          ].map(({ v, l, s, c }) => (
                            <motion.button key={v} onClick={() => { setOxy(v); setScenario(-1); }}
                              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                              style={{
                                padding: '8px 4px', borderRadius: 8, cursor: 'pointer', textAlign: 'center',
                                background: oxy === v ? `${c}22` : 'rgba(13,37,64,0.5)',
                                border: oxy === v ? `1px solid ${c}66` : '1px solid rgba(141,171,168,0.1)',
                                color: oxy === v ? c : '#8daba8', fontSize: 10, ...mono,
                              }}>
                              <div style={{ fontWeight: 600 }}>{l}</div>
                              <div style={{ fontSize: 8 }}>{s}</div>
                            </motion.button>
                          ))}
                        </div>
                        {oxyWarning && <p style={{ fontSize: 10, color: '#ff6b6b', marginTop: 6 }}>⚠ Severe hypoxia: ¹O₂ pathway efficiency ~18%.</p>}
                      </div>
                    </div>
                  </BentoCard>
                )}

                {/* Fractionated controls */}
                {activeTab === 'fractionated' && (
                  <BentoCard>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(141,171,168,0.1)', background: 'rgba(13,37,64,0.4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={lbl}>Fractionated / Metronomic</span>
                      <motion.button onClick={() => setIsFractionated(f => !f)}
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        style={{
                          ...mono, fontSize: 10, padding: '4px 12px', borderRadius: 6, cursor: 'pointer',
                          background: isFractionated ? 'rgba(78,205,196,0.2)' : 'rgba(13,37,64,0.6)',
                          border: isFractionated ? '1px solid rgba(78,205,196,0.5)' : '1px solid rgba(141,171,168,0.2)',
                          color: isFractionated ? '#4ecdc4' : '#8daba8',
                        }}>{isFractionated ? '⚡ ON' : 'OFF'}</motion.button>
                    </div>
                    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {[
                        { label: 'Pulse Duration', val: pulseDuration, set: setPulseDuration, min: 10, max: 300, step: 10, unit: 's' },
                        { label: 'Dark Interval', val: darkInterval, set: setDarkInterval, min: 30, max: 600, step: 30, unit: 's' },
                        { label: 'Cycles', val: numCycles, set: setNumCycles, min: 1, max: 20, step: 1, unit: '' },
                        { label: 'Reox τ', val: reoxRate, set: setReoxRate, min: 10, max: 180, step: 10, unit: 's' },
                      ].map(({ label, val, set, min, max, step, unit }) => (
                        <div key={label}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span style={{ fontSize: 12, color: '#e4eeee' }}>{label}</span>
                            <span style={{ ...mono, fontSize: 13, color: '#4ecdc4' }}>{val}{unit}</span>
                          </div>
                          <input type="range" min={min} max={max} step={step} value={val}
                            onChange={e => set(Number(e.target.value))} style={{ width: '100%' }} />
                        </div>
                      ))}
                      {isFractionated && fracResult && fracResult.oxyProfile.length > 1 && (
                        <div>
                          <div style={{ ...lbl, marginBottom: 8 }}>O₂ Level Per Cycle</div>
                          <svg width="100%" height="80" viewBox={`0 0 ${fracResult.oxyProfile.length * 20} 80`} preserveAspectRatio="none">
                            <polyline points={fracResult.oxyProfile.map((v, i) => `${i * 20},${80 - v * 70}`).join(' ')} fill="none" stroke="#4ecdc4" strokeWidth="2" />
                            {fracResult.oxyProfile.map((v, i) => <circle key={i} cx={i * 20} cy={80 - v * 70} r="3" fill="#4ecdc4" />)}
                            <line x1="0" y1={80 - 0.18 * 70} x2={fracResult.oxyProfile.length * 20} y2={80 - 0.18 * 70} stroke="rgba(255,107,107,0.4)" strokeWidth="1" strokeDasharray="3,2" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </BentoCard>
                )}
              </div>
            )}

            {/* ── RIGHT: Results (Bento Grid) ──────────────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* 2D MAP TAB */}
              {activeTab === 'map2d' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
                  <BentoCard>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(141,171,168,0.1)', background: 'rgba(13,37,64,0.4)' }}>
                      <span style={lbl}>Map Parameters</span>
                    </div>
                    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {[
                        { label: 'Tumor Depth', val: depth, set: (v: number) => setDepth(v), min: 1, max: 50, step: 1, unit: 'mm', warn: depthWarning },
                        { label: 'Fluence Rate', val: fluenceRate, set: (v: number) => setFluenceRate(v), min: 10, max: 250, step: 10, unit: 'mW/cm²', warn: false },
                      ].map(({ label, val, set, min, max, step, unit, warn }) => (
                        <div key={label}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span style={{ fontSize: 12, color: '#e4eeee' }}>{label}</span>
                            <span style={{ ...mono, fontSize: 13, color: warn ? '#ff6b6b' : '#4ecdc4' }}>{val}{unit}</span>
                          </div>
                          <input type="range" min={min} max={max} step={step} value={val}
                            onChange={e => { set(parseInt(e.target.value)); setScenario(-1); }}
                            style={{ width: '100%' }} />
                        </div>
                      ))}
                      <div>
                        <div style={{ ...lbl, marginBottom: 6 }}>Delivery</div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {[{ v: 'surface', l: 'Surface' }, { v: 'interstitial', l: '⊕ Interstitial' }].map(({ v, l }) => (
                            <motion.button key={v} onClick={() => { setDeliveryMode(v); setScenario(-1); }}
                              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                              style={{
                                flex: 1, padding: '6px 8px', borderRadius: 6, cursor: 'pointer',
                                background: deliveryMode === v ? 'rgba(78,205,196,0.2)' : 'rgba(13,37,64,0.5)',
                                border: deliveryMode === v ? '1px solid rgba(78,205,196,0.4)' : '1px solid rgba(141,171,168,0.1)',
                                color: deliveryMode === v ? '#4ecdc4' : '#8daba8', fontSize: 10, ...mono,
                              }}>{l}</motion.button>
                          ))}
                        </div>
                      </div>
                      <div style={{ fontSize: 11, color: '#8daba8', lineHeight: 1.6 }}>
                        <div>⚡ <span style={{ color: '#fbbf24' }}>Yellow dashed</span> — lethal threshold</div>
                        <div>🎯 <span style={{ color: '#ff6b6b' }}>Red circle</span> — tumor at {depth}mm</div>
                        {deliveryMode === 'interstitial' && <div>⊕ <span style={{ color: '#4ecdc4' }}>Cyan</span> — fiber tip</div>}
                      </div>
                    </div>
                  </BentoCard>

                  {/* 2D Canvas — spans 2 rows */}
                  <BentoCard rowSpan={1} glowColor="rgba(78,205,196,0.12)">
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(141,171,168,0.1)', background: 'rgba(13,37,64,0.4)', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={lbl}>2D Fluence — {deliveryMode === 'interstitial' ? 'Interstitial Point Source' : 'Surface Diffusion Approx'}</span>
                      <span style={{ ...mono, fontSize: 12, color: '#b8cece' }}>{tissue.label} · {ps.name.split('(')[0]}</span>
                    </div>
                    <canvas ref={canvasRef} width={420} height={520} style={{ display: 'block', width: '100%' }} />
                    <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(141,171,168,0.08)', display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ ...lbl, fontSize: 9 }}>Low</span>
                      <div style={{ flex: 1, height: 10, borderRadius: 5, background: `linear-gradient(to right, #091d2e, ${ps.color}, #ffffff)` }} />
                      <span style={{ ...lbl, fontSize: 9 }}>High</span>
                    </div>
                  </BentoCard>
                </div>
              )}

              {/* RESULTS BENTO GRID */}
              {activeTab !== 'map2d' && (
                <>
                  {/* ── MOVING BORDER ADEQUACY BANNER ─────────────── */}
                  <MovingBorderWrapper
                    color={adequacy === 'adequate' ? '#22c55e' : adequacy === 'overdose' ? '#fbbf24' : '#ff6b6b'}
                    duration={adequacy === 'adequate' ? 4000 : 1500}
                  >
                    <div style={{
                      background: adequacy === 'adequate' ? 'rgba(34,197,94,0.07)' : adequacy === 'overdose' ? 'rgba(251,191,36,0.07)' : 'rgba(255,107,107,0.07)',
                      borderRadius: 15, padding: 24,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
                        <div>
                          <div style={{ ...lbl, color: adequacyColor, marginBottom: 6 }}>
                            Treatment Adequacy · {isFractionated ? 'Metronomic' : 'Continuous'} · {deliveryMode === 'interstitial' ? 'Interstitial' : 'Surface'}
                          </div>
                          <motion.div
                            key={adequacyLabel}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4 }}
                            style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, fontWeight: 700, color: adequacyColor }}
                          >
                            {adequacyLabel}
                          </motion.div>
                          <div style={{ fontSize: 12, color: '#8daba8', marginTop: 4 }}>
                            {adequacy === 'adequate' && `Tumor receives ${tumorFluence.toFixed(2)} J/cm² — exceeds lethal threshold (${LETHAL} J/cm²)`}
                            {adequacy === 'subtherapeutic' && `Tumor receives ${tumorFluence.toFixed(2)} J/cm² — below lethal threshold. ${depthWarning && deliveryMode === 'surface' ? 'Switch to interstitial delivery.' : oxyWarning ? 'Severe hypoxia prevents ¹O₂ generation.' : 'Increase surface fluence or duration.'}`}
                            {adequacy === 'overdose' && 'Excessive surface fluence risks O₂ depletion. Consider fractionated delivery.'}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ ...mono, fontSize: 28, fontWeight: 700, color: adequacyColor }}>
                            <AnimatedNumber value={tumorFluence} decimals={1} />
                          </div>
                          <div style={{ ...lbl, fontSize: 9 }}>{isFractionated ? 'O₂-weighted ' : ''}J/cm² at tumor</div>
                          <div style={{ ...lbl, fontSize: 9, marginTop: 4 }}>Threshold: {LETHAL} J/cm²</div>
                        </div>
                      </div>
                      <div>
                        <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginBottom: 4 }}>
                          <motion.div
                            animate={{ width: `${Math.min(100, (tumorFluence / LETHAL) * 100)}%` }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                            style={{ height: '100%', borderRadius: 4, background: adequacyColor }}
                          />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ ...lbl, fontSize: 9 }}>0 J/cm²</span>
                          <span style={{ ...lbl, fontSize: 9 }}>Lethal threshold ({LETHAL} J/cm²)</span>
                        </div>
                      </div>
                    </div>
                  </MovingBorderWrapper>

                  {/* ── METRICS BENTO GRID (4 cards) ──────────────── */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                    {[
                      { l: 'Surface Dose',   v: surfaceDose,              dec: 1, u: 'J/cm²',        w: surfaceDose > 100 },
                      { l: '¹O₂ (bleach)',   v: singletO2,                dec: 1, u: 'μM·s',         w: singletO2 < 50 },
                      { l: '[PS] remaining', v: Math.round(psRemaining * 100), dec: 0, u: '% initial', w: psRemaining < 0.3 },
                      { l: 'λ Penetration',  v: penetration,              dec: 0, u: 'mm max',       w: depthWarning },
                    ].map(({ l, v, dec, u, w }) => (
                      <BentoCard key={l} glowColor={w ? 'rgba(251,191,36,0.15)' : 'rgba(78,205,196,0.1)'}>
                        <div style={{ padding: 16, textAlign: 'center' }}>
                          <div style={{ ...mono, fontSize: 20, fontWeight: 700, color: w ? '#fbbf24' : '#4ecdc4', marginBottom: 2 }}>
                            <AnimatedNumber value={v} decimals={dec} />
                          </div>
                          <div style={{ ...lbl, fontSize: 8 }}>{u}</div>
                          <div style={{ ...lbl, fontSize: 8, marginTop: 2 }}>{l}</div>
                        </div>
                      </BentoCard>
                    ))}
                  </div>

                  {/* ── DEPTH PROFILE + OUTCOME BENTO ROW ─────────── */}
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>

                    {/* Depth Profile — col-span-2 equivalent */}
                    <BentoCard glowColor="rgba(78,205,196,0.1)">
                      <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(141,171,168,0.1)', background: 'rgba(13,37,64,0.4)', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={lbl}>{deliveryMode === 'interstitial' ? '¹O₂ vs Distance from Fiber' : '¹O₂ Dose vs Depth'}</span>
                        <span style={{ ...mono, fontSize: 12, color: '#b8cece' }}>
                          <PhysicsTooltip label="D">D</PhysicsTooltip>={D.toFixed(4)}cm · <PhysicsTooltip label="μeff">μeff</PhysicsTooltip>={mueff.toFixed(3)}
                        </span>
                      </div>
                      <div style={{ padding: '20px 20px 0' }}>
                        <svg width="100%" height="200" viewBox="0 0 700 200" preserveAspectRatio="none">
                          {[0.25, 0.5, 0.75].map(f => (
                            <line key={f} x1="0" y1={200 * f} x2="700" y2={200 * f} stroke="rgba(141,171,168,0.06)" strokeWidth="1" />
                          ))}
                          {maxDose > 0 && (
                            <line x1="0" y1={200 * (1 - LETHAL / 1000 / maxDose)} x2="700" y2={200 * (1 - LETHAL / 1000 / maxDose)}
                              stroke="rgba(251,191,36,0.5)" strokeWidth="1.5" strokeDasharray="5,3" />
                          )}
                          <path d={['M 0 200', ...profile.map((p, i) => `L ${(i / 60) * 700} ${200 - (p.dose / maxDose) * 185}`), 'L 700 200 Z'].join(' ')} fill="rgba(78,205,196,0.1)" />
                          <motion.path
                            d={profile.map((p, i) => `${i === 0 ? 'M' : 'L'} ${(i / 60) * 700} ${200 - (p.dose / maxDose) * 185}`).join(' ')}
                            fill="none" stroke="#4ecdc4" strokeWidth="2.5"
                            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8 }}
                          />
                          {tumorIdx <= 60 && (
                            <>
                              <line x1={(tumorIdx / 60) * 700} y1="0" x2={(tumorIdx / 60) * 700} y2="200"
                                stroke="rgba(255,107,107,0.7)" strokeWidth="1.5" strokeDasharray="4,3" />
                              <text x={(tumorIdx / 60) * 700 + 5} y="18" fill="#ff6b6b" fontSize="12" fontFamily="IBM Plex Mono">
                                {deliveryMode === 'interstitial' ? 'fiber tip' : `tumor ${depth}mm`}
                              </text>
                            </>
                          )}
                          {maxDose > 0 && (
                            <text x="5" y={200 * (1 - LETHAL / 1000 / maxDose) - 4}
                              fill="rgba(251,191,36,1)" fontSize="12" fontFamily="IBM Plex Mono">Lethal threshold</text>
                          )}
                        </svg>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0 16px' }}>
                          {(deliveryMode === 'interstitial'
                            ? ['−25mm', '−12.5mm', '0 (tip)', '+12.5mm', '+25mm']
                            : ['0mm', '12.5mm', '25mm', '37.5mm', '50mm']
                          ).map(d => <span key={d} style={{ ...mono, fontSize: 12, color: '#b8cece' }}>{d}</span>)}
                        </div>
                      </div>
                    </BentoCard>

                    {/* Outcome Probabilities */}
                    <BentoCard glowColor="rgba(34,197,94,0.08)">
                      <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(141,171,168,0.1)', background: 'rgba(13,37,64,0.4)' }}>
                        <span style={lbl}>Outcome Probability</span>
                      </div>
                      <div style={{ padding: 16 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 14 }}>
                          {[
                            { l: 'CR', v: outcome.cr, c: '#22c55e' },
                            { l: 'PR', v: outcome.pr, c: '#fbbf24' },
                            { l: 'NR', v: outcome.nr, c: '#ff6b6b' },
                          ].map(({ l, v, c }) => (
                            <div key={l}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <span style={{ ...lbl, fontSize: 9, color: c }}>{l}</span>
                                <span style={{ ...mono, fontSize: 14, fontWeight: 700, color: c }}>
                                  <AnimatedNumber value={v} decimals={0} suffix="%" />
                                </span>
                              </div>
                              <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                                <motion.div
                                  animate={{ width: `${v}%` }}
                                  transition={{ duration: 0.6, ease: 'easeOut' }}
                                  style={{ height: '100%', borderRadius: 3, background: c }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                        <p style={{ fontSize: 10, color: '#5c7f7c', lineHeight: 1.5, margin: 0 }}>
                          Logistic sigmoid · Agostinis 2011.<br />
                          Max CR: {Math.round((TISSUE_OUTCOME[tissueKey]?.max_cr ?? 0.85) * 100)}% for {tissue.label}
                        </p>
                        {outcome.clinNote && (
                          <div style={{ marginTop: 10, padding: '8px', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 8, fontSize: 10, color: '#fbbf24', lineHeight: 1.6 }}>
                            {outcome.clinNote}
                          </div>
                        )}
                      </div>
                    </BentoCard>
                  </div>

                  {/* ── PHOTOBLEACHING DETAIL ─────────────────────── */}
                  <BentoCard>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(141,171,168,0.1)', background: 'rgba(13,37,64,0.4)' }}>
                      <span style={{ ...lbl, color: '#4ecdc4' }}>
                        Photobleaching Model — [PS](t)=[PS]₀·exp(−<PhysicsTooltip label="β">β</PhysicsTooltip>·F)
                      </span>
                    </div>
                    <div style={{ padding: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      {[
                        ['Without bleaching', `${singletO2Linear.toFixed(1)} μM·s (overestimate)`],
                        ['With bleaching', `${singletO2.toFixed(1)} μM·s (corrected)`],
                        ['Correction factor', `${singletO2Linear > 0 ? (singletO2 / singletO2Linear * 100).toFixed(0) : '100'}% of linear`],
                        ['βF product', `${(ps.beta * tumorFluence).toFixed(2)} — ${ps.beta * tumorFluence > 2 ? 'significant' : ps.beta * tumorFluence > 0.5 ? 'moderate' : 'minor'} bleaching`],
                      ].map(([k, v]) => (
                        <div key={k} style={{ padding: '4px 8px', background: 'rgba(9,29,46,0.5)', borderRadius: 6 }}>
                          <div style={{ ...mono, fontSize: 9, color: '#5c7f7c' }}>{k}</div>
                          <div style={{ ...mono, fontSize: 10, color: '#b8cece' }}>{v}</div>
                        </div>
                      ))}
                    </div>
                  </BentoCard>

                  {/* ── BASELINE COMPARISON ───────────────────────── */}
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <motion.button onClick={lockBaseline}
                      whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                      style={{ ...mono, fontSize: 11, padding: '8px 16px', borderRadius: 8, cursor: 'pointer', background: 'rgba(78,205,196,0.15)', border: '1px solid rgba(78,205,196,0.4)', color: '#4ecdc4' }}>
                      📌 Lock as Baseline
                    </motion.button>
                    {baseline && (
                      <motion.button onClick={() => setBaseline(null)}
                        whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                        style={{ ...mono, fontSize: 11, padding: '8px 16px', borderRadius: 8, cursor: 'pointer', background: 'transparent', border: '1px solid rgba(141,171,168,0.2)', color: '#5c7f7c' }}>
                        ✕ Clear
                      </motion.button>
                    )}
                    {baseline && <span style={{ ...mono, fontSize: 10, color: '#5c7f7c' }}>{baseline.label}</span>}
                  </div>

                  {baseline && (
                    <BentoCard>
                      <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(141,171,168,0.1)', background: 'rgba(13,37,64,0.4)' }}>
                        <span style={{ ...lbl, color: '#4ecdc4' }}>Side-by-Side Comparison</span>
                      </div>
                      <div style={{ padding: 16 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: 0 }}>
                          {[
                            ['Metric', 'Baseline', 'Current', 'Delta'],
                            ['CR Rate', `${baseline.cr}%`, `${outcome.cr}%`, `${outcome.cr - baseline.cr > 0 ? '+' : ''}${outcome.cr - baseline.cr}%`],
                            ['PR Rate', `${baseline.pr}%`, `${outcome.pr}%`, `${outcome.pr - baseline.pr > 0 ? '+' : ''}${outcome.pr - baseline.pr}%`],
                            ['¹O₂ Dose', `${baseline.singletO2}`, `${singletO2.toFixed(1)}`, `${((singletO2 - parseFloat(baseline.singletO2)) / parseFloat(baseline.singletO2) * 100).toFixed(0)}%`],
                            ['Tumor Fluence', `${baseline.tumorFluence}`, `${tumorFluence.toFixed(2)}`, `${((tumorFluence - parseFloat(baseline.tumorFluence)) / parseFloat(baseline.tumorFluence) * 100).toFixed(0)}%`],
                            ['[PS] Rem.', `${baseline.psRemaining}%`, `${Math.round(psRemaining * 100)}%`, `${Math.round(psRemaining * 100) - baseline.psRemaining}pp`],
                            ['Adequacy', baseline.adequacy, adequacy, ''],
                          ].map((row, ri) =>
                            row.map((cell, ci) => {
                              const isHeader = ri === 0;
                              const isDelta = ci === 3 && !isHeader;
                              const deltaVal = isDelta ? parseFloat(cell) : null;
                              const deltaColor = deltaVal == null || isNaN(deltaVal) ? '#8daba8' : deltaVal > 0 ? '#22c55e' : deltaVal < 0 ? '#ff6b6b' : '#8daba8';
                              return (
                                <div key={`${ri}-${ci}`} style={{
                                  padding: '8px 12px',
                                  background: ri % 2 === 0 ? 'rgba(9,29,46,0.4)' : 'transparent',
                                  borderBottom: '1px solid rgba(141,171,168,0.06)',
                                  ...mono, fontSize: isHeader ? 9 : 11,
                                  color: isHeader ? '#5c7f7c' : isDelta ? deltaColor : ci === 0 ? '#8daba8' : '#b8cece',
                                  fontWeight: isHeader ? 'normal' : ci === 0 ? 'normal' : 600,
                                  letterSpacing: isHeader ? '0.1em' : 0,
                                  textTransform: isHeader ? 'uppercase' : 'none',
                                }}>
                                  {cell}
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </BentoCard>
                  )}

                  {/* ── LIVE PHYSICS READOUT ──────────────────────── */}
                  <BentoCard>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(141,171,168,0.1)', background: 'rgba(13,37,64,0.4)' }}>
                      <span style={{ ...lbl, color: '#4ecdc4' }}>Live Physics Readout</span>
                    </div>
                    <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 24px' }}>
                      {([
                        ['Model', 'Diffusion approx. (Farrell 1992)'],
                        ['Delivery mode', deliveryMode],
                        ['Tissue', tissue.label],
                        ['PS', ps.name.split('(')[0].trim()],
                        ['λ', `${ps.lambda} nm`],
                        ['μa@630nm', `${tissue.mua} cm⁻¹`],
                        ['μa@λ (corr.)', `${mua_eff.toFixed(3)} cm⁻¹`],
                        ["μs'@λ (corr.)", `${musp_eff.toFixed(2)} cm⁻¹`],
                        ['μeff (λ-corr.)', `${mueff.toFixed(4)} cm⁻¹`],
                        ['D', `${D.toFixed(5)} cm`],
                        ['Bleaching β', `${ps.beta} cm²/J`],
                        ['βF product', `${(ps.beta * tumorFluence).toFixed(3)}`],
                        ['[PS] at end', `${Math.round(psRemaining * 100)}% of [PS]₀`],
                        ['¹O₂ (linear)', `${singletO2Linear.toFixed(2)} μM·s`],
                        ['¹O₂ (bleach)', `${singletO2.toFixed(2)} μM·s`],
                        ['O₂ efficiency', `${Math.round(oxyFactor * 100)}%`],
                      ] as [string, string][]).map(([k, v]) => (
                        <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(141,171,168,0.05)' }}>
                          <span style={{ ...mono, fontSize: 10, color: '#5c7f7c' }}>
                            {['μeff (λ-corr.)', 'D', 'Bleaching β', "μs'@λ (corr.)", 'μa@λ (corr.)'].includes(k)
                              ? <PhysicsTooltip label={k === 'μeff (λ-corr.)' ? 'μeff' : k === 'Bleaching β' ? 'β' : k === 'D' ? 'D' : k.startsWith("μs'") ? "μs'" : 'μa'}>{k}</PhysicsTooltip>
                              : k}
                          </span>
                          <span style={{ ...mono, fontSize: 10, color: '#b8cece' }}>{v}</span>
                        </div>
                      ))}
                    </div>
                  </BentoCard>

                  {/* ── DISCLAIMER ────────────────────────────────── */}
                  <div style={{ padding: 12, background: 'rgba(141,171,168,0.04)', border: '1px solid rgba(141,171,168,0.1)', borderRadius: 10, fontSize: 11, color: '#5c7f7c', lineHeight: 1.7 }}>
                    <strong style={{ color: '#8daba8' }}>Physics foundation:</strong> Diffusion approximation (Farrell, Patterson & Wilson 1992 Med Phys).
                    Tissue optics: Cheong et al. (1990) & Jacques (2013). PS photobleaching: Georgakoudi & Foster (1998); Dysart & Patterson (2005).
                    λ-correction: Jacques (2013) power-law scattering. Outcome model: logistic sigmoid calibrated to Agostinis et al. (2011) CA Cancer J Clin.
                    <strong style={{ color: '#ff6b6b' }}> Not for clinical use without physician oversight.</strong>
                  </div>
                </>
              )}
=======
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
>>>>>>> eeb4c537ea74731802203ec4092c162b4b2d2456
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
