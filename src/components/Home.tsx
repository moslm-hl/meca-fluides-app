import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Stars, PerspectiveCamera } from '@react-three/drei';

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
      {Array.from({ length: 150 }).map((_, i) => (
        <mesh key={i} position={[(Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 10]}>
          <sphereGeometry args={[0.02, 16, 16]} />
          <meshStandardMaterial color="#818cf8" emissive="#6366f1" emissiveIntensity={5} />
        </mesh>
      ))}
    </group>
  );
};

const Home: React.FC<{ onStart: () => void, onSandbox: () => void }> = ({ onStart, onSandbox }) => {
  return (
    <div className="home-page">
      <div className="home-canvas">
        <Canvas dpr={[1, 2]}>
          <PerspectiveCamera makeDefault position={[0, 0, 8]} />
          <Stars radius={50} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
          <ambientLight intensity={0.2} />
          <pointLight position={[10, 10, 10]} intensity={1} color="#6366f1" />
          <pointLight position={[-10, -10, -10]} intensity={0.5} color="#0ea5e9" />
          <FlowField />
          <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
            <mesh position={[0, 0, 0]}>
              <torusKnotGeometry args={[1.5, 0.4, 256, 32]} />
              <MeshDistortMaterial 
                color="#6366f1" 
                speed={2} 
                distort={0.4} 
                emissive="#4f46e5"
                emissiveIntensity={0.5}
                roughness={0.1}
                metalness={0.8}
              />
            </mesh>
          </Float>
        </Canvas>
      </div>

      <div className="home-content">
        <div className="home-glass">
          <div className="home-badge">FLUID DYNAMICS V2.0</div>
          <h1 className="home-title">MECANIQUE DE FLUIDE</h1>
          <p className="home-subtitle">
            The definitive interactive reference for Fluid Mechanics Mastery. 
            From Continuum Hypotheses to Boundary Layer Theory.
          </p>
          <div className="home-actions">
            <button className="start-btn" onClick={onStart}>
              EXPLORE CHAPTERS
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
            <button className="sandbox-btn" onClick={onSandbox}>
              TRY SIMULATION
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
