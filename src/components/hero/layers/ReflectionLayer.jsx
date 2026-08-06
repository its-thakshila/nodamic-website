import { LAYER_Z_INDEX } from '../../../config/hero.config'

/*
 * Layer 5 (z-50): ReflectionLayer
 * CSS-only soft diagonal reflections, glass sheen, and extremely subtle moving highlights.
 * Affects only the atmosphere above the 3D model, with pointer-events: none.
 */
export default function ReflectionLayer() {
  return (
    <div
      className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden select-none"
      style={{ zIndex: LAYER_Z_INDEX.reflection, opacity: 0.12, mixBlendMode: 'plus-lighter' }}
      aria-hidden="true"
    >
      {/* Large blurred diagonal studio light reflection strip */}
      <div
        className="absolute -left-[35%] -top-[30%] w-[170%] h-[60%] origin-center animate-glass-reflection pointer-events-none"
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
          transform: 'rotate(-28deg)',
        }}
      />
    </div>
  )
}
