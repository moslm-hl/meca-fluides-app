import React, { useRef, useEffect, useState } from 'react';

const FluidSandbox: React.FC<{ viscosity: number, velocity: number, guideSize: number, geometry?: 'pipe' | 'venturi', neckSize?: number }> = ({ viscosity, velocity, guideSize, geometry = 'pipe', neckSize = 0.5 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<any[]>([]);
  const frameRef = useRef<number | undefined>(undefined);
  
  // Draggable Overlay State
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

  // Global Reynolds Calculation for Display
  const reGlobal = (velocity * guideSize * 8000) / (viscosity + 0.1);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const centerY = H / 2.5;

    const getWallHalfHeight = (x: number) => {
      const baseH = (H * guideSize) / 2;
      if (geometry === 'pipe') return baseH;
      const neckLocation = W / 2;
      const neckWidth = W / 3;
      const dist = Math.abs(x - neckLocation);
      const neckFactor = Math.max(0, 1 - Math.pow(dist / neckWidth, 2));
      return baseH * (1 - neckFactor * neckSize);
    };

    particles.current = Array.from({ length: 1500 }).map(() => ({
      x: Math.random() * W,
      y: (centerY) + (Math.random() - 0.5) * (H * guideSize),
      vx: velocity * 5,
      vy: 0
    }));

    let scannerX = 0;

    const render = () => {
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, W, H);

      // Grid
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.05)';
      ctx.lineWidth = 1;
      const ox = panOffset.current.x % 40;
      const oy = panOffset.current.y % 40;
      for (let x = ox - 40; x < W + 40; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = oy - 40; y < H + 40; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

      ctx.save();
      ctx.translate(panOffset.current.x, panOffset.current.y);

      // 1. Draw Pressure Field
      const pressureGradient = ctx.createLinearGradient(0, 0, W, 0);
      for (let i = 0; i <= 10; i++) {
        const x = (i / 10) * W;
        const h = getWallHalfHeight(x);
        const localV = (H * guideSize / 2) / h;
        const intensity = Math.min(1, localV / 3);
        const hue = 240 - (intensity * 240);
        pressureGradient.addColorStop(i / 10, `hsla(${hue}, 70%, 10%, 1)`);
      }
      ctx.fillStyle = pressureGradient;
      ctx.fillRect(0, 0, W, H);

      // 2. Draw Walls
      ctx.fillStyle = '#020617';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      for(let x = 0; x <= W; x += 20) ctx.lineTo(x, centerY - getWallHalfHeight(x));
      ctx.lineTo(W, 0); ctx.fill();

      ctx.beginPath();
      ctx.moveTo(0, H);
      for(let x = 0; x <= W; x += 20) ctx.lineTo(x, centerY + getWallHalfHeight(x));
      ctx.lineTo(W, H); ctx.fill();

      // 3. Physics & Particles
      particles.current.forEach(p => {
        const h = getWallHalfHeight(p.x);
        const yRel = p.y - centerY;
        const r = Math.abs(yRel) / h;
        const localContinuity = (H * guideSize / 2) / h;
        const targetVx = velocity * localContinuity * 8 * Math.max(0, 1 - Math.pow(r, 2 * (1 + viscosity * 2)));
        
        p.vx += (targetVx - p.vx) * 0.08; 
        p.vy += (Math.random() - 0.5) * (velocity * 0.5);
        p.vy *= 0.95;

        p.x += p.vx; p.y += p.vy;

        if (p.y <= centerY - h + 2) { p.y = centerY - h + 2; p.vy *= -0.1; }
        if (p.y >= centerY + h - 2) { p.y = centerY + h - 2; p.vy *= -0.1; }
        
        if (p.x > W) { p.x = 0; p.y = centerY + (Math.random() - 0.5) * (getWallHalfHeight(0) * 1.8); p.vx = velocity * 5; }

        ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 + (p.vx / (velocity * 25 + 1)) * 0.5})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 1.5, p.y - p.vy * 1.5);
        ctx.stroke();
      });

      // 4. Scanner
      scannerX = (scannerX + 1.5) % W;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.setLineDash([2, 2]);
      ctx.beginPath(); ctx.moveTo(scannerX, 0); ctx.lineTo(scannerX, H); ctx.stroke();
      ctx.setLineDash([]);

      const hScan = getWallHalfHeight(scannerX);
      const reLocal = (velocity * ((H * guideSize / 2) / hScan) * guideSize * 8000) / (viscosity + 0.1);
      ctx.strokeStyle = `hsl(${240 - Math.min(1, reLocal / 3000) * 240}, 80%, 60%)`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      for(let y = centerY - hScan; y <= centerY + hScan; y += 2) {
        const vProfile = velocity * ((H * guideSize / 2) / hScan) * 30 * (1 - Math.pow(Math.abs(y - centerY) / hScan, reLocal > 2000 ? 7 : 2));
        if (y === centerY - hScan) ctx.moveTo(scannerX + vProfile, y); else ctx.lineTo(scannerX + vProfile, y);
      }
      ctx.stroke();

      ctx.restore();
      frameRef.current = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(frameRef.current!);
  }, [viscosity, velocity, guideSize, geometry, neckSize]);

  return (
    <div className="simulation-canvas-wrapper" style={{ background: '#000', width: '100%', height: '100%', overflow: 'hidden', position: 'relative', cursor: 'grab' }} onMouseDown={handleCanvasMouseDown}>
      <canvas ref={canvasRef} width={1400} height={700} style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#020617' }} />
      <div 
        className="sim-overlay" 
        style={{ 
          position: 'absolute',
          top: overlayPos.y, 
          left: overlayPos.x, 
          cursor: isDraggingOverlay ? 'grabbing' : 'grab',
          background: '#0f172a',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #1e293b',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
          userSelect: 'none'
        }}
        onMouseDown={handleOverlayMouseDown}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
            <div>
                <span style={{ color: '#6366f1', letterSpacing: '2px', fontWeight: 900 }}>FLUID_FIELD ANALYSIS // v2.1</span>
                <div style={{ fontSize: '9px', opacity: 0.6, marginTop: '4px' }}>SOLVER: EULER-LAGRANGE HYBRID // DT: 0.016s</div>
            </div>
            <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>CONDUIT_DIMENSIONS</div>
                <div style={{ fontSize: '11px', fontWeight: 700 }}>D: {(guideSize * 10).toFixed(1)}m | L: 14.0m</div>
            </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div>
                <span style={{ color: '#818cf8', fontSize: '9px', fontWeight: 800, display: 'block', marginBottom: '6px' }}>GOVERNING EQUATIONS</span>
                <div style={{ fontStyle: 'italic', fontSize: '10px', color: '#e2e8f0' }}>
                    P + ½ρv² = Cte <br/>
                    Re = (ρVD)/μ <br/>
                    u(r) = V_max(1 - (r/R)ⁿ)
                </div>
            </div>
            <div>
                <span style={{ color: '#22c55e', fontSize: '9px', fontWeight: 800, display: 'block', marginBottom: '6px' }}>LIVE PARAMETERS</span>
                <div style={{ fontSize: '10px' }}>
                    P_GRAD: <span style={{ color: '#f87171' }}>DYNAMIC</span> <br/>
                    FLOW: <span style={{ color: '#fbbf24' }}>{reGlobal > 2000 ? 'TURBULENT' : 'LAMINAR'}</span> <br/>
                    VISC: {viscosity.toFixed(3)} Pa·s
                </div>
            </div>
        </div>
      </div>
      
      {/* Real-time Legend */}
      <div style={{ position: 'absolute', bottom: '24px', left: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '9px', color: '#94a3b8' }}>LOW P</span>
          <div style={{ width: '100px', height: '6px', background: 'linear-gradient(to right, #0000ff, #ff0000)', borderRadius: '100px' }}></div>
          <span style={{ fontSize: '9px', color: '#94a3b8' }}>HIGH P</span>
      </div>
    </div>
  );
};

export default FluidSandbox;
