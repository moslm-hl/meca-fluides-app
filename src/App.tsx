import { useState } from 'react';
import { mecaFluidesData, type SectionData, type LineData, type LinePart, type ExamInsight } from './data/mecaFluides';
import FluidSim3D from './components/FluidSim3D';
import Home from './components/Home';
import FluidSandbox from './components/FluidSandbox';

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
  const [view, setView] = useState<'home' | 'chapters' | 'sandbox'>('home');
  const [activeTab, setActiveTab] = useState(mecaFluidesData[0].id);
  
  // Sandbox Physics State
  const [viscosity, setViscosity] = useState(0.2);
  const [velocity, setVelocity] = useState(1.0);
  const [guideSize, setGuideSize] = useState(0.6);
  const [density, setDensity] = useState(1.0);
  const [pressure, setPressure] = useState(0.5);
  const [geometry, setGeometry] = useState<'pipe' | 'venturi'>('pipe');
  const [neckSize, setNeckSize] = useState(0.5);

  // Expose setView to window for the Home component callback
  (window as any).onSandbox = () => setView('sandbox');

  const activeSection = mecaFluidesData.find(s => s.id === activeTab) || mecaFluidesData[0];

  // Correct Reynolds Formula: Re = (rho * V * D) / mu
  // Using guideSize as D
  const reynolds = Math.round((density * velocity * guideSize * 8000) / (viscosity + 0.1));

  if (view === 'home') {
    return <Home onStart={() => setView('chapters')} onSandbox={() => setView('sandbox')} />;
  }

  if (view === 'sandbox') {
    return (
      <div className="sandbox-view">
        <div className="shell sandbox-shell">
          <header className="sandbox-header">
            <div className="topbar-title">MDF.PHYSICS_LAB (EXPERIMENTAL)</div>
            <button className="close-btn" onClick={() => setView('home')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
              EXIT LABORATORY
            </button>
          </header>
          
          <div className="sandbox-container">
            <div className="simulation-area">
              <FluidSandbox 
                viscosity={viscosity} 
                velocity={velocity + pressure} 
                guideSize={guideSize} 
                geometry={geometry}
                neckSize={neckSize}
              />
            </div>
            
            <div className="sandbox-controls">
              <h3>EXPERIMENTAL PARAMETERS</h3>
              <p>Fine-tune the physical environment.</p>

              <div className="geometry-selector">
                <button 
                  className={geometry === 'pipe' ? 'active' : ''} 
                  onClick={() => setGeometry('pipe')}
                >STRAIGHT PIPE</button>
                <button 
                  className={geometry === 'venturi' ? 'active' : ''} 
                  onClick={() => setGeometry('venturi')}
                >VENTURI (COL)</button>
              </div>

              {geometry === 'venturi' && (
                <div className="control-item neck-control" style={{ marginBottom: '24px' }}>
                  <span style={{ color: '#6366f1', fontSize: '10px', fontWeight: 800, letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>COL INTENSITY (neck %)</span>
                  <input 
                    type="range" min="0.1" max="0.85" step="0.01" 
                    value={neckSize} onChange={(e) => setNeckSize(parseFloat(e.target.value))}
                    style={{ width: '100%', accentColor: '#6366f1' }}
                  />
                </div>
              )}
              
              <div className="reynolds-display">
                <span className="re-label">REYNOLDS (Re)</span>
                <span className="re-value">{reynolds}</span>
                <div className="re-gauge">
                  <div className="re-fill" style={{ width: `${Math.min(100, reynolds/100)}%`, background: reynolds > 2000 ? '#ef4444' : '#22c55e' }}></div>
                </div>
                <span className="re-status">{reynolds > 2000 ? 'TURBULENT FLOW' : 'LAMINAR FLOW'}</span>
              </div>

              <div className="control-group">
                <div className="control-item">
                  <span>GUIDE SIZE (D)</span>
                  <input 
                    type="range" min="0.2" max="0.9" step="0.01" 
                    value={guideSize} onChange={(e) => setGuideSize(parseFloat(e.target.value))}
                  />
                </div>

                <div className="control-item">
                  <span>INLET VELOCITY (V)</span>
                  <input 
                    type="range" min="0.1" max="2.0" step="0.1" 
                    value={velocity} onChange={(e) => setVelocity(parseFloat(e.target.value))}
                  />
                </div>

                <div className="control-item">
                  <span>VISCOSITY (μ)</span>
                  <input 
                    type="range" min="0.01" max="1.0" step="0.01" 
                    value={viscosity} onChange={(e) => setViscosity(parseFloat(e.target.value))}
                  />
                </div>

                <div className="control-item">
                  <span>DENSITY (ρ)</span>
                  <input 
                    type="range" min="0.1" max="2.0" step="0.1" 
                    value={density} onChange={(e) => setDensity(parseFloat(e.target.value))}
                  />
                </div>

                <div className="control-item">
                  <span>PRESSURE GRADIENT (ΔP)</span>
                  <input 
                    type="range" min="0" max="2.0" step="0.1" 
                    value={pressure} onChange={(e) => setPressure(parseFloat(e.target.value))}
                  />
                </div>
              </div>
            </div>
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
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
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
