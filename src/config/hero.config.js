import * as THREE from 'three'

const DEG = Math.PI / 180

/* --- Shared Breakpoint Tokens -------------------------------------------
 * Single source of truth for all numeric breakpoint values.
 * Consumed by: useViewportProgress, Node1Model (isMobile), tailwind.config.js (xs).
 * Mirrors the Tailwind screen config - keep in sync if screens change.
 * ------------------------------------------------------------------------- */
export const BREAKPOINTS = {
  xs: 480,   // Large phones / phablets  (xs: in Tailwind)
  sm: 640,   // Small tablets / landscape phones (sm: in Tailwind)
  md: 768,   // Tablet portrait start    (md: in Tailwind)
  lg: 1024,   // Tablet landscape / layout switch (lg: in Tailwind)
  xl: 1280,   // Desktop                 (xl: in Tailwind)
  '2xl': 1440,  // Wide desktop            (2xl: in Tailwind)
  '3xl': 1920,  // Ultra-wide / reference  (used by useViewportProgress)
}

/* ------------------------------------------------------------------------- */
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

/* ------------------------------------------------------------------------- */
export const DEBUG_FLAGS = {
  toneMapping: 'ACESFilmic', // 'ACESFilmic' or 'AgX'
  enableVignette: true,
  enableBloom: true,
  enableColorGrading: true, // Toggles HueSaturation & BrightnessContrast
  enableNoise: true,
  enableSMAA: true,
  useHighResHDRI: false, // Toggles between 1k and 4k HDRI (fallback to 1k if 4k missing)
  useSplitGridLight: true, // Toggles between the 2x4 grid and a single large rect light
  forceFixedDPR: false, // Disables AdaptiveDpr and locks Canvas DPR to 2.0

  // Manual Layer Toggles for visual debugging
  showBackgroundLayer: true,
  showNoiseLayer: true,
  showLightBeamLayer: true,
  showRadialGlowLayer: true,
  showReflectionLayer: true,
  showOverlayUI: true,
  showForegroundGrainLayer: true,
}

/* ------------------------------------------------------------------------- */
export const ANIMATION_TIMING = {
  introDelay: 0.4,    // Animation waits for the browser to stabilize and loading screen to fade
  textDelay: 0.8,     // Typography fades in as the model builds momentum
  ctaDelay: 1.1,      // CTA button appears last for a fluid 3-stage stagger
  duration: 1.5,      // Unified duration for the animations themselves
}

