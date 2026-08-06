import { LAYER_Z_INDEX } from '../../../config/hero.config'

// Tiny tileable monochrome noise image texture
const NOISE_TEXTURE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwAgMAAAAjsGOJAAAADFBMVEUAAAD///8AAAAAAACO+bN6AAAAAnRSTlMAYT/5/vUAAABqSURBVHjaY2AAgzg4GDBxMDLwcQDxOZhg4uJkAhLzGEHE/0cEEI9/hBEsJoYYH5C9P0PMMh6Y2v/g/rG/jBmsPjAw7wWbJQbT+w5ijAkm1/oW1D0w9RkFf0H2FwAz9z/I5gVfGBgYAADdOC5q60g+lAAAAABJRU5ErkJggg=='

/*
 * Layer 1 (z-10): NoiseLayer
 * Very subtle procedural base grain at 3% opacity covering entire viewport.
 * pointer-events: none prevents interaction blocking.
 */
export default function NoiseLayer() {
  return (
    <div
      className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.032]"
      style={{
        zIndex: LAYER_Z_INDEX.noise,
        backgroundImage: `url(${NOISE_TEXTURE})`,
        backgroundRepeat: 'repeat',
      }}
      aria-hidden="true"
    />
  )
}
