import BackgroundLayer from './BackgroundLayer'
import LightingLayer from './LightingLayer'
import HeroScene from './HeroScene'
import OverlayUI from './OverlayUI'
import NoiseLayer from './NoiseLayer'
import WebGLErrorBoundary from '../WebGLErrorBoundary'

export default function Hero() {
  return (
    <section className="relative w-full h-screen overflow-hidden bg-[#0a0a0a]">
      <BackgroundLayer />
      <LightingLayer />
      <WebGLErrorBoundary>
        <HeroScene />
      </WebGLErrorBoundary>
      <OverlayUI />
      <NoiseLayer />
    </section>
  )
}
