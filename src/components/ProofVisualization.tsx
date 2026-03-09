import { useRef, useEffect, useState, useCallback } from "react";

const ProofVisualization = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const animFrameRef = useRef<number>(0);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    // Colors
    const CYAN = "#06B6D4";
    const INDIGO = "#6366F1";
    const WHITE = "#E2E8F0";
    const DIM = "#1E1B4B";
    const BG = "#0A0A0F";

    // Data packets
    interface Packet {
      x: number;
      y: number;
      phase: number; // 0=entering, 1=in circuit, 2=exiting
      progress: number;
      speed: number;
      row: number;
    }

    // Circuit nodes
    interface Node {
      x: number;
      y: number;
    }

    const packets: Packet[] = [];
    const CYCLE = 8000; // 8s loop

    // Generate circuit layout
    const getCircuitNodes = (w: number, h: number): Node[] => {
      const cx = w * 0.5;
      const cy = h * 0.5;
      const spread = Math.min(w, h) * 0.25;
      return [
        { x: cx - spread * 0.8, y: cy - spread * 0.6 },
        { x: cx - spread * 0.3, y: cy - spread * 0.9 },
        { x: cx + spread * 0.2, y: cy - spread * 0.5 },
        { x: cx + spread * 0.7, y: cy - spread * 0.2 },
        { x: cx + spread * 0.5, y: cy + spread * 0.3 },
        { x: cx, y: cy + spread * 0.7 },
        { x: cx - spread * 0.5, y: cy + spread * 0.4 },
        { x: cx - spread * 0.7, y: cy },
      ];
    };

    let startTime = performance.now();

    const draw = (time: number) => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      const elapsed = (time - startTime) % CYCLE;
      const t = elapsed / CYCLE; // 0..1

      ctx.clearRect(0, 0, w, h);

      const nodes = getCircuitNodes(w, h);
      const cx = w * 0.5;
      const cy = h * 0.5;

      // Draw circuit structure (indigo lines)
      ctx.strokeStyle = DIM;
      ctx.lineWidth = 1;
      ctx.setLineDash([]);
      for (let i = 0; i < nodes.length; i++) {
        const next = nodes[(i + 1) % nodes.length];
        ctx.beginPath();
        ctx.moveTo(nodes[i].x, nodes[i].y);
        ctx.lineTo(next.x, next.y);
        ctx.stroke();
      }

      // Draw active circuit paths (indigo, animated)
      const activeSegments = Math.floor(t * nodes.length * 2) % nodes.length;
      for (let i = 0; i <= activeSegments && i < nodes.length; i++) {
        const next = nodes[(i + 1) % nodes.length];
        ctx.strokeStyle = INDIGO;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(nodes[i].x, nodes[i].y);
        ctx.lineTo(next.x, next.y);
        ctx.stroke();
      }

      // Draw circuit nodes
      nodes.forEach((node, i) => {
        const active = i <= activeSegments;
        ctx.fillStyle = active ? INDIGO : DIM;
        ctx.fillRect(node.x - 2.5, node.y - 2.5, 5, 5);
      });

      // Data packets entering from left
      const entryCount = 5;
      for (let i = 0; i < entryCount; i++) {
        const pt = (t + i * 0.15) % 1;
        if (pt < 0.3) {
          // Entering phase
          const px = pt / 0.3;
          const startX = -10;
          const endX = nodes[0].x;
          const yOffset = (i - 2) * 20;
          const x = startX + (endX - startX) * px;
          const y = cy + yOffset;

          ctx.fillStyle = CYAN;
          ctx.globalAlpha = 0.6 + px * 0.4;
          ctx.fillRect(x - 3, y - 3, 6, 6);
          ctx.globalAlpha = 1;

          // Trail
          ctx.strokeStyle = CYAN;
          ctx.globalAlpha = 0.15;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(Math.max(0, x - 30), y);
          ctx.lineTo(x, y);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }

      // Proof seal emerging (hexagon on right)
      if (t > 0.7) {
        const sealProgress = (t - 0.7) / 0.3;
        const sealX = w * 0.82;
        const sealY = cy;
        const size = 18 * Math.min(sealProgress * 1.5, 1);

        ctx.strokeStyle = WHITE;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = sealProgress;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i - Math.PI / 2;
          const px = sealX + size * Math.cos(angle);
          const py = sealY + size * Math.sin(angle);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();

        // Inner dot
        ctx.fillStyle = WHITE;
        ctx.beginPath();
        ctx.arc(sealX, sealY, 2, 0, Math.PI * 2);
        ctx.fill();

        // Connection line from circuit to seal
        const lastNode = nodes[nodes.length - 1];
        ctx.strokeStyle = CYAN;
        ctx.globalAlpha = sealProgress * 0.4;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(lastNode.x, lastNode.y);
        ctx.lineTo(sealX - size, sealY);
        ctx.stroke();

        ctx.globalAlpha = 1;
      }

      // Mouse scan line distortion
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      if (mx > 0 && my > 0) {
        ctx.strokeStyle = INDIGO;
        ctx.globalAlpha = 0.08;
        ctx.lineWidth = 1;
        // Horizontal scan line
        ctx.beginPath();
        ctx.moveTo(0, my);
        ctx.lineTo(w, my);
        ctx.stroke();
        // Vertical scan line
        ctx.beginPath();
        ctx.moveTo(mx, 0);
        ctx.lineTo(mx, h);
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Intersection glow
        ctx.fillStyle = INDIGO;
        ctx.globalAlpha = 0.15;
        ctx.beginPath();
        ctx.arc(mx, my, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      animFrameRef.current = requestAnimationFrame(draw);
    };

    animFrameRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      onMouseMove={handleMouseMove}
      className="w-full h-full cursor-crosshair"
      style={{ display: "block" }}
    />
  );
};

export default ProofVisualization;
