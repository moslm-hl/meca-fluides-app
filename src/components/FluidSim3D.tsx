import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Float, PerspectiveCamera, Trail } from '@react-three/drei';


const ContinuumSim = () => {
  const micro = useRef<any>(null);
  const macro = useRef<any>(null);
  useFrame((state) => {
    micro.current.rotation.y += 0.01;
    macro.current.rotation.x += 0.005;
  });
  return (
    <group>
      <points ref={micro}>
        <sphereGeometry args={[1.2, 32, 32]} />
        <pointsMaterial size={0.03} color="#94a3b8" />
      </points>
      <mesh ref={macro}>
        <sphereGeometry args={[2.5, 32, 32]} />
        <meshStandardMaterial color="#6366f1" wireframe transparent opacity={0.1} />
      </mesh>
    </group>
  );
};

const KinematicsSim = ({ velocity, viscosity }: { velocity: number, viscosity: number }) => {
  const eulerGrid = useRef<any>(null);
  const lagrangePoint = useRef<any>(null);
  useFrame((state) => {
    eulerGrid.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
    const t = state.clock.elapsedTime * velocity;
    const offset = viscosity * 2;
    lagrangePoint.current.position.set(Math.cos(t) * (2 + offset), Math.sin(t * 2) * 1, Math.sin(t) * (2 + offset));
  });
  return (
    <group>
      <gridHelper ref={eulerGrid} args={[10, 10, "#6366f1", "#1e293b"]} rotation={[Math.PI/2, 0, 0]} />
      <Trail width={2} length={10} color="#ef4444" attenuation={(t) => t}>
        <mesh ref={lagrangePoint}>
          <sphereGeometry args={[0.2]} />
          <meshStandardMaterial color="#ef4444" emissive="#ef4444" />
        </mesh>
      </Trail>
    </group>
  );
};

const BalancesSim = () => {
  return (
    <group rotation={[0.5, 0.5, 0]}>
      <mesh><boxGeometry args={[2, 2, 2]} /><meshStandardMaterial color="#6366f1" wireframe /></mesh>
      <group position={[0, -1, 0]} rotation={[0, 0, Math.PI]}>
        <mesh><coneGeometry args={[0.15, 1.5, 16]} /><meshStandardMaterial color="#22c55e" /></mesh>
      </group>
      {[ [1,0,0], [-1,0,0], [0,1,0] ].map((pos: any, i) => (
        <group key={i} position={pos} rotation={[0, 0, pos[0] ? Math.PI/2 : 0]}>
          <mesh position={[0.5, 0, 0]}><coneGeometry args={[0.1, 0.4, 16]} /><meshStandardMaterial color="#ef4444" /></mesh>
          <mesh position={[0, 0.5, 0]}><coneGeometry args={[0.05, 0.3, 16]} /><meshStandardMaterial color="#3b82f6" /></mesh>
        </group>
      ))}
    </group>
  );
};

const NavierStokesSim = ({ velocity, viscosity }: { velocity: number, viscosity: number }) => {
  const profile = useRef<any>(null);
  useFrame((state) => {
    profile.current.children.forEach((line: any, i: number) => {
      const r = Math.abs(i - 7) / 7;
      // Viscosity affects how much the profile stretches
      const speed = (1 - Math.pow(r, 2 * (1 + viscosity))) * velocity * 3;
      line.scale.y = speed + 0.1;
    });
  });
  return (
    <group rotation={[0, 0, Math.PI / 2]}>
      <mesh><cylinderGeometry args={[1.5, 1.5, 6, 32]} /><meshStandardMaterial color="#6366f1" wireframe transparent opacity={0.1} /></mesh>
      <group ref={profile} position={[0, -3, 0]}>
        {Array.from({ length: 15 }).map((_, i) => (
          <mesh key={i} position={[0, 0, (i - 7) * 0.2]}>
            <cylinderGeometry args={[0.02, 1, 1]} />
            <meshStandardMaterial color="#6366f1" />
          </mesh>
        ))}
      </group>
    </group>
  );
};

