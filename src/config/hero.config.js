import * as THREE from 'three'

const DEG = Math.PI / 180

/* ─── Layer Stacking Order & Z-Index Architecture ─────────────────────────── */
export const LAYER_Z_INDEX = {
  background: 0,      // Layer 0 (z-0): Static monochrome radial foundation & vignette
  noise: 10,          // Layer 1 (z-10): Subtle base procedural texture grain
  lightBeam: 20,      // Layer 2 (z-20): Studio softbox diagonal cinematic beam
  radialGlow: 30,     // Layer 3 (z-30): Product silhouette separation glow
  heroScene: 40,      // Layer 4 (z-40): R3F 3D showcase canvas
  reflection: 50,     // Layer 5 (z-50): Tempered glass atmospheric reflection sheen
  overlayUI: 60,      // Layer 6 (z-60): Interactive brand, navigation, typography & CTA
  foregroundGrain: 70 // Layer 7 (z-70): Unifying film grain composition texture
}

/* ─── Debug & Feature Flags for Rendering Isolation ──────────────────────── */
export const DEBUG_FLAGS = {
  toneMapping: 'ACESFilmic', // 'ACESFilmic' or 'AgX'
  enableVignette: true,
  enableBloom: true,
  enableColorGrading: true, // Toggles HueSaturation & BrightnessContrast
  enableNoise: true,
  enableSMAA: true,
  useHighResHDRI: false, // Toggles between 1k and 4k HDRI (fallback to 1k if 4k missing)
  useSplitGridLight: true, // Toggles between the 2x4 grid and a single large rect light
  forceFixedDPR: true, // Disables AdaptiveDpr and locks Canvas DPR to 2.0
}

/* ─── Animation Timing ─────────────────────────────────────────────────────── */
export const ANIMATION_TIMING = {
  introDelay: 0,      // Animation begins immediately as the loading screen starts fading out
  textDelay: 0.4,     // Typography fades in as the model builds momentum
  ctaDelay: 0.7,      // CTA button appears last for a fluid 3-stage stagger
  duration: 1.5,      // Unified duration for the animations themselves
}

/* ─── Model Configuration ────────────────────────────────────────────────── */
export const MODEL_CONFIG = {
  path: import.meta.env.BASE_URL + 'models/Node1.glb',
  targetSize: 2.2,
  position: [0, -0.15, 0],
  baseRotation: {
    x: 1.2,
    y: 0.38,
    z: -0.4,
  },
  mouseSensitivity: {
    x: 0.07,
    y: 0.06,
  },
  lerpFactor: 0.04,
  materials: {
    /*
     * REFLECTION BLUR & SOFTBOX DIFFUSION:
     * - Increase acrylicRoughness & clearcoatRoughness (e.g. 0.15 to 0.22) to blur and soften reflected light tile edges!
     * - Lower values (< 0.05) result in sharp, mirror-crisp rectangular light boundaries.
     */
    acrylicRoughness: 0.1, // Blurs reflected studio grid tiles into smoothly diffused highlights
    metalnessFloor: 0.15,
    roughnessMultiplier: 0.65,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08, // Softens upper clearcoat reflection sheen
    emissiveIntensity: 3.2,
    emissiveColor: '#ffffff',
  },
}



/* ─── HDRI & Environment Configuration ───────────────────────────────────── */
const BLENDER_HDRI = {
  x: 0 * DEG,
  y: 0 * DEG,
  z: 0 * DEG,
}

export const ENVIRONMENT_CONFIG = {
  path: import.meta.env.BASE_URL + 'textures/studio_kominka_01_2k.hdr',
  intensity: 1.5,
  rotation: {
    x: -1.00,
    y: -0.75,
    z: -1.09,
  },
}

/* ─── Complete Studio Photography Lighting Setup ─────────────────────────── */
export const STUDIO_LIGHTS = {
  /*
   * LOCALIZED RECESSED SOCKET FILL LIGHT:
   * - A soft, high-penumbra spot light that casts a grazing illumination across ONLY the right half
   *   of the circular center socket feature, simulating light catching the inner slope from the top-right beam.
   * - Short distance & physical quadratic decay prevent unwanted spill onto outer faces, left side, or underside.
   */
  recessLight: {
    position: [4.8, 2, 0.5], // Farther right at a grazing side-angle so zero glare reflects into camera from flat glass
    target: [0, 0, 0.1],   // Aimed precisely at the physical center of the circular socket area
    intensity: 1000.0,           // Increased to compensate for inverse-square decay over the ~5m journey
    angle: 0.28,               // Compact ~16-degree beam cone focuses strictly on the circular recess
    penumbra: 1.0,             // 100% edge feathering eliminates hard spotlight boundaries
    distance: 5.8,             // Adjusted effective range so light illuminates right rim and gracefully fades out before left side
    decay: 2.0,                // Physically correct inverse-square attenuation
    color: '#ffffff',
    castShadow: false,          // Preserves natural depth within socket holes
    shadowMapSize: 1024,
    shadowBias: -0.0001,
  },
  rimLight: {
    position: [-3.5, 1.2, -4.5],
    intensity: 10,
    color: '#e0f2fe',
  },
  overheadLight: {
    position: [0.5, 7.0, 0.5],
    intensity: 15,
    color: '#ffffff',
  },
  // Hemisphere light starves underside of bounce while illuminating top facets
  hemisphereLight: {
    skyColor: '#ffffff',
    groundColor: '#ffffff',
    intensity: 10,
  },
  contactShadows: {
    position: [0, -1.25, 0],
    opacity: 0.82,
    scale: 50,
    blur: 1.6,
    far: 3.5,
    color: '#000000',
  },
}

/* ─── Camera & Rendering Configuration ───────────────────────────────────── */
export const CAMERA_CONFIG = {
  position: [0, 0.1, 6.2],
  fov: 30,
  near: 0.1,
  far: 100,
}

export const GL_CONFIG = {
  antialias: true,
  stencil: false,
  depth: true,
  precision: 'highp',
  toneMapping: THREE.ACESFilmicToneMapping,
  toneMappingExposure: 0.95,
  outputColorSpace: THREE.SRGBColorSpace,
  powerPreference: 'high-performance',
  alpha: true,
}

/* ─── Post-Processing Configuration ──────────────────────────────────────── */
export const POST_PROCESSING_CONFIG = {
  bloom: {
    intensity: 0.78,
    luminanceThreshold: 0.86,
    luminanceSmoothing: 0.9,
    radius: 0.65,
  },
  ssao: {
    radius: 0.35,
    intensity: 2.4,
    distanceFalloff: 0.8,
  },
  colorGrade: {
    saturation: -0.95, // Near-monochrome while preserving natural optical depth
    brightness: 0.02,
    contrast: 0.18,    // Prevents flat grayscale by expanding halftones and reflection speculars
  },
  vignette: {
    offset: 0.3,
    darkness: 0.78,
  },
  noise: {
    opacity: 0.022,
  },
}

/* ─── UI & Typography Content ────────────────────────────────────────────── */
export const UI_CONTENT = {
  headingTitle: 'Unthink the',
  headingSubtitle: 'Ordinary.',
  ctaButtonText: 'SCROLL TO DISCOVER',
  bodyParagraph: {
    desktop: 'Creating intelligent, minimalist\ntechnology products that redefine\neveryday experiences.',
    tablet: 'Creating intelligent, minimalist technology products\nthat redefine everyday experiences.',
    mobile: 'Creating intelligent, minimalist technology products that redefine everyday experiences.',
  },
}
