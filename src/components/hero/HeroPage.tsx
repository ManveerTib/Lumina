import React, { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { PinContainer } from "../ui/3d-pin";
import { FeaturesStats } from "../ui/features-stats";

// ─── Terminal embedded directly in the MacBook screen ────────────────────────
const LINES = [
  { delay: 0,    cmd: true,  text: "ssh manveer@lumina-medical.ai" },
  { delay: 800,  cmd: false, text: "✔ Connected · Lumina Medical AI Suite v2.0" },
  { delay: 1300, cmd: true,  text: "python3 launch_suite.py" },
  { delay: 2100, cmd: false, text: "✔ OncoScan AI     — DenseNet121 · 14 diseases" },
  { delay: 2400, cmd: false, text: "✔ PDT Simulator   — Diffusion approx (Farrell 1992)" },
  { delay: 2700, cmd: false, text: "✔ AI Dosimetry    — RF model · O₂: 88% importance" },
  { delay: 3200, cmd: false, text: "" },
  { delay: 3400, cmd: true,  text: "echo 'Welcome to Manveer\\'s ISM Final Product'" },
  { delay: 4400, cmd: false, text: "Welcome to Manveer's ISM Final Product" },
  { delay: 4900, cmd: false, text: "" },
  { delay: 5100, cmd: false, text: "Discovery is for naught if it cannot reach" },
  { delay: 5500, cmd: false, text: "the people it was designed to serve." },
  { delay: 6000, cmd: false, text: "                    — Manveer Singh Tib, 2026" },
];

function EmbeddedTerminal() {
  const [visibleCount, setVisibleCount] = useState(0);
  const [cursor, setCursor] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    LINES.forEach((line, i) => {
      setTimeout(() => setVisibleCount(i + 1), line.delay);
    });
    const tick = setInterval(() => setCursor(c => !c), 530);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [visibleCount]);

  return (
    <div style={{
      width: "100%", height: "100%",
      background: "linear-gradient(135deg, #060d18 0%, #091d2e 100%)",
      borderRadius: 10, padding: "10px 14px",
      fontFamily: "IBM Plex Mono, monospace", fontSize: 10.5,
      overflowY: "auto", display: "flex", flexDirection: "column", gap: 1,
    }}>
      {/* Traffic lights */}
      <div style={{ display: "flex", gap: 5, marginBottom: 8, alignItems: "center" }}>
        <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#ff5f57" }}/>
        <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#febc2e" }}/>
        <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#28c840" }}/>
        <span style={{ marginLeft: 10, fontSize: 9, color: "#5c7f7c", letterSpacing: "0.1em" }}>manveer@lumina — bash</span>
      </div>

      {LINES.slice(0, visibleCount).map((line, i) => (
        <div key={i} style={{
          lineHeight: 1.65,
          color: line.cmd ? "#e4eeee"
            : line.text.startsWith("✔") ? "#4ecdc4"
            : line.text.startsWith("Discovery") || line.text.startsWith("the people") || line.text.startsWith("                    —") ? "#8daba8"
            : "#8daba8",
          whiteSpace: "pre",
        }}>
          {line.cmd && (
            <span style={{ color: "#5c7f7c" }}>
              <span style={{ color: "#4ecdc4" }}>manveer</span>:~$ {" "}
            </span>
          )}
          {line.text}
        </div>
      ))}

      {/* Blinking cursor */}
      <div style={{ lineHeight: 1.65, color: "#e4eeee" }}>
        <span style={{ color: "#5c7f7c" }}>
          <span style={{ color: "#4ecdc4" }}>manveer</span>:~$ {" "}
        </span>
        <span style={{
          display: "inline-block", width: 6, height: 12,
          background: cursor ? "#4ecdc4" : "transparent",
          verticalAlign: "middle", transition: "background 0.1s",
        }}/>
      </div>
      <div ref={bottomRef}/>
    </div>
  );
}

