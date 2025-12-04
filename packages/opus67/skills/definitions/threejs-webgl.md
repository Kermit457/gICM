# Three.js & WebGL Expert

> **ID:** `threejs-webgl`
> **Tier:** 2
> **Token Cost:** 8000
> **MCP Connections:** None

## What This Skill Does

- Create 3D scenes with Three.js and React Three Fiber
- Implement custom shaders with GLSL
- Build performant animations and interactions
- Load and optimize 3D models (GLTF, GLB, OBJ)
- Implement post-processing effects
- Create immersive WebGL experiences
- Optimize for mobile and low-end devices
- Debug WebGL performance issues

## When to Use

This skill is automatically loaded when:

- **Keywords:** three, webgl, 3d, shader, glsl, r3f, react-three-fiber, canvas, mesh, geometry
- **File Types:** .glsl, .vert, .frag
- **Directories:** shaders/, 3d/, canvas/

## Core Capabilities

### 1. Create 3D Scenes with React Three Fiber

Build declarative 3D scenes using React Three Fiber (R3F), the React renderer for Three.js.

**Best Practices:**
- Use React Three Fiber for React projects, vanilla Three.js for others
- Structure scenes with proper component hierarchy
- Implement proper cleanup for resources (geometries, materials, textures)
- Use Drei helpers for common patterns
- Keep render loop efficient with useMemo and useCallback

**Common Patterns:**

```tsx
// Basic React Three Fiber Scene Setup
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Environment, useGLTF, Center } from "@react-three/drei";
import { Suspense, useRef } from "react";
import * as THREE from "three";

function Scene() {
  return (
    <Canvas
      camera={{ position: [0, 2, 5], fov: 50 }}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        outputColorSpace: THREE.SRGBColorSpace,
      }}
      shadows
    >
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />

      {/* Environment map for reflections */}
      <Environment preset="city" />

      {/* Scene content */}
      <Suspense fallback={<LoadingSpinner />}>
        <SceneContent />
      </Suspense>

      {/* Controls */}
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={2}
        maxDistance={20}
      />
    </Canvas>
  );
}

// Animated Box Component
function AnimatedBox({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Animation loop
  useFrame((state, delta) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.x += delta * 0.5;
    meshRef.current.rotation.y += delta * 0.3;
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      scale={hovered ? 1.2 : 1}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color={hovered ? "hotpink" : "orange"}
        metalness={0.5}
        roughness={0.3}
      />
    </mesh>
  );
}

// Instanced Rendering for Many Objects
function InstancedCubes({ count = 1000 }: { count?: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  useEffect(() => {
    if (!meshRef.current) return;

    const dummy = new THREE.Object3D();
    const color = new THREE.Color();

    for (let i = 0; i < count; i++) {
      // Random position
      dummy.position.set(
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20
      );
      // Random rotation
      dummy.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      // Random scale
      const scale = 0.2 + Math.random() * 0.3;
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);

      // Random color
      color.setHSL(Math.random(), 0.7, 0.5);
      meshRef.current.setColorAt(i, color);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [count]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial />
    </instancedMesh>
  );
}

// Loading 3D Models with GLTF
function Model({ url, scale = 1 }: { url: string; scale?: number }) {
  const { scene, animations } = useGLTF(url);
  const { actions, mixer } = useAnimations(animations, scene);

  // Clone scene to avoid mutation issues
  const clonedScene = useMemo(() => scene.clone(), [scene]);

  // Play animations
  useEffect(() => {
    if (actions.idle) {
      actions.idle.play();
    }
  }, [actions]);

  // Traverse and setup materials
  useEffect(() => {
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [clonedScene]);

  return (
    <primitive
      object={clonedScene}
      scale={scale}
      dispose={null}
    />
  );
}

// Preload models
useGLTF.preload("/models/character.glb");
```

