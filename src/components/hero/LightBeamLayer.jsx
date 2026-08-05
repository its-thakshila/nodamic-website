import { LAYER_Z_INDEX } from '../../config/hero.config'

/*
 * Layer 2 (z-20): LightBeamLayer
 * Brighter, near-bar studio light shaft entering diagonally from top-right.
 * Engineered using a narrow-span conic gradient (spanning ~28 degrees instead of 80+)
 * and reduced blur radius to achieve a focused, sharp-edged bar silhouette that
 * avoids wide conical fanning while staying anchored to the ceiling corner.
 */
export default function LightBeamLayer() {
  return (
    <div
      className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden select-none"
      style={{ zIndex: LAYER_Z_INDEX.lightBeam, mixBlendMode: 'screen' }}
      aria-hidden="true"
    >
      {/* Oversized inner animation buffer (-inset-10 / w-120%) prevents right-edge seam gaps during drift */}
      <div className="absolute -left-[10%] -top-[10%] w-[120%] h-[120%] pointer-events-none animate-beam-drift">
        {/* Layer 1: Ambient elliptical radial glow around emitting corner */}
        <div
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{
            background: `
              radial-gradient(
                ellipse 65% 65% at 92% 8%,
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
                from 205deg at 92% 8%,
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
            maskImage: 'radial-gradient(ellipse 90% 90% at 92% 8%, black 0%, black 50%, rgba(0, 0, 0, 0.4) 75%, transparent 92%)',
            WebkitMaskImage: 'radial-gradient(ellipse 90% 90% at 92% 8%, black 0%, black 50%, rgba(0, 0, 0, 0.4) 75%, transparent 92%)',
          }}
        />
      </div>
    </div>
  )
}
