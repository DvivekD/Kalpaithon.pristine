import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Edges, Html } from '@react-three/drei';
import * as THREE from 'three';

// --- Colors & Materials from Reference ---
const colors = {
  foundation: '#a9a9a9', // Mounting Pole
  structure: '#cfd6dc',  // Enclosure
  slab: '#b5b5b5',       // Inner Mounts
  wall: '#cc705b',       // Sensors / Accents
  lintel: '#2c3e50',     // PCB / Battery
  roof: '#e0e0e0',       // Solar Panel frame
  solarGlass: '#1a2a3a', // Solar Glass
  edge: '#333333'
};

const NodeLayer = ({ position, children, label, desc, isExploded }) => {
  const ref = useRef();
  
  // Smoothly interpolate position based on exploded state
  useFrame((state, delta) => {
    ref.current.position.y = THREE.MathUtils.lerp(
      ref.current.position.y,
      isExploded ? position[1] : 0, // When not exploded, everything collapses to y=0 (relative to their local offsets)
      0.1 // speed
    );
  });

  return (
    <group ref={ref} position={[0, 0, 0]}>
      {children}
      {isExploded && label && (
        <Html position={[2, 0, 0]} center className="pointer-events-none transition-opacity duration-300">
          <div className="flex items-center -translate-y-1/2">
            <div className="w-12 h-[1.5px] bg-slate-700 mr-3 relative">
              <div className="absolute left-0 -top-[3px] w-2 h-2 rounded-full bg-slate-700"></div>
            </div>
            <div className="bg-white/95 backdrop-blur-md border border-slate-300 px-3 py-2 rounded-lg shadow-lg whitespace-nowrap pointer-events-auto">
              <strong className="text-slate-800 text-sm">{label}</strong><br />
              <span className="text-slate-500 text-xs">{desc}</span>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
};

// Reusable Block with Edges matching reference aesthetic
const Block = ({ size, position, rotation, color, roughness = 0.8 }) => (
  <mesh position={position} rotation={rotation} castShadow receiveShadow>
    <boxGeometry args={size} />
    <meshStandardMaterial color={color} roughness={roughness} />
    <Edges scale={1} threshold={15} color={colors.edge} transparent opacity={0.4} />
  </mesh>
);

const CylinderBlock = ({ args, position, rotation, color, roughness = 0.8 }) => (
  <mesh position={position} rotation={rotation} castShadow receiveShadow>
    <cylinderGeometry args={args} />
    <meshStandardMaterial color={color} roughness={roughness} />
    <Edges scale={1} threshold={15} color={colors.edge} transparent opacity={0.4} />
  </mesh>
);

export default function ExplodedIotNode() {
  const [explode, setExplode] = useState(7.5); // 0 to 15 matching reference slider

  const val = explode / 15; // Normalized 0 to 1

  return (
    <div className="w-full h-full relative bg-[#f4f6f8] rounded-xl overflow-hidden border border-white/5">
      {/* UI Overlay */}
      <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur-md p-5 rounded-xl border border-black/5 shadow-[0_8px_32px_rgba(0,0,0,0.1)] w-72 pointer-events-auto">
        <h2 className="text-lg font-bold text-slate-800 mb-2 leading-tight">Hardware Node</h2>
        <p className="text-xs text-slate-500 mb-4 leading-relaxed">Interactive 3D exploded view of the Fasal edge sensor architecture.</p>
        
        <div className="flex flex-col gap-2 mb-4">
          <label className="flex justify-between text-xs font-bold text-slate-700">
            <span>Explosion Spacing</span>
            <span>{Math.round(val * 100)}%</span>
          </label>
          <input 
            type="range" 
            min="0" max="15" step="0.1" 
            value={explode} 
            onChange={(e) => setExplode(parseFloat(e.target.value))}
            className="w-full cursor-pointer accent-slate-700"
          />
        </div>

        <div className="flex flex-col gap-2 mt-4">
          <div className="flex items-center gap-2 text-[10px] text-slate-700 font-semibold uppercase tracking-wider"><div className="w-3 h-3 rounded-sm" style={{backgroundColor: colors.foundation}}></div> Mounting Pole</div>
          <div className="flex items-center gap-2 text-[10px] text-slate-700 font-semibold uppercase tracking-wider"><div className="w-3 h-3 rounded-sm" style={{backgroundColor: colors.structure}}></div> Main Enclosure</div>
          <div className="flex items-center gap-2 text-[10px] text-slate-700 font-semibold uppercase tracking-wider"><div className="w-3 h-3 rounded-sm" style={{backgroundColor: colors.lintel}}></div> Internal PCB / Battery</div>
          <div className="flex items-center gap-2 text-[10px] text-slate-700 font-semibold uppercase tracking-wider"><div className="w-3 h-3 rounded-sm" style={{backgroundColor: colors.wall}}></div> Environmental Sensors</div>
          <div className="flex items-center gap-2 text-[10px] text-slate-700 font-semibold uppercase tracking-wider"><div className="w-3 h-3 rounded-sm" style={{backgroundColor: colors.solarGlass}}></div> Solar Array</div>
        </div>
      </div>

      <Canvas shadows camera={{ position: [25, 20, 25], fov: 45 }}>
        <color attach="background" args={['#f4f6f8']} />
        
        <ambientLight intensity={0.5} />
        <directionalLight 
          position={[20, 40, 20]} 
          intensity={0.7} 
          castShadow 
          shadow-mapSize={[2048, 2048]}
        />
        <hemisphereLight intensity={0.4} color="#ffffff" groundColor="#444444" />

        <OrbitControls 
          enableDamping 
          dampingFactor={0.05} 
          target={[0, 4, 0]} 
          autoRotate 
          autoRotateSpeed={0.5} 
        />

        <group position={[0, -4, 0]}>
          {/* Layer 1: Mounting Pole */}
          <NodeLayer position={[0, 0, 0]} isExploded={val > 0.1} label="Mounting Base" desc="Galvanized steel pipe mount">
            <CylinderBlock args={[0.5, 0.5, 6, 16]} position={[0, 3, 0]} color={colors.foundation} />
            <Block size={[2, 0.4, 2]} position={[0, 0.2, 0]} color={colors.foundation} />
          </NodeLayer>

          {/* Layer 2: Main Enclosure */}
          <NodeLayer position={[0, val * 3, 0]} isExploded={val > 0.1} label="IP67 Enclosure" desc="Weatherproof polycarbonate housing">
            <Block size={[4, 5, 3]} position={[0, 6.5, 0]} color={colors.structure} />
            {/* Front Door Panel */}
            <Block size={[3.8, 4.8, 0.2]} position={[0, 6.5, 1.55]} color={colors.slab} />
          </NodeLayer>

          {/* Layer 3: Internal PCB */}
          <NodeLayer position={[0, val * 6, 0]} isExploded={val > 0.1} label="Logic & Power" desc="Main PCB, ESP32, and Li-ion Battery">
            {/* PCB Board */}
            <Block size={[2.8, 3.8, 0.1]} position={[0, 6.5, 1.2]} color={colors.lintel} />
            {/* MCU Chip */}
            <Block size={[0.6, 0.6, 0.1]} position={[0, 7.5, 1.3]} color={colors.edge} />
            {/* Connectors */}
            <Block size={[2.0, 0.4, 0.3]} position={[0, 5.0, 1.3]} color={colors.solarGlass} />
            {/* Battery */}
            <CylinderBlock args={[0.4, 0.4, 2.5, 16]} position={[0.8, 6.0, 1.3]} color={colors.roof} />
          </NodeLayer>

          {/* Layer 4: Sensors */}
          <NodeLayer position={[0, val * 9, 0]} isExploded={val > 0.1} label="Sensor Probes" desc="Soil Moisture & DHT22">
            {/* DHT22 side mount */}
            <Block size={[1, 1.5, 1]} position={[2.2, 5.5, 0]} color={colors.wall} />
            <CylinderBlock args={[0.1, 0.1, 2, 8]} position={[2.2, 4.2, 0]} color={colors.wall} />
            
            {/* Soil Probe Wire */}
            <CylinderBlock args={[0.05, 0.05, 8, 8]} position={[-1.5, 2.0, 0]} color={colors.wall} />
            {/* Soil Probe Tip */}
            <CylinderBlock args={[0.15, 0.05, 1.5, 8]} position={[-1.5, -2.0, 0]} color={colors.wall} />
          </NodeLayer>

          {/* Layer 5: Solar Panel */}
          <NodeLayer position={[0, val * 12, 0]} isExploded={val > 0.1} label="Solar Array" desc="6V 5W Monocrystalline Panel">
            {/* Angled Mount */}
            <Block size={[0.6, 1.5, 0.6]} position={[0, 9.5, -0.5]} rotation={[0.5, 0, 0]} color={colors.foundation} />
            {/* Panel Frame */}
            <Block size={[5, 0.2, 4]} position={[0, 10.3, -1]} rotation={[0.5, 0, 0]} color={colors.roof} />
            {/* Panel Glass */}
            <Block size={[4.6, 0.1, 3.6]} position={[0, 10.4, -1]} rotation={[0.5, 0, 0]} color={colors.solarGlass} />
          </NodeLayer>
        </group>
      </Canvas>
    </div>
  );
}