```tsx
// Advanced Scene with Physics (using @react-three/rapier)
import { Physics, RigidBody, CuboidCollider } from "@react-three/rapier";

function PhysicsScene() {
  return (
    <Canvas shadows camera={{ position: [0, 5, 10] }}>
      <Physics gravity={[0, -9.81, 0]}>
        {/* Ground */}
        <RigidBody type="fixed" colliders="cuboid">
          <mesh receiveShadow position={[0, -1, 0]}>
            <boxGeometry args={[20, 0.5, 20]} />
            <meshStandardMaterial color="gray" />
          </mesh>
        </RigidBody>

        {/* Falling objects */}
        {Array.from({ length: 20 }).map((_, i) => (
          <FallingBox key={i} position={[
            (Math.random() - 0.5) * 5,
            5 + i * 0.5,
            (Math.random() - 0.5) * 5
          ]} />
        ))}
      </Physics>

      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} castShadow />
      <OrbitControls />
    </Canvas>
  );
}

function FallingBox({ position }: { position: [number, number, number] }) {
  const [color] = useState(() => `hsl(${Math.random() * 360}, 70%, 50%)`);

  return (
    <RigidBody colliders="cuboid" restitution={0.5}>
      <mesh castShadow position={position}>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </RigidBody>
  );
}
```

**Gotchas:**
- Always wrap Canvas content in Suspense for async loading
- Dispose of geometries, materials, and textures manually when not using R3F
- useFrame runs on every frame - keep it lightweight
- Use drei helpers instead of reimplementing common patterns

### 2. Implement Custom Shaders with GLSL

Write custom vertex and fragment shaders for unique visual effects.

**Best Practices:**
- Start with simple shaders and build complexity
- Use uniforms for dynamic values controlled from JavaScript
- Optimize shader math for performance
- Test on multiple GPUs for compatibility
- Use shader chunks for reusable code

**Common Patterns:**

```tsx
// Custom Shader Material with React Three Fiber
import { shaderMaterial } from "@react-three/drei";
import { extend, useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Create custom shader material
const GradientShaderMaterial = shaderMaterial(
  // Uniforms
  {
    uTime: 0,
    uColor1: new THREE.Color("#ff0000"),
    uColor2: new THREE.Color("#0000ff"),
    uIntensity: 1.0,
  },
  // Vertex shader
  `
    varying vec2 vUv;
    varying vec3 vPosition;
    uniform float uTime;

    void main() {
      vUv = uv;
      vPosition = position;

      // Animate vertices
      vec3 pos = position;
      pos.z += sin(pos.x * 2.0 + uTime) * 0.1;
      pos.z += cos(pos.y * 2.0 + uTime) * 0.1;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  // Fragment shader
  `
    uniform float uTime;
    uniform vec3 uColor1;
    uniform vec3 uColor2;
    uniform float uIntensity;
    varying vec2 vUv;
    varying vec3 vPosition;

    void main() {
      // Animated gradient
      float pattern = sin(vUv.x * 10.0 + uTime) * 0.5 + 0.5;
      pattern *= sin(vUv.y * 10.0 + uTime * 0.5) * 0.5 + 0.5;

      vec3 color = mix(uColor1, uColor2, pattern);
      color *= uIntensity;

      gl_FragColor = vec4(color, 1.0);
    }
  `
);

// Extend Three.js with the custom material
extend({ GradientShaderMaterial });

// TypeScript declaration
declare global {
  namespace JSX {
    interface IntrinsicElements {
      gradientShaderMaterial: any;
    }
  }
}

// Usage component
function ShaderPlane() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <mesh>
      <planeGeometry args={[4, 4, 32, 32]} />
      <gradientShaderMaterial
        ref={materialRef}
        uColor1="#ff6b6b"
        uColor2="#4ecdc4"
        uIntensity={1.5}
      />
    </mesh>
  );
}
```

```glsl
// Advanced Fragment Shader - Noise-based effects
// noise-shader.frag
precision highp float;

uniform float uTime;
uniform vec2 uResolution;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;

varying vec2 vUv;

