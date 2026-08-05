import { LAYER_Z_INDEX } from '../../config/hero.config'

/*
 * Layer 3 (z-30): RadialGlowLayer
 * Soft glow positioned directly behind the product silhouette (not center screen)
 * to carve out background depth separation without competing with foreground materials.
 */
export default function RadialGlowLayer() {
  return (
    <div
      className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden select-none"
      style={{ zIndex: LAYER_Z_INDEX.radialGlow, mixBlendMode: 'screen' }}
      aria-hidden="true"
    >
      {/* Positioned relative to product center-mass (slightly lower than vertical center) */}
      <div
        className="absolute left-1/2 top-[53%] -translate-x-1/2 -translate-y-1/2 w-[50vw] max-w-[650px] h-[50vw] max-h-[650px] rounded-full pointer-events-none animate-blob-left"
        style={{
          background: `
            radial-gradient(
              circle at center,
              rgba(255, 255, 255, 0.065) 0%,
              rgba(255, 255, 255, 0.02) 45%,
              rgba(255, 255, 255, 0.005) 70%,
              transparent 90%
            )
          `,
          filter: 'blur(85px)',
        }}
      />
    </div>
  )
}
