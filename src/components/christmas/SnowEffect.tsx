import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TreeState } from '@/types/christmas';

interface SnowEffectProps {
  active: boolean;
  state: TreeState;
  count?: number;
}

const RANGE = 16;          // 水平覆盖半径（x / z）
const GROUND_Y = -6;       // 落到该高度即回收
const TOP_MIN = 14;        // 回收后顶部最低高度
const TOP_MAX = 18;        // 回收后顶部最高高度

export function SnowEffect({ active, state, count = 1600 }: SnowEffectProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const velocitiesRef = useRef<Float32Array>();
  const phasesRef = useRef<Float32Array>();
  const opacityRef = useRef(0);

  // 初始化雪花位置、下落速度与各自的摆动相位
  const positions = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const phases = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      // 初始在整个竖直区间内随机分布，避免开局全挤在顶部
      positions[i3] = (Math.random() - 0.5) * RANGE * 2;
      positions[i3 + 1] = Math.random() * (TOP_MAX - GROUND_Y) + GROUND_Y;
      positions[i3 + 2] = (Math.random() - 0.5) * RANGE * 2;

      // 竖直下落速度（舒缓），水平方向带轻微漂移
      velocities[i3] = (Math.random() - 0.5) * 0.2;
      velocities[i3 + 1] = -(Math.random() * 0.7 + 0.4);
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.2;
      phases[i] = Math.random() * Math.PI * 2;
    }

    velocitiesRef.current = velocities;
    phasesRef.current = phases;
    return positions;
  }, [count]);

  // 圆形柔边雪花贴图，避免默认方形粒子
  const texture = useMemo(() => {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(0.4, 'rgba(255,255,255,0.85)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);
    }
    return new THREE.CanvasTexture(canvas);
  }, []);

  useFrame((_, delta) => {
    if (!pointsRef.current || !velocitiesRef.current || !phasesRef.current) return;

    const geometry = pointsRef.current.geometry;
    const positionAttr = geometry.attributes.position as THREE.BufferAttribute;
    const posArray = positionAttr.array as Float32Array;
    const velocities = velocitiesRef.current;
    const phases = phasesRef.current;

    // 透明度平滑淡入 / 淡出；照片放大(focus)时压薄雪层，避免遮挡照片
    const targetOpacity = !active ? 0 : state === 'focus' ? 0.2 : 0.9;
    opacityRef.current += (targetOpacity - opacityRef.current) * Math.min(delta * 2.5, 1);
    const material = pointsRef.current.material as THREE.PointsMaterial;
    material.opacity = opacityRef.current;

    if (opacityRef.current < 0.01) return;

    const time = Date.now() * 0.001;
    const dt = Math.min(delta, 0.05); // 防止掉帧时瞬移

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const phase = phases[i];

      // 正弦风摆，每片雪花相位不同，更自然
      const windX = Math.sin(time * 0.8 + phase) * 0.15;
      const windZ = Math.cos(time * 0.6 + phase) * 0.15;

      posArray[i3] += (velocities[i3] + windX) * dt;
      posArray[i3 + 1] += velocities[i3 + 1] * dt;
      posArray[i3 + 2] += (velocities[i3 + 2] + windZ) * dt;

      // 落出底部后回收到顶部
      if (posArray[i3 + 1] < GROUND_Y) {
        posArray[i3] = (Math.random() - 0.5) * RANGE * 2;
        posArray[i3 + 1] = Math.random() * (TOP_MAX - TOP_MIN) + TOP_MIN;
        posArray[i3 + 2] = (Math.random() - 0.5) * RANGE * 2;
      }

      // 水平方向循环包裹，保持在视野内
      if (posArray[i3] > RANGE) posArray[i3] = -RANGE;
      if (posArray[i3] < -RANGE) posArray[i3] = RANGE;
      if (posArray[i3 + 2] > RANGE) posArray[i3 + 2] = -RANGE;
      if (posArray[i3 + 2] < -RANGE) posArray[i3 + 2] = RANGE;
    }

    positionAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.13}
        map={texture}
        color="#ffffff"
        transparent
        opacity={0}
        depthWrite={false}
        alphaTest={0.02}
        sizeAttenuation
        blending={THREE.NormalBlending}
      />
    </points>
  );
}
