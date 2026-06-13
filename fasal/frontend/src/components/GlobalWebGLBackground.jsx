import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function ParticleTerrain() {
  const pointsRef = useRef();
  
  // Create a grid of points
  const count = 10000;
  const size = 120;
  
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const gridSpan = Math.sqrt(count);
    
    for(let i=0; i<count; i++) {
      // Add organic jitter to break the perfect grid
      const jitterX = (Math.random() - 0.5) * (size / gridSpan) * 0.8;
      const jitterZ = (Math.random() - 0.5) * (size / gridSpan) * 0.8;
      
      const x = (i % gridSpan) / gridSpan * size - size/2 + jitterX;
      const z = Math.floor(i / gridSpan) / gridSpan * size - size/2 + jitterZ;
      
      pos[i*3] = x;
      pos[i*3+1] = 0;
      pos[i*3+2] = z;
    }
    return pos;
  }, [count]);

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
    
    const time = state.clock.getElapsedTime() * 0.15;
    const posAttr = pointsRef.current.geometry.attributes.position;
    const posArray = posAttr.array;
    
    let i = 0;
    const gridSpan = Math.sqrt(count);
    for(let ix=0; ix<gridSpan; ix++) {
      for(let iz=0; iz<gridSpan; iz++) {
        const x = posArray[i*3];
        const z = posArray[i*3+2];
        
        // Slow organic topographic waves
        const y = Math.sin(x * 0.05 + time) * Math.cos(z * 0.05 + time) * 4 + 
                  Math.sin(x * 0.02 - time * 0.5) * 3;
        
        posArray[i*3+1] = y;
        i++;
      }
    }
    posAttr.needsUpdate = true;
    
    // Gentle tilt parallax based on mouse
    pointsRef.current.rotation.x = THREE.MathUtils.lerp(pointsRef.current.rotation.x, (Math.PI / 2.5) + (mouse.current.y * 0.05), 0.05);
    pointsRef.current.rotation.z = THREE.MathUtils.lerp(pointsRef.current.rotation.z, mouse.current.x * 0.05, 0.05);
  });

  return (
    <points ref={pointsRef} position={[0, -12, -20]} rotation={[Math.PI / 2.5, 0, 0]}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial 
        size={0.25} 
        color="#2c9a6d" 
        map={circleTexture}
        transparent 
        opacity={0.6} 
        sizeAttenuation={true}
        depthWrite={false}
      />
    </points>
  );
}

export default function GlobalWebGLBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <Canvas camera={{ position: [0, 2, 10], fov: 60 }} dpr={[1, 1.5]}>
        <fog attach="fog" args={['#0b120e', 15, 80]} />
        <ParticleTerrain />
      </Canvas>
    </div>
  );
}
