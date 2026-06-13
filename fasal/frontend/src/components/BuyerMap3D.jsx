import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Line } from '@react-three/drei';
import * as THREE from 'three';

function calculateBearing(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const y = Math.sin(dLon) * Math.cos(lat2 * Math.PI / 180);
  const x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) -
    Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos(dLon);
  const brng = Math.atan2(y, x) * 180 / Math.PI;
  return (brng + 360) % 360;
}

function ScanRings() {
  const ring1 = useRef();
  const ring2 = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ring1.current) {
      ring1.current.scale.setScalar((t * 2) % 20);
      ring1.current.material.opacity = Math.max(0, 1 - ((t * 2) % 20) / 20);
    }
    if (ring2.current) {
      ring2.current.scale.setScalar(((t * 2) + 10) % 20);
      ring2.current.material.opacity = Math.max(0, 1 - (((t * 2) + 10) % 20) / 20);
    }
  });

  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
      <mesh ref={ring1}>
        <ringGeometry args={[0.95, 1, 64]} />
        <meshBasicMaterial color="#1D9E75" transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={ring2}>
        <ringGeometry args={[0.95, 1, 64]} />
        <meshBasicMaterial color="#1D9E75" transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function Pillar({ position, color, buyer }) {
  const height = 4;
  
  return (
    <group position={position}>
      {/* Laser Pillar */}
      <mesh position={[0, height / 2, 0]}>
        <cylinderGeometry args={[0.05, 0.05, height, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.6} blending={THREE.AdditiveBlending} />
      </mesh>
      
      {/* Core Beam */}
      <mesh position={[0, height / 2, 0]}>
        <cylinderGeometry args={[0.01, 0.01, height, 8]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* Base ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
        <ringGeometry args={[0.2, 0.3, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.8} side={THREE.DoubleSide} />
      </mesh>

      {/* Floating HTML Label */}
      <Html position={[0, height + 0.5, 0]} center zIndexRange={[100, 0]} transform>
        <div className="bg-[#0D1517]/80 backdrop-blur-md border border-[#1D9E75]/30 px-2 py-1 rounded flex flex-col items-center pointer-events-none w-32"
          style={{ transform: 'scale(0.5)' }}>
          <span className="text-white text-[8px] font-black uppercase text-center leading-tight truncate w-full">{buyer.name}</span>
          <span className="text-[7px] font-bold mt-0.5" style={{ color: color }}>
            {buyer.type} • {buyer.distance_km}KM
          </span>
        </div>
      </Html>
    </group>
  );
}

export default function BuyerMap3D({ buyers, profileLat, profileLon }) {
  // Convert buyer real-world coordinates to 3D grid coordinates
  const mappedBuyers = useMemo(() => {
    if (!buyers || !profileLat || !profileLon) return [];
    
    return buyers.map(b => {
      const bearing = calculateBearing(profileLat, profileLon, b.lat, b.lon);
      // Math.PI / 2 offset to align North to -Z
      const angle = (bearing - 90) * (Math.PI / 180);
      
      // Map max distance (~200km) to max map radius (~15 units)
      const maxDistKm = 200;
      const maxMapRadius = 15;
      const distanceRatio = Math.min(b.distance_km / maxDistKm, 1);
      const radius = distanceRatio * maxMapRadius;
      
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      
      let color = '#1D9E75';
      if (b.type === 'HOTEL') color = '#FFD700';
      if (b.type === 'FPO') color = '#3B82F6';

      return { ...b, pos: [x, 0, z], color };
    });
  }, [buyers, profileLat, profileLon]);

  return (
    <div className="w-full h-full relative bg-[#050809] overflow-hidden">
      <Canvas camera={{ position: [0, 8, 12], fov: 60 }}>
        <fog attach="fog" args={['#050809', 10, 35]} />
        
        {/* Base Grid */}
        <gridHelper args={[40, 40, '#1D9E75', '#0D1517']} position={[0, 0, 0]} />
        <gridHelper args={[40, 8, '#1D9E75', '#1D9E75']} position={[0, 0.01, 0]} material-transparent material-opacity={0.2} />

        {/* Center Point (YOU) */}
        <group position={[0, 0, 0]}>
          <mesh position={[0, 0.5, 0]}>
             <cylinderGeometry args={[0.2, 0.2, 1, 16]} />
             <meshBasicMaterial color="#ffffff" />
          </mesh>
          <Html position={[0, 1.5, 0]} center transform>
            <div className="bg-[#1D9E75] text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-[0_0_10px_rgba(29,158,117,0.8)]">
              YOU
            </div>
          </Html>
        </group>

        <ScanRings />

        {/* Connections from center to buyers */}
        {mappedBuyers.map((b, i) => (
          <Line key={`line-${i}`}
            points={[[0, 0.1, 0], [b.pos[0], 0.1, b.pos[2]]]}
            color={b.color}
            opacity={0.3}
            transparent
            dashed
            dashScale={5}
            dashSize={0.5}
            dashOffset={0}
          />
        ))}

        {/* Buyer Pillars */}
        {mappedBuyers.map((b, i) => (
          <Pillar key={i} position={b.pos} color={b.color} buyer={b} />
        ))}

        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          maxPolarAngle={Math.PI / 2 - 0.05}
          minDistance={2}
          maxDistance={30}
          autoRotate={true}
          autoRotateSpeed={0.5}
        />
      </Canvas>
      
      {/* Overlay UI */}
      <div className="absolute top-4 left-4 pointer-events-none">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#1D9E75] animate-pulse" />
          <p className="text-[10px] font-black text-[#1D9E75] uppercase tracking-widest">3D Geo-Spatial Link</p>
        </div>
      </div>
    </div>
  );
}