// Simplex 2D noise
vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
           -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
    + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
    dot(x12.zw,x12.zw)), 0.0);
  m = m*m;
  m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

// Fractal Brownian Motion
float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;
  for (int i = 0; i < 6; i++) {
    value += amplitude * snoise(p * frequency);
    amplitude *= 0.5;
    frequency *= 2.0;
  }
  return value;
}

void main() {
  vec2 uv = vUv;

  // Create animated noise pattern
  float noise1 = fbm(uv * 3.0 + uTime * 0.1);
  float noise2 = fbm(uv * 5.0 - uTime * 0.15);
  float noise3 = fbm(uv * 7.0 + vec2(noise1, noise2));

  // Create color bands
  float t = noise3 * 0.5 + 0.5;

  vec3 color;
  if (t < 0.33) {
    color = mix(uColor1, uColor2, t * 3.0);
  } else if (t < 0.66) {
    color = mix(uColor2, uColor3, (t - 0.33) * 3.0);
  } else {
    color = mix(uColor3, uColor1, (t - 0.66) * 3.0);
  }

  // Add subtle vignette
  float vignette = 1.0 - length(uv - 0.5) * 0.5;
  color *= vignette;

  gl_FragColor = vec4(color, 1.0);
}
```

```tsx
// Particle System with Custom Shaders
function ParticleSystem({ count = 5000 }: { count?: number }) {
  const points = useRef<THREE.Points>(null);
  const { viewport } = useThree();

  // Generate particle positions and random values
  const [positions, randoms] = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const randoms = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
      randoms[i] = Math.random();
    }

    return [positions, randoms];
  }, [count]);

  // Custom shader for particles
  const shader = useMemo(() => ({
    uniforms: {
      uTime: { value: 0 },
      uSize: { value: 30 * viewport.dpr },
    },
    vertexShader: `
      uniform float uTime;
      uniform float uSize;
      attribute float aRandom;
      varying float vRandom;

      void main() {
        vRandom = aRandom;

        vec3 pos = position;
        pos.y += sin(uTime + aRandom * 6.28) * 0.5;
        pos.x += cos(uTime * 0.5 + aRandom * 6.28) * 0.3;

        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        gl_PointSize = uSize * (1.0 / -mvPosition.z);
      }
    `,
    fragmentShader: `
      varying float vRandom;

      void main() {
        // Circular particle
        vec2 center = gl_PointCoord - 0.5;
        float dist = length(center);
        if (dist > 0.5) discard;

        // Soft edges
        float alpha = 1.0 - smoothstep(0.3, 0.5, dist);

        // Color based on random value
        vec3 color = mix(
          vec3(0.2, 0.5, 1.0),
          vec3(1.0, 0.3, 0.5),
          vRandom
        );

        gl_FragColor = vec4(color, alpha);
      }
    `,
  }), [viewport.dpr]);

  useFrame((state) => {
    if (points.current) {
      (points.current.material as THREE.ShaderMaterial).uniforms.uTime.value =
        state.clock.elapsedTime;
    }
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aRandom"
          count={count}
          array={randoms}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        {...shader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
```

**Gotchas:**
- GLSL has no implicit type conversion - be explicit with floats (1.0 not 1)
- Mobile GPUs may not support all shader features
- Debug with console warnings and shader compilation errors
- Use lowp/mediump/highp precision hints for mobile

### 3. Build Performant Animations and Interactions

Create smooth, 60fps animations with efficient update patterns.

**Best Practices:**
- Use requestAnimationFrame via useFrame hook
- Batch similar operations together
- Avoid creating objects in the render loop
- Use object pooling for frequently created/destroyed objects
- Profile with Chrome DevTools and Three.js inspector

**Common Patterns:**

```tsx
// Optimized Animation Pattern
function OptimizedAnimation() {
  const meshRef = useRef<THREE.Mesh>(null);

  // Pre-create reusable objects outside render loop
  const tempVector = useMemo(() => new THREE.Vector3(), []);
  const tempQuaternion = useMemo(() => new THREE.Quaternion(), []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Use delta time for frame-independent animation
    const time = state.clock.elapsedTime;

    // Efficient position update
    tempVector.set(
      Math.sin(time) * 2,
      Math.cos(time * 0.5) * 1,
      0
    );
    meshRef.current.position.copy(tempVector);

    // Efficient rotation update
    meshRef.current.rotation.y += delta * 0.5;
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.5, 32, 32]} />
      <meshStandardMaterial color="coral" />
    </mesh>
  );
}

// Mouse/Touch Interaction
function InteractiveScene() {
  const { viewport, camera } = useThree();
  const meshRef = useRef<THREE.Mesh>(null);
  const targetPosition = useRef(new THREE.Vector3());

  // Track mouse position
  useFrame((state) => {
    if (!meshRef.current) return;

    // Convert mouse to 3D position
    targetPosition.current.set(
      (state.mouse.x * viewport.width) / 2,
      (state.mouse.y * viewport.height) / 2,
      0
    );

    // Smooth interpolation (lerp)
    meshRef.current.position.lerp(targetPosition.current, 0.1);

    // Look at camera
    meshRef.current.lookAt(camera.position);
  });

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[0.5, 1]} />
      <meshNormalMaterial />
    </mesh>
  );
}

