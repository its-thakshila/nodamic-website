import { LAYER_Z_INDEX } from '../../../config/hero.config'

// Tiny tileable monochrome film grain texture
const NOISE_TEXTURE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwAgMAAAAjsGOJAAAADFBMVEUAAAD///8AAAAAAACO+bN6AAAAAnRSTlMAYT/5/vUAAABqSURBVHjaY2AAgzg4GDBxMDLwcQDxOZhg4uJkAhLzGEHE/0cEEI9/hBEsJoYYH5C9P0PMMh6Y2v/g/rG/jBmsPjAw7wWbJQbT+w5ijAkm1/oW1D0w9RkFf0H2FwAz9z/I5gVfGBgYAADdOC5q60g+lAAAAABJRU5ErkJggg=='

/*
 * Layer 7 (z-70): ForegroundGrainLayer
 * Very subtle film grain at ~1.6% opacity that unifies the entire foreground composition
 * across typography, atmospheric reflections, and the 3D showcase.
 * pointer-events: none ensures unblocked UI interactivity.
 */
export default function ForegroundGrainLayer() {
  return (
    <div
      className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.018]"
      style={{
        zIndex: LAYER_Z_INDEX.foregroundGrain,
        backgroundImage: `url(${NOISE_TEXTURE})`,
        backgroundRepeat: 'repeat',
      }}
      aria-hidden="true"
    />
  )
}