const BernoulliSim = () => {
  const levels = useRef<any>(null);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    levels.current.children[0].scale.y = 1 + Math.sin(t) * 0.5;
    levels.current.children[1].scale.y = 2 + Math.cos(t) * 0.3;
    levels.current.children[2].scale.y = 1.5;
  });
  return (
    <group position={[0, -2, 0]}>
      <group ref={levels}>
        <mesh position={[-2, 0.5, 0]}><boxGeometry args={[0.8, 1, 0.8]} /><meshStandardMaterial color="#3b82f6" /></mesh>
        <mesh position={[0, 0.5, 0]}><boxGeometry args={[0.8, 1, 0.8]} /><meshStandardMaterial color="#ef4444" /></mesh>
        <mesh position={[2, 0.5, 0]}><boxGeometry args={[0.8, 1, 0.8]} /><meshStandardMaterial color="#22c55e" /></mesh>
      </group>
      <gridHelper args={[10, 10, "#475569", "#1e293b"]} />
    </group>
  );
};

const SimilitudeSim = () => {
  return (
    <group>
      <Float speed={2}><mesh position={[-2, 0, 0]}><boxGeometry args={[1.5, 1.5, 1.5]} /><meshStandardMaterial color="#6366f1" /></mesh></Float>
      <Float speed={2}><mesh position={[2, 0, 0]} scale={0.5}><boxGeometry args={[1.5, 1.5, 1.5]} /><meshStandardMaterial color="#6366f1" wireframe /></mesh></Float>
      <mesh rotation={[Math.PI/2, 0, 0]} position={[0, -2, 0]}><gridHelper args={[10, 10, "#6366f1", "#1e293b"]} /></mesh>
    </group>
  );
};

const PotentialSim = () => {
  const ref = useRef<any>(null);
  useFrame((state) => (ref.current.rotation.y += 0.005));
  return (
    <group ref={ref}>
      <mesh><sphereGeometry args={[1.5, 32, 32]} /><meshStandardMaterial color="#6366f1" transparent opacity={0.3} /></mesh>
      {Array.from({ length: 50 }).map((_, i) => (
        <group key={i} rotation={[Math.random() * Math.PI, Math.random() * Math.PI, 0]}>
          <mesh position={[3, 0, 0]}><boxGeometry args={[0.4, 0.02, 0.02]} /><meshStandardMaterial color="#6366f1" /></mesh>
        </group>
      ))}
    </group>
  );
};

const BoundaryLayerSim = () => {
  return (
    <group rotation={[-0.5, 0, 0]}>
      <mesh position={[0, -1, 0]}><boxGeometry args={[6, 0.1, 4]} /><meshStandardMaterial color="#1e293b" /></mesh>
      {Array.from({ length: 12 }).map((_, i) => (
        <mesh key={i} position={[-2.5 + i * 0.4, -0.9 + i * 0.05, 0]}>
          <boxGeometry args={[0.05, 0.1 + i * 0.15, 0.2]} /><meshStandardMaterial color="#6366f1" />
        </mesh>
      ))}
    </group>
  );
};

const Scene = ({ type, physics }: { type: string, physics: { velocity: number, viscosity: number } }) => {
  switch (type) {
    case 'ch1': return <ContinuumSim />;
    case 'ch2': return <KinematicsSim {...physics} />;
    case 'ch3': return <BalancesSim />;
    case 'ch4': return <NavierStokesSim {...physics} />;
    case 'ch5': return <BernoulliSim />;
    case 'ch6': return <SimilitudeSim />;
    case 'ch7': return <PotentialSim />;
    case 'ch8': return <BoundaryLayerSim />;
    default: return <ContinuumSim />;
  }
};

const FluidSim3D: React.FC<{ chapterId: string, physics?: { velocity: number, viscosity: number } }> = ({ chapterId, physics = { velocity: 0.5, viscosity: 0.5 } }) => {
  return (
    <div style={{ height: '350px', width: '100%', marginBottom: '32px', borderRadius: '32px', overflow: 'hidden', background: 'var(--bg-shell)', border: '1px solid var(--border-shell)', position: 'relative' }}>
      <div style={{ position: 'absolute', top: '20px', left: '24px', zIndex: 10, pointerEvents: 'none' }}>
        <span style={{ fontSize: '10px', fontWeight: 'bold', letterSpacing: '2px', color: 'var(--text-active)', opacity: 0.6 }}>3D INTERACTIVE LAB</span>
      </div>
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[5, 5, 5]} />
        <OrbitControls enableZoom={false} autoRotate={chapterId === 'ch1' || chapterId === 'ch3'} autoRotateSpeed={0.5} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <Stars radius={50} depth={50} count={2000} factor={4} saturation={0} fade speed={1} />
        <Scene type={chapterId} physics={physics} />
      </Canvas>
    </div>
  );
};

export default FluidSim3D;