// Spring Animation with @react-spring/three
import { useSpring, animated, config } from "@react-spring/three";

function SpringBox() {
  const [active, setActive] = useState(false);

  const { scale, rotation, color } = useSpring({
    scale: active ? 1.5 : 1,
    rotation: active ? Math.PI : 0,
    color: active ? "#ff6b6b" : "#4ecdc4",
    config: config.wobbly,
  });

  return (
    <animated.mesh
      scale={scale}
      rotation-y={rotation}
      onClick={() => setActive(!active)}
    >
      <boxGeometry />
      <animated.meshStandardMaterial color={color} />
    </animated.mesh>
  );
}

// Scroll-based Animation
import { useScroll } from "@react-three/drei";

function ScrollAnimation() {
  const meshRef = useRef<THREE.Group>(null);
  const scroll = useScroll();

  useFrame(() => {
    if (!meshRef.current) return;

    // Get scroll progress (0 to 1)
    const offset = scroll.offset;

    // Animate based on scroll
    meshRef.current.rotation.y = offset * Math.PI * 2;
    meshRef.current.position.y = -offset * 5;
    meshRef.current.scale.setScalar(1 + offset * 0.5);
  });

  return (
    <group ref={meshRef}>
      <mesh>
        <torusKnotGeometry args={[1, 0.3, 128, 32]} />
        <meshNormalMaterial />
      </mesh>
    </group>
  );
}

// Scroll container
function ScrollScene() {
  return (
    <Canvas>
      <ScrollControls pages={3} damping={0.25}>
        <Scroll>
          <ScrollAnimation />
        </Scroll>
        <Scroll html>
          <div className="absolute top-[100vh] left-1/2 -translate-x-1/2">
            <h2 className="text-4xl font-bold text-white">Keep Scrolling</h2>
          </div>
        </Scroll>
      </ScrollControls>
    </Canvas>
  );
}
```

**Gotchas:**
- delta time varies with frame rate - always multiply by delta for consistent speed
- Avoid setState in useFrame - use refs for animation state
- lerp factor should be between 0 and 1 (0.1 = smooth, 0.5 = snappy)
- Test on 60Hz and high refresh rate displays

### 4. Load and Optimize 3D Models

Efficiently load, optimize, and display 3D models in various formats.

**Best Practices:**
- Use GLTF/GLB format for best performance and features
- Compress models with Draco or meshopt
- Use LOD (Level of Detail) for complex scenes
- Implement progressive loading for large assets
- Optimize textures (resize, compress, use KTX2)

**Common Patterns:**

```tsx
// Model Loading with Progress
import { useGLTF, useProgress, Html } from "@react-three/drei";

