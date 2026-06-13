import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

// A single item on the cylinder
function GalleryItem({ item, index, total, radius, renderCard }) {
  // Calculate angle based on index
  // We negate the angle so the items render in clockwise order as we drag
  const angle = -(index / total) * Math.PI * 2;
  
  // Position on cylinder
  const x = Math.sin(angle) * radius;
  const z = Math.cos(angle) * radius;
  
  // Rotation to face the center
  // Since they are on the edge looking AT the center:
  // Math.atan2(x, z) gives the angle. We add Math.PI so it faces inward.
  const rotationY = angle + Math.PI;

  return (
    <group position={[x, 0, z]} rotation={[0, rotationY, 0]}>
      <Html 
        transform 
        occlude="blending"
        className="w-[320px] pointer-events-auto select-none"
        distanceFactor={18} // This scales the HTML. Tweak if cards look too big/small.
        position={[0, 0, 0]}
      >
        <div className="w-full h-full transform hover:scale-[1.02] transition-transform duration-300">
          {renderCard(item, index)}
        </div>
      </Html>
    </group>
  );
}

// Controller for dragging and rotating
function GalleryCylinder({ items, radius, renderCard }) {
  const groupRef = useRef();
  const { gl } = useThree();
  
  // Drag physics state
  const rotation = useRef(0);
  const targetRotation = useRef(0);
  const isDragging = useRef(false);
  const startX = useRef(0);

  useEffect(() => {
    // We attach events to the main window or canvas parent to ensure smooth dragging
    // even if cursor leaves the canvas briefly.
    const container = gl.domElement.parentElement;
    
    const onPointerDown = (e) => {
      isDragging.current = true;
      startX.current = e.clientX;
      container.style.cursor = 'grabbing';
    };
    
    const onPointerMove = (e) => {
      if (!isDragging.current) return;
      const deltaX = e.clientX - startX.current;
      targetRotation.current += deltaX * 0.005; // Pan sensitivity
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

  // Apply smooth dampening
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    // Lerp current rotation to target rotation
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

export default function CropGallery3D({ crops, renderCard }) {
  // Estimate radius based on number of crops to prevent overlap.
  // 12 crops -> radius ~9
  // 18 crops -> radius ~13
  const radius = Math.max(9, (crops.length * 4.5) / (2 * Math.PI));

  return (
    <div className="w-full h-[650px] relative rounded-3xl overflow-hidden bg-gradient-to-b from-[#0A1012] to-[#050809] border border-white/10 shadow-2xl">
      {/* Overlay vignette for depth */}
      <div className="absolute inset-0 pointer-events-none z-10 shadow-[inset_0_0_120px_rgba(0,0,0,1)]" />
      
      <div className="absolute top-6 left-0 w-full flex justify-center z-20 pointer-events-none">
         <span className="bg-black/50 backdrop-blur px-4 py-2 rounded-full text-[10px] font-black tracking-widest text-white/50 border border-white/10 shadow-[0_0_15px_rgba(29,158,117,0.2)]">
           DRAG TO EXPLORE GALLERY
         </span>
      </div>

      <Canvas camera={{ position: [0, 0, 0], fov: 60 }}>
         {/* The camera is at [0,0,0] (center of cylinder). The cards wrap around. */}
         <GalleryCylinder items={crops} radius={radius} renderCard={renderCard} />
      </Canvas>
    </div>
  );
}
