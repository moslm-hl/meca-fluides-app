import { useState } from 'react';
import { mecaFluidesData, type SectionData, type LineData, type LinePart, type ExamInsight } from './data/mecaFluides';
import FluidSim3D from './components/FluidSim3D';
import Home from './components/Home';
import FluidSandbox from './components/FluidSandbox';
import BendSimulation from './components/BendSimulation';
import LabMenu from './components/LabMenu';
import CombinedSimulation from './components/CombinedSimulation';
import NetworkSimulation from './components/NetworkSimulation';

function Matrix({ data }: { data: string[][] }) {
  return (
    <div className="matrix-container">
      <div className="matrix-bracket left"></div>
      <div className="matrix-content">
        {data.map((row, i) => (
          <div key={i} className="matrix-row">
            {row.map((cell, j) => (
              <span key={j} className="matrix-cell">{cell}</span>
            ))}
          </div>
        ))}
      </div>
      <div className="matrix-bracket right"></div>
    </div>
  );
}

function Line({ data }: { data: LineData }) {
  return (
    <div className="line">
      <span className="ln">{data.ln}</span>
      <div className="line-body">
        <div className="line-content">
          {data.parts.map((part: LinePart, i: number) => (
            <span key={i} className={part.type}>
              {part.text}
            </span>
          ))}
          {data.badge && (
            <span className={`badge ${data.badge.type}`}>
              {data.badge.text}
            </span>
          )}
        </div>
        {data.matrix && <Matrix data={data.matrix} />}
      </div>
      {data.isSep && <div className="sep" style={{ width: '100%' }} />}
    </div>
  );
}

