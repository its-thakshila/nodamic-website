import { memo } from 'react'
import { LAYER_Z_INDEX } from '../../../config/hero.config'
import { useViewportProgress } from '../../../hooks/useViewportProgress'

/*
 * Layer 5 (z-50): ReflectionLayer
 * CSS-only soft diagonal reflections, glass sheen, and extremely subtle moving highlights.
 * Dynamically repositions to stay aligned with the product center across viewports.
 */
export default memo(function ReflectionLayer() {
  const { mobile: progress } = useViewportProgress()

  // Interpolate tracking parameters (relative offsets since animation provides base values)
  const left = -35 - (6 * progress)  // -35% -> -41%
  const top = -30 - (10 * progress)  // -30% -> -40%
  const angleOffset = -6 * progress  // 0deg -> -6deg (additive to the base -28deg animation)

  return (
    <div
      className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden select-none"
      style={{ zIndex: LAYER_Z_INDEX.reflection, opacity: 0.12, mixBlendMode: 'plus-lighter' }}
      aria-hidden="true"
    >
      {/* Layout wrapper: Handles responsive positioning without CSS animation conflicts */}
      <div
        className="absolute w-[170%] h-[60%] origin-center pointer-events-none"
        style={{
          left: `${left}%`,
          top: `${top}%`,
          transform: `rotate(${angleOffset}deg)`,
        }}
      >
        {/* Animation wrapper: Handles the base rotation and floating effect */}
        <div
          className="w-full h-full animate-glass-reflection pointer-events-none"
          style={{
            background: `
              linear-gradient(
                115deg,
                transparent 0%,
                transparent 35%,
                rgba(255, 255, 255, 0.35) 46%,
                rgba(255, 255, 255, 0.85) 50%,
                rgba(255, 255, 255, 0.35) 54%,
                transparent 65%,
                transparent 100%
              )
            `,
            filter: 'blur(110px)',
          }}
        />
      </div>
    </div>
  )
})
