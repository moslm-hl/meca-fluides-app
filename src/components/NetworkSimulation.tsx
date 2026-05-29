import React, { useRef, useEffect, useState } from 'react';

interface Node {
  id: string;
  x: number;
  y: number;
  type: 'inlet' | 'outlet' | 'junction';
  p: number; // Pressure
  fixedPressure?: boolean; // For inlets/outlets
  rotation?: number; // Rotation angle for realistic rendering
  size?: number; // Size of the node
}

interface Edge {
  id: string;
  n1: string;
  n2: string;
  type: 'pipe' | 'venturi' | 'elbow' | 'curve' | 'neck';
  q: number; // Flow rate
  diameter: number; // Pipe diameter
  length: number; // Calculated length
  customLength?: number; // User-defined virtual length
  controlPoint?: { x: number; y: number }; // For curved pipes
  neckRatio?: number; // For neck: 0.5 = half diameter in middle
}

interface Particle {
  edgeId: string;
  progress: number; // 0 to 1
  speed: number;
  offset: number;
  fromNode: string;
  toNode: string;
  trail: {x: number, y: number}[]; // Trail for visualization
}

interface NetworkSimProps {
  velocity: number;
  viscosity: number;
  onVelocityChange?: (v: number) => void;
  onViscosityChange?: (v: number) => void;
}

