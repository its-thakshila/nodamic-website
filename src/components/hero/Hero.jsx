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

import { ScrollProvider } from './ScrollContext'
import { MODEL_CONFIG, DEBUG_FLAGS } from '../../config/hero.config'
import ResponsiveDebugger from './debug/ResponsiveDebugger'

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
    <ScrollProvider totalScreens={5}>
      {MODEL_CONFIG.debugResponsive && <ResponsiveDebugger />}
      <section className="relative w-full h-[100svh] lg:h-screen overflow-hidden bg-[#0a0a0a] isolate">
        {/* Layer 0 (z-0): Dark monochrome radial gradients & perimeter vignette */}
        {DEBUG_FLAGS.showBackgroundLayer && <BackgroundLayer />}

        {/* Layer 1 (z-10): Very subtle procedural base texture grain */}
        {DEBUG_FLAGS.showNoiseLayer && <NoiseLayer />}

        {/* Layer 2 (z-20): Large cinematic studio softbox light beam with drift */}
        {DEBUG_FLAGS.showLightBeamLayer && <LightBeamLayer />}

        {/* Layer 3 (z-30): Soft separation glow positioned directly behind the product */}
        {DEBUG_FLAGS.showRadialGlowLayer && <RadialGlowLayer />}

        {/* Layer 4 (z-40): React Three Fiber showcase canvas (transparent background) */}
        <WebGLErrorBoundary>
          <HeroScene startAnimations={isSceneReady} onModelReady={handleModelReady} />
        </WebGLErrorBoundary>

        {/* Layer 5 (z-50): CSS atmospheric soft diagonal tempered glass reflections */}
        {DEBUG_FLAGS.showReflectionLayer && <ReflectionLayer />}

        {/* Layer 6 (z-60): All interactive elements (Logo, Nav, Title, Paragraph, CTA) */}
        {DEBUG_FLAGS.showOverlayUI && <OverlayUI isLoaded={isSceneReady} />}

        {/* Layer 7 (z-70): Unifying foreground film grain (~1.8% opacity) */}
        {DEBUG_FLAGS.showForegroundGrainLayer && <ForegroundGrainLayer />}

        <LoadingScreen onReady={handleSceneReady} isModelRendered={isModelRendered} />

        {/* <MobileDiagnosticUI /> */}
        {/* Layer 8 (z-80): Landscape Blocker for Mobile Phones */}
        <div className="hidden landscape:[@media(max-height:510px)]:flex fixed inset-0 z-[9999] bg-[#0a0a0a] flex-col items-center justify-center px-6 text-center">
          <div className="w-12 h-12 mb-6 text-white/50 animate-pulse">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </div>
          <h3 className="text-xl font-medium text-white/90 mb-2 font-outfit tracking-tight">Please rotate your device</h3>
          <p className="text-sm text-white/50 font-outfit max-w-[280px]">
            This experience is designed to be viewed in portrait mode on mobile devices.
          </p>
        </div>
      </section>
    </ScrollProvider>
  )
}
