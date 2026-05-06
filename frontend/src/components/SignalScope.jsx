import { useEffect, useRef } from "react";

export default function SignalScope({ active, priority = 0 }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    const width = canvas.width;
    const height = canvas.height;

    let particles = [];
    const getColor = (priority) => {
        switch (priority) {
          case 5:
            return "#ef4444"; // red
          case 4:
            return "#f97316"; // orange
          case 3:
            return "#eab308"; // yellow
          case 2:
            return "#22c55e"; // green
          default:
            return "#3b82f6"; // blue (normal)
        }
      };
    const baseColor = getColor(priority) || "#22c55e";

    const hexToRgb = (hex) => {
        if (!hex || typeof hex !== "string") {
          return { r: 34, g: 197, b: 94 }; // fallback green
        }

        const clean = hex.replace("#", "");
        if (clean.length !== 6) {
          return { r: 34, g: 197, b: 94 };
        }

        const bigint = parseInt(clean, 16);
      
        return {
          r: (bigint >> 16) & 255,
          g: (bigint >> 8) & 255,
          b: bigint & 255,
        };
      };

    const { r, g, b } = hexToRgb(baseColor);

    const createParticle = () => {
      return {
        x: width,
        y:
          height / 2 +
          (Math.random() - 0.5) *
            (active ? 50 : 10),
        speed: 2 + Math.random() * 4,
        alpha: 0.2 + Math.random() * 0.8,
        size: 1 + Math.random() * 2,
      };
    };

    const draw = () => {
      animationRef.current =
        requestAnimationFrame(draw);

      // phosphor fade
      ctx.fillStyle = "rgba(0,0,0,0.22)";
      ctx.fillRect(0, 0, width, height);

      // center reference line
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.strokeStyle = "rgba(34,197,94,0.08)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // generate activity
      const spawnRate = active ? 8 : 1;

      for (let i = 0; i < spawnRate; i++) {
        if (Math.random() < 0.35) {
          particles.push(createParticle());
        }
      }

      // draw signal bursts
      particles.forEach((p, index) => {
        p.x -= p.speed;

        ctx.beginPath();

//      ctx.strokeStyle = `rgba(34,197,94,${p.alpha})`;
//      ctx.shadowColor = "#22c55e";
        ctx.strokeStyle = `rgba(${r},${g},${b},${p.alpha})`;
        ctx.shadowColor = baseColor;
        ctx.lineWidth = p.size;
        ctx.shadowBlur = active ? 2 : 0;

        ctx.moveTo(p.x, height / 2);
        ctx.lineTo(p.x, p.y);

        ctx.stroke();

        p.alpha *= 0.985;

        if (p.x < 0 || p.alpha < 0.05) {
          particles.splice(index, 1);
        }
      });
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [active,priority]);

  return (
    <div className="bg-black rounded-lg border border-zinc-800 overflow-hidden">
      <canvas
        ref={canvasRef}
        width={1000}
        height={90}
        className="w-full h-[90px]"
      />
    </div>
  );
}
