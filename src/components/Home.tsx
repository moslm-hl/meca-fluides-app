import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Stars, PerspectiveCamera, Text } from '@react-three/drei';

const FlowField = () => {
  const points = useRef<any>(null);
  useFrame((state) => {
    const t = state.clock.elapsedTime * 0.5;
    points.current.children.forEach((p: any) => {
      p.position.y += Math.sin(t + p.position.x) * 0.005;
      p.position.z += Math.cos(t + p.position.y) * 0.005;
      p.rotation.x += 0.01;
      p.rotation.y += 0.01;
    });
  });

  return (
    <group ref={points}>
      {Array.from({ length: 200 }).map((_, i) => (
        <mesh key={i} position={[(Math.random() - 0.5) * 25, (Math.random() - 0.5) * 25, (Math.random() - 0.5) * 15]}>
          <sphereGeometry args={[0.015, 16, 16]} />
          <meshStandardMaterial 
            color={i % 3 === 0 ? "#818cf8" : i % 3 === 1 ? "#0ea5e9" : "#a855f7"} 
            emissive={i % 3 === 0 ? "#6366f1" : i % 3 === 1 ? "#0284c7" : "#7c3aed"}
            emissiveIntensity={3} 
          />
        </mesh>
      ))}
    </group>
  );
};

const FloatingText = ({ text, position }: { text: string; position: [number, number, number] }) => {
  const ref = useRef<any>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.5) * 0.3;
    }
  });
  return (
    <Text
      ref={ref}
      position={position}
      fontSize={0.3}
      color="#818cf8"
      anchorX="center"
      anchorY="middle"
    >
      {text}
    </Text>
  );
};

const Home: React.FC<{ onStart: () => void, onSandbox: () => void }> = ({ onStart, onSandbox }) => {
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);

  return (
    <div className="home-page">
      <div className="home-canvas">
        <Canvas dpr={[1, 2]}>
          <PerspectiveCamera makeDefault position={[0, 0, 8]} />
          <Stars radius={60} depth={60} count={5000} factor={4} saturation={0} fade speed={0.5} />
          <ambientLight intensity={0.3} />
          <pointLight position={[10, 10, 10]} intensity={1.5} color="#6366f1" />
          <pointLight position={[-10, -10, -10]} intensity={1} color="#0ea5e9" />
          <pointLight position={[0, 10, -10]} intensity={0.8} color="#a855f7" />
          <FlowField />
          <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.8}>
            <mesh position={[0, 0, 0]}>
              <torusKnotGeometry args={[1.8, 0.5, 256, 32]} />
              <MeshDistortMaterial 
                color="#6366f1" 
                speed={3} 
                distort={0.5} 
                emissive="#4f46e5"
                emissiveIntensity={0.6}
                roughness={0.05}
                metalness={0.9}
              />
            </mesh>
          </Float>
          <FloatingText text="FLUID" position={[-3, 2, -2]} />
          <FloatingText text="DYNAMICS" position={[3, -2, -2]} />
          <FloatingText text="SIMULATION" position={[0, 3, -3]} />
        </Canvas>
      </div>

      <div className="home-content">
        <div className="home-glass">
          <div className="home-badge">
            <div className="badge-dot"></div>
            FLUID DYNAMICS V2.0
          </div>
          <h1 className="home-title">
            <span className="title-line">MECANIQUE</span>
            <span className="title-line">DE FLUIDE</span>
          </h1>
          <p className="home-subtitle">
            The definitive interactive reference for Fluid Mechanics Mastery. 
            From Continuum Hypotheses to Boundary Layer Theory.
          </p>
          <div className="home-features">
            <div className="feature-item">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
              <span>Real-time Simulation</span>
            </div>
            <div className="feature-item">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v6l4 2"/>
              </svg>
              <span>Interactive Learning</span>
            </div>
            <div className="feature-item">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 12h20M2 12l5-5m-5 5l5 5"/>
              </svg>
              <span>Advanced Physics</span>
            </div>
          </div>
          <div className="home-actions">
            <button 
              className={`start-btn ${hoveredBtn === 'chapters' ? 'hovered' : ''}`}
              onClick={onStart}
              onMouseEnter={() => setHoveredBtn('chapters')}
              onMouseLeave={() => setHoveredBtn(null)}
            >
              <span className="btn-text">EXPLORE CHAPTERS</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
            <button 
              className={`sandbox-btn ${hoveredBtn === 'sandbox' ? 'hovered' : ''}`}
              onClick={onSandbox}
              onMouseEnter={() => setHoveredBtn('sandbox')}
              onMouseLeave={() => setHoveredBtn(null)}
            >
              <span className="btn-text">TRY SIMULATION</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 8v8M8 12h8"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
