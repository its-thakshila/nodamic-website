import * as THREE from 'three'

const DEG = Math.PI / 180

/* ─── Model Configuration ────────────────────────────────────────────────── */
export const MODEL_CONFIG = {
  path: import.meta.env.BASE_URL + 'models/Node1.glb',
  targetSize: 2.2,
  baseRotation: {
    x: 1.2,
    y: 0.38,
    z: -0.4,
  },
  mouseSensitivity: {
    x: 0.07, // horizontal axis (drives rotation.y)
    y: 0.06, // vertical axis (drives rotation.x)
  },
  lerpFactor: 0.04,
  materials: {
    metalnessFloor: 0.1,
    emissiveIntensity: 2.0,
    emissiveColor: '#ffffff',
  },
}

/* ─── HDRI & Environment Configuration ───────────────────────────────────── */
// Raw Blender values converted to Three.js axes & radians
const BLENDER_HDRI = {
  x: 3.1 * DEG,
  y: 293 * DEG,
  z: 88.5 * DEG,
}

export const ENVIRONMENT_CONFIG = {
  path: import.meta.env.BASE_URL + 'textures/white_home_studio_1k.hdr',
  intensity: 3.0,
  // Automatically compensate HDRI rotation against the model's resting angle
  rotation: {
    x: BLENDER_HDRI.x - MODEL_CONFIG.baseRotation.x,
    y: BLENDER_HDRI.y - MODEL_CONFIG.baseRotation.y,
    z: BLENDER_HDRI.z - MODEL_CONFIG.baseRotation.z,
  },
}

/* ─── Camera & Rendering Configuration ───────────────────────────────────── */
export const CAMERA_CONFIG = {
  position: [0, 0.1, 4.8],
  fov: 40,
  near: 0.1,
  far: 100,
}

export const GL_CONFIG = {
  antialias: true,
  toneMapping: THREE.ACESFilmicToneMapping,
  toneMappingExposure: 0.85,
  outputColorSpace: THREE.SRGBColorSpace,
  powerPreference: 'high-performance',
  alpha: true,
}

/* ─── UI & Typography Content ────────────────────────────────────────────── */
export const UI_CONTENT = {
  eyebrow: 'nodamic Node 1',
  headingTitle: 'Unthink the',
  headingSubtitle: 'Ordinary.',
  ctaButtonText: 'SCROLL TO DISCOVER',
  bodyParagraph: 'Creating intelligent, minimalist technology products that redefine everyday experiences.',
  badgeTitle: 'Smart Socket',
  badgeSubtitle: 'Wi-Fi Ready',
}
