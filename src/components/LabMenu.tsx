import React from 'react';

interface LabMenuProps {
  onSelectGeometry: (geometry: 'pipe' | 'venturi' | 'bend' | 'combined' | 'network') => void;
  onBack: () => void;
}

const LabMenu: React.FC<LabMenuProps> = ({ onSelectGeometry, onBack }) => {
  const labs = [
    {
      id: 'pipe' as const,
      title: 'STRAIGHT PIPE',
      subtitle: 'NAVIER-STOKES & REYNOLDS',
      desc: 'Analyze velocity profiles, viscous friction, and transition from laminar to turbulent flow (Reynolds number) in a standard conduit.',
      color: '#22c55e',
      icon: 'M4 12h16M4 8h16M4 16h16'
    },
    {
      id: 'venturi' as const,
      title: 'VENTURI TUBE',
      subtitle: 'BERNOULLI PRINCIPLE',
      desc: 'Observe the Venturi effect: as the pipe narrows, fluid accelerates and static pressure drops. Visualize pressure gradients.',
      color: '#3b82f6',
      icon: 'M4 8h5l4 3h7M4 16h5l4-3h7'
    },
    {
      id: 'bend' as const,
      title: 'PIPE BEND',
      subtitle: 'EULER THEOREM',
      desc: 'Calculate the resultant mechanical forces (Fx, Fy) exerted by the fluid on a bend, and simulate water hammer (coup de bélier) shocks.',
      color: '#ef4444',
      icon: 'M4 4v8a8 8 0 008 8h8'
    },
    {
      id: 'combined' as const,
      title: 'PIPELINE BUILDER',
      subtitle: 'LINEAR SEQUENCE',
      desc: 'Design a sequence of pipes, venturis, and bends to evaluate sequential pressure and forces.',
      color: '#a855f7',
      icon: 'M4 10h4l3-3h5a4 4 0 014 4v4'
    },
    {
      id: 'network' as const,
      title: 'FLUID NETWORK',
      subtitle: 'GRAPH-BASED SOLVER',
      desc: 'Build a fully interconnected grid of nodes and tubes. Uses iterative numerical solvers to simulate multi-path fluid flow.',
      color: '#ec4899',
      icon: 'M3 5h4m14 0h-4M3 19h4m14 0h-4M12 5v14m-5-7h10'
    }
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#020617', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      
      {/* Futuristic Background Elements */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.1, backgroundImage: 'linear-gradient(rgba(99, 102, 241, 0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(99, 102, 241, 0.4) 1px, transparent 1px)', backgroundSize: '40px 40px', zIndex: 0 }} />
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '800px', height: '800px', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.05) 0%, transparent 70%)', borderRadius: '50%', zIndex: 0 }} />

      <button 
        onClick={onBack}
        style={{ position: 'absolute', top: '40px', left: '40px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '11px', padding: '10px 16px', borderRadius: '8px', zIndex: 10, letterSpacing: '1px' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        SYSTEM OVERRIDE
      </button>

      <div style={{ textAlign: 'center', marginBottom: '60px', zIndex: 10, position: 'relative' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '6px 12px', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '20px', color: '#818cf8', fontSize: '10px', fontWeight: 800, letterSpacing: '2px', marginBottom: '20px' }}>
          <div style={{ width: '6px', height: '6px', background: '#818cf8', borderRadius: '50%', boxShadow: '0 0 8px #818cf8' }} />
          SIMULATION PROTOCOLS ACTIVE
        </div>
        <h1 style={{ color: '#fff', fontSize: '42px', fontWeight: 900, letterSpacing: '4px', marginBottom: '16px', textShadow: '0 0 40px rgba(99,102,241,0.5)' }}>EXPERIMENTAL LAB</h1>
        <p style={{ color: '#94a3b8', fontSize: '14px', maxWidth: '600px', lineHeight: 1.6, margin: '0 auto' }}>
          Select a localized testing environment or enter the Pipeline Builder to construct a dynamic fluid transport architecture.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', maxWidth: '1400px', width: '100%', padding: '0 40px', zIndex: 10 }}>
        {labs.map(lab => (
          <div 
            key={lab.id}
            onClick={() => onSelectGeometry(lab.id)}
            style={{
              background: 'rgba(15, 23, 42, 0.7)',
              border: `1px solid rgba(255,255,255,0.05)`,
              borderRadius: '16px',
              padding: '30px 24px',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative',
              overflow: 'hidden',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = lab.color;
              e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
              e.currentTarget.style.background = 'rgba(30, 41, 59, 0.9)';
              e.currentTarget.style.boxShadow = `0 20px 40px ${lab.color}20`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.background = 'rgba(15, 23, 42, 0.7)';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)';
            }}
          >
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '3px', background: lab.color }} />
            
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${lab.color}15`, border: `1px solid ${lab.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: lab.color, marginBottom: '24px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={lab.icon} />
              </svg>
            </div>

            <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: 800, marginBottom: '8px', letterSpacing: '1px' }}>{lab.title}</h3>
            <div style={{ color: lab.color, fontSize: '10px', fontWeight: 800, letterSpacing: '1.5px', marginBottom: '16px' }}>{lab.subtitle}</div>
            <p style={{ color: '#94a3b8', fontSize: '13px', lineHeight: 1.6, flex: 1 }}>{lab.desc}</p>
            
            <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '11px', fontWeight: 700, letterSpacing: '1px', opacity: 0.8 }}>
              INITIALIZE <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LabMenu;