// ─── MacBook shell — reduced height, terminal centered in screen ─────────────
function MacBookHero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });

  // Lid opens as user scrolls — completes by 20% scroll (much faster than before)
  const lidRotate = useTransform(scrollYProgress, [0, 0.2], [-32, 0]);
  const lidScaleY = useTransform(scrollYProgress, [0, 0.2], [0.5, 1]);
  const titleY    = useTransform(scrollYProgress, [0, 0.15], [0, -60]);
  const titleOp   = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const bodyY     = useTransform(scrollYProgress, [0.3, 0.7], [0, 480]);

  // MacBook dimensions
  const W = 520; // screen + base width
  const SW = 480; // screen width
  const SH = 300; // screen height

  return (
    // Reduced from 140vh → 105vh so less scrolling needed
    <div ref={ref} style={{ minHeight: "105vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", paddingTop: 90 }}>

      {/* Fading title */}
      <motion.div style={{ y: titleY, opacity: titleOp, textAlign: "center", marginBottom: 28, zIndex: 2, position: "relative" }}>
        <div style={{ fontFamily: "IBM Plex Mono,monospace", fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: "#5c7f7c", marginBottom: 10 }}>
          // Manveer Singh Tib · ISM Research · Texas A&amp;M
        </div>
        <h1 style={{ fontFamily: "Playfair Display,serif", fontSize: "clamp(26px,4.5vw,52px)", fontWeight: 900, color: "#e4eeee", lineHeight: 1.08, marginBottom: 8 }}>
          Lumina Medical<br/>
          <span style={{ background: "linear-gradient(135deg,#b8cece,#4ecdc4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            AI Suite
          </span>
        </h1>
        <p style={{ fontSize: 13, color: "#8daba8" }}>Scroll to boot the system</p>
      </motion.div>

      {/* MacBook — sticky in viewport */}
      <div style={{ position: "sticky", top: 70, zIndex: 5 }}>
        <motion.div style={{ y: bodyY, display: "flex", flexDirection: "column", alignItems: "center" }}>

          {/* Screen lid */}
          <div style={{ position: "relative", width: SW, perspective: "1400px" }}>

            {/* Static back of lid (always visible) */}
            <div style={{
              width: SW, height: SH, borderRadius: 14, background: "#0a0a0a",
              border: "1px solid #222", boxSizing: "border-box",
              transform: "perspective(1400px) rotateX(-18deg)",
              transformOrigin: "bottom center",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {/* Apple-style logo on back */}
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.12 }}>
                <circle cx="12" cy="12" r="8" stroke="#8daba8" strokeWidth="1"/>
                <circle cx="12" cy="12" r="3" fill="#8daba8" opacity="0.4"/>
                <path d="M12 4v4M12 16v4M4 12h4M16 12h4" stroke="#8daba8" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </div>

            {/* Animated lid opening — terminal screen inside */}
            <motion.div style={{
              rotateX: lidRotate,
              scaleY: lidScaleY,
              transformOrigin: "bottom center",
              position: "absolute", top: 0, left: 0,
              width: SW, height: SH,
            }}>
              <div style={{
                width: "100%", height: "100%", borderRadius: 14,
                background: "#070f1a", padding: 6,
                border: "1px solid rgba(141,171,168,0.25)",
                boxShadow: "0 0 50px rgba(78,205,196,0.08), 0 24px 80px rgba(0,0,0,0.7)",
                overflow: "hidden", boxSizing: "border-box",
              }}>
                <EmbeddedTerminal />
              </div>
            </motion.div>
          </div>

          {/* Keyboard base */}
          <div style={{ width: W, display: "flex", flexDirection: "column", alignItems: "center" }}>
            {/* Hinge bar */}
            <div style={{ width: "100%", height: 6, background: "linear-gradient(to bottom,#1c1c1e,#111)", borderRadius: "0 0 4px 4px", marginTop: -1 }}/>
            {/* Base */}
            <div style={{ width: "100%", height: 18, background: "linear-gradient(to bottom,#1a1a1c,#111)", borderRadius: "0 0 14px 14px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 52, height: 3, borderRadius: 2, background: "#2a2a2c" }}/>
            </div>
            {/* Shadow strip */}
            <div style={{ width: "98%", height: 8, background: "linear-gradient(to bottom,rgba(0,0,0,0.4),transparent)", borderRadius: "0 0 12px 12px" }}/>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ─── 3 tool pin cards ─────────────────────────────────────────────────────────
const TOOLS = [
  { id: "oncoscan",  name: "OncoScan AI",   accent: "#0ea5e9", stats: ["14 diseases","DenseNet121","GradCAM","FastAPI"],          desc: "14-disease chest X-ray CNN with GradCAM heatmap. Detects pneumonia, carcinoma, effusion and more from a frontal radiograph." },
  { id: "pdt",       name: "PDT Simulator", accent: "#4ecdc4", stats: ["Diffusion approx","2D fluence map","Metronomic","9 tissues"], desc: "Physics-grade PDT planning using diffusion approximation (Farrell 1992). 2D fluence maps and fractionated dosing mode." },
  { id: "dosimetry", name: "AI Dosimetry",  accent: "#a78bfa", stats: ["RF model","O₂: 88%","10 features","Prescriptive"],        desc: "Prescriptive treatment optimization. Works backwards from a therapeutic goal to calculate the optimal surface fluence and timing." },
];

interface HeroPageProps { onNavigate: (tool: string) => void; }

export default function HeroPage({ onNavigate }: HeroPageProps) {
  return (
    <div style={{ position: "relative" }}>

      {/* MacBook scroll section */}
      <MacBookHero />

      {/* Features / stats bento */}
      <div style={{ background: "rgba(7,15,26,0.75)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(141,171,168,0.1)", borderBottom: "1px solid rgba(141,171,168,0.1)" }}>
        <FeaturesStats />
      </div>

      {/* 3D Pin cards */}
      <div style={{ padding: "64px 24px 100px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ fontFamily: "IBM Plex Mono,monospace", fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: "#5c7f7c", marginBottom: 10 }}>
              // Three Tools · One Pipeline
            </div>
            <h2 style={{ fontFamily: "Playfair Display,serif", fontSize: "clamp(22px,3.5vw,36px)", fontWeight: 900, color: "#e4eeee", marginBottom: 10 }}>
              The Lumina Suite
            </h2>
            <p style={{ fontSize: 13, color: "#8daba8", maxWidth: 480, margin: "0 auto", lineHeight: 1.7 }}>
              Detect → Plan → Optimize. Each tool is a direct engineering response to one of three ISM research questions.
            </p>
          </div>

          <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 8 }}>
            {TOOLS.map(tool => (
              <div key={tool.id} style={{ height: 400, width: 340, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <PinContainer title={tool.name} href="#" containerClassName="">
                  <div style={{ width: 270, height: 215, display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ height: 88, borderRadius: 10, background: `linear-gradient(135deg,${tool.accent}18,${tool.accent}38)`, border: `1px solid ${tool.accent}30`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
                      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 25% 50%,${tool.accent}18,transparent 65%)` }}/>
                      <div style={{ fontFamily: "Playfair Display,serif", fontSize: 16, fontWeight: 700, color: "#e4eeee", position: "relative", zIndex: 1 }}>{tool.name}</div>
                      <div style={{ fontFamily: "IBM Plex Mono,monospace", fontSize: 9, color: tool.accent, letterSpacing: "0.15em", textTransform: "uppercase", position: "relative", zIndex: 1, marginTop: 4 }}>ISM 2025–26</div>
                    </div>
                    <p style={{ fontSize: 11, color: "#8daba8", lineHeight: 1.6, margin: 0 }}>{tool.desc}</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {tool.stats.map(s => (
                        <span key={s} style={{ padding: "2px 7px", background: `${tool.accent}12`, border: `1px solid ${tool.accent}28`, borderRadius: 999, fontFamily: "IBM Plex Mono,monospace", fontSize: 9, color: tool.accent }}>{s}</span>
                      ))}
                    </div>
                    <button onClick={e => { e.preventDefault(); e.stopPropagation(); onNavigate(tool.id); }}
                      style={{ marginTop: "auto", padding: "7px 14px", background: `${tool.accent}18`, border: `1px solid ${tool.accent}38`, borderRadius: 8, color: tool.accent, fontFamily: "IBM Plex Mono,monospace", fontSize: 10, cursor: "pointer", letterSpacing: "0.1em", textTransform: "uppercase", transition: "all 0.2s", pointerEvents: "auto" }}>
                      Open Tool →
                    </button>
                  </div>
                </PinContainer>
              </div>
            ))}
          </div>

          {/* Research callout */}
          <div style={{ marginTop: 56, padding: "24px 32px", background: "rgba(13,37,64,0.5)", border: "1px solid rgba(141,171,168,0.12)", borderRadius: 20, maxWidth: 680, margin: "56px auto 0", textAlign: "center" }}>
            <div style={{ fontFamily: "IBM Plex Mono,monospace", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#5c7f7c", marginBottom: 10 }}>
              // ISM Research · Texas A&amp;M · Dr. Bagnato
            </div>
            <p style={{ fontSize: 13, color: "#8daba8", lineHeight: 1.8, marginBottom: 14 }}>
              14-page PDT manuscript developed under Dr. Vanderlei Salvador Bagnato at Texas A&amp;M University.
              Presented at the UNT Frisco ISM Showcase · Pending publication in Journal of High School Science.
            </p>
            <div style={{ fontFamily: "Playfair Display,serif", fontSize: 15, fontStyle: "italic", color: "#b8cece" }}>
              "Discovery is for naught if it cannot reach the people it was designed to serve."
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
