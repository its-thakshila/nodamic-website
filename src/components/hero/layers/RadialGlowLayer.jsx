import { memo } from 'react'
import { LAYER_Z_INDEX } from '../../../config/hero.config'
import { useViewportProgress } from '../../../hooks/useViewportProgress'

/*
 * Layer 3 (z-30): RadialGlowLayer
 * Soft glow positioned directly behind the product silhouette.
 * Dynamically tracks the product's translation and scaling on smaller viewports.
 */
export default memo(function RadialGlowLayer() {
  const { mobile: progress } = useViewportProgress()

  // Interpolate tracking parameters
  const top = 53 - (15 * progress)  // 53% desktop -> 38% mobile
  const left = 50 - (5 * progress)  // 50% desktop -> 45% mobile
  const size = 50 - (14 * progress) // 50vw desktop -> 36vw mobile

  return (
    <div
      className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden select-none"
      style={{ zIndex: LAYER_Z_INDEX.radialGlow, mixBlendMode: 'screen' }}
      aria-hidden="true"
    >
      {/* Layout wrapper: Handles responsive positioning without CSS animation conflicts */}
      <div
        className="absolute -translate-x-1/2 -translate-y-1/2"
        style={{
          top: `${top}%`,
          left: `${left}%`,
          width: `${size}vw`,
          height: `${size}vw`,
        }}
      >
        {/* Animation wrapper: Handles the blob float effect */}
        <div
          className="w-full h-full max-w-[650px] max-h-[650px] rounded-full pointer-events-none animate-blob-left"
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
    </div>
  )
})