/* ------------------------------------------------------------------------- */
export const MODEL_CONFIG = {
  debugResponsive: false, // Enables the Leva interactive keyframe recording UI
  path: import.meta.env.BASE_URL + 'models/Node1.glb',
  targetSize: 2.2,
  // Fallback defaults if screen tracking is off
  position: [0, -0.15, 0],
  baseRotation: {
    x: 1.2,
    y: 0.38,
    z: -0.4,
  },
  screens: [
    {
      // Screen 0: Initial Hero
      position: [0, -0.15, 0],
      baseRotation: {
        x: 1.2,
        y: 0.38,
        z: -0.4,
      },
      mobileConfig: {
        scale: { phase1Target: 0.90, minScale: 0.70 },
        viewOffset: { maxOffsetX: 0.05, maxOffsetY: 0.05 }
      }
    },
    {
      // Screen 1: Intermediate
      position: [1.8, -0.25, -0.5],
      baseRotation: {
        x: 1.2,
        y: -0.38,
        z: 0.6,
      },
      mobileConfig: {
        scale: { phase1Target: 0.90, minScale: 1 },
        viewOffset: { maxOffsetX: 0.50, maxOffsetY: -0.25 } // custom 2D Viewport shift (32% left)
      }
    },
    {
      // Screen 2: Final Scrolled Down
      position: [0.5, -0.2, -1.5],
      baseRotation: {
        x: 1.2,
        y: -0.25,
        z: 0.4 - (Math.PI * 2), // Full 360 rotation around Z axis
      },
      mobileConfig: {
        scale: { phase1Target: 0.90, minScale: 0.80, phase2Start: 1300 },
        viewOffset: { minOffsetX: -0.18, minOffsetY: 0.10, maxOffsetX: 0.15, maxOffsetY: 0.10, breakpoint: 1300 },
        snapMobileOnPortrait1024: true,
        responsiveKeyframes: [
          { width: 2560, height: 1440, offsetX: 0.04, offsetY: 0, scale: 1 },
          { width: 1920, height: 1080, offsetX: -0.01, offsetY: 0, scale: 1 },
          { width: 1440, height: 900, offsetX: -0.01, offsetY: 0, scale: 0.96 },
          { width: 1366, height: 1024, offsetX: 0.01, offsetY: 0, scale: 0.85 },
          { width: 1300, height: 731, offsetX: -0.05, offsetY: -0.01, scale: 0.97 },
          { width: 1300, height: 730, offsetX: -0.18, offsetY: -0.01, scale: 1.01 },
          { width: 1299, height: 731, offsetX: -0.19, offsetY: 0.07, scale: 0.9 },
          { width: 1280, height: 800, offsetX: -0.18, offsetY: 0.06, scale: 0.92 },
          { width: 1024, height: 1366, offsetX: -0.03, offsetY: 0, scale: 0.81 },
          { width: 1024, height: 768, offsetX: -0.15, offsetY: 0.04, scale: 0.96 },
          { width: 1024, height: 600, offsetX: -0.19, offsetY: -0.05, scale: 1.07 },
          { width: 768, height: 1024, offsetX: 0.08, offsetY: 0.06, scale: 0.96 },
          { width: 430, height: 932, offsetX: 0.15, offsetY: 0.08, scale: 0.77 },
          { width: 390, height: 844, offsetX: 0.15, offsetY: 0.1, scale: 0.77 },
          { width: 320, height: 568, offsetX: 0.14, offsetY: 0.08, scale: 0.84 }
        ]
      }
    },
    {
      // Screen 3: Our Stories (Model drops & fades out)
      position: [-5.0, -3.0, -1.5],
      baseRotation: {
        x: 1.2,
        y: 0.38,
        z: -0.9 - (Math.PI * 2),
      },
      mobileConfig: {
        scale: { phase1Target: 0.0, minScale: 0.0, phase2Start: 1300 },
        viewOffset: { maxOffsetX: 0, maxOffsetY: 0 }
      }
    },
    {
      // Screen 4: Who's Behind It (Model remains faded out)
      position: [-5.0, -3.0, -1.5],
      baseRotation: {
        x: 1.2,
        y: 0.38,
        z: -0.9 - (Math.PI * 2),
      },
      mobileConfig: {
        scale: { phase1Target: 0.0, minScale: 0.0, phase2Start: 1300 },
        viewOffset: { maxOffsetX: 0, maxOffsetY: 0 }
      }
    }
  ],
  mobileConfig: {
    // Global defaults (used for breakpoints)
    scale: {
      phase1Start: 1520,
      phase2Start: 1024,
      minBreakpoint: 430,
    },
    viewOffset: {
      breakpoint: 1024,
    }
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



/* ------------------------------------------------------------------------- */
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
  screens: [
    {
      // Screen 0: Initial Hero
      rotation: {
        x: -1.00,
        y: -0.75,
        z: -1.09,
      }
    },
    {
      // Screen 1: Intermediate
      rotation: {
        x: 0.07,
        y: -0.07,
        z: 0.95,
      }
    },
    {
      // Screen 2: Final Scrolled Down
      rotation: {
        x: 0.17,
        y: 0.03,
        z: 0.80,
      }
    },
    {
      // Screen 3: Our Stories
      rotation: {
        x: 0.17,
        y: 0.03,
        z: 0.80,
      }
    },
    {
      // Screen 4: Who's Behind It (Model remains faded out)
      rotation: {
        x: 0.17,
        y: 0.03,
        z: 0.80,
      }
    }
  ]
}

/* ------------------------------------------------------------------------- */
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
    screens: {
      1: {
        position: [4.8, 1.5, 0.0],
        intensity: 300.0
      },
      2: {
        position: [4.8, 1.5, -2.0],
        intensity: 700.0 // Tweak this value to control intensity specifically on Screen 2
      }
    }
  },
  rimLight: {
    position: [-3.5, 1.2, -4.5],
    intensity: 10,
    color: '#e0f2fe',
  },
  overheadLight: {
    position: [0.5, 7.0, 0.5],
    intensity: 10,
    color: '#ffffff',
    screens: [
      { position: [0.5, 7.0, 0.5], intensity: 10 },
      { position: [-0.5, 7.0, 0.5], intensity: 20 },
      { position: [-1, 7.0, 0.5], intensity: 20 },
      { position: [-1, 7.0, 0.5], intensity: 20 },
      { position: [-1, 7.0, 0.5], intensity: 20 }
    ]
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

/* ------------------------------------------------------------------------- */
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

/* ------------------------------------------------------------------------- */
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

/* ------------------------------------------------------------------------- */
export const UI_CONTENT = {
  screens: [
    {
      layoutVariant: 'split',
      subtitleSameSize: true,   // Renders headingTitle & headingSubtitle at identical size
      headingTitle: 'Unthink the',
      headingSubtitle: 'Ordinary.',
      ctaButtonText: 'SCROLL TO DISCOVER',
      bodyParagraph: {
        desktop: 'We build intelligent extensions\nof human potential.',
        tablet: 'We build intelligent extensions of human\npotential.',
        mobile: 'We build intelligent extensions of human potential.',
      }
    },
    {
      layoutVariant: 'stacked-left',
      headingTitle: 'We build things.',
      headingSubtitle: '',
      ctaButtonText: '',
      bodyParagraph: {
        desktop: 'From the first sketch to the final circuit, we turn ideas\ninto physical experiences through hardware,\nsoftware, and everything in between.',
        tablet: 'From the first sketch to the final circuit, we turn ideas\ninto physical experiences through hardware.',
        mobile: 'From the first sketch to the final circuit, we turn ideas into physical experiences through hardware, software, and everything in between.',
      }
    },
    {
      layoutVariant: 'split-features',
      headingTitle: 'Node 1',
      headingSubtitle: 'Our First Build.',
      ctaButtonText: '',
      githubButton: true,
      bodyParagraph: {
        desktop: 'An open-source smart socket built\nto explore connected hardware.',
        tablet: 'An open-source smart socket built\nto explore connected hardware.',
        mobile: 'An open-source smart socket built to explore connected hardware.',
      },
      featuresList: [
        { title: 'Remote Control', desc: 'Control your devices,\nwherever you are.' },
        { title: 'Smart Scheduling', desc: 'Automate everyday routines\nwith ease.' },
        { title: 'Power Cut Detection', desc: 'Detect unexpected interruptions,\ninstantly.' },
        { title: 'Weather Alerts', desc: 'Stay ahead of changing\nweather conditions.' }
      ]
    },
    {
      layoutVariant: 'stories',
      headingTitle: 'Our Stories',
      headingSubtitle: '',
      ctaButtonText: '',
      bodyParagraph: {
        desktop: "Builds, experiments and things we've learned along the way.",
        tablet: "Builds, experiments and things we've learned along the way.",
        mobile: "Builds, experiments and things we've learned along the way.",
      }
    },
    {
      layoutVariant: 'team',
      headingTitle: "Who's Behind It",
      headingSubtitle: '',
      ctaButtonText: '',
      bodyParagraph: { desktop: '', tablet: '', mobile: '' },
    }
  ]
}