function Loader() {
  const { progress, active } = useProgress();

  if (!active) return null;

  return (
    <Html center>
      <div className="flex flex-col items-center gap-2">
        <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-sm text-gray-600">{progress.toFixed(0)}%</span>
      </div>
    </Html>
  );
}

// Draco-compressed Model Loading
function DracoModel({ url }: { url: string }) {
  const { scene } = useGLTF(url, "/draco/");

  return <primitive object={scene} />;
}

// LOD (Level of Detail) Implementation
import { LOD } from "three";
import { useEffect, useRef } from "react";

function LODModel() {
  const lodRef = useRef<THREE.LOD>(null);
  const { camera } = useThree();

  // High detail model
  const highDetail = useGLTF("/models/character-high.glb");
  // Medium detail model
  const mediumDetail = useGLTF("/models/character-medium.glb");
  // Low detail model
  const lowDetail = useGLTF("/models/character-low.glb");

  useEffect(() => {
    if (!lodRef.current) return;

    // Add LOD levels (object, distance)
    lodRef.current.addLevel(highDetail.scene.clone(), 0);
    lodRef.current.addLevel(mediumDetail.scene.clone(), 10);
    lodRef.current.addLevel(lowDetail.scene.clone(), 30);
  }, [highDetail, mediumDetail, lowDetail]);

  useFrame(() => {
    lodRef.current?.update(camera);
  });

  return <lOD ref={lodRef} />;
}

// Texture Optimization
function OptimizedTextures() {
  const texture = useTexture("/textures/albedo.jpg");

  // Configure texture settings
  useEffect(() => {
    texture.generateMipmaps = true;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.anisotropy = 16;
    texture.colorSpace = THREE.SRGBColorSpace;
  }, [texture]);

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <meshStandardMaterial map={texture} />
    </mesh>
  );
}

// KTX2 Texture Loading (GPU-compressed)
import { useKTX2 } from "@react-three/drei";

function KTX2Model() {
  const albedo = useKTX2("/textures/albedo.ktx2");
  const normal = useKTX2("/textures/normal.ktx2");

  return (
    <mesh>
      <sphereGeometry args={[1, 64, 64]} />
      <meshStandardMaterial map={albedo} normalMap={normal} />
    </mesh>
  );
}

// Clone and Reuse Models
function SceneWithClones() {
  const { scene: originalScene } = useGLTF("/models/tree.glb");

  // Create multiple instances efficiently
  const trees = useMemo(() => {
    return Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      position: [
        (Math.random() - 0.5) * 20,
        0,
        (Math.random() - 0.5) * 20,
      ] as [number, number, number],
      rotation: Math.random() * Math.PI * 2,
      scale: 0.8 + Math.random() * 0.4,
    }));
  }, []);

  return (
    <>
      {trees.map((tree) => (
        <primitive
          key={tree.id}
          object={originalScene.clone()}
          position={tree.position}
          rotation-y={tree.rotation}
          scale={tree.scale}
        />
      ))}
    </>
  );
}
```

**Gotchas:**
- GLTF loader path is relative to public folder in most setups
- Draco decoder needs separate files served statically
- Clone scenes when reusing to avoid mutation
- KTX2 requires basis_transcoder.js to be served

### 5. Implement Post-Processing Effects

Add cinematic post-processing effects like bloom, depth of field, and color grading.

**Best Practices:**
- Use Effect Composer from @react-three/postprocessing
- Order effects by performance cost (cheap first)
- Disable effects on mobile for performance
- Use selective bloom for better performance
- Test effects at different resolutions

**Common Patterns:**

```tsx
// Post-Processing Setup
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Vignette,
  DepthOfField,
  Noise,
  ToneMapping,
} from "@react-three/postprocessing";
import { BlendFunction, ToneMappingMode } from "postprocessing";

