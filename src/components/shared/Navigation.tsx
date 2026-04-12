<<<<<<< HEAD
import React, { useRef, useState } from "react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "motion/react";
import { IconMenu2, IconX } from "@tabler/icons-react";
import { cn } from "../../lib/utils";

type Tool = 'home' | 'oncoscan' | 'pdt' | 'dosimetry';

const NAV_ITEMS: { id: Tool; label: string; sub: string }[] = [
  { id: 'home',      label: 'Home',          sub: 'Overview' },
  { id: 'oncoscan',  label: 'OncoScan AI',   sub: 'X-Ray Analysis' },
  { id: 'pdt',       label: 'PDT Simulator', sub: 'Treatment Planning' },
  { id: 'dosimetry', label: 'AI Dosimetry',  sub: 'Dose Optimization' },
];

export default function Navigation({ active, onChange }: { active: Tool; onChange: (t: Tool) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 60);
  });

  return (
    <motion.div
      ref={ref}
      className={cn("fixed inset-x-0 top-0 z-[100] flex justify-center px-4 pt-3 transition-all duration-300")}
    >
      {/* Desktop nav pill */}
      <motion.nav
        animate={{ width: scrolled ? "auto" : "100%", maxWidth: scrolled ? 680 : 1280 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        style={{
          background: scrolled ? "rgba(9,29,46,0.96)" : "rgba(9,29,46,0.85)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(141,171,168,0.18)",
          borderRadius: scrolled ? 999 : 16,
          padding: scrolled ? "8px 20px" : "10px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          boxShadow: scrolled ? "0 8px 32px rgba(0,0,0,0.4)" : "none",
          transition: "border-radius 0.3s, padding 0.3s, box-shadow 0.3s",
          width: "100%",
        }}
      >
        {/* Logo */}
        <button onClick={() => onChange('home')} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", padding: 0, flexShrink: 0 }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#5c7f7c,#4ecdc4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="4" stroke="#091d2e" strokeWidth="2.5"/>
              <path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="#091d2e" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          {!scrolled && (
            <div>
              <div style={{ fontFamily: "Playfair Display,serif", fontWeight: 700, fontSize: 15, color: "#e4eeee", lineHeight: 1.1 }}>Lumina</div>
              <div style={{ fontFamily: "IBM Plex Mono,monospace", fontSize: 8, color: "#5c7f7c", letterSpacing: "0.18em", textTransform: "uppercase" }}>Medical AI Suite</div>
            </div>
          )}
        </button>

        {/* Desktop links */}
        <div className="hidden md:flex" style={{ gap: 4 }}>
          {NAV_ITEMS.map(({ id, label }) => (
            <button key={id} onClick={() => onChange(id)} style={{
              padding: scrolled ? "6px 14px" : "7px 14px",
              borderRadius: 999,
              cursor: "pointer",
              background: active === id ? "rgba(78,205,196,0.15)" : "transparent",
              border: active === id ? "1px solid rgba(78,205,196,0.35)" : "1px solid transparent",
              color: active === id ? "#b8cece" : "#8daba8",
              fontFamily: "IBM Plex Mono,monospace",
              fontSize: 11,
              fontWeight: active === id ? 600 : 400,
              transition: "all 0.2s",
              whiteSpace: "nowrap",
            }}>{label}</button>
          ))}
        </div>

        {/* Mobile hamburger */}
        <button className="flex md:hidden" onClick={() => setMobileOpen(o => !o)} style={{ background: "none", border: "1px solid rgba(141,171,168,0.2)", borderRadius: 8, padding: "6px 8px", cursor: "pointer", color: "#8daba8" }}>
          {mobileOpen ? <IconX size={16}/> : <IconMenu2 size={16}/>}
        </button>
      </motion.nav>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            style={{
              position: "absolute", top: "calc(100% + 8px)", left: 16, right: 16,
              background: "rgba(9,29,46,0.97)", border: "1px solid rgba(141,171,168,0.18)",
              borderRadius: 16, padding: 12, backdropFilter: "blur(20px)",
              display: "flex", flexDirection: "column", gap: 4,
            }}
          >
            {NAV_ITEMS.map(({ id, label, sub }) => (
              <button key={id} onClick={() => { onChange(id); setMobileOpen(false); }} style={{
                padding: "12px 16px", borderRadius: 10, cursor: "pointer", textAlign: "left",
                background: active === id ? "rgba(78,205,196,0.12)" : "transparent",
                border: active === id ? "1px solid rgba(78,205,196,0.3)" : "1px solid transparent",
                color: active === id ? "#b8cece" : "#8daba8",
              }}>
                <div style={{ fontFamily: "IBM Plex Mono,monospace", fontSize: 12, fontWeight: 500 }}>{label}</div>
                <div style={{ fontFamily: "IBM Plex Mono,monospace", fontSize: 9, color: "#5c7f7c", letterSpacing: "0.15em", textTransform: "uppercase", marginTop: 2 }}>{sub}</div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
=======
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
>>>>>>> eeb4c537ea74731802203ec4092c162b4b2d2456
  );
}
