import React from "react";
import { Card, CardContent } from "./card";
import { cn } from "../../lib/utils";

// Lumina Medical AI Suite — key stats bento section
// Replaces the plain 6-card grid shown in the screenshot

const STATS = [
  {
    value: "127,871",
    label: "Chest X-rays trained",
    accent: "#4ecdc4",
    span: "col-span-1",
    sub: "NIH ChestX-ray14 dataset",
  },
  {
    value: "9",
    label: "PDT tissue types",
    accent: "#e4eeee",
    span: "col-span-1",
    sub: "Cheong et al. (1990) optical data",
  },
  {
    value: "88%",
    label: "Feature importance (O₂)",
    accent: "#a78bfa",
    span: "col-span-1",
    sub: "Random Forest · top predictor",
  },
  {
    value: "7",
    label: "Photosensitizers",
    accent: "#4ecdc4",
    span: "col-span-1",
    sub: "Gen 1–3 · Agostinis et al. 2011",
  },
  {
    value: "DenseNet121",
    label: "Model architecture",
    accent: "#e4eeee",
    span: "col-span-1",
    sub: "CheXNet · 14-class sigmoid output",
  },
  {
    value: "Farrell 1992",
    label: "Physics model",
    accent: "#a78bfa",
    span: "col-span-1",
    sub: "Diffusion approximation · Med Phys",
  },
];

// Wide feature cards
const FEATURES = [
  {
    title: "Precision PDT Pipeline",
    desc: "Three tools. One workflow. Detect with OncoScan AI → Plan with the PDT Simulator → Optimize with the AI Dosimetry Model. Each tool was built as a direct engineering response to a research question in the ISM manuscript.",
    accent: "#4ecdc4",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4ecdc4" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></svg>
    ),
  },
  {
    title: "Free · Browser-Based · No Login",
    desc: "All three tools run in any browser. No app to install, no account required, no cost. Built to reach patients anywhere — rural Texas, sub-Saharan Africa, any clinic with a laptop and an internet connection.",
    accent: "#a78bfa",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
    ),
  },
];

export function FeaturesStats({ className }: { className?: string }) {
  return (
    <section className={cn("py-16", className)}>
      <div className="mx-auto max-w-5xl px-6">

        {/* Section header */}
        <div className="mb-10 text-center">
          <div style={{ fontFamily: "IBM Plex Mono,monospace", fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: "#5c7f7c", marginBottom: 8 }}>
            // Research Foundation · ISM 2025–26
          </div>
          <h2 style={{ fontFamily: "Playfair Display,serif", fontSize: "clamp(22px,3.5vw,34px)", fontWeight: 900, color: "#e4eeee", lineHeight: 1.2 }}>
            By the Numbers
          </h2>
        </div>

        {/* 3×2 stat cards */}
        <div className="grid grid-cols-3 gap-3 mb-3">
          {STATS.map((s) => (
            <Card key={s.label} className="border-[rgba(141,171,168,0.15)] bg-[rgba(13,37,64,0.6)] hover:border-[rgba(141,171,168,0.3)] hover:bg-[rgba(13,37,64,0.8)] transition-all duration-300 group cursor-default">
              <CardContent className="pt-8 pb-6 px-6 flex flex-col items-center text-center gap-2">
                <span style={{ fontFamily: "Playfair Display,serif", fontSize: "clamp(28px,4vw,42px)", fontWeight: 700, color: s.accent, lineHeight: 1 }}
                  className="group-hover:scale-105 transition-transform duration-300 inline-block">
                  {s.value}
                </span>
                <span style={{ fontFamily: "IBM Plex Mono,monospace", fontSize: 12, color: "#b8cece", letterSpacing: "0.04em" }}>{s.label}</span>
                <span style={{ fontFamily: "IBM Plex Mono,monospace", fontSize: 10, color: "#5c7f7c", letterSpacing: "0.08em" }}>{s.sub}</span>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 2 wide feature cards */}
        <div className="grid grid-cols-2 gap-3">
          {FEATURES.map((f) => (
            <Card key={f.title} className="border-[rgba(141,171,168,0.15)] bg-[rgba(13,37,64,0.6)] hover:border-[rgba(141,171,168,0.3)] hover:bg-[rgba(13,37,64,0.8)] transition-all duration-300 group cursor-default">
              <CardContent className="pt-6 pb-6 px-6 flex flex-col gap-4">
                <div style={{ width: 44, height: 44, borderRadius: "50%", border: `1px solid ${f.accent}30`, background: `${f.accent}10`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {f.icon}
                </div>
                <div>
                  <div style={{ fontFamily: "Playfair Display,serif", fontSize: 16, fontWeight: 700, color: "#e4eeee", marginBottom: 6 }}>{f.title}</div>
                  <p style={{ fontSize: 12, color: "#8daba8", lineHeight: 1.7 }}>{f.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