const NetworkSimulation: React.FC<NetworkSimProps> = ({ velocity, viscosity, onVelocityChange, onViscosityChange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [nodes, setNodes] = useState<Node[]>([
    { id: 'inlet', x: 200, y: 350, type: 'inlet', p: 100, fixedPressure: true, rotation: 0, size: 30 },
    { id: 'outlet', x: 1200, y: 350, type: 'outlet', p: 0, fixedPressure: true, rotation: Math.PI, size: 30 }
  ]);
  
  const [edges, setEdges] = useState<Edge[]>([]);

  const particlesRef = useRef<Particle[]>([]);
  const frameRef = useRef<number | undefined>(undefined);
  
  const [mode, setMode] = useState<'move' | 'node' | 'link'>('move');
  const [dragStartNode, setDragStartNode] = useState<string | null>(null);
  const [linkStartNode, setLinkStartNode] = useState<string | null>(null);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(true);
  const [draggedControlPoint, setDraggedControlPoint] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(true);
  const [showControlsPanel, setShowControlsPanel] = useState(true);
  const [showPhysicsParams, setShowPhysicsParams] = useState(true);
  const [showLeftSidebar, setShowLeftSidebar] = useState(true);

  // Preset networks
  const loadPreset = (preset: 'simple' | 'parallel' | 'complex') => {
    if (preset === 'simple') {
      setNodes([
        { id: 'inlet', x: 200, y: 350, type: 'inlet', p: 100, fixedPressure: true, rotation: 0, size: 30 },
        { id: 'outlet', x: 1200, y: 350, type: 'outlet', p: 0, fixedPressure: true, rotation: Math.PI, size: 30 },
        { id: 'n1', x: 700, y: 350, type: 'junction', p: 50, rotation: 0, size: 25 }
      ]);
      setEdges([
        { id: 'e1', n1: 'inlet', n2: 'n1', type: 'pipe', q: 0, diameter: 1.0, length: 0 },
        { id: 'e2', n1: 'n1', n2: 'outlet', type: 'pipe', q: 0, diameter: 1.0, length: 0 }
      ]);
    } else if (preset === 'parallel') {
      setNodes([
        { id: 'inlet', x: 200, y: 350, type: 'inlet', p: 100, fixedPressure: true, rotation: 0, size: 30 },
        { id: 'outlet', x: 1200, y: 350, type: 'outlet', p: 0, fixedPressure: true, rotation: Math.PI, size: 30 },
        { id: 'n1', x: 500, y: 200, type: 'junction', p: 50, rotation: Math.PI/4, size: 25 },
        { id: 'n2', x: 500, y: 500, type: 'junction', p: 50, rotation: -Math.PI/4, size: 25 },
        { id: 'n3', x: 900, y: 200, type: 'junction', p: 50, rotation: -Math.PI/4, size: 25 },
        { id: 'n4', x: 900, y: 500, type: 'junction', p: 50, rotation: Math.PI/4, size: 25 }
      ]);
      setEdges([
        { id: 'e1', n1: 'inlet', n2: 'n1', type: 'pipe', q: 0, diameter: 1.0, length: 0 },
        { id: 'e2', n1: 'inlet', n2: 'n2', type: 'pipe', q: 0, diameter: 1.0, length: 0 },
        { id: 'e3', n1: 'n1', n2: 'n3', type: 'pipe', q: 0, diameter: 0.8, length: 0 },
        { id: 'e4', n1: 'n2', n2: 'n4', type: 'venturi', q: 0, diameter: 0.6, length: 0 },
        { id: 'e5', n1: 'n3', n2: 'outlet', type: 'pipe', q: 0, diameter: 1.0, length: 0 },
        { id: 'e6', n1: 'n4', n2: 'outlet', type: 'pipe', q: 0, diameter: 1.0, length: 0 }
      ]);
    } else if (preset === 'complex') {
      setNodes([
        { id: 'inlet', x: 200, y: 350, type: 'inlet', p: 100, fixedPressure: true, rotation: 0, size: 30 },
        { id: 'outlet', x: 1200, y: 350, type: 'outlet', p: 0, fixedPressure: true, rotation: Math.PI, size: 30 },
        { id: 'n1', x: 400, y: 200, type: 'junction', p: 50, rotation: Math.PI/3, size: 25 },
        { id: 'n2', x: 400, y: 500, type: 'junction', p: 50, rotation: -Math.PI/3, size: 25 },
        { id: 'n3', x: 700, y: 350, type: 'junction', p: 50, rotation: 0, size: 28 },
        { id: 'n4', x: 1000, y: 200, type: 'junction', p: 50, rotation: -Math.PI/3, size: 25 },
        { id: 'n5', x: 1000, y: 500, type: 'junction', p: 50, rotation: Math.PI/3, size: 25 }
      ]);
      setEdges([
        { id: 'e1', n1: 'inlet', n2: 'n1', type: 'pipe', q: 0, diameter: 1.2, length: 0 },
        { id: 'e2', n1: 'inlet', n2: 'n2', type: 'pipe', q: 0, diameter: 1.0, length: 0 },
        { id: 'e3', n1: 'n1', n2: 'n3', type: 'venturi', q: 0, diameter: 0.7, length: 0 },
        { id: 'e4', n1: 'n2', n2: 'n3', type: 'pipe', q: 0, diameter: 0.9, length: 0 },
        { id: 'e5', n1: 'n3', n2: 'n4', type: 'pipe', q: 0, diameter: 1.0, length: 0 },
        { id: 'e6', n1: 'n3', n2: 'n5', type: 'venturi', q: 0, diameter: 0.6, length: 0 },
        { id: 'e7', n1: 'n4', n2: 'outlet', type: 'pipe', q: 0, diameter: 1.2, length: 0 },
        { id: 'e8', n1: 'n5', n2: 'outlet', type: 'pipe', q: 0, diameter: 1.0, length: 0 }
      ]);
    }
    setSelectedEdge(null);
    particlesRef.current = [];
  };
  
  // Panning
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });

  // Zooming
  const [zoom, setZoom] = useState(1);
  const zoomRef = useRef(zoom);

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  const panRef = useRef(pan);
  const selectedEdgeRef = useRef(selectedEdge);
  const selectedNodeRef = useRef(selectedNode);

  useEffect(() => {
    nodesRef.current = nodes;
    edgesRef.current = edges;
    panRef.current = pan;
    selectedEdgeRef.current = selectedEdge;
    selectedNodeRef.current = selectedNode;
    zoomRef.current = zoom;
  }, [nodes, edges, pan, selectedEdge, selectedNode, zoom]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'm' || e.key === 'M') { setMode('move'); e.preventDefault(); }
      if (e.key === 'n' || e.key === 'N') { setMode('node'); e.preventDefault(); }
      if (e.key === 'l' || e.key === 'L') { setMode('link'); e.preventDefault(); }
      if (e.key === '?' || e.key === 'h' || e.key === 'H') { setShowHelp(!showHelp); e.preventDefault(); }
      
      // Delete selected node
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNode) {
        const node = nodes.find(n => n.id === selectedNode);
        if (node && node.type === 'junction') {
          setNodes(nodes.filter(n => n.id !== selectedNode));
          setEdges(edges.filter(edge => edge.n1 !== selectedNode && edge.n2 !== selectedNode));
          setSelectedNode(null);
        }
        e.preventDefault();
      }
      
      // Delete selected edge
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedEdge) {
        setEdges(edges.filter(e => e.id !== selectedEdge));
        setSelectedEdge(null);
        e.preventDefault();
      }

      // Cycle edge type with R key
      if ((e.key === 'r' || e.key === 'R') && selectedEdge) {
        const edge = edgesRef.current.find(e => e.id === selectedEdge);
        if (edge) {
          const types: Array<'pipe' | 'venturi' | 'elbow' | 'curve' | 'neck'> = ['pipe', 'venturi', 'elbow', 'curve', 'neck'];
          const currentIndex = types.indexOf(edge.type);
          const nextType = types[(currentIndex + 1) % types.length];
          
          setEdges(edgesRef.current.map(e => e.id === selectedEdge ? { 
            ...e, 
            type: nextType,
            controlPoint: nextType === 'curve' || nextType === 'elbow' ? 
              { 
                x: (nodesRef.current.find(n => n.id === e.n1)!.x + nodesRef.current.find(n => n.id === e.n2)!.x) / 2 + 50,
                y: (nodesRef.current.find(n => n.id === e.n1)!.y + nodesRef.current.find(n => n.id === e.n2)!.y) / 2
              } : e.controlPoint,
            neckRatio: nextType === 'neck' ? 0.5 : e.neckRatio
          } : e));
        }
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNode, selectedEdge, nodes, edges, showHelp]);

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

      // Calculate edge lengths
      curEdges.forEach(e => {
        const n1 = curNodes.find(x => x.id === e.n1)!;
        const n2 = curNodes.find(x => x.id === e.n2)!;
        e.length = Math.hypot(n2.x - n1.x, n2.y - n1.y);
      });

      const P = new Map<string, number>();
      curNodes.forEach(n => P.set(n.id, n.type === 'inlet' ? 100 : n.type === 'outlet' ? 0 : n.p));

      // Iterative solver for junction pressures with improved physics
      for(let iter=0; iter<30; iter++) {
        curNodes.filter(n => n.type === 'junction').forEach(n => {
          let sumC = 0;
          let sumCP = 0;
          curEdges.forEach(e => {
            if (e.n1 === n.id || e.n2 === n.id) {
              const neighborId = e.n1 === n.id ? e.n2 : e.n1;
              // Improved conductivity: includes diameter effect (Poiseuille's law)
              // C ∝ D^4 / L
              const D = e.diameter;
              const L = e.customLength || e.length || 1; // Use custom length if available
              const venturiFactor = e.type === 'venturi' ? 0.3 : e.type === 'neck' ? 0.4 : 1.0;
              const C = venturiFactor * Math.pow(D, 4) / (L + 1) / (viscosity + 0.1);
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
        const D = e.diameter;
        const L = e.customLength || e.length || 1; // Use custom length if available
        const venturiFactor = e.type === 'venturi' ? 0.3 : e.type === 'neck' ? 0.4 : 1.0;
        const C = venturiFactor * Math.pow(D, 4) / (L + 1) / (viscosity + 0.1);
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
            toNode: flow > 0 ? edge.n2 : edge.n1,
            trail: []
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

        // Update trail - handle both straight and curved pipes
        const nFrom = curNodes.find(x => x.id === p.fromNode)!;
        const nTo = curNodes.find(x => x.id === p.toNode)!;
        
        let px, py;
        if (e.type === 'curve' || e.type === 'elbow') {
          const cp = e.controlPoint || { 
            x: (nFrom.x + nTo.x) / 2 + 50, 
            y: (nFrom.y + nTo.y) / 2 
          };
          const t = p.progress;
          const dx = nTo.x - nFrom.x;
          const dy = nTo.y - nFrom.y;
          const L = Math.hypot(dx, dy);
          const ux = dx / L;
          const uy = dy / L;
          
          px = (1-t)*(1-t)*nFrom.x + 2*(1-t)*t*cp.x + t*t*nTo.x + (-uy) * p.offset;
          py = (1-t)*(1-t)*nFrom.y + 2*(1-t)*t*cp.y + t*t*nTo.y + ux * p.offset;
        } else {
          const dx = nTo.x - nFrom.x;
          const dy = nTo.y - nFrom.y;
          const L = Math.hypot(dx, dy);
          const ux = dx / L;
          const uy = dy / L;
          px = nFrom.x + dx * p.progress + (-uy) * p.offset;
          py = nFrom.y + dy * p.progress + ux * p.offset;
        }

        p.trail.push({ x: px, y: py });
        if (p.trail.length > 8) p.trail.shift();

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
                toNode: nextFlow > 0 ? nextE.n2 : nextE.n1,
                trail: []
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

      ctx.save();
      ctx.translate(panRef.current.x, panRef.current.y);
      ctx.scale(zoomRef.current, zoomRef.current);

      // Grid
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.05)';
      ctx.lineWidth = 1 / zoomRef.current;
      const gridSize = 40;
      const startX = Math.floor((-panRef.current.x / zoomRef.current) / gridSize) * gridSize;
      const startY = Math.floor((-panRef.current.y / zoomRef.current) / gridSize) * gridSize;
      const endX = startX + (W / zoomRef.current) + gridSize * 2;
      const endY = startY + (H / zoomRef.current) + gridSize * 2;
      for (let x = startX; x < endX; x += gridSize) { ctx.beginPath(); ctx.moveTo(x, startY); ctx.lineTo(x, endY); ctx.stroke(); }
      for (let y = startY; y < endY; y += gridSize) { ctx.beginPath(); ctx.moveTo(startX, y); ctx.lineTo(endX, y); ctx.stroke(); }

      // Draw Edges
      curEdges.forEach(e => {
        const n1 = curNodes.find(x => x.id === e.n1)!;
        const n2 = curNodes.find(x => x.id === e.n2)!;
        const flow = flows.get(e.id)!;
        const p1 = P.get(e.n1)!;
        const p2 = P.get(e.n2)!;
        const isSelected = selectedEdgeRef.current === e.id;

        // Pipe width based on diameter
        const pipeWidth = e.diameter * 20;

        // Pressure gradient color
        const pressureRatio = (p1 + p2) / 200;
        const hue = 240 - pressureRatio * 120;
        ctx.strokeStyle = isSelected ? '#fbbf24' : `hsla(${hue}, 70%, 50%, 0.5)`;
        ctx.lineWidth = isSelected ? pipeWidth + 4 : pipeWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Draw pipe with different styles based on type
        ctx.beginPath();
        if (e.type === 'curve' || e.type === 'elbow') {
          // Use bezier curve for curved pipes
          const cp = e.controlPoint || { 
            x: (n1.x + n2.x) / 2 + 50, 
            y: (n1.y + n2.y) / 2 
          };
          ctx.moveTo(n1.x, n1.y);
          ctx.quadraticCurveTo(cp.x, cp.y, n2.x, n2.y);
        } else {
          // Straight line
          ctx.moveTo(n1.x, n1.y);
          ctx.lineTo(n2.x, n2.y);
        }
        ctx.stroke();

        // Inner dark pipe
        ctx.strokeStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.lineWidth = pipeWidth - 4;
        ctx.beginPath();
        if (e.type === 'curve' || e.type === 'elbow') {
          const cp = e.controlPoint || { 
            x: (n1.x + n2.x) / 2 + 50, 
            y: (n1.y + n2.y) / 2 
          };
          ctx.moveTo(n1.x, n1.y);
          ctx.quadraticCurveTo(cp.x, cp.y, n2.x, n2.y);
        } else {
          ctx.moveTo(n1.x, n1.y);
          ctx.lineTo(n2.x, n2.y);
        }
        ctx.stroke();

        // Neck visualization - show constriction
        if (e.type === 'neck') {
          const neckRatio = e.neckRatio || 0.5;
          const midX = (n1.x + n2.x) / 2;
          const midY = (n1.y + n2.y) / 2;
          
          ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
          ctx.beginPath();
          ctx.arc(midX, midY, pipeWidth * neckRatio / 2, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.fillStyle = '#ef4444';
          ctx.font = '700 9px "JetBrains Mono"';
          ctx.fillText('NECK', midX - 15, midY - pipeWidth - 8);
        }

        // Venturi constriction visualization
        if (e.type === 'venturi') {
          const midX = (n1.x + n2.x) / 2;
          const midY = (n1.y + n2.y) / 2;
          ctx.fillStyle = '#3b82f6';
          ctx.font = '800 10px "JetBrains Mono"';
          ctx.fillText('VENTURI', midX - 25, midY - pipeWidth - 8);
        }

        // Elbow/Curve visualization
        if (e.type === 'elbow' || e.type === 'curve') {
          const cp = e.controlPoint || { 
            x: (n1.x + n2.x) / 2 + 50, 
            y: (n1.y + n2.y) / 2 
          };
          const label = e.type === 'elbow' ? 'ELBOW' : 'CURVE';
          ctx.fillStyle = e.type === 'elbow' ? '#f59e0b' : '#8b5cf6';
          ctx.font = '700 9px "JetBrains Mono"';
          ctx.fillText(label, cp.x - 20, cp.y - pipeWidth - 8);
          
          // Draw control point indicator when selected
          if (isSelected) {
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.arc(cp.x, cp.y, 6, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Flow direction arrow
        if (Math.abs(flow) > 0.01) {
          let midX, midY;
          if (e.type === 'curve' || e.type === 'elbow') {
            // Get point at 0.5 on the curve
            const cp = e.controlPoint || { 
              x: (n1.x + n2.x) / 2 + 50, 
              y: (n1.y + n2.y) / 2 
            };
            // Quadratic curve point at t=0.5: P(t) = (1-t)²P0 + 2(1-t)tP1 + t²P2
            midX = (1-0.5)*(1-0.5)*n1.x + 2*(1-0.5)*0.5*cp.x + 0.5*0.5*n2.x;
            midY = (1-0.5)*(1-0.5)*n1.y + 2*(1-0.5)*0.5*cp.y + 0.5*0.5*n2.y;
          } else {
            midX = (n1.x + n2.x) / 2;
            midY = (n1.y + n2.y) / 2;
          }
          
          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const L = Math.hypot(dx, dy);
          const ux = dx / L;
          const uy = dy / L;
          const dir = flow > 0 ? 1 : -1;

          ctx.save();
          ctx.translate(midX, midY);
          ctx.rotate(Math.atan2(uy * dir, ux * dir));
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.moveTo(-8, -5);
          ctx.lineTo(8, 0);
          ctx.lineTo(-8, 5);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }

        // Flow rate label
        ctx.fillStyle = '#94a3b8';
        ctx.font = '700 9px "JetBrains Mono"';
        const displayLength = e.customLength || e.length;
        ctx.fillText(`${Math.abs(flow).toFixed(2)} L/s | L:${displayLength.toFixed(0)}`, (n1.x + n2.x) / 2 - 35, (n1.y + n2.y) / 2 + pipeWidth + 12);
      });

      // Draw Dragging Edge
      if (dragStartNode) {
        const n1 = curNodes.find(x => x.id === dragStartNode)!;
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.8)';
        ctx.lineWidth = 4 / zoomRef.current;
        ctx.setLineDash([8 / zoomRef.current, 8 / zoomRef.current]);
        ctx.beginPath();
        ctx.moveTo(n1.x, n1.y);
        ctx.lineTo(mousePos.x, mousePos.y);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Draw endpoint indicator
        ctx.fillStyle = '#6366f1';
        ctx.beginPath();
        ctx.arc(mousePos.x, mousePos.y, 8 / zoomRef.current, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Draw Link Start Node Highlight (for Shift+Click linking)
      if (linkStartNode) {
        const n = curNodes.find(x => x.id === linkStartNode)!;
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 4 / zoomRef.current;
        ctx.beginPath();
        ctx.arc(n.x, n.y, (n.size || 25) + 10 / zoomRef.current, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw Particles with trails
      particlesRef.current.forEach(p => {
        const nFrom = curNodes.find(x => x.id === p.fromNode)!;
        const nTo = curNodes.find(x => x.id === p.toNode)!;
        const edge = curEdges.find(e => e.id === p.edgeId)!;
        
        let px, py;
        
        if (edge.type === 'curve' || edge.type === 'elbow') {
          // Use bezier curve for curved pipes
          const cp = edge.controlPoint || { 
            x: (nFrom.x + nTo.x) / 2 + 50, 
            y: (nFrom.y + nTo.y) / 2 
          };
          // Quadratic curve point: P(t) = (1-t)²P0 + 2(1-t)tP1 + t²P2
          const t = p.progress;
          const dx = nTo.x - nFrom.x;
          const dy = nTo.y - nFrom.y;
          const ux = dx > 0 || dy > 0 ? dx / Math.hypot(dx, dy) : 1;
          const uy = dx > 0 || dy > 0 ? dy / Math.hypot(dx, dy) : 0;
          
          px = (1-t)*(1-t)*nFrom.x + 2*(1-t)*t*cp.x + t*t*nTo.x + (-uy) * p.offset;
          py = (1-t)*(1-t)*nFrom.y + 2*(1-t)*t*cp.y + t*t*nTo.y + ux * p.offset;
        } else {
          // Straight line particle movement
          const dx = nTo.x - nFrom.x;
          const dy = nTo.y - nFrom.y;
          const L = Math.hypot(dx, dy);
          const ux = dx / L;
          const uy = dy / L;
          px = nFrom.x + dx * p.progress + (-uy) * p.offset;
          py = nFrom.y + dy * p.progress + ux * p.offset;
        }

        // Draw trail
        if (p.trail.length > 1) {
          ctx.beginPath();
          ctx.moveTo(p.trail[0].x, p.trail[0].y);
          for (let i = 1; i < p.trail.length; i++) {
            ctx.lineTo(p.trail[i].x, p.trail[i].y);
          }
          ctx.strokeStyle = `hsla(${200 - p.speed*10}, 80%, 60%, 0.4)`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Draw particle
        ctx.fillStyle = `hsla(${200 - p.speed*10}, 80%, 60%, 0.9)`;
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Nodes with realistic shapes
      curNodes.forEach(n => {
        const size = n.size || 25;
        const rotation = n.rotation || 0;
        const isSelected = selectedNodeRef.current === n.id;

        ctx.save();
        ctx.translate(n.x, n.y);
        ctx.rotate(rotation);

        // Selection glow
        if (isSelected) {
          ctx.shadowColor = '#fbbf24';
          ctx.shadowBlur = 15;
        }

        if (n.type === 'inlet') {
          // Draw realistic inlet - pipe flange with flow indicator
          // Outer flange
          ctx.fillStyle = '#22c55e';
          ctx.beginPath();
          ctx.roundRect(-size, -size/2, size * 2, size, 4);
          ctx.fill();
          ctx.strokeStyle = '#16a34a';
          ctx.lineWidth = 3;
          ctx.stroke();

          // Inner pipe
          ctx.fillStyle = '#166534';
          ctx.beginPath();
          ctx.roundRect(-size + 6, -size/2 + 6, size * 2 - 12, size - 12, 2);
          ctx.fill();

          // Flow arrows
          ctx.fillStyle = '#86efac';
          ctx.beginPath();
          ctx.moveTo(size - 15, 0);
          ctx.lineTo(size - 25, -6);
          ctx.lineTo(size - 25, 6);
          ctx.closePath();
          ctx.fill();

          // Bolt holes
          ctx.fillStyle = '#14532d';
          for (let i = -1; i <= 1; i += 2) {
            ctx.beginPath();
            ctx.arc(size - 8, i * 8, 3, 0, Math.PI * 2);
            ctx.fill();
          }

        } else if (n.type === 'outlet') {
          // Draw realistic outlet - pipe flange with exit indicator
          // Outer flange
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.roundRect(-size, -size/2, size * 2, size, 4);
          ctx.fill();
          ctx.strokeStyle = '#dc2626';
          ctx.lineWidth = 3;
          ctx.stroke();

          // Inner pipe
          ctx.fillStyle = '#7f1d1d';
          ctx.beginPath();
          ctx.roundRect(-size + 6, -size/2 + 6, size * 2 - 12, size - 12, 2);
          ctx.fill();

          // Exit indicator
          ctx.fillStyle = '#fca5a5';
          ctx.beginPath();
          ctx.arc(size - 15, 0, 6, 0, Math.PI * 2);
          ctx.fill();

          // Bolt holes
          ctx.fillStyle = '#450a0a';
          for (let i = -1; i <= 1; i += 2) {
            ctx.beginPath();
            ctx.arc(size - 8, i * 8, 3, 0, Math.PI * 2);
            ctx.fill();
          }

        } else {
          // Draw junction - realistic T-junction or cross-junction
          // Count connections to determine shape
          const connections = curEdges.filter(e => e.n1 === n.id || e.n2 === n.id).length;

          // Main body
          ctx.fillStyle = '#6366f1';
          ctx.beginPath();
          if (connections <= 2) {
            // Simple junction - rounded rectangle
            ctx.roundRect(-size, -size/2, size * 2, size, 6);
          } else if (connections === 3) {
            // T-junction shape
            ctx.moveTo(-size, -size/2);
            ctx.lineTo(size/2, -size/2);
            ctx.lineTo(size/2, -size);
            ctx.lineTo(size, -size);
            ctx.lineTo(size, size);
            ctx.lineTo(size/2, size);
            ctx.lineTo(size/2, size/2);
            ctx.lineTo(-size, size/2);
            ctx.closePath();
          } else {
            // Cross-junction
            ctx.moveTo(-size, -size/3);
            ctx.lineTo(size/3, -size/3);
            ctx.lineTo(size/3, -size);
            ctx.lineTo(size, -size);
            ctx.lineTo(size, size);
            ctx.lineTo(size/3, size);
            ctx.lineTo(size/3, size/3);
            ctx.lineTo(-size, size/3);
            ctx.lineTo(-size, -size/3);
            ctx.closePath();
          }
          ctx.fill();
          ctx.strokeStyle = '#4f46e5';
          ctx.lineWidth = 3;
          ctx.stroke();

          // Inner detail
          ctx.fillStyle = '#312e81';
          ctx.beginPath();
          if (connections <= 2) {
            ctx.roundRect(-size + 5, -size/2 + 5, size * 2 - 10, size - 10, 3);
          } else if (connections === 3) {
            ctx.moveTo(-size + 5, -size/2 + 5);
            ctx.lineTo(size/2 - 5, -size/2 + 5);
            ctx.lineTo(size/2 - 5, -size + 5);
            ctx.lineTo(size - 5, -size + 5);
            ctx.lineTo(size - 5, size - 5);
            ctx.lineTo(size/2 - 5, size - 5);
            ctx.lineTo(size/2 - 5, size/2 - 5);
            ctx.lineTo(-size + 5, size/2 - 5);
            ctx.closePath();
          } else {
            ctx.moveTo(-size + 5, -size/3 + 5);
            ctx.lineTo(size/3 - 5, -size/3 + 5);
            ctx.lineTo(size/3 - 5, -size + 5);
            ctx.lineTo(size - 5, -size + 5);
            ctx.lineTo(size - 5, size - 5);
            ctx.lineTo(size/3 - 5, size - 5);
            ctx.lineTo(size/3 - 5, size/3 - 5);
            ctx.lineTo(-size + 5, size/3 - 5);
            ctx.lineTo(-size + 5, -size/3 + 5);
            ctx.closePath();
          }
          ctx.fill();

          // Connection indicators
          ctx.fillStyle = '#a5b4fc';
          for (let i = 0; i < connections; i++) {
            const angle = (i / connections) * Math.PI * 2;
            const ix = Math.cos(angle) * (size - 12);
            const iy = Math.sin(angle) * (size - 12);
            ctx.beginPath();
            ctx.arc(ix, iy, 4, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        ctx.restore();

        // Pressure text (not rotated)
        ctx.fillStyle = '#fff';
        ctx.font = '700 10px "JetBrains Mono"';
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.round(n.p)} kPa`, n.x, n.y + size + 15);
        ctx.textAlign = 'left';
      });

      ctx.restore();
      frameRef.current = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(frameRef.current!);
  }, [mousePos, dragStartNode, linkStartNode, velocity, viscosity, selectedEdge, zoom]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const mx = (e.clientX - rect.left - pan.x) / zoom;
    const my = (e.clientY - rect.top - pan.y) / zoom;
    setMousePos({ x: mx, y: my });

    if (draggedNode) {
      setNodes(nodes.map(n => n.id === draggedNode ? { ...n, x: mx, y: my } : n));
    }

    if (draggedControlPoint) {
      setEdges(edges.map(e => e.id === draggedControlPoint ? { ...e, controlPoint: { x: mx, y: my } } : e));
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

    if (draggedControlPoint) {
      setDraggedControlPoint(null);
    }

    if (dragStartNode) {
      const nearNode = nodes.find(n => Math.hypot(n.x - mx, n.y - my) < (n.size || 25) * 2);
      if (nearNode && nearNode.id !== dragStartNode) {
        // Check if edge already exists
        const edgeExists = edges.some(e => 
          (e.n1 === dragStartNode && e.n2 === nearNode.id) ||
          (e.n2 === dragStartNode && e.n1 === nearNode.id)
        );
        if (!edgeExists) {
          setEdges([...edges, { id: 'e'+Math.random(), n1: dragStartNode, n2: nearNode.id, type: 'pipe', q: 0, diameter: 1.0, length: 0 }]);
        }
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
    const mx = (rawX - pan.x) / zoom;
    const my = (rawY - pan.y) / zoom;

    // Check for control point click on curved/elbow pipes
    const clickedControlPoint = edges.find(e => {
      if ((e.type === 'curve' || e.type === 'elbow') && e.controlPoint) {
        return Math.hypot(e.controlPoint.x - mx, e.controlPoint.y - my) < 8 / zoom;
      }
      return false;
    });

    if (clickedControlPoint) {
      setDraggedControlPoint(clickedControlPoint.id);
      setSelectedEdge(clickedControlPoint.id);
      setSelectedNode(null);
      return;
    }

    const clickedNode = nodes.find(n => Math.hypot(n.x - mx, n.y - my) < (n.size || 25) * 1.5);
    const clickedEdge = edges.find(edge => {
      const n1 = nodes.find(n => n.id === edge.n1)!;
      const n2 = nodes.find(n => n.id === edge.n2)!;
      const L = Math.hypot(n2.x - n1.x, n2.y - n1.y);
      const dist = Math.abs((n2.y - n1.y)*mx - (n2.x - n1.x)*my + n2.x*n1.y - n2.y*n1.x) / L;
      const hitRadius = 15 / zoom;
      return dist < hitRadius && mx > Math.min(n1.x, n2.x) - hitRadius && mx < Math.max(n1.x, n2.x) + hitRadius && my > Math.min(n1.y, n2.y) - hitRadius && my < Math.max(n1.y, n2.y) + hitRadius;
    });

    // Priority: Node > Edge > Nothing
    if (clickedNode) {
      setSelectedNode(clickedNode.id);
      setSelectedEdge(null);
    } else if (clickedEdge) {
      setSelectedEdge(clickedEdge.id);
      setSelectedNode(null);
    } else {
      setSelectedEdge(null);
      setSelectedNode(null);
    }

    if (mode === 'move') {
      if (clickedNode) {
        setDraggedNode(clickedNode.id);
      } else if (clickedEdge) {
        setEdges(edges.map(e => e.id === clickedEdge.id ? { ...e, type: e.type === 'pipe' ? 'venturi' : e.type === 'venturi' ? 'elbow' : e.type === 'elbow' ? 'curve' : e.type === 'curve' ? 'neck' : 'pipe' } : e));
      } else {
        isPanning.current = true;
        panStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
      }
    } else if (mode === 'node') {
      if (!clickedNode && !clickedEdge) {
        setNodes([...nodes, { id: 'n'+Math.random(), x: mx, y: my, type: 'junction', p: 50, rotation: 0, size: 25 }]);
      }
    } else if (mode === 'link') {
      if (clickedNode) {
        setDragStartNode(clickedNode.id);
      }
    } else if (mode === 'move' && e.shiftKey && clickedNode) {
      // Shift+Click in move mode for quick linking
      if (linkStartNode === null) {
        setLinkStartNode(clickedNode.id);
      } else if (linkStartNode !== clickedNode.id) {
        // Check if edge already exists
        const edgeExists = edges.some(e => 
          (e.n1 === linkStartNode && e.n2 === clickedNode.id) ||
          (e.n2 === linkStartNode && e.n1 === clickedNode.id)
        );
        if (!edgeExists) {
          setEdges([...edges, { id: 'e'+Math.random(), n1: linkStartNode, n2: clickedNode.id, type: 'pipe', q: 0, diameter: 1.0, length: 0 }]);
        }
        setLinkStartNode(null);
      }
      e.preventDefault();
    } else if (mode === 'move' && !e.shiftKey) {
      // Clear link start if clicking without shift
      setLinkStartNode(null);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (selectedEdge) {
      e.preventDefault();
      const edge = edges.find(e => e.id === selectedEdge);
      if (!edge) return;
      
      // Shift+Wheel = adjust length, Ctrl+Wheel = adjust diameter, normal = adjust custom length
      if (e.shiftKey) {
        // Adjust custom length
        const delta = e.deltaY > 0 ? -10 : 10;
        setEdges(edges.map(e => e.id === selectedEdge ? { ...e, customLength: Math.max(0, (e.customLength || e.length) + delta) } : e));
      } else if (e.ctrlKey) {
        // Adjust diameter
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setEdges(edges.map(e => e.id === selectedEdge ? { ...e, diameter: Math.max(0.3, Math.min(2.0, e.diameter + delta)) } : e));
      } else if (edge.type === 'neck') {
        // Adjust neck ratio
        const delta = e.deltaY > 0 ? -0.05 : 0.05;
        setEdges(edges.map(e => e.id === selectedEdge ? { ...e, neckRatio: Math.max(0.1, Math.min(0.9, (e.neckRatio || 0.5) + delta)) } : e));
      }
    } else if (selectedNode) {
      e.preventDefault();
      const node = nodes.find(n => n.id === selectedNode);
      if (node && node.type === 'junction') {
        // Rotate node with scroll
        const delta = e.deltaY > 0 ? -Math.PI/8 : Math.PI/8;
        setNodes(nodes.map(n => n.id === selectedNode ? { ...n, rotation: (n.rotation || 0) + delta } : n));
      } else if (node) {
        // Change size for inlet/outlet
        const delta = e.deltaY > 0 ? -2 : 2;
        setNodes(nodes.map(n => n.id === selectedNode ? { ...n, size: Math.max(20, Math.min(40, (n.size || 25) + delta)) } : n));
      }
    } else {
      // Zoom with mouse wheel when nothing is selected
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom(Math.max(0.5, Math.min(3, zoom + delta)));
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const rect = canvasRef.current!.getBoundingClientRect();
    const mx = (e.clientX - rect.left - pan.x) / zoom;
    const my = (e.clientY - rect.top - pan.y) / zoom;

    const clickedNode = nodes.find(n => Math.hypot(n.x - mx, n.y - my) < (n.size || 25) * 1.5);
    if (clickedNode && clickedNode.type === 'junction') {
      setNodes(nodes.filter(n => n.id !== clickedNode.id));
      setEdges(edges.filter(edge => edge.n1 !== clickedNode.id && edge.n2 !== clickedNode.id));
      setSelectedNode(null);
      return;
    } else if (clickedNode && (clickedNode.type === 'inlet' || clickedNode.type === 'outlet')) {
      // Reset rotation for inlet/outlet
      setNodes(nodes.map(n => n.id === clickedNode.id ? { ...n, rotation: clickedNode.type === 'inlet' ? 0 : Math.PI } : n));
      return;
    }

    const clickedEdge = edges.find(edge => {
      const n1 = nodes.find(n => n.id === edge.n1)!;
      const n2 = nodes.find(n => n.id === edge.n2)!;
      const L = Math.hypot(n2.x - n1.x, n2.y - n1.y);
      const dist = Math.abs((n2.y - n1.y)*mx - (n2.x - n1.x)*my + n2.x*n1.y - n2.y*n1.x) / L;
      const hitRadius = 15 / zoom;
      return dist < hitRadius && mx > Math.min(n1.x, n2.x) - hitRadius && mx < Math.max(n1.x, n2.x) + hitRadius && my > Math.min(n1.y, n2.y) - hitRadius && my < Math.max(n1.y, n2.y) + hitRadius;
    });
    
    if (clickedEdge) {
      // Right-click menu for edge - cycle through types
      const types: Array<'pipe' | 'venturi' | 'elbow' | 'curve' | 'neck'> = ['pipe', 'venturi', 'elbow', 'curve', 'neck'];
      const currentIndex = types.indexOf(clickedEdge.type);
      const nextType = types[(currentIndex + 1) % types.length];
      
      setEdges(edges.map(e => e.id === clickedEdge.id ? { 
        ...e, 
        type: nextType,
        controlPoint: nextType === 'curve' || nextType === 'elbow' ? 
          { 
            x: (nodes.find(n => n.id === e.n1)!.x + nodes.find(n => n.id === e.n2)!.x) / 2 + 50,
            y: (nodes.find(n => n.id === e.n1)!.y + nodes.find(n => n.id === e.n2)!.y) / 2
          } : e.controlPoint,
        neckRatio: nextType === 'neck' ? 0.5 : e.neckRatio
      } : e));
      setSelectedEdge(clickedEdge.id);
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
        onWheel={handleWheel}
      />

      {!showLeftSidebar && (
        <button
          onClick={() => setShowLeftSidebar(true)}
          style={{ position: 'absolute', top: 20, left: 20, padding: '10px 16px', background: 'rgba(15,23,42,0.95)', color: '#a5b4fc', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '8px', cursor: 'pointer', fontSize: '10px', fontWeight: 700, letterSpacing: '1px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}
        >
          Show Controls
        </button>
      )}

      {!showControlsPanel && (
        <button
          onClick={() => setShowControlsPanel(true)}
          style={{ position: 'absolute', bottom: 20, left: 20, padding: '10px 16px', background: 'rgba(15,23,42,0.95)', color: '#a5b4fc', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '8px', cursor: 'pointer', fontSize: '10px', fontWeight: 700, letterSpacing: '1px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}
        >
          Show Tutorial
        </button>
      )}

      {showLeftSidebar && (
        <>
        <div style={{ position: 'absolute', top: 20, left: 20, display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '280px' }}>
        {/* Mode Selection */}
        <div style={{ background: 'rgba(15,23,42,0.95)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.3)', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ color: '#a5b4fc', fontSize: '10px', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase' }}>Operation Mode</div>
            <button
              onClick={() => setShowLeftSidebar(false)}
              style={{ padding: '4px 8px', background: 'rgba(99, 102, 241, 0.2)', color: '#6366f1', border: '1px solid rgba(99, 102, 241, 0.4)', borderRadius: '4px', cursor: 'pointer', fontSize: '9px', fontWeight: 700 }}
            >
              ✕
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            <button
              style={{ 
                padding: '12px 16px', 
                background: mode === 'move' ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' : 'rgba(99, 102, 241, 0.1)', 
                color: mode === 'move' ? '#fff' : '#cbd5e1', 
                border: mode === 'move' ? 'none' : '1px solid rgba(99, 102, 241, 0.3)', 
                borderRadius: '8px', 
                cursor: 'pointer', 
                fontWeight: 700, 
                fontSize: '11px', 
                transition: 'all 0.2s',
                letterSpacing: '0.5px'
              }}
              onClick={() => setMode('move')}
            >
              MOVE
            </button>
            <button
              style={{ 
                padding: '12px 16px', 
                background: mode === 'node' ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' : 'rgba(99, 102, 241, 0.1)', 
                color: mode === 'node' ? '#fff' : '#cbd5e1', 
                border: mode === 'node' ? 'none' : '1px solid rgba(99, 102, 241, 0.3)', 
                borderRadius: '8px', 
                cursor: 'pointer', 
                fontWeight: 700, 
                fontSize: '11px', 
                transition: 'all 0.2s',
                letterSpacing: '0.5px'
              }}
              onClick={() => setMode('node')}
            >
              NODE
            </button>
            <button
              style={{ 
                padding: '12px 16px', 
                background: mode === 'link' ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' : 'rgba(99, 102, 241, 0.1)', 
                color: mode === 'link' ? '#fff' : '#cbd5e1', 
                border: mode === 'link' ? 'none' : '1px solid rgba(99, 102, 241, 0.3)', 
                borderRadius: '8px', 
                cursor: 'pointer', 
                fontWeight: 700, 
                fontSize: '11px', 
                transition: 'all 0.2s',
                letterSpacing: '0.5px'
              }}
              onClick={() => setMode('link')}
            >
              LINK
            </button>
          </div>
          <div style={{ marginTop: '12px', fontSize: '9px', color: '#64748b', textAlign: 'center', letterSpacing: '0.5px' }}>
            KEYBOARD: M · N · L
          </div>
        </div>

        {/* Preset Networks */}
        <div style={{ background: 'rgba(15,23,42,0.95)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.3)', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
          <div style={{ color: '#a5b4fc', fontSize: '10px', fontWeight: 800, letterSpacing: '2px', marginBottom: '12px', textTransform: 'uppercase' }}>Preset Networks</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              style={{ 
                padding: '10px 12px', 
                background: 'rgba(99, 102, 241, 0.15)', 
                color: '#a5b4fc', 
                border: '1px solid rgba(99, 102, 241, 0.3)', 
                borderRadius: '8px', 
                cursor: 'pointer', 
                fontWeight: 700, 
                fontSize: '10px', 
                transition: 'all 0.2s',
                textAlign: 'left',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
              onClick={() => loadPreset('simple')}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.25)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)'}
            >
              <span>Simple</span>
              <span style={{ fontSize: '12px', opacity: 0.7 }}>→</span>
            </button>
            <button
              style={{ 
                padding: '10px 12px', 
                background: 'rgba(99, 102, 241, 0.15)', 
                color: '#a5b4fc', 
                border: '1px solid rgba(99, 102, 241, 0.3)', 
                borderRadius: '8px', 
                cursor: 'pointer', 
                fontWeight: 700, 
                fontSize: '10px', 
                transition: 'all 0.2s',
                textAlign: 'left',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
              onClick={() => loadPreset('parallel')}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.25)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)'}
            >
              <span>Parallel</span>
              <span style={{ fontSize: '12px', opacity: 0.7 }}>→</span>
            </button>
            <button
              style={{ 
                padding: '10px 12px', 
                background: 'rgba(99, 102, 241, 0.15)', 
                color: '#a5b4fc', 
                border: '1px solid rgba(99, 102, 241, 0.3)', 
                borderRadius: '8px', 
                cursor: 'pointer', 
                fontWeight: 700, 
                fontSize: '10px', 
                transition: 'all 0.2s',
                textAlign: 'left',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
              onClick={() => loadPreset('complex')}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.25)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)'}
            >
              <span>Complex</span>
              <span style={{ fontSize: '12px', opacity: 0.7 }}>→</span>
            </button>
          </div>
        </div>

        {/* Physics Parameters */}
        {onVelocityChange && onViscosityChange && (
          <div style={{ background: 'rgba(15,23,42,0.95)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.3)', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ color: '#a5b4fc', fontSize: '10px', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase' }}>Physics Parameters</div>
              <button
                onClick={() => setShowPhysicsParams(!showPhysicsParams)}
                style={{ padding: '4px 8px', background: 'rgba(99, 102, 241, 0.2)', color: '#6366f1', border: '1px solid rgba(99, 102, 241, 0.4)', borderRadius: '4px', cursor: 'pointer', fontSize: '9px', fontWeight: 700 }}
              >
                {showPhysicsParams ? '−' : '+'}
              </button>
            </div>
            
            {showPhysicsParams && (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ color: '#cbd5e1', fontSize: '10px', fontWeight: 700 }}>Inlet Velocity (V)</span>
                    <span style={{ color: '#fbbf24', fontSize: '11px', fontWeight: 800 }}>{velocity.toFixed(2)} m/s</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="2.0"
                    step="0.1"
                    value={velocity}
                    onChange={(e) => onVelocityChange(parseFloat(e.target.value))}
                    style={{ width: '100%', height: '6px', borderRadius: '3px', background: 'rgba(99, 102, 241, 0.2)', outline: 'none', cursor: 'pointer', accentColor: '#6366f1' }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ color: '#cbd5e1', fontSize: '10px', fontWeight: 700 }}>Viscosity (μ)</span>
                    <span style={{ color: '#fbbf24', fontSize: '11px', fontWeight: 800 }}>{viscosity.toFixed(3)} Pa·s</span>
                  </div>
                  <input
                    type="range"
                    min="0.01"
                    max="1.0"
                    step="0.01"
                    value={viscosity}
                    onChange={(e) => onViscosityChange(parseFloat(e.target.value))}
                    style={{ width: '100%', height: '6px', borderRadius: '3px', background: 'rgba(99, 102, 241, 0.2)', outline: 'none', cursor: 'pointer', accentColor: '#6366f1' }}
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>
        </>
      )}

      <div style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(15,23,42,0.95)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.3)', width: '320px', maxHeight: '280px', overflow: 'auto', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ color: '#fff', margin: 0, fontSize: '11px', letterSpacing: '2px', fontWeight: 900 }}>QUICK REFERENCE</h3>
          <button
            onClick={() => setShowHelp(!showHelp)}
            style={{ padding: '4px 8px', background: 'rgba(99, 102, 241, 0.2)', color: '#6366f1', border: '1px solid rgba(99, 102, 241, 0.4)', borderRadius: '4px', cursor: 'pointer', fontSize: '9px', fontWeight: 700 }}
          >
            {showHelp ? '×' : '?'}
          </button>
        </div>
        
        {showHelp && (
          <>
            <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '8px', borderRadius: '6px', marginBottom: '12px', borderLeft: '3px solid #6366f1' }}>
              <div style={{ color: '#a5b4fc', fontSize: '9px', fontWeight: 700, letterSpacing: '1px', marginBottom: '4px' }}>CURRENT MODE</div>
              <div style={{ color: '#fff', fontSize: '10px', fontWeight: 800 }}>
                {mode === 'move' ? 'MOVE / PAN' : mode === 'node' ? 'ADD NODE' : 'DRAW LINK'}
              </div>
            </div>

            <div style={{ fontSize: '9px', color: '#cbd5e1', lineHeight: 2.2 }}>
              <div style={{ marginBottom: '8px' }}>
                <strong style={{color:'#6366f1', fontSize: '10px'}}>MODES (Keyboard)</strong>
                <div style={{ marginLeft: '8px', marginTop: '4px', borderLeft: '2px solid rgba(99, 102, 241, 0.3)', paddingLeft: '8px' }}>
                  <div><kbd style={{background:'rgba(99,102,241,0.3)', padding:'2px 4px', borderRadius:'3px', fontSize:'8px'}}>M</kbd> = Move / Pan</div>
                  <div><kbd style={{background:'rgba(99,102,241,0.3)', padding:'2px 4px', borderRadius:'3px', fontSize:'8px'}}>N</kbd> = Add Node</div>
                  <div><kbd style={{background:'rgba(99,102,241,0.3)', padding:'2px 4px', borderRadius:'3px', fontSize:'8px'}}>L</kbd> = Draw Link</div>
                  <div><kbd style={{background:'rgba(99,102,241,0.3)', padding:'2px 4px', borderRadius:'3px', fontSize:'8px'}}>?</kbd> = Toggle Help</div>
                </div>
              </div>

              <div style={{ marginBottom: '8px' }}>
                <strong style={{color:'#10b981', fontSize: '10px'}}>NODE ACTIONS</strong>
                <div style={{ marginLeft: '8px', marginTop: '4px', borderLeft: '2px solid rgba(16, 185, 129, 0.3)', paddingLeft: '8px' }}>
                  <div>Click → Select</div>
                  <div>Drag → Move (in MOVE mode)</div>
                  <div>Scroll → Rotate/Resize</div>
                  <div><kbd style={{background:'rgba(34,197,94,0.3)', padding:'2px 4px', borderRadius:'3px', fontSize:'8px'}}>Del</kbd> = Delete</div>
                  <div>Right-click → Delete/Reset</div>
                </div>
              </div>

              <div style={{ marginBottom: '8px' }}>
                <strong style={{color:'#f59e0b', fontSize: '10px'}}>TUBE/EDGE ACTIONS</strong>
                <div style={{ marginLeft: '8px', marginTop: '4px', borderLeft: '2px solid rgba(245, 158, 11, 0.3)', paddingLeft: '8px' }}>
                  <div>Click → Select</div>
                  <div>Scroll → Diameter</div>
                  <div>Shift+Scroll → Length</div>
                  <div>Right-click → Cycle Type</div>
                  <div><kbd style={{background:'rgba(245,158,11,0.3)', padding:'2px 4px', borderRadius:'3px', fontSize:'8px'}}>R</kbd> = Cycle Type</div>
                  <div><kbd style={{background:'rgba(239,68,68,0.3)', padding:'2px 4px', borderRadius:'3px', fontSize:'8px'}}>Del</kbd> = Delete</div>
                  <div>Drag ◉ → Curve</div>
                </div>
              </div>

              <div>
                <strong style={{color:'#8b5cf6', fontSize: '10px'}}>TUBE TYPES</strong>
                <div style={{ marginLeft: '8px', marginTop: '4px', borderLeft: '2px solid rgba(139, 92, 246, 0.3)', paddingLeft: '8px', fontSize: '8px' }}>
                  <div><span style={{color:'#a0aec0'}}>Pipe</span> → <span style={{color:'#3b82f6'}}>Venturi</span> → <span style={{color:'#f59e0b'}}>Elbow</span> → <span style={{color:'#8b5cf6'}}>Curve</span> → <span style={{color:'#ef4444'}}>Neck</span></div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {showControlsPanel && (
        <div style={{ position: 'absolute', bottom: 20, left: 20, background: 'rgba(15,23,42,0.95)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.3)', width: '420px', maxHeight: '300px', overflow: 'auto', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ color: '#fff', margin: 0, fontSize: '12px', letterSpacing: '1px', fontWeight: 800 }}>NETWORK CONTROLS & TUTORIAL</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setShowStats(!showStats)}
                style={{ padding: '4px 8px', background: showStats ? '#6366f1' : 'transparent', color: showStats ? '#fff' : '#94a3b8', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '4px', cursor: 'pointer', fontSize: '9px', fontWeight: 700 }}
              >
                {showStats ? 'HIDE STATS' : 'SHOW STATS'}
              </button>
              <button
                onClick={() => setShowControlsPanel(false)}
                style={{ padding: '4px 8px', background: 'transparent', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', cursor: 'pointer', fontSize: '9px', fontWeight: 700 }}
              >
                ✕
              </button>
            </div>
          </div>
        <ul style={{ color: '#94a3b8', fontSize: '10px', margin: 0, paddingLeft: '16px', lineHeight: 2.0 }}>
          <li><strong style={{color:'#fff'}}>MOVE:</strong> Drag nodes. Click link to cycle types (Pipe→Venturi→Elbow→Curve→Neck). Right-click edge to delete.</li>
          <li><strong style={{color:'#fff'}}>ADD NODE:</strong> Click empty space to place junctions.</li>
          <li><strong style={{color:'#fff'}}>QUICK LINK:</strong> <span style={{color:'#22c55e'}}>Shift+Click</span> two nodes to connect them instantly (no drag needed).</li>
          <li><strong style={{color:'#fff'}}>DRAW LINK:</strong> Drag from node to node to connect.</li>
          <li><strong style={{color:'#fff'}}>SCROLL on EDGE:</strong>
            <ul style={{ marginTop: '4px', marginBottom: '4px', paddingLeft: '16px' }}>
              <li>Normal: Adjust <span style={{color:'#ffff00'}}>diameter</span></li>
              <li>Shift+Scroll: Adjust <span style={{color:'#ffff00'}}>tube length</span></li>
              <li>Neck type: Adjust <span style={{color:'#ffff00'}}>constriction ratio</span></li>
            </ul>
          </li>
          <li><strong style={{color:'#fff'}}>CURVES/ELBOWS:</strong> Right-click edge to cycle to Elbow or Curve, then drag the control point (yellow circle when selected).</li>
          <li><strong style={{color:'#fff'}}>NECKS:</strong> Right-click edge to set as Neck for narrowed sections. Use Shift+Scroll to adjust constriction.</li>
          <li><strong style={{color:'#fff'}}>Nodes:</strong> Scroll = rotate junctions or resize inlets/outlets. Right-click junction = delete it.</li>
        </ul>
        {showStats && (
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: '10px', color: '#6366f1', fontWeight: 800, marginBottom: '8px', letterSpacing: '1px' }}>REAL-TIME STATISTICS</div>
            <div style={{ fontSize: '10px', color: '#cbd5e1', lineHeight: 1.8 }}>
              <div>Nodes: <span style={{ color: '#fff', fontWeight: 700 }}>{nodes.length}</span></div>
              <div>Edges: <span style={{ color: '#fff', fontWeight: 700 }}>{edges.length}</span></div>
              <div>Particles: <span style={{ color: '#fff', fontWeight: 700 }}>{particlesRef.current.length}</span></div>
              <div>Viscosity: <span style={{ color: '#fff', fontWeight: 700 }}>{viscosity.toFixed(3)}</span> Pa·s</div>
              {selectedEdge && (
                <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ color: '#fbbf24', fontWeight: 700, marginBottom: '4px' }}>SELECTED EDGE</div>
                  <div>Diameter: <span style={{ color: '#fff', fontWeight: 700 }}>{edges.find(e => e.id === selectedEdge)?.diameter.toFixed(2)}</span></div>
                  <div>Length: <span style={{ color: '#fff', fontWeight: 700 }}>{(edges.find(e => e.id === selectedEdge)?.customLength || edges.find(e => e.id === selectedEdge)?.length || 0).toFixed(0)}</span></div>
                  <div>Type: <span style={{ color: '#fff', fontWeight: 700 }}>{edges.find(e => e.id === selectedEdge)?.type.toUpperCase()}</span></div>
                  {edges.find(e => e.id === selectedEdge)?.type === 'neck' && (
                    <div>Constrict: <span style={{ color: '#fff', fontWeight: 700 }}>{((edges.find(e => e.id === selectedEdge)?.neckRatio || 0.5) * 100).toFixed(0)}%</span></div>
                  )}
                </div>
              )}
              {selectedNode && (
                <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ color: '#22c55e', fontWeight: 700, marginBottom: '4px' }}>SELECTED NODE</div>
                  <div>Type: <span style={{ color: '#fff', fontWeight: 700 }}>{nodes.find(n => n.id === selectedNode)?.type.toUpperCase()}</span></div>
                  <div>Pressure: <span style={{ color: '#fff', fontWeight: 700 }}>{nodes.find(n => n.id === selectedNode)?.p.toFixed(1)}</span> kPa</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      )}

      {/* PROPERTIES PANEL - Right Side */}
      <div style={{ position: 'absolute', bottom: 20, right: 20, background: 'rgba(15,23,42,0.95)', padding: '20px', borderRadius: '8px', border: '2px solid rgba(99, 102, 241, 0.5)', width: '320px', maxHeight: '600px', overflow: 'auto' }}>
        <h3 style={{ color: '#fff', margin: '0 0 16px 0', fontSize: '12px', letterSpacing: '2px', fontWeight: 900, textTransform: 'uppercase' }}>PROPERTIES</h3>
        
        {selectedEdge && edges.find(e => e.id === selectedEdge) && (
          <div>
            <div style={{ background: 'rgba(99, 102, 241, 0.2)', padding: '12px', borderRadius: '8px', marginBottom: '16px', borderLeft: '4px solid #fbbf24' }}>
              <div style={{ color: '#fbbf24', fontSize: '11px', fontWeight: 800, marginBottom: '12px', textTransform: 'uppercase' }}>TUBE</div>
              
              {/* TYPE SELECTOR */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ color: '#cbd5e1', fontSize: '10px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Type</label>
                <select 
                  value={edges.find(e => e.id === selectedEdge)?.type || 'pipe'}
                  onChange={(e) => {
                    const newType = e.target.value as 'pipe' | 'venturi' | 'elbow' | 'curve' | 'neck';
                    setEdges(edges.map(ed => ed.id === selectedEdge ? {
                      ...ed,
                      type: newType,
                      controlPoint: (newType === 'curve' || newType === 'elbow') ? (ed.controlPoint || { x: ((nodes.find(n => n.id === ed.n1)?.x || 0) + (nodes.find(n => n.id === ed.n2)?.x || 0)) / 2, y: ((nodes.find(n => n.id === ed.n1)?.y || 0) + (nodes.find(n => n.id === ed.n2)?.y || 0)) / 2 }) : ed.controlPoint,
                      neckRatio: newType === 'neck' ? 0.5 : ed.neckRatio
                    } : ed));
                  }}
                  style={{ width: '100%', padding: '6px', background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(99, 102, 241, 0.5)', borderRadius: '4px', color: '#fff', fontSize: '10px', fontWeight: 700 }}
                >
                  <option value="pipe">Pipe</option>
                  <option value="venturi">Venturi</option>
                  <option value="elbow">Elbow</option>
                  <option value="curve">Curve</option>
                  <option value="neck">Neck</option>
                </select>
              </div>

              {/* DIAMETER SLIDER */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ color: '#cbd5e1', fontSize: '10px', fontWeight: 700, display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span>Diameter</span>
                  <span style={{ color: '#fbbf24', fontWeight: 800 }}>{edges.find(e => e.id === selectedEdge)?.diameter.toFixed(2)}</span>
                </label>
                <input 
                  type="range" 
                  min="0.3" 
                  max="2.0" 
                  step="0.1" 
                  value={edges.find(e => e.id === selectedEdge)?.diameter || 1.0}
                  onChange={(e) => {
                    setEdges(edges.map(ed => ed.id === selectedEdge ? { ...ed, diameter: parseFloat(e.target.value) } : ed));
                  }}
                  style={{ width: '100%', height: '6px', borderRadius: '3px', background: 'rgba(99, 102, 241, 0.3)', outline: 'none', cursor: 'pointer' }}
                />
                <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: '4px' }}>Range: 0.3 - 2.0 units</div>
              </div>

              {/* LENGTH SLIDER */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ color: '#cbd5e1', fontSize: '10px', fontWeight: 700, display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span>Length</span>
                  <span style={{ color: '#fbbf24', fontWeight: 800 }}>{(edges.find(e => e.id === selectedEdge)?.customLength || edges.find(e => e.id === selectedEdge)?.length || 0).toFixed(0)}</span>
                </label>
                <input 
                  type="range" 
                  min="0" 
                  max="500" 
                  step="10" 
                  value={edges.find(e => e.id === selectedEdge)?.customLength || edges.find(e => e.id === selectedEdge)?.length || 0}
                  onChange={(e) => {
                    setEdges(edges.map(ed => ed.id === selectedEdge ? { ...ed, customLength: parseFloat(e.target.value) } : ed));
                  }}
                  style={{ width: '100%', height: '6px', borderRadius: '3px', background: 'rgba(34, 197, 94, 0.3)', outline: 'none', cursor: 'pointer' }}
                />
                <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: '4px' }}>Range: 0 - 500 units</div>
              </div>

              {/* NECK RATIO SLIDER */}
              {edges.find(e => e.id === selectedEdge)?.type === 'neck' && (
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ color: '#cbd5e1', fontSize: '10px', fontWeight: 700, display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span>Constriction</span>
                    <span style={{ color: '#ef4444', fontWeight: 800 }}>{((edges.find(e => e.id === selectedEdge)?.neckRatio || 0.5) * 100).toFixed(0)}%</span>
                  </label>
                  <input 
                    type="range" 
                    min="0.1" 
                    max="0.9" 
                    step="0.05" 
                    value={edges.find(e => e.id === selectedEdge)?.neckRatio || 0.5}
                    onChange={(e) => {
                      setEdges(edges.map(ed => ed.id === selectedEdge ? { ...ed, neckRatio: parseFloat(e.target.value) } : ed));
                    }}
                    style={{ width: '100%', height: '6px', borderRadius: '3px', background: 'rgba(239, 68, 68, 0.3)', outline: 'none', cursor: 'pointer' }}
                  />
                  <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: '4px' }}>Range: 10% - 90%</div>
                </div>
              )}

              {/* DELETE BUTTON */}
              <button
                onClick={() => {
                  setEdges(edges.filter(e => e.id !== selectedEdge));
                  setSelectedEdge(null);
                }}
                style={{ width: '100%', padding: '8px', background: 'rgba(239, 68, 68, 0.3)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.5)', borderRadius: '6px', cursor: 'pointer', fontSize: '10px', fontWeight: 700, marginTop: '12px' }}
              >
                DELETE TUBE
              </button>
            </div>
          </div>
        )}

        {selectedNode && nodes.find(n => n.id === selectedNode) && (
          <div>
            <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '12px', borderRadius: '8px', borderLeft: '4px solid #22c55e' }}>
              <div style={{ color: '#22c55e', fontSize: '11px', fontWeight: 800, marginBottom: '12px', textTransform: 'uppercase' }}>NODE</div>
              
              {/* NODE TYPE INFO */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ color: '#cbd5e1', fontSize: '10px', fontWeight: 700, marginBottom: '6px', display: 'block' }}>Type</label>
                <div style={{ padding: '8px', background: 'rgba(30, 41, 59, 0.8)', borderRadius: '4px', color: '#a5b4fc', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', textAlign: 'center' }}>
                  {nodes.find(n => n.id === selectedNode)?.type}
                </div>
              </div>

              {/* PRESSURE INFO */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ color: '#cbd5e1', fontSize: '10px', fontWeight: 700, display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span>Pressure</span>
                  <span style={{ color: '#22c55e', fontWeight: 800 }}>{nodes.find(n => n.id === selectedNode)?.p.toFixed(1)} kPa</span>
                </label>
                <div style={{ padding: '8px', background: 'rgba(30, 41, 59, 0.6)', borderRadius: '4px', fontSize: '9px', color: '#94a3b8' }}>
                  Calculated from network
                </div>
              </div>

              {/* SIZE SLIDER */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ color: '#cbd5e1', fontSize: '10px', fontWeight: 700, display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span>Size</span>
                  <span style={{ color: '#10b981', fontWeight: 800 }}>{nodes.find(n => n.id === selectedNode)?.size || 25}</span>
                </label>
                <input 
                  type="range" 
                  min="15" 
                  max="40" 
                  step="1" 
                  value={nodes.find(n => n.id === selectedNode)?.size || 25}
                  onChange={(e) => {
                    setNodes(nodes.map(n => n.id === selectedNode ? { ...n, size: parseFloat(e.target.value) } : n));
                  }}
                  style={{ width: '100%', height: '6px', borderRadius: '3px', background: 'rgba(16, 185, 129, 0.3)', outline: 'none', cursor: 'pointer' }}
                />
              </div>

              {/* ROTATION SLIDER */}
              {nodes.find(n => n.id === selectedNode)?.type === 'junction' && (
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ color: '#cbd5e1', fontSize: '10px', fontWeight: 700, display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span>Rotation</span>
                    <span style={{ color: '#60a5fa', fontWeight: 800 }}>{((nodes.find(n => n.id === selectedNode)?.rotation || 0) * 180 / Math.PI).toFixed(0)}°</span>
                  </label>
                  <input 
                    type="range" 
                    min="0" 
                    max="360" 
                    step="5" 
                    value={(nodes.find(n => n.id === selectedNode)?.rotation || 0) * 180 / Math.PI}
                    onChange={(e) => {
                      setNodes(nodes.map(n => n.id === selectedNode ? { ...n, rotation: parseFloat(e.target.value) * Math.PI / 180 } : n));
                    }}
                    style={{ width: '100%', height: '6px', borderRadius: '3px', background: 'rgba(96, 165, 250, 0.3)', outline: 'none', cursor: 'pointer' }}
                  />
                  <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: '4px' }}>Range: 0° - 360°</div>
                </div>
              )}

              {/* DELETE BUTTON (only for junction) */}
              {nodes.find(n => n.id === selectedNode)?.type === 'junction' && (
                <button
                  onClick={() => {
                    const nodeToDelete = selectedNode;
                    setNodes(nodes.filter(n => n.id !== nodeToDelete));
                    setEdges(edges.filter(edge => edge.n1 !== nodeToDelete && edge.n2 !== nodeToDelete));
                    setSelectedNode(null);
                  }}
                  style={{ width: '100%', padding: '8px', background: 'rgba(239, 68, 68, 0.3)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.5)', borderRadius: '6px', cursor: 'pointer', fontSize: '10px', fontWeight: 700, marginTop: '12px' }}
                >
                  DELETE NODE
                </button>
              )}
            </div>
          </div>
        )}

        {!selectedEdge && !selectedNode && (
          <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '10px', padding: '20px' }}>
            <div style={{ marginBottom: '8px' }}>Select element</div>
            <div>Click a tube or node to edit</div>
          </div>
        )}
      </div>

      {/* Zoom Controls */}
      <div style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(15, 23, 42, 0.95)', padding: '8px 16px', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.3)', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)' }}>
        <button
          onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
          style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.4)', borderRadius: '8px', cursor: 'pointer', fontSize: '18px', fontWeight: 700, transition: 'all 0.2s' }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.3)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)'}
        >
          −
        </button>
        <div style={{ minWidth: '60px', textAlign: 'center', color: '#e2e8f0', fontSize: '12px', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>
          {Math.round(zoom * 100)}%
        </div>
        <button
          onClick={() => setZoom(Math.min(3, zoom + 0.1))}
          style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.4)', borderRadius: '8px', cursor: 'pointer', fontSize: '18px', fontWeight: 700, transition: 'all 0.2s' }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.3)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)'}
        >
          +
        </button>
        <button
          onClick={() => setZoom(1)}
          style={{ padding: '8px 12px', background: 'rgba(99, 102, 241, 0.1)', color: '#a5b4fc', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '8px', cursor: 'pointer', fontSize: '10px', fontWeight: 700, letterSpacing: '0.5px', transition: 'all 0.2s' }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)'}
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default NetworkSimulation;
