import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, Stars } from '@react-three/drei';
import * as THREE from 'three';

function Tree({ position, rotation, scale = 1, color = "#2d4c1e" }) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.1, 1, 5]} />
        <meshStandardMaterial color="#5c4033" roughness={0.9} flatShading />
      </mesh>
      <mesh position={[0, 1.2, 0]} castShadow>
        <coneGeometry args={[0.5, 1.5, 5]} />
        <meshStandardMaterial color={color} roughness={0.8} flatShading />
      </mesh>
    </group>
  );
}

function CloudLayer({ count = 6 }) {
  const clouds = useMemo(() => {
    return Array.from({ length: count }).map(() => ({
      position: [
        (Math.random() - 0.5) * 12,
        Math.random() * 2 + 4,
        (Math.random() - 0.5) * 12
      ],
      scale: Math.random() * 0.5 + 0.5,
      speed: Math.random() * 0.02 + 0.01,
    }));
  }, [count]);

  const group = useRef();
  
  useFrame(() => {
    if (group.current) {
      group.current.rotation.y -= 0.001;
    }
  });

  return (
    <group ref={group}>
      {clouds.map((c, i) => (
        <Float key={i} speed={c.speed * 50} rotationIntensity={0.2} floatIntensity={0.5}>
          <mesh position={c.position} scale={c.scale} castShadow receiveShadow>
            <dodecahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color="#ffffff" flatShading roughness={1} />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

function Airplane() {
  const group = useRef();
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * 0.8;
    group.current.position.x = Math.sin(t) * 5;
    group.current.position.z = Math.cos(t) * 5;
    group.current.position.y = 3.5 + Math.sin(t * 3) * 0.3;
    group.current.rotation.y = t + Math.PI;
    group.current.rotation.z = Math.sin(t * 3) * 0.2;
  });

  return (
    <group ref={group}>
      <mesh castShadow>
        <boxGeometry args={[0.8, 0.3, 0.3]} />
        <meshStandardMaterial color="#e74c3c" flatShading />
      </mesh>
      <mesh position={[0, 0.1, 0]} castShadow>
        <boxGeometry args={[0.3, 0.05, 1.2]} />
        <meshStandardMaterial color="#ecf0f1" flatShading />
      </mesh>
      <mesh position={[-0.3, 0.2, 0]} castShadow>
        <boxGeometry args={[0.15, 0.3, 0.05]} />
        <meshStandardMaterial color="#e74c3c" flatShading />
      </mesh>
    </group>
  );
}

function Planet({ soilMoisture = 50, cropProgress = 0.5 }) {
  const planetRef = useRef();

  useFrame(() => {
    planetRef.current.rotation.y += 0.001;
    planetRef.current.rotation.z += 0.0002;
  });

  const soilColor = useMemo(() => {
    const dry = new THREE.Color("#d2b48c"); // Tan/dry
    const wet = new THREE.Color("#3e2723"); // Dark brown
    // 0 is dry, 100 is wet. Let's say < 30 is fully dry, > 60 is fully wet.
    const moistureRatio = Math.max(0, Math.min(1, (soilMoisture - 20) / 40));
    return dry.lerp(wet, moistureRatio).getHexString();
  }, [soilMoisture]);

  // Generate static tree positions once
  const baseTrees = useMemo(() => {
    const arr = [];
    const radius = 2.5;
    for (let i = 0; i < 35; i++) {
      const phi = Math.acos(-1 + (2 * i) / 35);
      const theta = Math.sqrt(35 * Math.PI) * phi;
      const x = radius * Math.cos(theta) * Math.sin(phi);
      const y = radius * Math.sin(theta) * Math.sin(phi);
      const z = radius * Math.cos(phi);
      
      const normal = new THREE.Vector3(x, y, z).normalize();
      const up = new THREE.Vector3(0, 1, 0);
      const quaternion = new THREE.Quaternion().setFromUnitVectors(up, normal);
      const euler = new THREE.Euler().setFromQuaternion(quaternion);

      const maxScale = Math.random() * 0.4 + 0.4;
      const greens = ["#1D9E75", "#22C55E", "#15803D", "#16A34A"];
      const treeColor = greens[Math.floor(Math.random() * greens.length)];

      arr.push({ pos: [x, y, z], rot: [euler.x, euler.y, euler.z], maxScale, color: treeColor });
    }
    return arr;
  }, []); // Empty dependency array so positions are fixed

  // Calculate current scale based on progress
  const trees = useMemo(() => {
    return baseTrees.map(t => ({
      ...t,
      scale: Math.max(0.05, cropProgress * t.maxScale * 2.5) // Multiplier to make full grown trees larger
    }));
  }, [baseTrees, cropProgress]);

  return (
    <group ref={planetRef}>
      <mesh receiveShadow castShadow>
        <icosahedronGeometry args={[2.5, 2]} />
        <meshStandardMaterial color={`#${soilColor}`} flatShading roughness={1} />
      </mesh>
      
      {trees.map((t, i) => (
        <Tree key={i} position={t.pos} rotation={t.rot} scale={t.scale} color={t.color} />
      ))}
    </group>
  );
}

export default function LowPolyFarm({ soilMoisture = 50, cropProgress = 0.5, isRaining = false }) {
  return (
    <div className="w-full h-[350px] rounded-2xl overflow-hidden relative bg-gradient-to-b from-[#FFDAB9] to-[#87CEEB] border border-white/5 shadow-xl">
      <Canvas shadows camera={{ position: [0, 2, 8], fov: 45 }}>
        <ambientLight intensity={0.6} color="#FFE4B5" />
        <directionalLight 
          position={[10, 10, 5]} 
          intensity={1.2} 
          castShadow 
          color="#FFFAFA"
          shadow-mapSize-width={1024} 
          shadow-mapSize-height={1024} 
        />
        <pointLight position={[-10, -10, -10]} intensity={0.3} color="#87CEEB" />

        <Planet soilMoisture={soilMoisture} cropProgress={cropProgress} />
        <CloudLayer count={6} />
        <Airplane />
        
        {isRaining && (
           <Stars radius={5} depth={10} count={500} factor={4} saturation={0} fade speed={2} />
        )}

        <OrbitControls 
          enablePan={false} 
          enableZoom={true} 
          minDistance={4} 
          maxDistance={12}
          autoRotate={false}
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
