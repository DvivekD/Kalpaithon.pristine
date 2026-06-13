import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Edges, Html, Environment } from '@react-three/drei';
import * as THREE from 'three';

// --- Brighter Theme Colors for Visibility ---
const colors = {
  shell: '#2c323a',      // Sleek grey/blue shell
  pcb: '#166534',        // Classic green PCB
  chip: '#3f3f46',       // Grey ESP32
  oled: '#18181b',       // Dark screen
  oledText: '#4ade80',   // OLED text/glow
  dht22: '#f8fafc',      // White DHT22
  buzzer: '#2563eb',     // Blue buzzer
  soilSensor: '#52525b', // Grey blade
  gold: '#fbbf24',       // Gold traces
  edge: '#4ade80'        // Green edges
};

const NodeLayer = ({ position, children, label, desc, isExploded, explodeMultiplier = 1 }) => {
  const ref = useRef();
  
  // Smoothly interpolate position based on exploded state
  useFrame((state, delta) => {
    ref.current.position.y = THREE.MathUtils.lerp(
      ref.current.position.y,
      isExploded ? position[1] * explodeMultiplier : 0, 
      0.08 // speed
    );
  });

  return (
    <group ref={ref} position={[0, 0, 0]}>
      {children}
      {isExploded && label && (
        <Html position={[0, 0, 0]} className="pointer-events-none transition-opacity duration-300 z-50">
          <div className="flex items-center -translate-y-1/2 -translate-x-full pr-[100px] lg:pr-[160px] relative">
            {/* Connecting line reaching back to the center [0,0,0] */}
            <div className="w-[100px] lg:w-[160px] absolute right-0 top-1/2 h-[1px] bg-green-primary/40">
              <div className="absolute right-0 -top-[3px] w-1.5 h-1.5 rounded-full bg-green-primary shadow-[0_0_8px_rgba(44,154,109,0.8)]"></div>
            </div>
            {/* The Label Box */}
            <div className="bg-[#0f1115]/95 backdrop-blur-md border border-white/10 px-4 py-2.5 rounded-xl shadow-2xl whitespace-nowrap pointer-events-auto">
              <strong className="text-white text-sm font-bold tracking-wide">{label}</strong><br />
              <span className="text-text-secondary text-xs">{desc}</span>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
};

// Reusable Block
const Block = ({ size, position, rotation, color, roughness = 0.8, edgeColor = colors.edge }) => (
  <mesh position={position} rotation={rotation} castShadow receiveShadow>
    <boxGeometry args={size} />
    <meshStandardMaterial color={color} roughness={roughness} />
    <Edges scale={1} threshold={15} color={edgeColor} transparent opacity={0.3} />
  </mesh>
);

const CylinderBlock = ({ args, position, rotation, color, roughness = 0.8, edgeColor = colors.edge }) => (
  <mesh position={position} rotation={rotation} castShadow receiveShadow>
    <cylinderGeometry args={args} />
    <meshStandardMaterial color={color} roughness={roughness} />
    <Edges scale={1} threshold={15} color={edgeColor} transparent opacity={0.3} />
  </mesh>
);

export default function ExplodedIotNode() {
  const [explode, setExplode] = useState(7.5); // 0 to 15 matching reference slider

  const val = explode / 15; // Normalized 0 to 1
  const isExploded = val > 0.05;

  return (
    <div className="w-full h-full relative bg-transparent rounded-2xl overflow-hidden border border-white/5">
      
      {/* UI Overlay (Dark Theme) */}
      <div className="absolute top-4 left-4 z-10 bg-[#0f1115]/80 backdrop-blur-md p-5 rounded-xl border border-white/5 shadow-2xl w-72 pointer-events-auto">
        <h2 className="text-lg font-black text-white mb-2 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-primary animate-pulse"></div>
          Fasal Drop-Node
        </h2>
        <p className="text-xs text-text-secondary mb-5 leading-relaxed">Interactive schematic of the spherical, deployable IoT architecture.</p>
        
        <div className="flex flex-col gap-2 mb-4">
          <label className="flex justify-between text-xs font-bold text-text-secondary uppercase tracking-wider">
            <span>Explosion Spacing</span>
            <span className="text-white">{Math.round(val * 100)}%</span>
          </label>
          <input 
            type="range" 
            min="0" max="15" step="0.1" 
            value={explode} 
            onChange={(e) => setExplode(parseFloat(e.target.value))}
            className="w-full cursor-pointer accent-green-primary"
          />
        </div>

        <div className="flex flex-col gap-2 mt-6">
          <div className="flex items-center gap-2 text-[10px] text-text-secondary font-semibold uppercase tracking-wider"><div className="w-3 h-3 rounded-sm" style={{backgroundColor: colors.shell}}></div> Spherical Shell</div>
          <div className="flex items-center gap-2 text-[10px] text-text-secondary font-semibold uppercase tracking-wider"><div className="w-3 h-3 rounded-sm" style={{backgroundColor: colors.oled}}></div> OLED Display</div>
          <div className="flex items-center gap-2 text-[10px] text-text-secondary font-semibold uppercase tracking-wider"><div className="w-3 h-3 rounded-sm" style={{backgroundColor: colors.pcb}}></div> ESP32 / Logic Board</div>
          <div className="flex items-center gap-2 text-[10px] text-text-secondary font-semibold uppercase tracking-wider"><div className="w-3 h-3 rounded-sm" style={{backgroundColor: colors.dht22}}></div> DHT22 Environment</div>
          <div className="flex items-center gap-2 text-[10px] text-text-secondary font-semibold uppercase tracking-wider"><div className="w-3 h-3 rounded-sm" style={{backgroundColor: colors.soilSensor}}></div> Capacitive Soil Probe</div>
        </div>
      </div>

      <Canvas shadows camera={{ position: [25, 15, 25], fov: 35 }}>
        <Environment preset="city" />
        <ambientLight intensity={1.5} />
        <directionalLight 
          position={[10, 20, 10]} 
          intensity={2.0} 
          castShadow 
          shadow-mapSize={[2048, 2048]}
        />
        <hemisphereLight intensity={1.0} color="#ffffff" groundColor="#0f172a" />

        <OrbitControls 
          enableDamping 
          dampingFactor={0.05} 
          target={[8, 0, 0]} 
          autoRotate 
          autoRotateSpeed={0.5} 
        />

        {/* Shift the entire node to the right side of the canvas */}
        <group position={[8, 0, 0]}>
          
          {/* Layer 1: Top Hemisphere Shell */}
          <NodeLayer position={[0, 16, 0]} isExploded={isExploded} explodeMultiplier={val} label="Protective Shell (Top)" desc="UV-resistant drop-in casing">
            <mesh position={[0, 0, 0]} castShadow receiveShadow>
              <sphereGeometry args={[3.2, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshStandardMaterial color={colors.shell} roughness={0.5} metalness={0.2} side={THREE.DoubleSide} />
              <Edges scale={1} threshold={15} color={colors.edge} transparent opacity={0.3} />
            </mesh>
          </NodeLayer>

          {/* Layer 2: OLED Display */}
          <NodeLayer position={[0, 10, 0]} isExploded={isExploded} explodeMultiplier={val} label="OLED Display" desc="128x64 I2C Status Screen">
            <Block size={[1.8, 0.1, 1.2]} position={[0, 1.5, 0]} color={colors.oled} />
            <mesh position={[0, 1.56, 0]} rotation={[-Math.PI/2, 0, 0]}>
              <planeGeometry args={[1.5, 0.9]} />
              <meshBasicMaterial color={colors.oledText} transparent opacity={0.8} />
            </mesh>
          </NodeLayer>

          {/* Layer 3: ESP32 & Logic Board */}
          <NodeLayer position={[0, 4, 0]} isExploded={isExploded} explodeMultiplier={val} label="ESP32 Core & Buzzer" desc="WiFi/BLE MCU with alert system">
            <Block size={[2.8, 0.1, 3.8]} position={[0, 0, 0]} color={colors.pcb} />
            <Block size={[1, 0.3, 1.5]} position={[-0.5, 0.2, 0.5]} color={colors.chip} edgeColor="#777" />
            <Block size={[0.8, 0.31, 0.2]} position={[-0.5, 0.2, 1.5]} color={colors.gold} />
            <CylinderBlock args={[0.4, 0.4, 0.5, 16]} position={[0.6, 0.3, -0.8]} color={colors.buzzer} edgeColor="#888" />
          </NodeLayer>

          {/* Layer 4: DHT22 Sensor */}
          <NodeLayer position={[0, -2, 0]} isExploded={isExploded} explodeMultiplier={val} label="DHT22 Sensor" desc="Ambient Temp & Humidity">
            <Block size={[1.2, 0.6, 1.8]} position={[1.8, 0, 0]} color={colors.dht22} edgeColor="#888" />
            <Block size={[0.1, 0.61, 1.2]} position={[2.3, 0, 0]} color="#ccc" />
          </NodeLayer>

          {/* Layer 5: Capacitive Soil Sensor */}
          <NodeLayer position={[0, -8, 0]} isExploded={isExploded} explodeMultiplier={val} label="Capacitive Soil Probe" desc="Corrosion-resistant analog depth probe">
            <Block size={[1.2, 1.5, 0.2]} position={[0, -0.5, 0]} color={colors.pcb} />
            <Block size={[0.8, 4, 0.1]} position={[0, -3.2, 0]} color={colors.soilSensor} />
            <Block size={[0.6, 3.8, 0.11]} position={[0, -3.2, 0]} color={colors.gold} />
          </NodeLayer>

          {/* Layer 6: Bottom Hemisphere Shell */}
          <NodeLayer position={[0, -14, 0]} isExploded={isExploded} explodeMultiplier={val} label="Protective Shell (Base)" desc="Weighted drop-base">
            <mesh position={[0, 0, 0]} castShadow receiveShadow>
              <sphereGeometry args={[3.2, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
              <meshStandardMaterial color={colors.shell} roughness={0.5} metalness={0.2} side={THREE.DoubleSide} />
              <Edges scale={1} threshold={15} color={colors.edge} transparent opacity={0.3} />
            </mesh>
          </NodeLayer>

        </group>
      </Canvas>
    </div>
  );
}