function PostProcessingScene() {
  return (
    <Canvas>
      <SceneContent />

      <EffectComposer>
        {/* Bloom for glowing elements */}
        <Bloom
          intensity={0.5}
          luminanceThreshold={0.8}
          luminanceSmoothing={0.9}
          mipmapBlur
        />

        {/* Subtle chromatic aberration */}
        <ChromaticAberration
          offset={[0.002, 0.002]}
          blendFunction={BlendFunction.NORMAL}
        />

        {/* Vignette for cinematic look */}
        <Vignette
          offset={0.3}
          darkness={0.5}
          blendFunction={BlendFunction.NORMAL}
        />

        {/* Film grain */}
        <Noise
          opacity={0.02}
          blendFunction={BlendFunction.OVERLAY}
        />

        {/* Tone mapping */}
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
    </Canvas>
  );
}

// Selective Bloom (only certain objects glow)
import { Selection, Select } from "@react-three/postprocessing";

function SelectiveBloomScene() {
  return (
    <Canvas>
      <Selection>
        {/* Non-glowing objects */}
        <mesh position={[-2, 0, 0]}>
          <sphereGeometry />
          <meshStandardMaterial color="gray" />
        </mesh>

        {/* Glowing objects (wrapped in Select) */}
        <Select enabled>
          <mesh position={[2, 0, 0]}>
            <sphereGeometry />
            <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={2} />
          </mesh>
        </Select>

        <EffectComposer>
          <SelectiveBloom
            selection={selection}
            intensity={1}
            luminanceThreshold={0}
            luminanceSmoothing={0.9}
          />
        </EffectComposer>
      </Selection>
    </Canvas>
  );
}

// Depth of Field with Focus Control
function DepthOfFieldScene() {
  const [focusDistance, setFocusDistance] = useState(5);

  return (
    <Canvas camera={{ position: [0, 0, 10] }}>
      {/* Objects at different distances */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry />
        <meshStandardMaterial color="red" />
      </mesh>
      <mesh position={[0, 0, -5]}>
        <boxGeometry />
        <meshStandardMaterial color="green" />
      </mesh>
      <mesh position={[0, 0, -10]}>
        <boxGeometry />
        <meshStandardMaterial color="blue" />
      </mesh>

      <EffectComposer>
        <DepthOfField
          focusDistance={focusDistance / 100}
          focalLength={0.02}
          bokehScale={6}
          height={480}
        />
      </EffectComposer>
    </Canvas>
  );
}

// Custom Post-Processing Effect
import { Effect } from "postprocessing";
import { Uniform } from "three";

const fragmentShader = `
  uniform float uTime;
  uniform float uIntensity;

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec2 center = uv - 0.5;
    float dist = length(center);

    // Radial distortion
    vec2 distortedUv = uv + center * dist * sin(uTime) * uIntensity;

    outputColor = texture2D(inputBuffer, distortedUv);
  }
`;

class WarpEffect extends Effect {
  constructor({ intensity = 0.1 } = {}) {
    super("WarpEffect", fragmentShader, {
      uniforms: new Map([
        ["uTime", new Uniform(0)],
        ["uIntensity", new Uniform(intensity)],
      ]),
    });
  }

  update(_renderer: any, _inputBuffer: any, deltaTime: number) {
    this.uniforms.get("uTime")!.value += deltaTime;
  }
}

// Use in React
const Warp = forwardRef<WarpEffect, { intensity?: number }>(
  ({ intensity = 0.1 }, ref) => {
    const effect = useMemo(() => new WarpEffect({ intensity }), [intensity]);
    return <primitive ref={ref} object={effect} dispose={null} />;
  }
);
```

**Gotchas:**
- Post-processing significantly impacts performance
- Some effects compound (multiple blooms = exponential cost)
- Test on target devices early
- Disable on mobile unless essential

### 6. Performance Optimization

Optimize Three.js applications for smooth performance across devices.

**Best Practices:**
- Monitor performance with Stats.js or browser DevTools
- Use instancing for repeated geometry
- Implement frustum culling
- Reduce draw calls by merging geometries
- Use texture atlases
- Implement LOD system

**Common Patterns:**

```tsx
// Performance Monitor
import { Perf } from "r3f-perf";

function PerformanceScene() {
  return (
    <Canvas>
      {/* Show performance stats in development */}
      {process.env.NODE_ENV === "development" && (
        <Perf position="top-left" />
      )}
      <SceneContent />
    </Canvas>
  );
}

// Frustum Culling
function CulledScene() {
  return (
    <Canvas
      gl={{
        // Enable frustum culling (default true)
        frustumCulled: true,
      }}
    >
      {/* Objects outside camera view won't be rendered */}
      <LargeMeshField />
    </Canvas>
  );
}

// Geometry Merging
import { mergeBufferGeometries } from "three/examples/jsm/utils/BufferGeometryUtils";

function MergedGeometry({ positions }: { positions: [number, number, number][] }) {
  const geometry = useMemo(() => {
    const geometries = positions.map((pos) => {
      const geo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
      geo.translate(...pos);
      return geo;
    });
    return mergeBufferGeometries(geometries);
  }, [positions]);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial />
    </mesh>
  );
}

