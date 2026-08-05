import BackgroundLayer from './BackgroundLayer'
import NoiseLayer from './NoiseLayer'
import LightBeamLayer from './LightBeamLayer'
import RadialGlowLayer from './RadialGlowLayer'
import HeroScene from './HeroScene'
import ReflectionLayer from './ReflectionLayer'
import OverlayUI from './OverlayUI'
import ForegroundGrainLayer from './ForegroundGrainLayer'
import WebGLErrorBoundary from '../WebGLErrorBoundary'

/*
 * Cinematic Layered Hero Architecture
 * Isolated stacking context ensuring strict rendering hierarchy from Layer 0 to Layer 7.
 */
export default function Hero() {
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
        <HeroScene />
      </WebGLErrorBoundary>

      {/* Layer 5 (z-50): CSS atmospheric soft diagonal tempered glass reflections */}
      <ReflectionLayer />

      {/* Layer 6 (z-60): All interactive elements (Logo, Nav, Title, Paragraph, CTA) */}
      <OverlayUI />

      {/* Layer 7 (z-70): Unifying foreground film grain (~1.8% opacity) */}
      <ForegroundGrainLayer />
    </section>
  )
}
