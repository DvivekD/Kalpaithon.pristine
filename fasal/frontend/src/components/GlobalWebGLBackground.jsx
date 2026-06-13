import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function ParticleTerrain() {
  const pointsRef = useRef();
  
  // Create a grid of points
  const gridX = 150;
  const gridZ = 150;
  const count = gridX * gridZ;
  const separation = 3;
  
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    
    let i = 0;
    for(let ix = 0; ix < gridX; ix++) {
      for(let iz = 0; iz < gridZ; iz++) {
        const x = ix * separation - ((gridX * separation) / 2);
        const z = iz * separation - ((gridZ * separation) / 2);
        
        pos[i*3] = x;
        pos[i*3+1] = 0;
        pos[i*3+2] = z;
        i++;
      }
    }
    return pos;
  }, [gridX, gridZ, count]);

  const circleTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const context = canvas.getContext('2d');
    context.beginPath();
    context.arc(16, 16, 14, 0, 2 * Math.PI);
    context.fillStyle = '#ffffff';
    context.fill();
    return new THREE.CanvasTexture(canvas);
  }, []);

  const mouse = useRef({ x: 0, y: 0 });
  
  useEffect(() => {
    const handleMouseMove = (e) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useFrame((state) => {
    if (!pointsRef.current) return;
    
    const time = state.clock.getElapsedTime() * 0.8;
    const posAttr = pointsRef.current.geometry.attributes.position;
    const posArray = posAttr.array;
    
    let i = 0;
    for(let ix=0; ix < gridX; ix++) {
      for(let iz=0; iz < gridZ; iz++) {
        const x = posArray[i*3];
        const z = posArray[i*3+2];
        
        // Classic rolling terrain math matching the reference
        const y = Math.sin((ix * 0.1) + time) * 5 + Math.sin((iz * 0.1) + time) * 5;
        
        posArray[i*3+1] = y;
        i++;
      }
    }
    posAttr.needsUpdate = true;
    
    // Gentle tilt parallax based on mouse (centered around 0 since grid is flat on floor)
    pointsRef.current.rotation.x = THREE.MathUtils.lerp(pointsRef.current.rotation.x, (mouse.current.y * 0.15), 0.05);
    pointsRef.current.rotation.y = THREE.MathUtils.lerp(pointsRef.current.rotation.y, (mouse.current.x * 0.15), 0.05);
  });

  return (
    <points ref={pointsRef} position={[0, -15, -100]}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial 
        size={0.2} 
        color="#ffffff" 
        map={circleTexture}
        transparent 
        opacity={0.8} 
        sizeAttenuation={true}
        depthWrite={false}
      />
    </points>
  );
}

export default function GlobalWebGLBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <Canvas camera={{ position: [0, 10, 50], fov: 60 }} dpr={[1, 1.5]}>
        <fog attach="fog" args={['#0b120e', 50, 250]} />
        <ParticleTerrain />
      </Canvas>
    </div>
  );
}
