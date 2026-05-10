import React, { useRef, useEffect } from 'react';

const FluidSandbox: React.FC<{ viscosity: number, velocity: number, guideSize: number, geometry?: 'pipe' | 'venturi', neckSize?: number }> = ({ viscosity, velocity, guideSize, geometry = 'pipe', neckSize = 0.5 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<any[]>([]);
  const frameRef = useRef<number>();
  
  // Draggable Overlay State
  const [overlayPos, setOverlayPos] = React.useState({ x: 32, y: 32 });
  const [isDragging, setIsDragging] = React.useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX - overlayPos.x,
      y: e.clientY - overlayPos.y
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      setOverlayPos({
        x: e.clientX - dragOffset.current.x,
        y: e.clientY - dragOffset.current.y
      });
    };
    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Global Reynolds Calculation for Display
  const reGlobal = (velocity * guideSize * 8000) / (viscosity + 0.1);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerY = height / 2.5; // Shifted even further up

    const getWallHalfHeight = (x: number) => {
      const baseH = (height * guideSize) / 2;
      if (geometry === 'pipe') return baseH;
      const neckLocation = width / 2;
      const neckWidth = width / 3;
      const dist = Math.abs(x - neckLocation);
      const neckFactor = Math.max(0, 1 - Math.pow(dist / neckWidth, 2));
      // neckSize represents the depth (0 to 0.85 of the total height)
      return baseH * (1 - neckFactor * neckSize);
    };

    // Initialize particles
    particles.current = Array.from({ length: 1500 }).map(() => ({
      x: Math.random() * width,
      y: (centerY) + (Math.random() - 0.5) * (height * guideSize),
      vx: velocity * 5,
      vy: 0
    }));

    // Scanner Position
    let scannerX = 0;

    const render = () => {
      // 1. Draw Pressure Field (Heatmap)
      const pressureGradient = ctx.createLinearGradient(0, 0, width, 0);
      
      for (let i = 0; i <= 10; i++) {
        const x = (i / 10) * width;
        const h = getWallHalfHeight(x);
        const localV = (height * guideSize / 2) / h;
        const intensity = Math.min(1, localV / 3);
        const hue = 240 - (intensity * 240);
        pressureGradient.addColorStop(i / 10, `hsla(${hue}, 70%, 10%, 1)`);
      }
      
      ctx.fillStyle = pressureGradient;
      ctx.fillRect(0, 0, width, height);

      // 2. Draw Walls (Smooth Bezier)
      ctx.fillStyle = '#020617';
      
      // Upper Wall
      ctx.beginPath();
      ctx.moveTo(0, 0);
      for(let x = 0; x <= width; x += 20) {
          const h = getWallHalfHeight(x);
          ctx.lineTo(x, (centerY) - h);
      }
      ctx.lineTo(width, 0);
      ctx.fill();

      // Lower Wall
      ctx.beginPath();
      ctx.moveTo(0, height);
      for(let x = 0; x <= width; x += 20) {
          const h = getWallHalfHeight(x);
          ctx.lineTo(x, (centerY) + h);
      }
      ctx.lineTo(width, height);
      ctx.fill();
      
      // Wall Highlights (Supple Glow)
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for(let x = 0; x <= width; x += 40) {
        const hLine = getWallHalfHeight(x);
        if (x === 0) ctx.moveTo(x, (centerY) - hLine);
        else {
            const prevH = getWallHalfHeight(x - 40);
            ctx.quadraticCurveTo(x - 20, (centerY) - prevH, x, (centerY) - hLine);
        }
      }
      ctx.stroke();

      // 3. Physics & Particles (Supple Motion)
      particles.current.forEach(p => {
        const h = getWallHalfHeight(p.x);
        const yRel = p.y - (centerY);
        const r = Math.abs(yRel) / h;
        
        const localContinuity = (height * guideSize / 2) / h;
        const targetVx = velocity * localContinuity * 8 * Math.max(0, 1 - Math.pow(r, 2 * (1 + viscosity * 2)));
        
        // Supple interpolation
        p.vx += (targetVx - p.vx) * 0.08; 
        p.vy += (Math.random() - 0.5) * (velocity * 0.5);
        p.vy *= 0.95; // Viscous damping

        p.x += p.vx;
        p.y += p.vy;

        if (p.y <= (centerY) - h + 2) { p.y = (centerY) - h + 2; p.vy *= -0.1; }
        if (p.y >= (centerY) + h - 2) { p.y = (centerY) + h - 2; p.vy *= -0.1; }
        
        if (p.x > width) { 
          p.x = 0; 
          p.y = (centerY) + (Math.random() - 0.5) * (getWallHalfHeight(0) * 1.8);
          p.vx = velocity * 5;
        }

        // Particle Styling with Motion Blur (Lines)
        const speedRatio = p.vx / (velocity * 25 + 1);
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 + speedRatio * 0.5})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 1.5, p.y - p.vy * 1.5); // Tail
        ctx.stroke();
      });

      // 4. Scanner & Velocity Profile Analysis (Supple Interpolation)
      scannerX = (scannerX + 1.5) % width;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(scannerX, 0);
      ctx.lineTo(scannerX, height);
      ctx.stroke();
      ctx.setLineDash([]);

      const hScan = getWallHalfHeight(scannerX);
      const localContinuity = (height * guideSize / 2) / hScan;
      const reLocal = (velocity * localContinuity * guideSize * 8000) / (viscosity + 0.1);
      
      // Dynamic Color based on local Reynolds (Blue -> Red)
      const reRatio = Math.min(1, reLocal / 3000);
      const profileColor = `hsl(${240 - reRatio * 240}, 80%, 60%)`;
      
      ctx.strokeStyle = profileColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      
      let maxVScan = 0;
      for(let y = (centerY) - hScan; y <= (centerY) + hScan; y += 2) {
        const yRel = y - (centerY);
        const r = Math.abs(yRel) / hScan;
        
        // Profile shape: Parabolic for laminar, Flatter for turbulent
        const profilePower = reLocal > 2000 ? 7 : 2; 
        const vProfile = velocity * localContinuity * 30 * (1 - Math.pow(r, profilePower));
        
        if (vProfile > maxVScan) maxVScan = vProfile;

        if (y === (centerY) - hScan) ctx.moveTo(scannerX + vProfile, y);
        else ctx.lineTo(scannerX + vProfile, y);
        
        // Draw horizontal velocity vectors every 20px
        if (Math.floor(y) % 20 === 0) {
            ctx.save();
            ctx.strokeStyle = `rgba(255, 255, 255, 0.2)`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(scannerX, y);
            ctx.lineTo(scannerX + vProfile, y);
            ctx.stroke();
            ctx.restore();
        }
      }
      ctx.stroke();

      // Scanner Labels
      ctx.fillStyle = '#fff';
      ctx.font = '800 10px JetBrains Mono';
      ctx.fillText(`V_MAX: ${maxVScan.toFixed(1)} m/s`, scannerX + 10, (centerY) - hScan - 10);
      ctx.fillStyle = profileColor;
      ctx.fillText(`Re_LOC: ${Math.round(reLocal)}`, scannerX + 10, (centerY) - hScan - 25);

      frameRef.current = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(frameRef.current!);
  }, [viscosity, velocity, guideSize, geometry, neckSize]);

  return (
    <div className="simulation-canvas-wrapper" style={{ background: '#000', width: '100%', height: '100%', overflow: 'hidden' }}>
      <canvas ref={canvasRef} width={1400} height={700} style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#020617' }} />
      <div 
        className="sim-overlay" 
        style={{ 
          top: overlayPos.y, 
          left: overlayPos.x, 
          cursor: isDragging ? 'grabbing' : 'grab',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
          userSelect: 'none'
        }}
        onMouseDown={handleMouseDown}
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
