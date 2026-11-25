import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const FILL_COUNT = 3400;
const EDGE_COUNT = 700;
const COUNT = FILL_COUNT + EDGE_COUNT;
const ORBIT_COUNT = 140;
// How long particles take to gather into the heart (slowed so the forming
// process stays visible).
const GATHER_DURATION = 2.8;

// 2D heart implicit: lobes on top, point down (y up).
function insideHeart(x: number, y: number): boolean {
  const a = x * x + y * y - 1;
  return a * a * a - x * x * y * y * y <= 0;
}

const smoothstep = (e0: number, e1: number, x: number) => {
  const t = Math.min(Math.max((x - e0) / (e1 - e0), 0), 1);
  return t * t * (3 - 2 * t);
};

interface Seed {
  base: [number, number, number];
  scatter: [number, number, number];
  phase: number;
  speed: number;
  amp: number;
}

// A particle-built 3D pink heart. Particles start scattered in a loose shell
// and slowly gather into a thick, volumetric heart silhouette that throbs like
// a heartbeat, sways and floats, wrapped by orbiting pink sparkles and a halo.
export function HeartMesh() {
  const groupRef = useRef<THREE.Group>(null);
  const pointsRef = useRef<THREE.Points>(null);
  const matRef = useRef<THREE.PointsMaterial>(null);
  const orbitRef = useRef<THREE.Points>(null);
  const glowRef = useRef<THREE.Sprite>(null);
  const elapsedRef = useRef(0);

  const { positions, colors, seeds } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const colors = new Float32Array(COUNT * 3);
    const seeds: Seed[] = [];

    const pink = new THREE.Color('#ff9ec4');
    const deepPink = new THREE.Color('#ff6fa5');
    const lightPink = new THREE.Color('#ffd1e3');
    const white = new THREE.Color('#ffffff');

    const makeScatter = (): [number, number, number] => {
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      const R = 4 + Math.random() * 3;
      return [
        R * Math.sin(ph) * Math.cos(th),
        R * Math.cos(ph) * 0.8,
        R * Math.sin(ph) * Math.sin(th),
      ];
    };

    // Interior fill particles inside the heart outline, with a deep tapered
    // thickness along z so the heart reads as a solid volume.
    let i = 0;
    while (i < FILL_COUNT) {
      const x = (Math.random() * 2 - 1) * 1.15;
      const y = (Math.random() * 2 - 1) * 1.15;
      if (!insideHeart(x, y)) continue;
      const r = Math.min(Math.sqrt(x * x + y * y), 1);
      const z = (Math.random() - 0.5) * 1.15 * (1 - r * 0.35);

      // Front layer glows lighter, back layer sits deeper pink for depth.
      const roll = Math.random();
      let col: THREE.Color;
      if (z > 0) col = roll < 0.6 ? lightPink : roll < 0.9 ? pink : white;
      else col = roll < 0.55 ? pink : roll < 0.9 ? deepPink : white;

      const base: [number, number, number] = [x * 1.5, y * 1.5, z * 1.5];
      seeds.push({
        base,
        scatter: makeScatter(),
        phase: Math.random() * Math.PI * 2,
        speed: 1 + Math.random() * 2,
        amp: 0.03 + Math.random() * 0.05,
      });
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;

      // Start from the scattered shell.
      positions[i * 3] = seeds[i].scatter[0];
      positions[i * 3 + 1] = seeds[i].scatter[1];
      positions[i * 3 + 2] = seeds[i].scatter[2];
      i++;
    }

    // Brighter particles tracing the heart outline (parametric heart curve),
    // with a little z spread to wrap the volume's edge.
    for (; i < COUNT; i++) {
      const t = Math.random() * Math.PI * 2;
      const ex = (16 * Math.pow(Math.sin(t), 3)) / 17;
      const ey =
        (13 * Math.cos(t) -
          5 * Math.cos(2 * t) -
          2 * Math.cos(3 * t) -
          Math.cos(4 * t)) /
        17;
      const z = (Math.random() - 0.5) * 0.4;
      const col = Math.random() < 0.7 ? lightPink : white;

      const base: [number, number, number] = [ex * 1.5, ey * 1.5, z * 1.5];
      seeds.push({
        base,
        scatter: makeScatter(),
        phase: Math.random() * Math.PI * 2,
        speed: 1 + Math.random() * 2,
        amp: 0.02 + Math.random() * 0.04,
      });
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;

      positions[i * 3] = seeds[i].scatter[0];
      positions[i * 3 + 1] = seeds[i].scatter[1];
      positions[i * 3 + 2] = seeds[i].scatter[2];
    }

    return { positions, colors, seeds };
  }, []);

  const orbit = useMemo(() => {
    const positions = new Float32Array(ORBIT_COUNT * 3);
    const colors = new Float32Array(ORBIT_COUNT * 3);
    const seeds: Array<{ angle: number; r: number; y: number; speed: number; phase: number; scatter: number }> = [];
    const pink = new THREE.Color('#ff9ec4');
    const white = new THREE.Color('#ffffff');
    for (let i = 0; i < ORBIT_COUNT; i++) {
      seeds.push({
        angle: Math.random() * Math.PI * 2,
        r: 2.6 + Math.random() * 1.2,
        y: (Math.random() - 0.5) * 2.2,
        speed: 0.3 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
        scatter: 5 + Math.random() * 3,
      });
      const c = Math.random() < 0.7 ? pink : white;
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    return { positions, colors, seeds };
  }, []);

  const glowTexture = useMemo(() => {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      g.addColorStop(0, 'rgba(255,190,214,0.9)');
      g.addColorStop(0.4, 'rgba(255,122,168,0.35)');
      g.addColorStop(1, 'rgba(255,122,168,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);
    }
    return new THREE.CanvasTexture(canvas);
  }, []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const g = groupRef.current;
    if (!g) return;

    // Gather progress: scattered shell -> formed heart
    elapsedRef.current += delta;
    const prog = Math.min(elapsedRef.current / GATHER_DURATION, 1);
    const ease = smoothstep(0, 1, prog);

    // Heartbeat: a sharp double-thump pulse (starts small as it forms)
    const beat = Math.pow(Math.max(Math.sin(t * 2.8), 0), 4);
    const base = 1.35 * (0.6 + 0.4 * ease);
    const s = base * (1 + 0.12 * beat);
    g.scale.set(s, s, 1);
    g.position.y = Math.sin(t * 1.2) * 0.15;
    g.rotation.y = Math.sin(t * 0.5) * 0.5;

    // Particles fly in from the scattered shell, then breathe around their home.
    const pts = pointsRef.current;
    if (pts) {
      const p = positions;
      for (let i = 0; i < COUNT; i++) {
        const sd = seeds[i];
        const w = Math.sin(t * sd.speed + sd.phase) * sd.amp * ease;
        p[i * 3] = sd.scatter[0] + (sd.base[0] - sd.scatter[0]) * ease + w;
        p[i * 3 + 1] = sd.scatter[1] + (sd.base[1] - sd.scatter[1]) * ease + w;
        p[i * 3 + 2] = sd.scatter[2] + (sd.base[2] - sd.scatter[2]) * ease;
      }
      (pts.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
    }
    if (matRef.current) {
      matRef.current.opacity = 0.15 + 0.8 * ease;
    }

    const orbitPts = orbitRef.current;
    if (orbitPts) {
      const pos = orbit.positions;
      for (let i = 0; i < ORBIT_COUNT; i++) {
        const sd = orbit.seeds[i];
        const a = sd.angle + t * sd.speed;
        const rad = sd.scatter + (sd.r - sd.scatter) * ease;
        pos[i * 3] = Math.cos(a) * rad;
        pos[i * 3 + 1] = sd.y + Math.sin(t * 1.5 + sd.phase) * 0.2;
        pos[i * 3 + 2] = Math.sin(a) * rad * 0.7;
      }
      (orbitPts.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
    }

    const glow = glowRef.current;
    if (glow) {
      const gs = (6 + beat * 1.5) * (0.5 + 0.5 * ease);
      glow.scale.set(gs, gs, 1);
      (glow.material as THREE.SpriteMaterial).opacity = (0.5 + beat * 0.2) * ease;
    }
  });

  return (
    <group ref={groupRef}>
      <points ref={pointsRef} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={COUNT} array={positions} itemSize={3} />
          <bufferAttribute attach="attributes-color" count={COUNT} array={colors} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial
          ref={matRef}
          size={0.15}
          map={glowTexture}
          vertexColors
          transparent
          opacity={0.15}
          depthWrite={false}
          alphaTest={0.02}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
          toneMapped={false}
        />
      </points>

      <points ref={orbitRef} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={ORBIT_COUNT} array={orbit.positions} itemSize={3} />
          <bufferAttribute attach="attributes-color" count={ORBIT_COUNT} array={orbit.colors} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial
          size={0.12}
          map={glowTexture}
          vertexColors
          transparent
          opacity={0.9}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
          toneMapped={false}
        />
      </points>

      <sprite ref={glowRef} frustumCulled={false}>
        <spriteMaterial
          map={glowTexture}
          color="#ff7aa8"
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </sprite>
    </group>
  );
}
