import React, { useRef, useEffect, useState } from 'react';

interface BendSimProps {
  velocity: number;
  density: number;
  diameter: number;
  bendAngle: number;
  pressureIn: number;
}

const BendSimulation: React.FC<BendSimProps> = ({ velocity, density, diameter, bendAngle, pressureIn }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<any[]>([]);
  const frameRef = useRef<number | undefined>(undefined);


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

  // ── Physics (Euler's Theorem) ──
  const angleRad = (bendAngle * Math.PI) / 180;
  const A = Math.PI * Math.pow(diameter / 2, 2);
  const Q = velocity * A;
  const mDot = density * Q;
  const P1 = pressureIn * 1000;
  const P2 = P1;

  const Fx_fluid = mDot * velocity * (Math.cos(angleRad) - 1) + P2 * A * Math.cos(angleRad) - P1 * A;
  const Fy_fluid = mDot * velocity * Math.sin(angleRad) + P2 * A * Math.sin(angleRad);
  const Fx_bend = -Fx_fluid;
  const Fy_bend = -Fy_fluid;
  const F_magnitude = Math.sqrt(Fx_bend ** 2 + Fy_bend ** 2);
  const F_angle = (Math.atan2(Fy_bend, Fx_bend) * 180) / Math.PI;

  const c_wave = 1480;
  const deltaP_shock = density * c_wave * velocity;
  const F_shock = deltaP_shock * A;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;

    const bendRadius = 140;
    const pipeWidth = 30 + diameter * 60;
    const inletLength = 250;
    const outletLength = 250;

    // ── KEY GEOMETRY: center BELOW the inlet end (inside the elbow) ──
    // Inlet is horizontal going right. Inlet end connects at the TOP of the arc circle.
    const inletEndX = W * 0.38;
    const inletEndY = H * 0.32;
    const cx = inletEndX;                // arc center X = same as inlet end
    const cy = inletEndY + bendRadius;   // arc center Y = below by radius

    // Arc angles (canvas: 0=right, π/2=down, π=left, -π/2=top)
    const arcStart = -Math.PI / 2;          // top (connects to inlet)
    const arcEnd = -Math.PI / 2 + angleRad; // sweeps clockwise by θ

    // Outlet start point (where the arc ends)
    const outSX = cx + bendRadius * Math.cos(arcEnd);
    const outSY = cy + bendRadius * Math.sin(arcEnd);

    // Outlet tangent direction (derivative of arc position at arcEnd)
    const outDirX = -Math.sin(arcEnd);
    const outDirY = Math.cos(arcEnd);

    // Inlet start point
    const inletStartX = inletEndX - inletLength;
    

    // Get position + tangent along the full pipe path (t in [0,1])
    const getPathPos = (t: number) => {
      const inFrac = 0.3;
      const bendFrac = 0.35;
      if (t < inFrac) {
        const f = t / inFrac;
        return { x: inletStartX + f * inletLength, y: inletEndY, dx: 1, dy: 0 };
      } else if (t < inFrac + bendFrac) {
        const f = (t - inFrac) / bendFrac;
        const a = arcStart + f * angleRad;
        return {
          x: cx + bendRadius * Math.cos(a),
          y: cy + bendRadius * Math.sin(a),
          dx: -Math.sin(a),
          dy: Math.cos(a),
        };
      } else {
        const f = (t - inFrac - bendFrac) / (1 - inFrac - bendFrac);
        return {
          x: outSX + outDirX * f * outletLength,
          y: outSY + outDirY * f * outletLength,
          dx: outDirX,
          dy: outDirY,
        };
      }
    };

    // Init particles
    particles.current = Array.from({ length: 400 }).map(() => ({
      t: Math.random(),
      offset: (Math.random() - 0.5) * pipeWidth * 0.65,
      speed: 0.002 + Math.random() * 0.001,
    }));

    const render = () => {
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, W, H);

      // Grid
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.03)';
      ctx.lineWidth = 1;
      const ox = panOffset.current.x % 40;
      const oy = panOffset.current.y % 40;
      for (let x = ox - 40; x < W + 40; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = oy - 40; y < H + 40; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

      ctx.save();
      ctx.translate(panOffset.current.x, panOffset.current.y);

      // ── Draw pipe (outer wall then inner dark) ──
      const drawSegment = () => {
        // Inlet
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.5)';
        ctx.lineWidth = pipeWidth;
        ctx.lineCap = 'butt';
        ctx.beginPath();
        ctx.moveTo(inletStartX, inletEndY);
        ctx.lineTo(inletEndX, inletEndY);
        ctx.stroke();

        // Arc (clockwise = anticlockwise:false)
        ctx.beginPath();
        ctx.arc(cx, cy, bendRadius, arcStart, arcEnd, angleRad < 0);
        ctx.stroke();

        // Outlet
        ctx.beginPath();
        ctx.moveTo(outSX, outSY);
        ctx.lineTo(outSX + outDirX * outletLength, outSY + outDirY * outletLength);
        ctx.stroke();
      };

      ctx.save();
      drawSegment();
      // Inner dark
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.lineWidth = pipeWidth - 6;
      ctx.lineCap = 'butt';
      // Inlet
      ctx.beginPath(); ctx.moveTo(inletStartX, inletEndY); ctx.lineTo(inletEndX, inletEndY); ctx.stroke();
      // Arc
      ctx.beginPath(); ctx.arc(cx, cy, bendRadius, arcStart, arcEnd, angleRad < 0); ctx.stroke();
      // Outlet
      ctx.beginPath(); ctx.moveTo(outSX, outSY); ctx.lineTo(outSX + outDirX * outletLength, outSY + outDirY * outletLength); ctx.stroke();
      ctx.restore();

      // ── Particles ──
      particles.current.forEach((p) => {
        p.t += p.speed * velocity;
        if (p.t > 1) { p.t = 0; p.offset = (Math.random() - 0.5) * pipeWidth * 0.6; }

        const pos = getPathPos(p.t);
        // Perpendicular to tangent
        const px = pos.x + (-pos.dy) * p.offset;
        const py = pos.y + pos.dx * p.offset;

        const inBend = p.t > 0.25 && p.t < 0.7;
        const hue = inBend ? Math.random() * 30 : 200 + Math.random() * 40;
        const alpha = inBend ? 0.6 : 0.45;
        const streakLen = velocity * (inBend ? 8 : 6);

        ctx.strokeStyle = `hsla(${hue}, 80%, 60%, ${alpha})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px - pos.dx * streakLen, py - pos.dy * streakLen);
        ctx.stroke();
      });

      // ── Force vector on the bend (at arc midpoint) ──
      const midArcAngle = arcStart + angleRad / 2;
      const forceOriginX = cx + bendRadius * Math.cos(midArcAngle);
      const forceOriginY = cy + bendRadius * Math.sin(midArcAngle);

      const forceScale = 0.15 / Math.max(F_magnitude, 1);
      const arrowLen = Math.min(F_magnitude * forceScale * 200, 150);
      const fAngleRad = Math.atan2(Fy_bend, Fx_bend);

      // Resultant force arrow
      ctx.save();
      ctx.shadowColor = '#ef4444'; ctx.shadowBlur = 20;
      ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(forceOriginX, forceOriginY);
      const tipX = forceOriginX + Math.cos(fAngleRad) * arrowLen;
      const tipY = forceOriginY + Math.sin(fAngleRad) * arrowLen;
      ctx.lineTo(tipX, tipY);
      ctx.stroke();
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(tipX, tipY);
      ctx.lineTo(tipX - 15 * Math.cos(fAngleRad - 0.4), tipY - 15 * Math.sin(fAngleRad - 0.4));
      ctx.lineTo(tipX - 15 * Math.cos(fAngleRad + 0.4), tipY - 15 * Math.sin(fAngleRad + 0.4));
      ctx.closePath(); ctx.fill();
      ctx.restore();
      ctx.fillStyle = '#ef4444'; ctx.font = '900 11px "JetBrains Mono"';
      ctx.fillText(`F = ${F_magnitude.toFixed(1)} N`, tipX + 10, tipY - 10);

      // Fx / Fy dashed components
      ctx.save(); ctx.setLineDash([4, 4]); ctx.lineWidth = 1.5;
      const fxLen = Math.min(Math.abs(Fx_bend) * forceScale * 200, 120);
      ctx.strokeStyle = '#22c55e'; ctx.beginPath();
      ctx.moveTo(forceOriginX, forceOriginY);
      ctx.lineTo(forceOriginX + Math.sign(Fx_bend) * fxLen, forceOriginY); ctx.stroke();
      ctx.fillStyle = '#22c55e'; ctx.font = '700 9px "JetBrains Mono"';
      ctx.fillText(`Fx=${Fx_bend.toFixed(1)}N`, forceOriginX + Math.sign(Fx_bend) * fxLen + 5, forceOriginY - 5);

      const fyLen = Math.min(Math.abs(Fy_bend) * forceScale * 200, 120);
      ctx.strokeStyle = '#3b82f6'; ctx.beginPath();
      ctx.moveTo(forceOriginX, forceOriginY);
      ctx.lineTo(forceOriginX, forceOriginY + Math.sign(Fy_bend) * fyLen); ctx.stroke();
      ctx.fillStyle = '#3b82f6';
      ctx.fillText(`Fy=${Fy_bend.toFixed(1)}N`, forceOriginX + 5, forceOriginY + Math.sign(Fy_bend) * fyLen + 12);
      ctx.setLineDash([]); ctx.restore();

      // ── Velocity arrows ──
      // Inlet V1
      ctx.save();
      ctx.strokeStyle = '#fbbf24'; ctx.fillStyle = '#fbbf24'; ctx.lineWidth = 2;
      ctx.shadowColor = '#fbbf24'; ctx.shadowBlur = 10;
      const vInX = inletStartX + 30;
      ctx.beginPath(); ctx.moveTo(vInX, inletEndY); ctx.lineTo(vInX + 50, inletEndY); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(vInX + 50, inletEndY); ctx.lineTo(vInX + 40, inletEndY - 6); ctx.lineTo(vInX + 40, inletEndY + 6); ctx.closePath(); ctx.fill();
      ctx.font = '700 10px "JetBrains Mono"'; ctx.fillText(`V₁ = ${velocity.toFixed(1)} m/s`, vInX, inletEndY - 15);
      ctx.restore();

      // Outlet V2
      ctx.save();
      ctx.strokeStyle = '#fbbf24'; ctx.fillStyle = '#fbbf24'; ctx.lineWidth = 2;
      ctx.shadowColor = '#fbbf24'; ctx.shadowBlur = 10;
      const v2X = outSX + outDirX * 60;
      const v2Y = outSY + outDirY * 60;
      ctx.beginPath(); ctx.moveTo(v2X, v2Y); ctx.lineTo(v2X + outDirX * 50, v2Y + outDirY * 50); ctx.stroke();
      const v2tX = v2X + outDirX * 50, v2tY = v2Y + outDirY * 50;
      ctx.beginPath(); ctx.moveTo(v2tX, v2tY);
      ctx.lineTo(v2tX - 10 * Math.cos(Math.atan2(outDirY, outDirX) - 0.4), v2tY - 10 * Math.sin(Math.atan2(outDirY, outDirX) - 0.4));
      ctx.lineTo(v2tX - 10 * Math.cos(Math.atan2(outDirY, outDirX) + 0.4), v2tY - 10 * Math.sin(Math.atan2(outDirY, outDirX) + 0.4));
      ctx.closePath(); ctx.fill();
      ctx.font = '700 10px "JetBrains Mono"'; ctx.fillText(`V₂ = ${velocity.toFixed(1)} m/s`, v2tX + 10, v2tY - 10);
      ctx.restore();

      // ── Angle arc annotation ──
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.arc(cx, cy, 50, arcStart, arcEnd, angleRad < 0); ctx.stroke();
      ctx.setLineDash([]); ctx.fillStyle = '#fff'; ctx.font = '700 11px "JetBrains Mono"';
      const lblA = arcStart + angleRad / 2;
      ctx.fillText(`θ = ${bendAngle}°`, cx + Math.cos(lblA) * 68 - 20, cy + Math.sin(lblA) * 68);
      ctx.restore();

      // Center marker
      ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(99, 102, 241, 0.8)'; ctx.fill();

      // Section labels
      ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.font = '900 9px "JetBrains Mono"';
      ctx.fillText('SECTION 1 (ENTRÉE)', inletStartX + 10, inletEndY - pipeWidth / 2 - 12);
      ctx.fillText('SECTION 2 (SORTIE)', outSX + outDirX * 30 + 10, outSY + outDirY * 30 - pipeWidth / 2 - 12);
      ctx.fillStyle = '#818cf8'; ctx.font = '700 9px "JetBrains Mono"';
      ctx.fillText(`P₁ = ${(P1 / 1000).toFixed(1)} kPa`, inletStartX + 10, inletEndY + pipeWidth / 2 + 16);
      ctx.fillText(`P₂ = ${(P2 / 1000).toFixed(1)} kPa`, outSX + outDirX * 30 + 10, outSY + outDirY * 30 + pipeWidth / 2 + 16);

      ctx.restore(); // Restore panning translate

      frameRef.current = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(frameRef.current!);
  }, [velocity, density, diameter, bendAngle, pressureIn, angleRad, F_magnitude, Fx_bend, Fy_bend, F_angle]);

  return (
    <div className="simulation-canvas-wrapper" style={{ background: '#000', width: '100%', height: '100%', overflow: 'hidden', position: 'relative', cursor: 'grab' }} onMouseDown={handleCanvasMouseDown}>
      <canvas ref={canvasRef} width={1400} height={700} style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#020617' }} />
      <div className="sim-overlay" style={{ top: overlayPos.y, left: overlayPos.x, cursor: isDraggingOverlay ? 'grabbing' : 'grab', userSelect: 'none', width: '400px' }} onMouseDown={handleOverlayMouseDown}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <div>
            <span style={{ color: '#6366f1', letterSpacing: '2px', fontWeight: 900, fontSize: '11px' }}>EULER BEND ANALYSIS // v1.0</span>
            <div style={{ fontSize: '9px', opacity: 0.5, marginTop: '3px' }}>THÉORÈME D'EULER — BILAN QDM</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '9px', color: '#94a3b8' }}>BEND GEOMETRY</div>
            <div style={{ fontSize: '11px', fontWeight: 700 }}>θ: {bendAngle}° | D: {(diameter * 100).toFixed(0)}cm</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '12px' }}>
          <div>
            <span style={{ color: '#ef4444', fontSize: '9px', fontWeight: 800, display: 'block', marginBottom: '4px' }}>FORCE PERMANENTE (COUDE)</span>
            <div style={{ fontSize: '18px', fontWeight: 900, color: '#ef4444' }}>{F_magnitude.toFixed(1)} N</div>
            <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: '2px' }}>Fx: {Fx_bend.toFixed(1)} N | Fy: {Fy_bend.toFixed(1)} N</div>
            <div style={{ fontSize: '9px', color: '#94a3b8' }}>Direction: {F_angle.toFixed(1)}°</div>
          </div>
          <div>
            <span style={{ color: '#fbbf24', fontSize: '9px', fontWeight: 800, display: 'block', marginBottom: '4px' }}>COUP DE BÉLIER (CHOC)</span>
            <div style={{ fontSize: '18px', fontWeight: 900, color: '#fbbf24' }}>{F_shock.toFixed(1)} N</div>
            <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: '2px' }}>ΔP: {(deltaP_shock / 1000).toFixed(1)} kPa</div>
            <div style={{ fontSize: '9px', color: '#94a3b8' }}>c = {c_wave} m/s (eau)</div>
          </div>
        </div>
        <div style={{ padding: '10px', background: 'rgba(99,102,241,0.05)', borderRadius: '8px', border: '1px solid rgba(99,102,241,0.1)' }}>
          <span style={{ color: '#818cf8', fontSize: '9px', fontWeight: 800, display: 'block', marginBottom: '4px' }}>ÉQUATIONS (EULER)</span>
          <div style={{ fontStyle: 'italic', fontSize: '9px', color: '#e2e8f0', lineHeight: 1.8 }}>
            ΣF = ṁ·(V₂ - V₁) + P₂·A₂ - P₁·A₁<br />
            Fx = ṁ·V·(cosθ - 1) + P·A·(cosθ - 1)<br />
            Fy = -ṁ·V·sinθ - P·A·sinθ<br />
            ṁ = ρ·Q = {mDot.toFixed(3)} kg/s
          </div>
        </div>
      </div>
      <div style={{ position: 'absolute', bottom: '20px', left: '20px', display: 'flex', gap: '16px', alignItems: 'center' }}>
        {[['#ef4444', 'FORCE RÉSULTANTE'], ['#22c55e', 'Fx'], ['#3b82f6', 'Fy'], ['#fbbf24', 'VELOCITY']].map(([c, l]) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '3px', background: c, borderRadius: '2px' }} />
            <span style={{ fontSize: '9px', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BendSimulation;
