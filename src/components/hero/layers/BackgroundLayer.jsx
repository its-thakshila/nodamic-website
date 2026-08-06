import { LAYER_Z_INDEX } from '../../../config/hero.config'

/*
 * Layer 0 (z-0): BackgroundLayer
 * Combines dark monochrome radial gradients and perimeter vignette using static CSS only.
 * Provides the immersive charcoal foundation without flat plain black.
 */
export default function BackgroundLayer() {
  return (
    <div
      className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden"
      style={{ zIndex: LAYER_Z_INDEX.background }}
      aria-hidden="true"
    >
      {/* Dark monochrome radial gradient foundation */}
      <div
        className="absolute inset-0 w-full h-full"
        style={{
          background: `
            radial-gradient(
              ellipse 80% 70% at 50% 32%,
              #181818 0%,
              #111111 38%,
              #090909 74%,
              #030303 100%
            )
          `,
        }}
      />

      {/* Static perimeter vignette framing */}
      <div
        className="absolute inset-0 w-full h-full"
        style={{
          background: `
            radial-gradient(
              circle at 50% 50%,
              transparent 55%,
              rgba(0, 0, 0, 0.5) 85%,
              rgba(0, 0, 0, 0.88) 100%
            )
          `,
          boxShadow: 'inset 0 0 150px 45px rgba(0, 0, 0, 0.65)',
        }}
      />
    </div>
  )
}
