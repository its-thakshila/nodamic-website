import { useState, useCallback, useRef } from 'react';
import NodeCanvas from './components/NodeCanvas';
import Atmosphere from './components/Atmosphere';
import HeroContent from './components/HeroContent';
import './App.css';

// Duration of the cinematic camera fly-in (must match CSS animation in Atmosphere.css)
const CINEMATIC_DURATION_MS = 3600;

export default function App() {
  // Phases:
  //   'loading'   — assets loading, black overlay + bar visible, camera frozen
  //   'cinematic' — loaded, black overlay fading, camera flies in
  //   'spawning'  — cinematic done, nodes start appearing
  const [phase, setPhase] = useState('loading');
  const cinematicTimer = useRef(null);

  const handleLoaded = useCallback(() => {
    if (cinematicTimer.current) return; // prevent double-firing
    cinematicTimer.current = 'compiling'; // lock immediately

    // Give WebGL 150ms to compile shaders and upload textures to the GPU
    // behind the black overlay before we fade it out. This prevents the
    // 1-frame white flash of empty texture placeholders.
    setTimeout(() => {
      setPhase('cinematic');

      cinematicTimer.current = setTimeout(() => {
        setPhase('spawning');
      }, CINEMATIC_DURATION_MS);
    }, 150);
  }, []);

  const isCinematic = phase === 'cinematic' || phase === 'spawning';

  return (
    <div className="app-root">
      {/* 3D terrain — camera frozen until playing=true */}
      <Atmosphere
        playing={isCinematic}
        onLoaded={handleLoaded}
      />

      {/* Node graph — hidden until cinematic completes */}
      <NodeCanvas
        className="node-canvas"
        spawning={phase === 'spawning'}
      />

      {/* Text and Logo content */}
      <HeroContent visible={phase === 'spawning'} />

      {/* Black overlay — sits on top of canvas, fades out when cinematic starts.
          This guarantees the user sees the full cinematic from frame 0. */}
      <div className={`scene-overlay${isCinematic ? ' fading' : ''}`} />
    </div>
  );
}
