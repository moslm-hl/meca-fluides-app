import React, { useRef, useEffect, useState } from 'react';

interface Node {
  id: string;
  x: number;
  y: number;
  type: 'inlet' | 'outlet' | 'junction';
  p: number; // Pressure
}

interface Edge {
  id: string;
  n1: string;
  n2: string;
  type: 'pipe' | 'venturi';
  q: number; // Flow rate
}

interface Particle {
  edgeId: string;
  progress: number; // 0 to 1
  speed: number;
  offset: number;
  fromNode: string;
  toNode: string;
}

interface NetworkSimProps {
  velocity: number;
  viscosity: number;
}

const NetworkSimulation: React.FC<NetworkSimProps> = ({ velocity, viscosity }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [nodes, setNodes] = useState<Node[]>([
    { id: 'inlet', x: 200, y: 350, type: 'inlet', p: 100 },
    { id: 'outlet', x: 1200, y: 350, type: 'outlet', p: 0 },
    { id: 'n1', x: 500, y: 200, type: 'junction', p: 50 },
    { id: 'n2', x: 500, y: 500, type: 'junction', p: 50 },
    { id: 'n3', x: 900, y: 350, type: 'junction', p: 50 }
  ]);
  
  const [edges, setEdges] = useState<Edge[]>([
    { id: 'e1', n1: 'inlet', n2: 'n1', type: 'pipe', q: 0 },
    { id: 'e2', n1: 'inlet', n2: 'n2', type: 'pipe', q: 0 },
    { id: 'e3', n1: 'n1', n2: 'n3', type: 'venturi', q: 0 },
    { id: 'e4', n1: 'n2', n2: 'n3', type: 'pipe', q: 0 },
    { id: 'e5', n1: 'n3', n2: 'outlet', type: 'pipe', q: 0 }
  ]);

  const particlesRef = useRef<Particle[]>([]);
  const frameRef = useRef<number>();
  
  const [mode, setMode] = useState<'move' | 'node' | 'link'>('move');
  const [dragStartNode, setDragStartNode] = useState<string | null>(null);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  
  // Panning
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  const panRef = useRef(pan);
  
  useEffect(() => {
    nodesRef.current = nodes;
    edgesRef.current = edges;
    panRef.current = pan;
  }, [nodes, edges, pan]);

  // Solver and Renderer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;

    const render = () => {
      // 1. Solve Pressures (Gauss-Seidel iteration)
      const curNodes = nodesRef.current;
      const curEdges = edgesRef.current;
      
      const P = new Map<string, number>();
      curNodes.forEach(n => P.set(n.id, n.type === 'inlet' ? 100 : n.type === 'outlet' ? 0 : n.p));

      // Iterative solver for junction pressures
      for(let iter=0; iter<20; iter++) {
        curNodes.filter(n => n.type === 'junction').forEach(n => {
          let sumC = 0;
          let sumCP = 0;
          curEdges.forEach(e => {
            if (e.n1 === n.id || e.n2 === n.id) {
              const neighborId = e.n1 === n.id ? e.n2 : e.n1;
              // Conductivity
              const L = Math.hypot(
                curNodes.find(x => x.id === e.n1)!.x - curNodes.find(x => x.id === e.n2)!.x,
                curNodes.find(x => x.id === e.n1)!.y - curNodes.find(x => x.id === e.n2)!.y
              );
              const C = (e.type === 'venturi' ? 0.2 : 1.0) / (L + 1) / (viscosity + 0.1);
              sumC += C;
              sumCP += C * P.get(neighborId)!;
            }
          });
          if (sumC > 0) P.set(n.id, sumCP / sumC);
        });
      }

      // Update node pressures and calculate flows
      curNodes.forEach(n => n.p = P.get(n.id)!);
      
      const flows = new Map<string, number>();
      curEdges.forEach(e => {
        const p1 = P.get(e.n1)!;
        const p2 = P.get(e.n2)!;
        const L = Math.hypot(
          curNodes.find(x => x.id === e.n1)!.x - curNodes.find(x => x.id === e.n2)!.x,
          curNodes.find(x => x.id === e.n1)!.y - curNodes.find(x => x.id === e.n2)!.y
        );
        const C = (e.type === 'venturi' ? 0.2 : 1.0) / (L + 1) / (viscosity + 0.1);
        flows.set(e.id, C * (p1 - p2)); // positive means n1 -> n2
      });

      // Maintain particles
      const newParticles: Particle[] = [];
      let totalInletFlow = 0;
      curEdges.forEach(e => {
        if (e.n1 === 'inlet') totalInletFlow += Math.max(0, flows.get(e.id)!);
        if (e.n2 === 'inlet') totalInletFlow += Math.max(0, -flows.get(e.id)!);
      });
      
      // Spawn particles at inlet
      if (Math.random() < totalInletFlow * velocity * 0.1) {
        // Pick an edge leaving inlet
        const leaving = curEdges.filter(e => (e.n1 === 'inlet' && flows.get(e.id)! > 0) || (e.n2 === 'inlet' && flows.get(e.id)! < 0));
        if (leaving.length > 0) {
          const edge = leaving[Math.floor(Math.random() * leaving.length)];
          const flow = flows.get(edge.id)!;
          newParticles.push({
            edgeId: edge.id,
            progress: 0,
            speed: Math.abs(flow) * 20,
            offset: (Math.random() - 0.5) * 20,
            fromNode: flow > 0 ? edge.n1 : edge.n2,
            toNode: flow > 0 ? edge.n2 : edge.n1
          });
        }
      }

      // Move existing particles
      particlesRef.current.forEach(p => {
        const e = curEdges.find(x => x.id === p.edgeId);
        if (!e) return;
        const flow = flows.get(e.id)!;
        const actualSpeed = Math.abs(flow) * 20 * velocity;
        p.speed = p.speed * 0.9 + actualSpeed * 0.1;
        
        // Venturi speed up
        let localSpeed = p.speed;
        if (e.type === 'venturi') {
          const dist = Math.abs(p.progress - 0.5);
          const factor = Math.max(0, 1 - dist * 2);
          localSpeed *= (1 + factor * 3);
        }
        
        p.progress += localSpeed * 0.001;
        
        if (p.progress >= 1) {
          // Reached node. If outlet, destroy. Else pick next edge
          if (p.toNode !== 'outlet') {
            const nextEdges = curEdges.filter(x => 
              (x.n1 === p.toNode && flows.get(x.id)! > 0) || 
              (x.n2 === p.toNode && flows.get(x.id)! < 0)
            );
            if (nextEdges.length > 0) {
              const nextE = nextEdges[Math.floor(Math.random() * nextEdges.length)];
              const nextFlow = flows.get(nextE.id)!;
              newParticles.push({
                edgeId: nextE.id,
                progress: 0,
                speed: Math.abs(nextFlow) * 20,
                offset: p.offset,
                fromNode: nextFlow > 0 ? nextE.n1 : nextE.n2,
                toNode: nextFlow > 0 ? nextE.n2 : nextE.n1
              });
            }
          }
        } else {
          newParticles.push(p);
        }
      });
      particlesRef.current = newParticles;

      // Render
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, W, H);

      // Grid
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.05)';
      ctx.lineWidth = 1;
      const ox = panRef.current.x % 40;
      const oy = panRef.current.y % 40;
      for (let x = ox - 40; x < W + 40; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = oy - 40; y < H + 40; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

      ctx.save();
      ctx.translate(panRef.current.x, panRef.current.y);

      // Draw Edges
      curEdges.forEach(e => {
        const n1 = curNodes.find(x => x.id === e.n1)!;
        const n2 = curNodes.find(x => x.id === e.n2)!;
        
        ctx.strokeStyle = e.type === 'venturi' ? 'rgba(59, 130, 246, 0.4)' : 'rgba(99, 102, 241, 0.4)';
        ctx.lineWidth = e.type === 'venturi' ? 10 : 24;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(n1.x, n1.y);
        ctx.lineTo(n2.x, n2.y);
        ctx.stroke();

        // Edge type label
        if (e.type === 'venturi') {
          ctx.fillStyle = '#3b82f6'; ctx.font = '800 10px "JetBrains Mono"';
          ctx.fillText('COL', (n1.x+n2.x)/2, (n1.y+n2.y)/2 - 15);
        }
      });

      // Draw Dragging Edge
      if (dragStartNode) {
        const n1 = curNodes.find(x => x.id === dragStartNode)!;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 4;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(n1.x, n1.y);
        ctx.lineTo(mousePos.x, mousePos.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Draw Particles
      particlesRef.current.forEach(p => {
        const nFrom = curNodes.find(x => x.id === p.fromNode)!;
        const nTo = curNodes.find(x => x.id === p.toNode)!;
        const dx = nTo.x - nFrom.x;
        const dy = nTo.y - nFrom.y;
        const L = Math.hypot(dx, dy);
        const ux = dx / L;
        const uy = dy / L;
        
        const px = nFrom.x + dx * p.progress + (-uy) * p.offset;
        const py = nFrom.y + dy * p.progress + ux * p.offset;
        
        ctx.fillStyle = `hsla(${200 - p.speed*10}, 80%, 60%, 0.8)`;
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Nodes
      curNodes.forEach(n => {
        ctx.fillStyle = n.type === 'inlet' ? '#22c55e' : n.type === 'outlet' ? '#ef4444' : '#6366f1';
        ctx.beginPath();
        ctx.arc(n.x, n.y, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Pressure text
        ctx.fillStyle = '#fff'; ctx.font = '600 9px "JetBrains Mono"';
        ctx.fillText(`${Math.round(n.p)}kPa`, n.x - 12, n.y + 30);
      });

      ctx.restore();
      frameRef.current = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(frameRef.current!);
  }, [mousePos, dragStartNode, velocity, viscosity]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const mx = e.clientX - rect.left - pan.x;
    const my = e.clientY - rect.top - pan.y;
    setMousePos({ x: mx, y: my });

    if (draggedNode) {
      setNodes(nodes.map(n => n.id === draggedNode ? { ...n, x: mx, y: my } : n));
    }
    
    if (isPanning.current) {
      setPan({ x: e.clientX - panStart.current.x, y: e.clientY - panStart.current.y });
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const mx = e.clientX - rect.left - pan.x;
    const my = e.clientY - rect.top - pan.y;

    if (draggedNode) {
      setDraggedNode(null);
    }

    if (dragStartNode) {
      const nearNode = nodes.find(n => Math.hypot(n.x - mx, n.y - my) < 20);
      if (nearNode && nearNode.id !== dragStartNode) {
        setEdges([...edges, { id: 'e'+Math.random(), n1: dragStartNode, n2: nearNode.id, type: 'pipe', q: 0 }]);
      }
      setDragStartNode(null);
    }
    
    isPanning.current = false;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 2) return; // Ignore standard mousedown for right click

    const rect = canvasRef.current!.getBoundingClientRect();
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;
    const mx = rawX - pan.x;
    const my = rawY - pan.y;

    const clickedNode = nodes.find(n => Math.hypot(n.x - mx, n.y - my) < 20);
    const clickedEdge = edges.find(edge => {
      const n1 = nodes.find(n => n.id === edge.n1)!;
      const n2 = nodes.find(n => n.id === edge.n2)!;
      const L = Math.hypot(n2.x - n1.x, n2.y - n1.y);
      const dist = Math.abs((n2.y - n1.y)*mx - (n2.x - n1.x)*my + n2.x*n1.y - n2.y*n1.x) / L;
      return dist < 15 && mx > Math.min(n1.x, n2.x) - 15 && mx < Math.max(n1.x, n2.x) + 15 && my > Math.min(n1.y, n2.y) - 15 && my < Math.max(n1.y, n2.y) + 15;
    });

    if (mode === 'move') {
      if (clickedNode) {
        setDraggedNode(clickedNode.id);
      } else if (clickedEdge) {
        setEdges(edges.map(e => e.id === clickedEdge.id ? { ...e, type: e.type === 'pipe' ? 'venturi' : 'pipe' } : e));
      } else {
        isPanning.current = true;
        panStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
      }
    } else if (mode === 'node') {
      if (!clickedNode && !clickedEdge) {
        setNodes([...nodes, { id: 'n'+Math.random(), x: mx, y: my, type: 'junction', p: 50 }]);
      }
    } else if (mode === 'link') {
      if (clickedNode) setDragStartNode(clickedNode.id);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const rect = canvasRef.current!.getBoundingClientRect();
    const mx = e.clientX - rect.left - pan.x;
    const my = e.clientY - rect.top - pan.y;

    const clickedNode = nodes.find(n => Math.hypot(n.x - mx, n.y - my) < 20);
    if (clickedNode && clickedNode.type === 'junction') {
      setNodes(nodes.filter(n => n.id !== clickedNode.id));
      setEdges(edges.filter(edge => edge.n1 !== clickedNode.id && edge.n2 !== clickedNode.id));
      return;
    }
    
    const clickedEdge = edges.find(edge => {
      const n1 = nodes.find(n => n.id === edge.n1)!;
      const n2 = nodes.find(n => n.id === edge.n2)!;
      const L = Math.hypot(n2.x - n1.x, n2.y - n1.y);
      const dist = Math.abs((n2.y - n1.y)*mx - (n2.x - n1.x)*my + n2.x*n1.y - n2.y*n1.x) / L;
      return dist < 15 && mx > Math.min(n1.x, n2.x) - 15 && mx < Math.max(n1.x, n2.x) + 15 && my > Math.min(n1.y, n2.y) - 15 && my < Math.max(n1.y, n2.y) + 15;
    });
    if (clickedEdge) {
      setEdges(edges.filter(e => e.id !== clickedEdge.id));
    }
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#020617', overflow: 'hidden' }}>
      <canvas 
        ref={canvasRef} 
        width={1400} 
        height={700} 
        style={{ width: '100%', height: '100%', cursor: mode === 'move' ? (isPanning.current ? 'grabbing' : 'grab') : 'crosshair' }} 
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onContextMenu={handleContextMenu}
      />
      
      <div style={{ position: 'absolute', top: 20, left: 20, display: 'flex', gap: '10px', background: 'rgba(15,23,42,0.8)', padding: '10px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
        <button 
          style={{ padding: '10px 20px', background: mode === 'move' ? '#6366f1' : 'transparent', color: mode === 'move' ? '#fff' : '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', cursor: 'pointer', fontWeight: 800, fontSize: '11px', transition: 'all 0.2s' }}
          onClick={() => setMode('move')}
        >
          ✋ MOVE / PAN
        </button>
        <button 
          style={{ padding: '10px 20px', background: mode === 'node' ? '#6366f1' : 'transparent', color: mode === 'node' ? '#fff' : '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', cursor: 'pointer', fontWeight: 800, fontSize: '11px', transition: 'all 0.2s' }}
          onClick={() => setMode('node')}
        >
          ➕ ADD NODE
        </button>
        <button 
          style={{ padding: '10px 20px', background: mode === 'link' ? '#6366f1' : 'transparent', color: mode === 'link' ? '#fff' : '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', cursor: 'pointer', fontWeight: 800, fontSize: '11px', transition: 'all 0.2s' }}
          onClick={() => setMode('link')}
        >
          🔗 DRAW LINK
        </button>
      </div>

      <div style={{ position: 'absolute', bottom: 20, left: 20, background: 'rgba(15,23,42,0.8)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', width: '300px' }}>
        <h3 style={{ color: '#fff', margin: '0 0 12px 0', fontSize: '12px', letterSpacing: '1px' }}>NETWORK CONTROLS</h3>
        <ul style={{ color: '#94a3b8', fontSize: '11px', margin: 0, paddingLeft: '16px', lineHeight: 1.8 }}>
          <li><strong style={{color:'#fff'}}>MOVE:</strong> Drag nodes to move them. Click a link to toggle Pipe/Venturi. Drag empty space to pan.</li>
          <li><strong style={{color:'#fff'}}>ADD NODE:</strong> Click empty space to drop a node.</li>
          <li><strong style={{color:'#fff'}}>DRAW LINK:</strong> Drag from node to node to connect.</li>
          <li><strong style={{color:'#ef4444'}}>DELETE:</strong> Right-click on any node or link to delete it.</li>
        </ul>
      </div>
    </div>
  );
};

export default NetworkSimulation;
