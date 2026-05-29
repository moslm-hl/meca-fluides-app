# Fluid Network Simulation - Enhanced Features

## New Capabilities Added

### 1. **Add Nodes** ✅
- **Mode**: Click the **➕ ADD NODE** button
- **Action**: Click anywhere on the canvas to place junction nodes
- **Tip**: Junction nodes automatically connect to the network when you link them

### 2. **Control Tube Length** ✅
**Virtual Length Control** (Independent from visual distance):
- **Select a tube** by clicking on it (turns yellow)
- **Shift + Scroll Up/Down** to increase/decrease tube length
- **Display**: Length shows in the stats panel and on the tube label
- **Effect**: Longer tubes increase resistance and affect flow calculations

### 3. **Create Curves (Coudes/Elbows)** ✅
**Create Bends**:
1. Click on a tube/edge to select it
2. Right-click to cycle through types → Select **ELBOW** or **CURVE**
   - **ELBOW**: 90-degree sharp bend (orange label)
   - **CURVE**: Smooth bezier curve (purple label)
3. A yellow control point appears at the bend center
4. **Drag the control point** to adjust the curve shape
5. Particles follow the curved path smoothly

### 4. **Create Necks (Constrictions)** ✅
**Add Narrowed Sections**:
1. Select a tube/edge by clicking on it
2. Right-click repeatedly to cycle → Select **NECK**
3. The tube shows red "NECK" label with constriction visualization
4. **Shift + Scroll** to adjust constriction ratio (0.1 - 0.9)
   - 0.5 = 50% diameter reduction at center
   - Lower values = tighter constriction
5. Affects flow resistance and particle velocity

## Edge Types & Their Effects

| Type | Icon/Label | Effect | Physics |
|------|-----------|--------|---------|
| **PIPE** | Gray | Normal straight pipe | Full diameter, standard resistance |
| **VENTURI** | Blue | Constriction + expansion | 0.3× conductivity, velocity spike |
| **ELBOW** | Orange | 90° bend | Curved path, user-adjustable |
| **CURVE** | Purple | Smooth bend | Bezier curve, user-adjustable |
| **NECK** | Red | Narrowed section | 0.4× conductivity, visual constriction |

## Mouse Controls

### Selection & Interaction
| Action | Result |
|--------|--------|
| **Click tube** | Select (turns yellow) |
| **Right-click tube** | Cycle edge type (Pipe→Venturi→Elbow→Curve→Neck) |
| **Drag tube** | Move in MOVE mode |
| **Scroll on tube** | Adjust diameter (default) |
| **Shift + Scroll on tube** | Adjust tube length |
| **Scroll on NECK tube** | Adjust constriction ratio |
| **Drag control point (yellow circle)** | Adjust curve shape for Elbow/Curve types |

### Node Controls
| Action | Result |
|--------|--------|
| **Click node** | Select (cyan glow) |
| **Drag node** | Move node in MOVE mode |
| **Scroll on node** | Rotate junction or resize inlet/outlet |
| **Right-click junction** | Delete it |
| **Right-click inlet/outlet** | Reset rotation |

## Physics Features

- **Custom Length**: Affects resistance calculation (R ∝ L/D⁴)
- **Neck Constriction**: Multiplier applied to conductivity based on restriction
- **Curved Pipes**: Particles follow bezier paths with smooth trajectories
- **Real-time Pressure**: Calculated iteratively based on tube dimensions
- **Flow Visualization**: Arrows and particles show direction and speed

## Example Workflows

### Create a Complex Network
1. **ADD NODE mode** → Click to place 3 junction nodes in a triangle
2. **DRAW LINK mode** → Connect them to inlet and outlet
3. **Adjust tubes**: 
   - Select tube → Right-click → Choose CURVE
   - Drag the yellow control point to create interesting paths
   - Shift+Scroll to make some tubes longer
4. **Add constrictions**: 
   - Right-click some tubes to set as NECK
   - Shift+Scroll to adjust tightness
5. **Observe flow** in real-time with particles flowing through the network

### Quick Tube Modifications
- **Make a tube bendy**: Select → Right-click → ELBOW/CURVE → Drag control point
- **Add resistance**: Select → Shift+Scroll to increase length
- **Create venturi effect**: Right-click to cycle to VENTURI
- **Add narrowing**: Select → Right-click 4 times to NECK → Adjust with Shift+Scroll

## Tips & Tricks

✨ **Pro Tips**:
- Longer tubes = more resistance = lower flow rate
- Narrower tubes (lower diameter) = much higher resistance (D⁴ effect!)
- Necks are good for flow control, Venturis create pressure drops
- Use curves to create realistic plumbing layouts
- Control points appear only when a curve/elbow is selected
- Particle trails help visualize flow behavior
