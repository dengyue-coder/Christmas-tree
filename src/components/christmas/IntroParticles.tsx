import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const COUNT = 5000;
const DURATION = 4.4;
const ARMS = 3;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smoothstep = (e0: number, e1: number, x: number) => {
  const t = Math.min(Math.max((x - e0) / (e1 - e0), 0), 1);
  return t * t * (3 - 2 * t);
};

const COLORS = {
  core: new THREE.Color('#fff3c4'),
  gold: new THREE.Color('#ffd700'),
  red: new THREE.Color('#ff3b5c'),
  white: new THREE.Color('#ffffff'),
  leaf: new THREE.Color('#8fe08f'),
  ice: new THREE.Color('#9fe0ff'),
};

interface Seed {
  dust: [number, number, number];
  core: [number, number, number];
  arm: [number, number, number];
  tree: [number, number, number];
  spin: number;
  phase: number;
  rad: number;
}

type Kind = 'core' | 'arm' | 'tree' | 'dust';

// Opening sequence, in four acts:
//  1. Stardust is sucked inward into a glowing core.
//  2. Three spiral arms spin out into a galaxy vortex covering the screen.
//  3. Particles gather into a Christmas-tree silhouette, crown star lit.
//  4. The vortex bursts outward and fades into the main tree scene.
export function IntroParticles({ onComplete }: { onComplete: () => void }) {
  const pointsRef = useRef<THREE.Points>(null);
  const glowRef = useRef<THREE.Sprite>(null);
  const matRef = useRef<THREE.PointsMaterial>(null);
  const elapsedRef = useRef(0);
  const doneRef = useRef(false);

  const { positions, colors, seeds } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const colors = new Float32Array(COUNT * 3);
    const seeds: Seed[] = [];

    for (let i = 0; i < COUNT; i++) {
      const roll = Math.random();
      let kind: Kind;
      if (roll < 0.08) kind = 'core';
      else if (roll < 0.63) kind = 'arm';
      else if (roll < 0.88) kind = 'tree';
      else kind = 'dust';

      const u = Math.random();
      const phase = Math.random() * Math.PI * 2;
      const spin = 0.5 + Math.random() * 1.4;

      // Dust: outer shell, also used as the burst direction
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      const dustR = 6 + Math.random() * 5;
      const dust: [number, number, number] = [
        dustR * Math.sin(ph) * Math.cos(th),
        dustR * Math.cos(ph) * 0.7,
        dustR * Math.sin(ph) * Math.sin(th),
      ];

      // Core: tight bright cluster at the center
      const cr = 0.25 + Math.random() * 0.4;
      const cth = Math.random() * Math.PI * 2;
      const cph = Math.acos(2 * Math.random() - 1);
      const core: [number, number, number] = [
        cr * Math.sin(cph) * Math.cos(cth),
        cr * Math.cos(cph),
        cr * Math.sin(cph) * Math.sin(cth),
      ];

      // Spiral arm: 3 twisted arms on a flattened disc
      const armIdx = i % ARMS;
      const armBase = armIdx * ((Math.PI * 2) / ARMS);
      const r = 0.8 + u * 7.5;
      const twist = r * 1.1;
      const theta = armBase + twist + (Math.random() - 0.5) * 0.3;
      const arm: [number, number, number] = [
        Math.cos(theta) * r,
        (Math.random() - 0.5) * 1.6 * (r / 8),
        Math.sin(theta) * r * 0.7,
      ];

      // Christmas-tree cone silhouette; core particles form the crown star
      const tt = u;
      const ty = tt * 7 - 3.5;
      let tree: [number, number, number];
      if (kind === 'core') {
        const sr = 0.25;
        tree = [
          (Math.random() - 0.5) * sr,
          3.4 + (Math.random() - 0.5) * 0.15,
          (Math.random() - 0.5) * sr,
        ];
      } else {
        const layerR = 3.4 * Math.pow(1 - tt, 0.8) + 0.04;
        const tth = Math.random() * Math.PI * 2;
        tree = [
          Math.cos(tth) * layerR,
          ty,
          Math.sin(tth) * layerR * 0.8,
        ];
      }

      seeds.push({ dust, core, arm, tree, spin, phase, rad: u });

      // Color by role
      let c: THREE.Color;
      if (kind === 'core') c = Math.random() < 0.5 ? COLORS.core : COLORS.white;
      else if (kind === 'arm') {
        const k = Math.random();
        c = k < 0.4 ? COLORS.gold : k < 0.7 ? COLORS.red : COLORS.white;
      } else if (kind === 'tree') {
        const k = Math.random();
        c = k < 0.6 ? COLORS.leaf : k < 0.85 ? COLORS.gold : COLORS.red;
      } else {
        c = COLORS.ice;
      }
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    return { positions, colors, seeds };
  }, []);

  // Soft radial glow texture for the central light core
  const glowTexture = useMemo(() => {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      g.addColorStop(0, 'rgba(255,244,214,1)');
      g.addColorStop(0.25, 'rgba(255,214,120,0.7)');
      g.addColorStop(0.6, 'rgba(255,150,80,0.25)');
      g.addColorStop(1, 'rgba(255,150,80,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);
    }
    return new THREE.CanvasTexture(canvas);
  }, []);

  useFrame((_, delta) => {
    if (doneRef.current) return;
    elapsedRef.current += delta;
    const t = Math.min(elapsedRef.current / DURATION, 1);

    const p1 = smoothstep(0, 0.22, t);   // dust -> core
    const p2 = smoothstep(0.22, 0.55, t); // core -> arms
    const p3 = smoothstep(0.55, 0.82, t);  // arms -> tree cone
    const burst = smoothstep(0.82, 1, t);
    const fadeIn = smoothstep(0, 0.12, t);
    const rot = elapsedRef.current * 0.9;

    const pos = positions;
    for (let i = 0; i < COUNT; i++) {
      const s = seeds[i];

      let x = lerp(s.dust[0], s.core[0], p1);
      let y = lerp(s.dust[1], s.core[1], p1);
      let z = lerp(s.dust[2], s.core[2], p1);

      x = lerp(x, s.arm[0], p2);
      y = lerp(y, s.arm[1], p2);
      z = lerp(z, s.arm[2], p2);

      x = lerp(x, s.tree[0], p3);
      y = lerp(y, s.tree[1], p3);
      z = lerp(z, s.tree[2], p3);

      // Differential rotation: inner spins faster than outer
      const ang = rot * (1.3 - 0.6 * s.rad) + s.phase;
      const ca = Math.cos(ang);
      const sa = Math.sin(ang);
      let rx = x * ca - z * sa;
      let rz = x * sa + z * ca;
      let ry = y;

      // Burst: fling outward along the dust direction, drift upward
      const spread = 1 + burst * 2.4;
      rx = rx * spread + s.dust[0] * burst * 0.35;
      ry = ry * spread + s.dust[1] * burst * 0.35 + burst * s.rad * 2.0;
      rz = rz * spread + s.dust[2] * burst * 0.35;

      pos[i * 3] = rx;
      pos[i * 3 + 1] = ry;
      pos[i * 3 + 2] = rz;
    }

    const geo = pointsRef.current?.geometry;
    if (geo) {
      const attr = geo.getAttribute('position') as THREE.BufferAttribute;
      attr.needsUpdate = true;
    }
    if (matRef.current) {
      matRef.current.opacity = fadeIn * (1 - burst);
    }

    // Central glow: strong during core/arm phase, rises to the crown star as the tree forms
    const glow = glowRef.current;
    if (glow) {
      const pulse = 1 + Math.sin(elapsedRef.current * 6) * 0.15;
      const gScale = Math.max((p1 * 2.4 + p2 * 1.7) * pulse * (1 - p3 * 0.6), 0.001) * (1 - burst);
      glow.position.set(0, 3.2 * p3, 0);
      glow.scale.set(gScale, gScale, 1);
      const gm = glow.material as THREE.SpriteMaterial;
      gm.opacity = fadeIn * (0.9 - p3 * 0.5) * (1 - burst);
    }

    if (t >= 1 && !doneRef.current) {
      doneRef.current = true;
      onComplete();
    }
  });

  return (
    <>
      <points ref={pointsRef} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={COUNT} array={positions} itemSize={3} />
          <bufferAttribute attach="attributes-color" count={COUNT} array={colors} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial
          ref={matRef}
          size={0.16}
          map={glowTexture}
          vertexColors
          transparent
          opacity={0}
          depthWrite={false}
          alphaTest={0.02}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
          toneMapped={false}
        />
      </points>
      <sprite ref={glowRef} frustumCulled={false}>
        <spriteMaterial
          map={glowTexture}
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </sprite>
    </>
  );
}
