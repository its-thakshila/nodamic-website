import React, { useRef, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { useTexture, useProgress } from '@react-three/drei';
import * as THREE from 'three';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader';
import { EffectComposer, Vignette } from '@react-three/postprocessing';
import './Atmosphere.css';

import diffMap from '../assets/HeroScene/dark_rock_diff_2k.jpg';
import armMap from '../assets/HeroScene/dark_rock_arm_2k.jpg';
import norMap from '../assets/HeroScene/dark_rock_nor_gl_2k.png';
import dispMap from '../assets/HeroScene/dark_rock_disp_2k.exr';

function CameraRig({ playing }) {
  const vec = new THREE.Vector3();
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMouseMove = (e) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', onMouseMove);
    return () => window.removeEventListener('mousemove', onMouseMove);
  }, []);

  useFrame((state) => {
    if (!playing) {
      // Reset the clock each frame while waiting so fly-in always starts from t=0
      state.clock.elapsedTime = 0;
      state.camera.position.set(0, 5, 30);
      state.camera.lookAt(0, -1, -3);
      return;
    }
    const t = state.clock.elapsedTime;
    const targetZ = 5;

    // Fast lerp in the first 2 seconds (rushing through fog), then slow/settled
    const lerpSpeed = t < 2 ? 0.055 : 0.03;

    vec.set(mouse.current.x * 1.0, 0.5 + mouse.current.y * 0.6, targetZ);
    state.camera.position.lerp(vec, lerpSpeed);
    state.camera.lookAt(0, -1, -1);
  });

  return null;
}

/**
 * Lives inside the Canvas — uses useProgress from drei to detect when
 * all textures/loaders resolve, then calls onLoaded.
 */
function LoadingTracker({ onLoaded }) {
  const { active, progress } = useProgress();
  const firedRef = useRef(false);

  useEffect(() => {
    if (!active && progress === 100 && !firedRef.current) {
      firedRef.current = true;
      onLoaded(100);
    }
  }, [active, progress, onLoaded]);

  // Report live progress each frame
  useEffect(() => {
    onLoaded(progress);
  }, [progress, onLoaded]);

  return null;
}

function Terrain() {
  const [diffuse, arm, normal] = useTexture([diffMap, armMap, norMap]);
  const displacement = useLoader(EXRLoader, dispMap);

  useEffect(() => {
    [diffuse, arm, normal, displacement].forEach((tex) => {
      tex.repeat.set(2, 2);
      tex.offset.set(-0.5, -0.5);
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.needsUpdate = true;
    });
  }, [diffuse, arm, normal, displacement]);

  return (
    <mesh position={[2, -2.5, -8]} rotation={[-Math.PI / 2.8, 0, -0.35]}>
      <planeGeometry args={[120, 120, 256, 256]} />
      <meshStandardMaterial
        map={diffuse}
        aoMap={arm}
        normalMap={normal}
        displacementMap={displacement}
        displacementScale={3.5}
        color="#1a1a1a"
        roughness={1}
        metalness={0}
      />
    </mesh>
  );
}

export default function Atmosphere({ playing = false, onProgress, onLoaded }) {
  const handleProgress = (p) => {
    onProgress && onProgress(p);
    if (p === 100) onLoaded && onLoaded();
  };

  return (
    <div className="atmo-root">
      {/* The `playing` class triggers the CSS keyframe animation in Atmosphere.css */}
      <div className={`atmo-canvas-wrapper${playing ? ' playing' : ''}`}>
        {/* Camera starts deep in the fog (Z=30) and flies in to Z=5 */}
        <Canvas camera={{ position: [0, 5, 30], fov: 55 }}>
          <color attach="background" args={['#0e0e0e']} />
          <fog attach="fog" args={['#0e0e0e', 5, 22]} />
          <ambientLight intensity={200} />

          <Suspense fallback={null}>
            <Terrain />
            <EffectComposer>
              <Vignette eskil={false} offset={0.12} darkness={0.92} />
            </EffectComposer>
          </Suspense>

          <LoadingTracker onLoaded={handleProgress} />
          <CameraRig playing={playing} />
        </Canvas>
      </div>

      {/* CSS radial blur overlay — blurs everything EXCEPT the center ellipse */}
      <div className="atmo-radial-blur-overlay" />

      {/* Strong bottom shadow */}
      <div className="atmo-bottom-shadow" />

    </div>
  );
}
