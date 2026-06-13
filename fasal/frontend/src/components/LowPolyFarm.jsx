import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, Stars } from '@react-three/drei';
import * as THREE from 'three';

function CloudLayer({ count = 5 }) {
  const clouds = useMemo(() => {
    return Array.from({ length: count }).map(() => ({
      position: [
        (Math.random() - 0.5) * 8,
        Math.random() * 2 + 3,
        (Math.random() - 0.5) * 8
      ],
      scale: Math.random() * 0.4 + 0.4,
      speed: Math.random() * 0.02 + 0.01,
    }));
  }, [count]);

  const group = useRef();
  
  useFrame(() => {
    if (group.current) {
      group.current.rotation.y -= 0.002;
    }
  });

  return (
    <group ref={group}>
      {clouds.map((c, i) => (
        <Float key={i} speed={c.speed * 50} rotationIntensity={0.1} floatIntensity={0.2}>
          <mesh position={c.position} scale={c.scale} castShadow receiveShadow>
            <dodecahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color="#ffffff" flatShading roughness={1} />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

function FloatingFarm({ soilMoisture = 50, cropProgress = 0.5 }) {
  const islandRef = useRef();

  useFrame(() => {
    islandRef.current.rotation.y += 0.002; // Slow rotation
  });

  const soilColor = useMemo(() => {
    const dry = new THREE.Color("#d2b48c"); // Tan/dry
    const wet = new THREE.Color("#3e2723"); // Dark brown
    const moistureRatio = Math.max(0, Math.min(1, (soilMoisture - 20) / 40));
    return dry.lerp(wet, moistureRatio).getHexString();
  }, [soilMoisture]);

  // Generate crops in rows
  const crops = useMemo(() => {
    const arr = [];
    const rows = 4;
    const cols = 5;
    const spacingX = 0.7;
    const spacingZ = 0.7;
    const startX = -((cols - 1) * spacingX) / 2;
    const startZ = -((rows - 1) * spacingZ) / 2;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Leave the top right corner empty for the barn
        if (r < 2 && c > 2) continue; 
        
        const x = startX + c * spacingX + (Math.random() * 0.1 - 0.05);
        const z = startZ + r * spacingZ + (Math.random() * 0.1 - 0.05);
        
        const maxScale = Math.random() * 0.4 + 0.6;
        const greens = ["#1D9E75", "#22C55E", "#15803D", "#16A34A"];
        const color = greens[Math.floor(Math.random() * greens.length)];

        arr.push({ pos: [x, 0.55, z], maxScale, color });
      }
    }
    return arr;
  }, []);

  // Calculate current scale based on progress
  const currentCrops = useMemo(() => {
    return crops.map(t => ({
      ...t,
      // Even at 0 progress, show tiny seeds/sprouts
      scale: Math.max(0.05, cropProgress * t.maxScale * 1.5)
    }));
  }, [crops, cropProgress]);

  return (
    <group ref={islandRef}>
      {/* Dirt Base (Island) */}
      <mesh position={[0, 0, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[2.5, 2.2, 1, 6]} />
        <meshStandardMaterial color="#5c4033" roughness={1} flatShading />
      </mesh>
      
      {/* Top Soil Layer */}
      <mesh position={[0, 0.51, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[2.45, 2.5, 0.1, 6]} />
        <meshStandardMaterial color={`#${soilColor}`} roughness={1} flatShading />
      </mesh>

      {/* Tiny Barn in the corner */}
      <group position={[1.0, 0.56, -0.8]} rotation={[0, -Math.PI / 6, 0]} castShadow>
        <mesh position={[0, 0.25, 0]} castShadow>
          <boxGeometry args={[0.7, 0.5, 0.6]} />
          <meshStandardMaterial color="#ecf0f1" flatShading />
        </mesh>
        <mesh position={[0, 0.6, 0]} castShadow rotation={[0, Math.PI / 4, 0]}>
          <cylinderGeometry args={[0, 0.6, 0.4, 4]} />
          <meshStandardMaterial color="#e74c3c" flatShading />
        </mesh>
      </group>
      
      {/* Crops */}
      {currentCrops.map((c, i) => (
        <group key={i} position={c.pos} scale={c.scale}>
          <mesh position={[0, 0.15, 0]} castShadow>
            <cylinderGeometry args={[0.02, 0.02, 0.3, 4]} />
            <meshStandardMaterial color="#4ade80" flatShading />
          </mesh>
          <mesh position={[0, 0.3, 0]} castShadow>
             <dodecahedronGeometry args={[0.15, 0]} />
             <meshStandardMaterial color={c.color} flatShading />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export default function LowPolyFarm({ soilMoisture = 50, cropProgress = 0.5, isRaining = false }) {
  return (
    <div className="w-full h-[350px] rounded-2xl overflow-hidden relative bg-gradient-to-b from-[#1a2a3a] to-[#0f172a] border border-white/5 shadow-xl">
      <Canvas shadows camera={{ position: [0, 4, 7], fov: 45 }}>
        <ambientLight intensity={0.4} color="#FFE4B5" />
        <directionalLight 
          position={[5, 10, 5]} 
          intensity={1.5} 
          castShadow 
          color="#FFFAFA"
          shadow-mapSize-width={1024} 
          shadow-mapSize-height={1024} 
        />
        <pointLight position={[-5, -5, -5]} intensity={0.5} color="#87CEEB" />

        <Float speed={2} rotationIntensity={0.05} floatIntensity={0.1}>
          <FloatingFarm soilMoisture={soilMoisture} cropProgress={cropProgress} />
        </Float>
        
        <CloudLayer count={4} />
        
        {isRaining && (
           <Stars radius={5} depth={10} count={500} factor={4} saturation={0} fade speed={2} />
        )}

        <OrbitControls 
          enablePan={false} 
          enableZoom={true} 
          minDistance={3} 
          maxDistance={10}
          autoRotate={false}
          maxPolarAngle={Math.PI / 2 - 0.1} // Prevent going below the island
        />
      </Canvas>
      
      <div className="absolute top-4 left-4 pointer-events-none">
        <div className="bg-black/30 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10">
          <p className="text-[10px] font-black text-white/70 uppercase tracking-wider">Digital Twin</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2 h-2 rounded-full bg-green-primary animate-pulse shadow-[0_0_8px_rgba(29,158,117,0.8)]" />
            <p className="text-xs font-bold text-white">Live Fasal Sync</p>
          </div>
          <p className="text-[9px] text-white/50 mt-1">Drag to rotate • Scroll to zoom</p>
        </div>
      </div>
    </div>
  );
}