export default function App() {
  const [view, setView] = useState<'home' | 'chapters' | 'lab-menu' | 'sandbox'>('home');
  const [activeTab, setActiveTab] = useState(mecaFluidesData[0].id);

  // Sandbox Physics State
  const [viscosity, setViscosity] = useState(0.2);
  const [velocity, setVelocity] = useState(1.0);
  const [guideSize, setGuideSize] = useState(0.6);
  const [density, setDensity] = useState(1.0);
  const [pressure, setPressure] = useState(0.5);
  const [geometry, setGeometry] = useState<'pipe' | 'venturi' | 'bend' | 'combined' | 'network'>('pipe');
  const [neckSize] = useState(0.5);
  const [showControls, setShowControls] = useState(true);

  // Bend Simulation State
  const [bendAngle, setBendAngle] = useState(90);

  // Expose setView to window for the Home component callback
  (window as any).onSandbox = () => setView('lab-menu');

  const [pipeline, setPipeline] = useState<any[]>([
    { id: '1', type: 'straight', length: 150 },
    { id: '2', type: 'venturi', length: 200, neckSize: 0.4 },
    { id: '3', type: 'straight', length: 100 },
    { id: '4', type: 'bend', angle: 90 },
    { id: '5', type: 'straight', length: 150 }
  ]);

  const addPipelineSegment = (type: string) => {
    const newSeg = { id: Math.random().toString(), type, length: 150, neckSize: 0.4, angle: 90 };
    setPipeline([...pipeline, newSeg]);
  };

  const updatePipelineSegment = (id: string, updates: any) => {
    setPipeline(pipeline.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const removePipelineSegment = (id: string) => {
    setPipeline(pipeline.filter(s => s.id !== id));
  };

  const activeSection = mecaFluidesData.find(s => s.id === activeTab) || mecaFluidesData[0];

  // Correct Reynolds Formula: Re = (rho * V * D) / mu
  // Using guideSize as D
  const reynolds = Math.round((density * velocity * guideSize * 8000) / (viscosity + 0.1));

  if (view === 'home') {
    return <Home onStart={() => setView('chapters')} onSandbox={() => setView('lab-menu')} />;
  }

  if (view === 'lab-menu') {
    return (
      <LabMenu
        onBack={() => setView('home')}
        onSelectGeometry={(geo) => {
          setGeometry(geo);
          setView('sandbox');
        }}
      />
    );
  }

  if (view === 'sandbox') {
    return (
      <div className="sandbox-view">
        <div className="shell sandbox-shell">
          <header className="sandbox-header">
            <div className="topbar-title">MDF.PHYSICS_LAB — {geometry.toUpperCase()}</div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="close-btn" onClick={() => setShowControls(!showControls)} style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8', borderColor: 'rgba(99, 102, 241, 0.3)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d={showControls ? "M9 18l6-6-6-6" : "M15 18l-6-6 6-6"} />
                </svg>
                {showControls ? 'HIDE CONTROLS' : 'SHOW CONTROLS'}
              </button>
              <button className="close-btn" onClick={() => setView('lab-menu')} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
                RETURN TO MENU
              </button>
            </div>
          </header>

          <div className="sandbox-container">
            <div className="simulation-area">
              {geometry === 'network' ? (
                <NetworkSimulation velocity={velocity} viscosity={viscosity} onVelocityChange={setVelocity} onViscosityChange={setViscosity} />
              ) : geometry === 'combined' ? (
                <CombinedSimulation
                  velocity={velocity * 2}
                  guideSize={guideSize}
                  density={density}
                  viscosity={viscosity}
                  pressureIn={pressure * 1000}
                  pipeline={pipeline}
                />
              ) : geometry === 'bend' ? (
                <BendSimulation
                  velocity={velocity * 3}
                  density={density * 1000}
                  diameter={guideSize}
                  bendAngle={bendAngle}
                  pressureIn={pressure * 400}
                />
              ) : (
                <FluidSandbox
                  viscosity={viscosity}
                  velocity={velocity + pressure}
                  guideSize={guideSize}
                  geometry={geometry as 'pipe' | 'venturi'}
                  neckSize={neckSize}
                />
              )}
            </div>

            {showControls && (
              <div className="sandbox-controls">
                <div className="params-header">
                  <div className="params-title">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M12 1v6m0 6v6m-8.5-8.5h4.2m8.6 0h4.2" />
                    </svg>
                    <h3>EXPERIMENTAL PARAMETERS</h3>
                  </div>
                  <p>Fine-tune the physical environment</p>
                  <button 
                    className="reset-btn"
                    onClick={() => {
                      setGuideSize(0.6);
                      setVelocity(1.0);
                      setDensity(1.0);
                      setPressure(0.5);
                      setViscosity(0.2);
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                      <path d="M3 3v5h5" />
                    </svg>
                    RESET DEFAULTS
                  </button>
                </div>



              {geometry === 'bend' && (
                <div className="control-item neck-control" style={{ marginBottom: '24px' }}>
                  <span style={{ color: '#6366f1', fontSize: '10px', fontWeight: 800, letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>ANGLE DU COUDE (θ) — {bendAngle}°</span>
                  <input
                    type="range" min="0" max="360" step="5"
                    value={bendAngle} onChange={(e) => setBendAngle(parseFloat(e.target.value))}
                    style={{ width: '100%', accentColor: '#6366f1' }}
                  />
                </div>
              )}

              {geometry !== 'bend' && (
                <div className="reynolds-display">
                  <div className="re-header">
                    <span className="re-label">REYNOLDS NUMBER</span>
                    <span className={`re-badge ${reynolds > 2000 ? 'turbulent' : 'laminar'}`}>
                      {reynolds > 2000 ? 'TURBULENT' : 'LAMINAR'}
                    </span>
                  </div>
                  <div className="re-value-container">
                    <span className="re-value">{reynolds.toLocaleString()}</span>
                    <span className="re-unit">Re</span>
                  </div>
                  <div className="re-gauge">
                    <div className="re-track"></div>
                    <div 
                      className="re-fill" 
                      style={{ 
                        width: `${Math.min(100, (reynolds / 5000) * 100)}%`,
                        background: reynolds > 2000 
                          ? 'linear-gradient(90deg, #f97316, #ef4444)' 
                          : 'linear-gradient(90deg, #22c55e, #10b981)'
                      }}
                    ></div>
                    <div className="re-markers">
                      <span className="marker">2000</span>
                      <span className="marker">4000</span>
                    </div>
                  </div>
                  <div className="re-description">
                    {reynolds > 2000 
                      ? 'Chaotic flow with eddies and vortices' 
                      : 'Smooth, orderly fluid motion'}
                  </div>
                </div>
              )}

              <div className="control-group">
                {geometry === 'combined' && (
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ color: '#a855f7', fontSize: '10px', fontWeight: 800, letterSpacing: '1px', marginBottom: '12px' }}>PIPELINE SEQUENCE</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                      {pipeline.map((seg, idx) => (
                        <div key={seg.id} style={{ background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#f8fafc' }}>{idx + 1}. {seg.type.toUpperCase()}</span>
                            <button onClick={() => removePipelineSegment(seg.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '10px' }}>REMOVE</button>
                          </div>
                          {seg.type === 'venturi' && (
                            <input type="range" min="0.1" max="0.9" step="0.1" value={seg.neckSize} onChange={(e) => updatePipelineSegment(seg.id, { neckSize: parseFloat(e.target.value) })} style={{ accentColor: '#a855f7' }} />
                          )}
                          {seg.type === 'bend' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <input type="range" min="-360" max="360" step="15" value={seg.angle ?? 90} onChange={(e) => updatePipelineSegment(seg.id, { angle: parseFloat(e.target.value) })} style={{ accentColor: '#a855f7', flex: 1 }} />
                              <span style={{ fontSize: '10px', color: '#94a3b8', width: '30px' }}>{seg.angle ?? 90}°</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => addPipelineSegment('straight')} style={{ flex: 1, padding: '6px', fontSize: '9px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '4px', cursor: 'pointer' }}>+ PIPE</button>
                      <button onClick={() => addPipelineSegment('venturi')} style={{ flex: 1, padding: '6px', fontSize: '9px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '4px', cursor: 'pointer' }}>+ VENTURI</button>
                      <button onClick={() => addPipelineSegment('bend')} style={{ flex: 1, padding: '6px', fontSize: '9px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '4px', cursor: 'pointer' }}>+ BEND</button>
                    </div>
                  </div>
                )}

                <div className="control-item">
                  <div className="control-label">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <circle cx="12" cy="12" r="4" />
                    </svg>
                    <span>GUIDE SIZE (D)</span>
                    <span className="control-value">{guideSize.toFixed(2)}</span>
                  </div>
                  <div className="slider-container">
                    <input
                      type="range" min="0.2" max={geometry === 'bend' ? 2.5 : 0.9} step="0.01"
                      value={guideSize} onChange={(e) => setGuideSize(parseFloat(e.target.value))}
                      className="custom-slider"
                    />
                    <div className="slider-range">
                      <span>0.2</span>
                      <span>{geometry === 'bend' ? '2.5' : '0.9'}</span>
                    </div>
                  </div>
                </div>

                <div className="control-item">
                  <div className="control-label">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                    </svg>
                    <span>INLET VELOCITY (V)</span>
                    <span className="control-value">{velocity.toFixed(2)} m/s</span>
                  </div>
                  <div className="slider-container">
                    <input
                      type="range" min="0.1" max="2.0" step="0.1"
                      value={velocity} onChange={(e) => setVelocity(parseFloat(e.target.value))}
                      className="custom-slider"
                    />
                    <div className="slider-range">
                      <span>0.1</span>
                      <span>2.0</span>
                    </div>
                  </div>
                </div>

                {geometry !== 'bend' && geometry !== 'combined' && geometry !== 'network' && (
                  <div className="control-item">
                    <div className="control-label">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                      </svg>
                      <span>VISCOSITY (μ)</span>
                      <span className="control-value">{viscosity.toFixed(2)}</span>
                    </div>
                    <div className="slider-container">
                      <input
                        type="range" min="0.01" max="1.0" step="0.01"
                        value={viscosity} onChange={(e) => setViscosity(parseFloat(e.target.value))}
                        className="custom-slider"
                      />
                      <div className="slider-range">
                        <span>0.01</span>
                        <span>1.0</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="control-item">
                  <div className="control-label">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    </svg>
                    <span>DENSITY (ρ)</span>
                    <span className="control-value">{density.toFixed(2)}</span>
                  </div>
                  <div className="slider-container">
                    <input
                      type="range" min="0.1" max="2.0" step="0.1"
                      value={density} onChange={(e) => setDensity(parseFloat(e.target.value))}
                      className="custom-slider"
                    />
                    <div className="slider-range">
                      <span>0.1</span>
                      <span>2.0</span>
                    </div>
                  </div>
                </div>

                <div className="control-item">
                  <div className="control-label">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2v20M2 12h20" />
                      <circle cx="12" cy="12" r="4" />
                    </svg>
                    <span>PRESSURE (P)</span>
                    <span className="control-value">{pressure.toFixed(2)}</span>
                  </div>
                  <div className="slider-container">
                    <input
                      type="range" min="0" max="2.0" step="0.1"
                      value={pressure} onChange={(e) => setPressure(parseFloat(e.target.value))}
                      className="custom-slider"
                    />
                    <div className="slider-range">
                      <span>0</span>
                      <span>2.0</span>
                    </div>
                  </div>
                </div>
              </div>

              {geometry === 'bend' && (
                <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(99,102,241,0.05)', borderRadius: '12px', border: '1px solid rgba(99,102,241,0.15)' }}>
                  <div style={{ fontSize: '10px', fontWeight: 900, color: '#818cf8', letterSpacing: '1px', marginBottom: '10px' }}>THÉORIE — BILAN QDM</div>
                  <div style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: 1.7 }}>
                    Le théorème d'Euler appliqué au coude donne :<br /><br />
                    <strong style={{ color: '#fff' }}>ΣF = ṁ·(V₂ - V₁)</strong><br />
                    <span style={{ color: '#94a3b8' }}>+ forces de pression</span><br /><br />
                    Le <strong style={{ color: '#fbbf24' }}>coup de bélier</strong> (arrêt brutal) : ΔP = ρ·c·V
                  </div>
                </div>
              )}
            </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="shell">
      <div className="topbar">
        <div className="window-controls">
          <div className="dot" style={{ background: '#ff5f56' }}></div>
          <div className="dot" style={{ background: '#ffbd2e' }}></div>
          <div className="dot" style={{ background: '#27c93f' }}></div>
        </div>
        <span className="topbar-title">
          meca_fluides.ref — MASTER REFERENCE
        </span>
        <div style={{ flex: 1 }}></div>
        <button className="home-link-btn" onClick={() => setView('home')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
          BACK TO HUB
        </button>
      </div>

      <div className="tab-row">
        {mecaFluidesData.map((section: SectionData) => (
          <button
            key={section.id}
            className={`tab ${activeTab === section.id ? 'active' : ''}`}
            onClick={() => setActiveTab(section.id)}
          >
            {section.tabLabel}
          </button>
        ))}
      </div>

      <div className="main-layout">
        <div className="content">
          <div className="section-header" key={`header-${activeTab}`}>
            <h2 className="section-title">{activeSection.tabLabel}</h2>
            <p className="section-summary">{activeSection.summary}</p>
          </div>

          <FluidSim3D chapterId={activeTab} physics={{ viscosity: 0.5, velocity: 0.5 }} />

          <div className="section active" key={activeTab}>
            {activeSection.lines.map((line: LineData, i: number) => (
              <Line key={i} data={line} />
            ))}
          </div>
        </div>

        <aside className="exam-sidebar">
          <div className="sidebar-scroll">
            <div className="sidebar-section">
              <div className="insights-list">
                {activeSection.insights.map((insight: ExamInsight, i: number) => (
                  <div key={i} className="insight-card">
                    <div className="insight-title">{insight.title}</div>
                    <div className="insight-content">{insight.content}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
