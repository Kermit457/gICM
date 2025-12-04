"use client";

import { useRef, useMemo, useState, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import skillsData from "../data/skills.json";

interface SkillOrbProps {
  position: [number, number, number];
  color: string;
  name: string;
  tokens: number;
}

function SkillOrb({ position, color, name, tokens }: SkillOrbProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
      if (hovered) {
        meshRef.current.scale.lerp(new THREE.Vector3(1.3, 1.3, 1.3), 0.1);
      } else {
        meshRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
      }
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      <sphereGeometry args={[0.3, 32, 32]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={hovered ? 0.8 : 0.3}
        roughness={0.3}
        metalness={0.8}
      />
      {hovered && (
        <Html distanceFactor={10}>
          <div className="glass-strong px-4 py-2 rounded-lg whitespace-nowrap">
            <div className="text-sm font-semibold text-white">{name}</div>
            <div className="text-xs text-gray-400">{tokens.toLocaleString()} tokens</div>
          </div>
        </Html>
      )}
    </mesh>
  );
}

function Galaxy() {
  const groupRef = useRef<THREE.Group>(null);

  // Generate skill positions in 3D space (spherical distribution)
  const skills = useMemo(() => {
    const allSkills: { position: [number, number, number]; color: string; name: string; tokens: number }[] = [];

    // Only blue colors
    const blueColors = ['#3b82f6', '#60a5fa'];

    skillsData.categories.forEach((category, catIndex) => {
      category.skills.forEach((skill, skillIndex) => {
        const totalSkillsInCat = category.skills.length;
        const radius = 8 + catIndex * 2; // Different radius per category

        // Distribute skills evenly around the sphere
        const phi = Math.acos(-1 + (2 * skillIndex) / totalSkillsInCat);
        const theta = Math.sqrt(totalSkillsInCat * Math.PI) * phi + catIndex;

        const x = radius * Math.cos(theta) * Math.sin(phi);
        const y = radius * Math.sin(theta) * Math.sin(phi);
        const z = radius * Math.cos(phi);

        allSkills.push({
          position: [x, y, z],
          color: blueColors[catIndex % 2], // Alternate between two blues
          name: skill.name,
          tokens: skill.tokens,
        });
      });
    });

    return allSkills;
  }, []);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.001;
    }
  });

  return (
    <group ref={groupRef}>
      {skills.map((skill, index) => (
        <SkillOrb key={index} {...skill} />
      ))}
    </group>
  );
}

export default function SkillGalaxy() {
  return (
    <div className="w-full h-[400px] md:h-[600px] lg:h-[800px] relative">
      <Canvas camera={{ position: [0, 0, 20], fov: 60 }}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <pointLight position={[-10, -10, -10]} intensity={0.5} color="#00D9FF" />
          <Galaxy />
          <OrbitControls
            enableZoom={true}
            enablePan={true}
            enableRotate={true}
            zoomSpeed={0.6}
            panSpeed={0.5}
            rotateSpeed={0.4}
          />
        </Suspense>
      </Canvas>

      {/* Legend */}
      <div className="absolute bottom-8 left-8 glass p-6 rounded-xl max-w-md">
        <h3 className="text-lg font-bold mb-4 text-blue-500">Skill Categories</h3>
        <div className="grid grid-cols-2 gap-3">
          {skillsData.categories.map((category, idx) => (
            <div key={category.id} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{
                  background: idx % 2 === 0 ? '#3b82f6' : '#60a5fa',
                  boxShadow: `0 0 10px ${idx % 2 === 0 ? '#3b82f6' : '#60a5fa'}`,
                }}
              />
              <span className="text-sm text-gray-300">{category.name}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-sm text-gray-400">
            <span className="text-white font-semibold">{skillsData.total_skills} Skills</span> • Hover orbs to see details
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Rotate, zoom, and explore the skill universe
          </p>
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute top-8 right-8 glass p-4 rounded-xl max-w-xs">
        <h4 className="text-sm font-bold text-blue-400 mb-2">Controls</h4>
        <ul className="text-xs text-gray-400 space-y-1">
          <li>🖱️ Drag to rotate</li>
          <li>🔍 Scroll to zoom</li>
          <li>👆 Hover orbs for info</li>
        </ul>
      </div>
    </div>
  );
}
