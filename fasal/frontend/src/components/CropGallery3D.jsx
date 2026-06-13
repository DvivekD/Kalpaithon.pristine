import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

// A single item on the cylinder
function GalleryItem({ item, index, total, radius, renderCard }) {
  const angle = -(index / total) * Math.PI * 2;
  const x = Math.sin(angle) * radius;
  const z = Math.cos(angle) * radius;
  const rotationY = angle + Math.PI;

  return (
    <group position={[x, 0, z]} rotation={[0, rotationY, 0]}>
      <Html 
        transform 
        occlude="blending"
        className="w-[350px] pointer-events-auto select-none"
        scale={0.1}
      >
        <div 
          className="w-full transform hover:scale-[1.02] transition-transform duration-300"
          onDragStart={(e) => e.preventDefault()}
        >
          {renderCard(item, index)}
        </div>
      </Html>
    </group>
  );
}

// Controller for dragging and rotating
function GalleryCylinder({ items, renderCard }) {
  const groupRef = useRef();
  const { gl } = useThree();
  
  // A scale of 0.1 makes a 350px card = 35 WebGL units wide.
  // We need enough circumference to fit all cards with some padding.
  const radius = Math.max(30, (items.length * 35 * 1.2) / (2 * Math.PI));

  // Drag physics state
  const rotation = useRef(0);
  const targetRotation = useRef(0);
  const isDragging = useRef(false);
  const startX = useRef(0);

  useEffect(() => {
    const container = gl.domElement.parentElement;
    
    const onPointerDown = (e) => {
      isDragging.current = true;
      startX.current = e.clientX;
      container.style.cursor = 'grabbing';
    };
    
    const onPointerMove = (e) => {
      if (!isDragging.current) return;
      const deltaX = e.clientX - startX.current;
      targetRotation.current += deltaX * 0.002; // Pan sensitivity adjusted for pixel scale
      startX.current = e.clientX;
    };
    
    const onPointerUp = () => {
      isDragging.current = false;
      container.style.cursor = 'grab';
    };

    container.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    
    container.style.cursor = 'grab';

    return () => {
      container.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [gl]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    rotation.current = THREE.MathUtils.damp(rotation.current, targetRotation.current, 5, delta);
    groupRef.current.rotation.y = rotation.current;
  });

  return (
    <group ref={groupRef}>
      {items.map((item, i) => (
        <GalleryItem 
          key={i} 
          item={item} 
          index={i} 
          total={items.length} 
          radius={radius} 
          renderCard={renderCard}
        />
      ))}
    </group>
  );
}

export default function CropGallery3D({ crops, renderCard, onClose }) {
  return (
    <div className="fixed inset-0 z-[100] bg-black">
      {/* Top bar */}
      <div className="absolute top-0 left-0 w-full p-6 z-20 flex justify-between items-center pointer-events-none">
         <h2 className="text-white font-black text-xl tracking-widest uppercase">CROP_GALLERY_OS</h2>
         <button onClick={onClose} className="pointer-events-auto bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-full font-bold text-sm backdrop-blur transition-all border border-white/20">
           Close Gallery
         </button>
      </div>

      <div className="absolute top-20 left-0 w-full flex justify-center z-20 pointer-events-none">
         <span className="bg-white/5 backdrop-blur px-6 py-2 rounded-full text-xs font-bold tracking-widest text-white/50 border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
           DRAG TO SPIN CYLINDER
         </span>
      </div>

      <Canvas camera={{ position: [0, 0, 0], fov: 60 }}>
         <GalleryCylinder items={crops} renderCard={renderCard} />
      </Canvas>
    </div>
  );
}