// Adaptive Performance
import { useDetectGPU } from "@react-three/drei";

function AdaptiveScene() {
  const GPUTier = useDetectGPU();

  const quality = useMemo(() => {
    if (!GPUTier) return "medium";
    if (GPUTier.tier >= 3) return "high";
    if (GPUTier.tier >= 2) return "medium";
    return "low";
  }, [GPUTier]);

  const settings = {
    high: { shadowMapSize: 2048, particles: 10000, postProcessing: true },
    medium: { shadowMapSize: 1024, particles: 5000, postProcessing: true },
    low: { shadowMapSize: 512, particles: 1000, postProcessing: false },
  };

  return (
    <Canvas
      shadows={quality !== "low"}
      gl={{
        powerPreference: quality === "high" ? "high-performance" : "default",
        antialias: quality !== "low",
      }}
    >
      <directionalLight
        castShadow={quality !== "low"}
        shadow-mapSize={[settings[quality].shadowMapSize, settings[quality].shadowMapSize]}
      />
      <ParticleSystem count={settings[quality].particles} />
      {settings[quality].postProcessing && <PostProcessing />}
    </Canvas>
  );
}

// Object Pooling
class ObjectPool<T> {
  private pool: T[] = [];
  private factory: () => T;

  constructor(factory: () => T, initialSize = 10) {
    this.factory = factory;
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(factory());
    }
  }

  get(): T {
    return this.pool.pop() ?? this.factory();
  }

  release(obj: T): void {
    this.pool.push(obj);
  }
}

