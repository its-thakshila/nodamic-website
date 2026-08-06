import { memo } from 'react'
import { LAYER_Z_INDEX } from '../../../config/hero.config'
import { useViewportProgress } from '../../../hooks/useViewportProgress'

/*
 * Layer 2 (z-20): LightBeamLayer
 * Brighter, near-bar studio light shaft entering diagonally from top-right.
 * Dynamically re-aims and adjusts origin to continuously illuminate the product center.
 */
export default memo(function LightBeamLayer() {
  const { mobile, desktop } = useViewportProgress()

  // Interpolate tracking parameters
  // Because narrower screens are proportionally taller, the physical pixel vector from the top-right 
  // corner to the center becomes steeper. Thus, the beam must continuously incline DOWN (more vertical)
  // starting all the way from 1920px.
  
  const baseAngle = 205
  const desktopAngleReduction = 15 * desktop // 1920px -> 1024px (205 -> 190)
  const mobileAngleReduction = 17 * mobile   // 1024px -> 430px (190 -> 173)
  const angle = baseAngle - desktopAngleReduction - mobileAngleReduction
  
  const ox = 92 + (4 * mobile)      // 92% -> 96% (shift origin slightly right)
  const oy = 8 - (6 * mobile)       // 8% -> 2% (shift origin slightly up)
  const origin = `${ox}% ${oy}%`

  return (
    <div
      className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden select-none"
      style={{ zIndex: LAYER_Z_INDEX.lightBeam, mixBlendMode: 'screen' }}
      aria-hidden="true"
    >
      <div className="absolute -left-[10%] -top-[10%] w-[120%] h-[120%] pointer-events-none animate-beam-drift">
        {/* Layer 1: Ambient elliptical radial glow around emitting corner */}
        <div
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{
            background: `
              radial-gradient(
                ellipse 65% 65% at ${origin},
                rgba(240, 245, 255, 0.32) 0%,
                rgba(225, 232, 240, 0.15) 35%,
                rgba(205, 215, 225, 0.04) 62%,
                transparent 88%
              )
            `,
          }}
        />

        {/* Layer 2: Narrow-span conic gradient producing a sharp, bright near-bar light shaft */}
        <div
          className="absolute -right-[22%] -top-[22%] w-[145%] h-[145%] pointer-events-none"
          style={{
            background: `
              conic-gradient(
                from ${angle}deg at ${origin},
                transparent 0deg,
                transparent 12deg,
                rgba(235, 242, 250, 0.08) 18deg,
                rgba(245, 250, 255, 0.35) 26deg,
                rgba(255, 255, 255, 0.48) 33deg,
                rgba(245, 250, 255, 0.35) 40deg,
                rgba(235, 242, 250, 0.08) 48deg,
                transparent 54deg,
                transparent 360deg
              )
            `,
            filter: 'blur(26px)',
            maskImage: `radial-gradient(ellipse 90% 90% at ${origin}, black 0%, black 50%, rgba(0, 0, 0, 0.4) 75%, transparent 92%)`,
            WebkitMaskImage: `radial-gradient(ellipse 90% 90% at ${origin}, black 0%, black 50%, rgba(0, 0, 0, 0.4) 75%, transparent 92%)`,
          }}
        />
      </div>
    </div>
  )
})
