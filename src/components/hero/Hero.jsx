import { useState } from 'react'
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

/*
 * Cinematic Layered Hero Architecture
 * Isolated stacking context ensuring strict rendering hierarchy from Layer 0 to Layer 7.
 */
export default function Hero() {
  const [startAnimations, setStartAnimations] = useState(false)

  return (
    <section className="relative w-full h-screen overflow-hidden bg-[#0a0a0a] isolate">
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
        <HeroScene startAnimations={startAnimations} />
      </WebGLErrorBoundary>

      {/* Layer 5 (z-50): CSS atmospheric soft diagonal tempered glass reflections */}
      <ReflectionLayer />

      {/* Layer 6 (z-60): All interactive elements (Logo, Nav, Title, Paragraph, CTA) */}
      <OverlayUI isLoaded={startAnimations} />

      {/* Layer 7 (z-70): Unifying foreground film grain (~1.8% opacity) */}
      <ForegroundGrainLayer />

      <LoadingScreen onNearFinish={() => setStartAnimations(true)} />
    </section>
  )
}