// Usage with particles
function PooledParticles() {
  const pool = useRef(new ObjectPool(() => new THREE.Vector3(), 100));
  const particles = useRef<THREE.Vector3[]>([]);

  const spawnParticle = () => {
    const pos = pool.current.get();
    pos.set(
      (Math.random() - 0.5) * 10,
      5,
      (Math.random() - 0.5) * 10
    );
    particles.current.push(pos);
  };

  const removeParticle = (pos: THREE.Vector3) => {
    const index = particles.current.indexOf(pos);
    if (index > -1) {
      particles.current.splice(index, 1);
      pool.current.release(pos);
    }
  };

  // ... render logic
}
```

**Gotchas:**
- GPU tier detection is async and may not be available immediately
- Object pooling adds complexity - only use when needed
- Merged geometries cannot be animated individually
- Balance quality and performance based on target devices

## Real-World Examples

### Example 1: Interactive Product Viewer

```tsx
function ProductViewer({ modelUrl }: { modelUrl: string }) {
  const [selectedColor, setSelectedColor] = useState("#ffffff");
  const [autoRotate, setAutoRotate] = useState(true);

  return (
    <div className="relative w-full h-[600px]">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{ preserveDrawingBuffer: true }}
      >
        <Suspense fallback={<Loader />}>
          <Environment preset="studio" />
          <ProductModel url={modelUrl} color={selectedColor} />
          <ContactShadows
            position={[0, -1, 0]}
            opacity={0.5}
            scale={10}
            blur={2}
          />
        </Suspense>
        <OrbitControls
          autoRotate={autoRotate}
          autoRotateSpeed={2}
          enablePan={false}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 1.5}
        />
      </Canvas>

      {/* UI Controls */}
      <div className="absolute bottom-4 left-4 flex gap-2">
        {["#ffffff", "#ff0000", "#0000ff", "#000000"].map((color) => (
          <button
            key={color}
            onClick={() => setSelectedColor(color)}
            className={cn(
              "w-8 h-8 rounded-full border-2",
              selectedColor === color ? "border-blue-500" : "border-gray-300"
            )}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>

      <button
        onClick={() => setAutoRotate(!autoRotate)}
        className="absolute bottom-4 right-4 px-4 py-2 bg-white rounded-lg shadow"
      >
        {autoRotate ? "Stop" : "Rotate"}
      </button>
    </div>
  );
}

function ProductModel({ url, color }: { url: string; color: string }) {
  const { scene, materials } = useGLTF(url);
  const groupRef = useRef<THREE.Group>(null);

  // Update material color
  useEffect(() => {
    Object.values(materials).forEach((material) => {
      if (material instanceof THREE.MeshStandardMaterial) {
        material.color.set(color);
      }
    });
  }, [color, materials]);

  return (
    <Center>
      <primitive ref={groupRef} object={scene} scale={2} />
    </Center>
  );
}
```

### Example 2: Immersive Landing Page Background

```tsx
function ImmersiveBackground() {
  return (
    <div className="fixed inset-0 -z-10">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 75 }}
        gl={{ alpha: true, antialias: true }}
      >
        <color attach="background" args={["#050505"]} />
        <fog attach="fog" args={["#050505", 5, 15]} />

        <FloatingParticles count={200} />
        <WaveGrid />
        <GlowOrbs />

        <EffectComposer>
          <Bloom luminanceThreshold={0.2} intensity={0.5} mipmapBlur />
        </EffectComposer>
      </Canvas>
    </div>
  );
}

function FloatingParticles({ count }: { count: number }) {
  const ref = useRef<THREE.Points>(null);

  const [positions, sizes] = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
      sizes[i] = Math.random() * 0.5 + 0.1;
    }

    return [positions, sizes];
  }, [count]);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.02;
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-size" count={count} array={sizes} itemSize={1} />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        color="#4a90d9"
        transparent
        opacity={0.8}
        sizeAttenuation
      />
    </points>
  );
}

function WaveGrid() {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ref.current) return;
    const positions = ref.current.geometry.attributes.position;
    const time = state.clock.elapsedTime;

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      positions.setZ(i, Math.sin(x + time) * 0.3 + Math.cos(y + time) * 0.3);
    }
    positions.needsUpdate = true;
  });

  return (
    <mesh ref={ref} rotation-x={-Math.PI / 2} position-y={-2}>
      <planeGeometry args={[20, 20, 50, 50]} />
      <meshBasicMaterial color="#1a1a2e" wireframe />
    </mesh>
  );
}
```

## Related Skills

- `react-expert` - React patterns for Three.js integration
- `framer-motion-animations` - 2D animations to complement 3D
- `performance-optimization` - General web performance
- `typescript-expert` - Type-safe Three.js code
- `webgpu-expert` - Next-generation graphics API

## Further Reading

- [Three.js Documentation](https://threejs.org/docs/) - Official docs
- [React Three Fiber Docs](https://docs.pmnd.rs/react-three-fiber) - R3F documentation
- [Drei Helpers](https://github.com/pmndrs/drei) - Useful abstractions
- [The Book of Shaders](https://thebookofshaders.com/) - GLSL fundamentals
- [Three.js Journey](https://threejs-journey.com/) - Comprehensive course
- [Shadertoy](https://www.shadertoy.com/) - Shader inspiration

---

*This skill is part of OPUS 67 v5.1 - "The Precision Update"*
*Master 3D graphics for immersive web experiences*
