import { useState, useCallback } from 'react'
import BackgroundLayer from './layers/BackgroundLayer'
import NoiseLayer from './layers/NoiseLayer'
import LightBeamLayer from './layers/LightBeamLayer'
import RadialGlowLayer from './layers/RadialGlowLayer'
import HeroScene from './scene/HeroScene'
import ReflectionLayer from './layers/ReflectionLayer'
import OverlayUI from './ui/OverlayUI'
import ForegroundGrainLayer from './layers/ForegroundGrainLayer'
import WebGLErrorBoundary from './scene/WebGLErrorBoundary'
import LoadingScreen from './ui/LoadingScreen'
// import { DiagnosticProvider } from './DiagnosticContext'
// import MobileDiagnosticUI from './MobileDiagnosticUI'

/*
 * Cinematic Layered Hero Architecture
 * Isolated stacking context ensuring strict rendering hierarchy from Layer 0 to Layer 7.
 */
export default function Hero() {
  const [isSceneReady, setIsSceneReady] = useState(false)
  const [isModelRendered, setIsModelRendered] = useState(false)

  const handleSceneReady = useCallback(() => {
    console.log('[DEBUG] Hero.jsx: handleSceneReady called. isSceneReady becoming true.')
    setIsSceneReady(true)
  }, [])

  const handleModelReady = useCallback(() => {
    console.log('[DEBUG] Hero.jsx: handleModelReady called. isModelRendered becoming true.')
    setIsModelRendered(true)
  }, [])

  return (
    <>
      <section className="relative w-full h-[100svh] lg:h-screen overflow-hidden bg-[#0a0a0a] isolate">
        {/* Layer 0 (z-0): Dark monochrome radial gradients & perimeter vignette */}
        <BackgroundLayer />

        {/* Layer 1 (z-10): Very subtle procedural base texture grain */}
        <NoiseLayer />

        {/* Layer 2 (z-20): Large cinematic studio softbox light beam with drift */}
        <LightBeamLayer />

        {/* Layer 3 (z-30): Soft separation glow positioned directly behind the product */}
        <RadialGlowLayer />

        {/* Layer 4 (z-40): React Three Fiber showcase canvas (transparent background) */}
        <WebGLErrorBoundary>
          <HeroScene startAnimations={isSceneReady} onModelReady={handleModelReady} />
        </WebGLErrorBoundary>

        {/* Layer 5 (z-50): CSS atmospheric soft diagonal tempered glass reflections */}
        <ReflectionLayer />

        {/* Layer 6 (z-60): All interactive elements (Logo, Nav, Title, Paragraph, CTA) */}
        <OverlayUI isLoaded={isSceneReady} />

        {/* Layer 7 (z-70): Unifying foreground film grain (~1.8% opacity) */}
        <ForegroundGrainLayer />

        <LoadingScreen onReady={handleSceneReady} isModelRendered={isModelRendered} />

        {/* <MobileDiagnosticUI /> */}
      </section>
    </>
  )
}
