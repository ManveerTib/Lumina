import React, { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "../../lib/utils";

type TokenType = "command"|"flag"|"string"|"number"|"operator"|"path"|"variable"|"comment"|"default";
interface Token { type: TokenType; value: string; }

function tokenizeBash(text: string): Token[] {
  const tokens: Token[] = [];
  const words = text.split(/(\s+)/);
  let isFirstWord = true;
  for (const word of words) {
    if (/^\s+$/.test(word)) { tokens.push({ type: "default", value: word }); continue; }
    if (word.startsWith("#")) { tokens.push({ type: "comment", value: word }); continue; }
    if (word.startsWith("$")) { tokens.push({ type: "variable", value: word }); isFirstWord = false; continue; }
    if (word.startsWith("--") || word.startsWith("-")) { tokens.push({ type: "flag", value: word }); isFirstWord = false; continue; }
    if (/^["'].*["']$/.test(word)) { tokens.push({ type: "string", value: word }); isFirstWord = false; continue; }
    if (/^\d+$/.test(word)) { tokens.push({ type: "number", value: word }); isFirstWord = false; continue; }
    if (/^[|>&<]+$/.test(word)) { tokens.push({ type: "operator", value: word }); isFirstWord = true; continue; }
    if (word.includes("/") || word.startsWith(".") || word.startsWith("~")) { tokens.push({ type: "path", value: word }); isFirstWord = false; continue; }
    if (isFirstWord) { tokens.push({ type: "command", value: word }); isFirstWord = false; continue; }
    tokens.push({ type: "default", value: word });
  }
  return tokens;
}

const tokenColors: Record<TokenType, string> = {
  command: "text-emerald-400", flag: "text-sky-400", string: "text-amber-300",
  number: "text-purple-400", operator: "text-red-400", path: "text-cyan-300",
  variable: "text-pink-400", comment: "text-neutral-500", default: "text-neutral-300",
};

function SyntaxHighlightedText({ text }: { text: string }) {
  const tokens = tokenizeBash(text);
  return <>{tokens.map((token, i) => <span key={i} className={tokenColors[token.type]}>{token.value}</span>)}</>;
}

interface TerminalLine { type: "command"|"output"; content: string; }

export interface TerminalProps {
  commands: string[];
  outputs?: Record<number, string[]>;
  username?: string;
  className?: string;
  typingSpeed?: number;
  delayBetweenCommands?: number;
  initialDelay?: number;
}

export function Terminal({
  commands = [],
  outputs = {},
  username = "manveer-macbook",
  className,
  typingSpeed = 50,
  delayBetweenCommands = 800,
  initialDelay = 500,
}: TerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [currentText, setCurrentText] = useState("");
  const [commandIdx, setCommandIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [outputIdx, setOutputIdx] = useState(-1);
  const [phase, setPhase] = useState<"idle"|"typing"|"executing"|"outputting"|"pausing"|"done">("idle");
  const [cursorVisible, setCursorVisible] = useState(true);
  const [inView, setInView] = useState(false);

  const currentCommand = commands[commandIdx] || "";
  const currentOutputs = useMemo(() => outputs[commandIdx] || [], [outputs, commandIdx]);
  const isLastCommand = commandIdx === commands.length - 1;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setInView(true); observer.disconnect(); } }, { threshold: 0.1 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView || phase !== "idle") return;
    const t = setTimeout(() => setPhase("typing"), initialDelay);
    return () => clearTimeout(t);
  }, [inView, phase, initialDelay]);

  useEffect(() => {
    if (phase !== "typing") return;
    if (charIdx < currentCommand.length) {
      const t = setTimeout(() => { setCurrentText(currentCommand.slice(0, charIdx + 1)); setCharIdx(c => c + 1); }, typingSpeed + Math.random() * 30);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => setPhase("executing"), 80);
      return () => clearTimeout(t);
    }
  }, [phase, charIdx, currentCommand, typingSpeed]);

  useEffect(() => {
    if (phase !== "executing") return;
    setLines(prev => [...prev, { type: "command", content: currentCommand }]);
    setCurrentText("");
    if (currentOutputs.length > 0) { setOutputIdx(0); setPhase("outputting"); }
    else if (isLastCommand) setPhase("done");
    else setPhase("pausing");
  }, [phase, currentCommand, currentOutputs.length, isLastCommand]);

  useEffect(() => {
    if (phase !== "outputting") return;
    if (outputIdx >= 0 && outputIdx < currentOutputs.length) {
      const t = setTimeout(() => { setLines(prev => [...prev, { type: "output", content: currentOutputs[outputIdx] }]); setOutputIdx(i => i + 1); }, 150);
      return () => clearTimeout(t);
    } else if (outputIdx >= currentOutputs.length) {
      const t = setTimeout(() => { if (isLastCommand) setPhase("done"); else setPhase("pausing"); }, 300);
      return () => clearTimeout(t);
    }
  }, [phase, outputIdx, currentOutputs, isLastCommand]);

  useEffect(() => {
    if (phase !== "pausing") return;
    const t = setTimeout(() => { setCharIdx(0); setOutputIdx(-1); setCommandIdx(c => c + 1); setPhase("typing"); }, delayBetweenCommands);
    return () => clearTimeout(t);
  }, [phase, delayBetweenCommands]);

  useEffect(() => {
    const interval = setInterval(() => setCursorVisible(v => !v), 530);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (contentRef.current) contentRef.current.scrollTop = contentRef.current.scrollHeight;
  }, [lines, phase]);

  const prompt = (
    <span className="text-neutral-500">
      <span className="text-sky-400">{username}</span>
      <span className="text-emerald-500">:</span>
      <span className="text-cyan-400">~</span>
      <span className="text-neutral-500">$</span>{" "}
    </span>
  );

  return (
    <div ref={containerRef} className={cn("mx-auto w-full max-w-2xl px-4 font-mono text-xs", className)}>
      <div className="overflow-hidden rounded-xl border border-[rgba(141,171,168,0.2)] bg-[#070f1a] shadow-2xl shadow-black/50">
        <div className="flex items-center gap-2 bg-[#0d1f35] px-4 py-3 border-b border-[rgba(141,171,168,0.1)]">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full bg-red-500"/>
            <div className="h-3 w-3 rounded-full bg-yellow-500"/>
            <div className="h-3 w-3 rounded-full bg-green-500"/>
          </div>
          <div className="flex-1 text-center">
            <span className="text-xs text-[#5c7f7c] font-mono">{username} — Lumina Medical AI</span>
          </div>
          <div className="w-[52px]"/>
        </div>
        <div ref={contentRef} className="h-72 overflow-y-auto p-4 font-mono scrollbar-thin">
          {lines.map((line, i) => (
            <div key={i} className="leading-relaxed whitespace-pre-wrap mb-1">
              {line.type === "command"
                ? <span>{prompt}<SyntaxHighlightedText text={line.content}/></span>
                : <span className="text-[#8daba8]">{line.content}</span>}
            </div>
          ))}
          {phase === "typing" && (
            <div className="leading-relaxed whitespace-pre-wrap">
              {prompt}<SyntaxHighlightedText text={currentText}/>
              <span className="ml-0.5 inline-block h-4 w-2 bg-[#4ecdc4] align-middle animate-pulse"/>
            </div>
          )}
          {(phase === "done" || phase === "pausing" || phase === "outputting") && (
            <div className="leading-relaxed whitespace-pre-wrap">
              {prompt}
              <span className={cn("inline-block h-4 w-2 bg-[#8daba8] align-middle transition-opacity duration-100", !cursorVisible && "opacity-0")}/>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
