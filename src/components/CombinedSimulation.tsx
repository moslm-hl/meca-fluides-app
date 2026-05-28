import React, { useRef, useEffect, useState } from 'react';

export interface PipelineSegment {
  id: string;
  type: 'straight' | 'venturi' | 'bend';
  length?: number;
  neckSize?: number;
  angle?: number;
}

interface CombinedSimProps {
  velocity: number;
  guideSize: number;
  density: number;
  viscosity: number;
  pressureIn: number;
  pipeline: PipelineSegment[];
}

const CombinedSimulation: React.FC<CombinedSimProps> = ({ velocity, guideSize, density, viscosity, pressureIn, pipeline }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<any[]>([]);
  const frameRef = useRef<number>();

  const [overlayPos, setOverlayPos] = useState({ x: 24, y: 24 });
  const [isDraggingOverlay, setIsDraggingOverlay] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Panning State
  const panOffset = useRef({ x: 0, y: 0 });
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });

  const handleOverlayMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDraggingOverlay(true);
    dragOffset.current = { x: e.clientX - overlayPos.x, y: e.clientY - overlayPos.y };
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    isPanning.current = true;
    panStart.current = { x: e.clientX - panOffset.current.x, y: e.clientY - panOffset.current.y };
  };

  useEffect(() => {
    const move = (e: MouseEvent) => { 
      if (isDraggingOverlay) {
        setOverlayPos({ x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y });
      }
      if (isPanning.current) {
        panOffset.current = { x: e.clientX - panStart.current.x, y: e.clientY - panStart.current.y };
      }
    };
    const up = () => { setIsDraggingOverlay(false); isPanning.current = false; };
    window.addEventListener('mousemove', move); 
    window.addEventListener('mouseup', up);
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
  }, [isDraggingOverlay]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;

    const baseWidth = 40 + guideSize * 50;

    // Calculate path segments
    let curX = W * 0.1;
    let curY = H * 0.3;
    let curDir = 0; // angle in radians (0 = right, pi/2 = down)
    let totalLen = 0;

    // Physics Sequential Calculations
    let currentP = pressureIn * 1000; // Pa
    let currentV = velocity;
    const rho = density * 1000; // kg/m^3
    const A = Math.PI * Math.pow(guideSize / 2, 2);
    const mDot = rho * currentV * A;

    const pathSegments: any[] = [];

    pipeline.forEach(seg => {
      const startX = curX;
      const startY = curY;
      const startDir = curDir;
      let len = 0;
      let arcCenter = {x: 0, y: 0};
      const bendRadius = 100;
      
      let stats: any = {};

      if (seg.type === 'straight' || seg.type === 'venturi') {
        len = seg.length || 150;
        curX += Math.cos(curDir) * len;
        curY += Math.sin(curDir) * len;
        
        if (seg.type === 'straight') {
          // Simple friction loss: dP = f * (L/D) * (rho V^2 / 2)
          // Approximating f ~ viscosity factor
          const dP = (viscosity * 0.1) * (len / 100) / guideSize * (0.5 * rho * currentV * currentV);
          stats = { dP, P_out: currentP - dP };
          currentP -= dP;
        } else if (seg.type === 'venturi') {
          const neckA = Math.PI * Math.pow((guideSize * (seg.neckSize || 0.4)) / 2, 2);
          const neckV = currentV * (A / neckA);
          const dropP = 0.5 * rho * (neckV * neckV - currentV * currentV);
          stats = { neckV, dropP, P_out: currentP - dropP * 0.1 }; // 10% unrecoverable loss
          currentP -= dropP * 0.1;
        }

      } else if (seg.type === 'bend') {
        const aRad = ((seg.angle ?? 90) * Math.PI) / 180;
        len = bendRadius * Math.abs(aRad);
        
        const sign = Math.sign(aRad) || 1;
        arcCenter.x = startX + bendRadius * Math.cos(curDir + sign * Math.PI/2);
        arcCenter.y = startY + bendRadius * Math.sin(curDir + sign * Math.PI/2);
        
        curDir += aRad;
        curX = arcCenter.x + bendRadius * Math.cos(startDir - sign * Math.PI/2 + aRad);
        curY = arcCenter.y + bendRadius * Math.sin(startDir - sign * Math.PI/2 + aRad);

        // Euler Forces
        // Assuming negligible pressure drop across the bend for force calc
        const P_out = currentP;
        const Fx_fluid = mDot * currentV * (Math.cos(aRad) - 1) + P_out * A * Math.cos(aRad) - currentP * A;
        const Fy_fluid = mDot * currentV * Math.sin(aRad) + P_out * A * Math.sin(aRad);
        const F_mag = Math.sqrt(Fx_fluid*Fx_fluid + Fy_fluid*Fy_fluid);
        stats = { F_mag, P_out };
      }

      pathSegments.push({
        ...seg,
        startX, startY, startDir,
        endX: curX, endY: curY, endDir: curDir,
        arcCenter, bendRadius,
        t0: totalLen,
        t1: totalLen + len,
        len,
        stats
      });
      totalLen += len;
    });

    const getWidthAtLoc = (seg: any, localDist: number) => {
      if (seg.type === 'venturi') {
        const neck = baseWidth * (seg.neckSize || 0.4);
        const progress = localDist / seg.len;
        const factor = 0.5 - 0.5 * Math.cos(progress * Math.PI * 2);
        return baseWidth - factor * (baseWidth - neck);
      }
      return baseWidth;
    };

    const getPos = (dist: number) => {
      if (dist < 0) dist = 0;
      if (dist >= totalLen) dist = totalLen - 0.1;
      
      const seg = pathSegments.find(s => dist >= s.t0 && dist < s.t1) || pathSegments[pathSegments.length - 1];
      if (!seg) return { x: 0, y: 0, dx: 1, dy: 0, width: baseWidth, speedMod: 1 };

      const localDist = dist - seg.t0;
      let x, y, dx, dy;

      if (seg.type === 'straight' || seg.type === 'venturi') {
        x = seg.startX + Math.cos(seg.startDir) * localDist;
        y = seg.startY + Math.sin(seg.startDir) * localDist;
        dx = Math.cos(seg.startDir);
        dy = Math.sin(seg.startDir);
      } else {
        const aRad = ((seg.angle ?? 90) * Math.PI) / 180;
        const sign = Math.sign(aRad) || 1;
        const currentAngle = seg.startDir - sign * Math.PI/2 + (localDist / seg.bendRadius) * sign;
        x = seg.arcCenter.x + seg.bendRadius * Math.cos(currentAngle);
        y = seg.arcCenter.y + seg.bendRadius * Math.sin(currentAngle);
        dx = -Math.sin(currentAngle) * sign;
        dy = Math.cos(currentAngle) * sign;
      }

      const w = getWidthAtLoc(seg, localDist);
      const speedMod = baseWidth / w;
      return { x, y, dx, dy, width: w, speedMod };
    };

    if (particles.current.length !== 800) {
      particles.current = Array.from({ length: 800 }).map(() => ({
        t: Math.random() * totalLen,
        offset: (Math.random() - 0.5),
        baseSpeed: 0.5 + Math.random() * 0.5,
      }));
    }

    const render = () => {
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, W, H);

      ctx.strokeStyle = 'rgba(99, 102, 241, 0.05)';
      ctx.lineWidth = 1;
      const ox = panOffset.current.x % 40;
      const oy = panOffset.current.y % 40;
      for (let x = ox - 40; x < W + 40; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = oy - 40; y < H + 40; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

      if (totalLen === 0) return;

      ctx.save();
      ctx.translate(panOffset.current.x, panOffset.current.y);

      // Draw Pipe
      ctx.save();
      ctx.lineCap = 'butt';
      ctx.lineJoin = 'round';
      
      const drawWalls = (isOuter: boolean) => {
        ctx.beginPath();
        // Left wall
        let first = true;
        for (let d = 0; d <= totalLen; d += 2) {
          const info = getPos(d);
          const px = info.x + (-info.dy) * (info.width/2 - (isOuter ? 0 : 3));
          const py = info.y + info.dx * (info.width/2 - (isOuter ? 0 : 3));
          if (first) { ctx.moveTo(px, py); first = false; }
          else ctx.lineTo(px, py);
        }
        // Right wall
        for (let d = totalLen; d >= 0; d -= 2) {
          const info = getPos(d);
          const px = info.x - (-info.dy) * (info.width/2 - (isOuter ? 0 : 3));
          const py = info.y - info.dx * (info.width/2 - (isOuter ? 0 : 3));
          ctx.lineTo(px, py);
        }
        ctx.closePath();
      };

      ctx.fillStyle = 'rgba(99, 102, 241, 0.2)';
      drawWalls(true);
      ctx.fill();
      
      ctx.fillStyle = '#0f172a';
      drawWalls(false);
      ctx.fill();
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.8)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      // Particles
      particles.current.forEach((p) => {
        const info = getPos(p.t);
        p.t += p.baseSpeed * velocity * 2 * info.speedMod;
        if (p.t > totalLen) { p.t = 0; p.offset = (Math.random() - 0.5); }

        const px = info.x + (-info.dy) * p.offset * (info.width * 0.8);
        const py = info.y + info.dx * p.offset * (info.width * 0.8);

        const hue = info.speedMod > 1.2 ? 10 : 200;
        const alpha = 0.7;
        const streakLen = velocity * 10 * info.speedMod;

        ctx.strokeStyle = `hsla(${hue}, 80%, 60%, ${alpha})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px - info.dx * streakLen, py - info.dy * streakLen);
        ctx.stroke();
      });

      // Segment Labels & Physics Display
      pathSegments.forEach(seg => {
        const midDist = seg.t0 + seg.len / 2;
        const info = getPos(midDist);
        
        ctx.save();
        ctx.translate(info.x, info.y);
        
        // Draw normal to path to position the label
        const nx = -info.dy;
        const ny = info.dx;
        const offset = baseWidth/2 + 20;

        ctx.fillStyle = '#f8fafc'; ctx.font = '800 11px "JetBrains Mono"';
        ctx.fillText(seg.type.toUpperCase(), nx * offset, ny * offset);

        ctx.fillStyle = '#94a3b8'; ctx.font = '600 9px "JetBrains Mono"';
        if (seg.type === 'straight') {
          ctx.fillText(`ΔP = ${(seg.stats.dP / 1000).toFixed(1)} kPa`, nx * offset, ny * offset + 14);
        } else if (seg.type === 'venturi') {
          ctx.fillStyle = '#ef4444';
          ctx.fillText(`V_col = ${seg.stats.neckV.toFixed(1)} m/s`, nx * offset, ny * offset + 14);
          ctx.fillStyle = '#3b82f6';
          ctx.fillText(`ΔP_col = -${(seg.stats.dropP / 1000).toFixed(1)} kPa`, nx * offset, ny * offset + 26);
        } else if (seg.type === 'bend') {
          ctx.fillStyle = '#ef4444';
          ctx.fillText(`F_coude = ${seg.stats.F_mag.toFixed(0)} N`, nx * offset, ny * offset + 14);
        }
        
        ctx.restore();
      });

      ctx.restore();

      frameRef.current = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(frameRef.current!);
  }, [velocity, guideSize, pipeline]);

  return (
    <div className="simulation-canvas-wrapper" style={{ background: '#000', width: '100%', height: '100%', overflow: 'hidden', position: 'relative', cursor: 'grab' }} onMouseDown={handleCanvasMouseDown}>
      <canvas ref={canvasRef} width={1400} height={700} style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#020617' }} />
      <div className="sim-overlay" style={{ top: overlayPos.y, left: overlayPos.x, cursor: isDraggingOverlay ? 'grabbing' : 'grab', userSelect: 'none', width: '350px' }} onMouseDown={handleOverlayMouseDown}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <div>
            <span style={{ color: '#a855f7', letterSpacing: '2px', fontWeight: 900, fontSize: '11px' }}>PIPELINE BUILDER</span>
            <div style={{ fontSize: '9px', opacity: 0.5, marginTop: '3px' }}>DYNAMIC SYSTEM EVALUATION</div>
          </div>
        </div>
        <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '12px', fontSize: '11px', color: '#cbd5e1', lineHeight: 1.6 }}>
          You are visualizing a dynamically constructed fluid pipeline. Add segments (straight, venturi, bend) and adjust their parameters in the controls to observe the flow behavior in real-time.
        </div>
      </div>
    </div>
  );
};

export default CombinedSimulation;
