import React, { useEffect, useRef } from "react";
import { cn } from "../../lib/utils";

export function BackgroundBeams({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let t = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const beams = Array.from({ length: 8 }, (_, i) => ({
      x: (i / 8) * window.innerWidth + Math.random() * 100 - 50,
      speed: 0.3 + Math.random() * 0.5,
      width: 1 + Math.random() * 2,
      opacity: 0.03 + Math.random() * 0.06,
      offset: Math.random() * Math.PI * 2,
    }));

    const draw = () => {
      t += 0.008;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Subtle radial overlay
      const grad = ctx.createRadialGradient(canvas.width / 2, 0, 0, canvas.width / 2, canvas.height * 0.6, canvas.height * 0.9);
      grad.addColorStop(0, "rgba(141,171,168,0.04)");
      grad.addColorStop(0.5, "rgba(9,29,46,0.0)");
      grad.addColorStop(1, "rgba(9,29,46,0.0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Beams
      beams.forEach(beam => {
        const x = beam.x + Math.sin(t * beam.speed + beam.offset) * 60;
        const lg = ctx.createLinearGradient(x, 0, x + 2, canvas.height * 0.85);
        lg.addColorStop(0, `rgba(141,171,168,${beam.opacity})`);
        lg.addColorStop(0.4, `rgba(78,205,196,${beam.opacity * 0.7})`);
        lg.addColorStop(1, "rgba(9,29,46,0)");
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + beam.width, 0);
        ctx.lineTo(x + beam.width * 3, canvas.height * 0.85);
        ctx.lineTo(x - beam.width * 2, canvas.height * 0.85);
        ctx.closePath();
        ctx.fillStyle = lg;
        ctx.fill();
      });

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={cn("fixed inset-0 pointer-events-none z-0", className)}
      style={{ background: "transparent" }}
    />
  );
}
