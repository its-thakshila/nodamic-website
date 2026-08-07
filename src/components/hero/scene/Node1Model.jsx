import { useRef, useEffect, useState, useMemo, memo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { MODEL_CONFIG, ANIMATION_TIMING } from '../../../config/hero.config'

useGLTF.preload(MODEL_CONFIG.path)

/* ─── Lerp helper ─────────────────────────────────────────────────────────── */
function lerp(a, b, t) {
  return a + (b - a) * t
}

/* ─── Easing Functions ────────────────────────────────────────────────────── */
function easeInOutCubic(x) {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2
}

/* ─── Radial Halo Texture Generator ───────────────────────────────────────── */
function createHaloTexture() {
  if (typeof document === 'undefined') return null
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const ctx = canvas.getContext('2d')
  const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
  grad.addColorStop(0, 'rgba(255, 255, 255, 1)')
  grad.addColorStop(0.25, 'rgba(255, 255, 255, 0.55)')
  grad.addColorStop(0.6, 'rgba(255, 255, 255, 0.12)')
  grad.addColorStop(1, 'rgba(255, 255, 255, 0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 128, 128)
  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

/* ─── Static Material Colors (Eliminates GC allocations inside useFrame) ──── */
const LED_COLOR_ON = new THREE.Color('#ffffff')
const LED_COLOR_OFF = new THREE.Color('#121212')
const LED_EMISSIVE_ON = new THREE.Color(MODEL_CONFIG.materials.emissiveColor)
const LED_EMISSIVE_OFF = new THREE.Color('#000000')
const HOVER_EMISSIVE_COLOR = new THREE.Color('#ffffff')

export default memo(function Node1Model({ startAnimations, onModelReady }) {
  const [isOn, setIsOn] = useState(true)
  const timerRef = useRef(null)

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    if (!isOn) {
      timerRef.current = setTimeout(() => {
        setIsOn(true)
        timerRef.current = null
      }, 5000)
    }
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isOn])

  const groupRef = useRef()

  const { scene: originalScene } = useGLTF(MODEL_CONFIG.path)
  const scene = useMemo(() => originalScene.clone(true), [originalScene])

  const rotation = useRef({ x: 0, y: 0 })
  const { pointer, size, gl, camera } = useThree()

  const isMobile = size.width < 1024

  // High-performance animation references and current state tracking (zero React re-renders)
  const switchMeshRef = useRef(null)
  const ledMeshRef = useRef(null)
  const ledMaterialRef = useRef(null)
  const haloMaterialRef = useRef(null)
  // Invisible hit-zone box — direct child of the Switch_Head mesh.
  // Inherits all position.z mutations automatically; no per-frame tracking required.
  const hitZoneRef = useRef(null)
  const animValues = useRef({
    switchZ: 0,
    emissive: MODEL_CONFIG.materials.emissiveIntensity,
    haloOpacity: 0.85,
  })

  // Load intro animation — starts at offset from baseRotation, decays to zero after a short delay
  // Initial: y: 0.5, z: -0.48  →  Target: y: 0.38, z: -0.4  (deltas: y +0.12, z -0.08)
  const introRef = useRef({
    startTime: null,
    started: false,
    startY: 0.5 - MODEL_CONFIG.baseRotation.y,
    startZ: -0.48 - MODEL_CONFIG.baseRotation.z,
    startScale: 0.72,
    yOffset: 0.5 - MODEL_CONFIG.baseRotation.y,
    zOffset: -0.48 - MODEL_CONFIG.baseRotation.z,
    scale: 0.72,
  })
  const INTRO_DELAY = ANIMATION_TIMING.introDelay  // seconds before the settle animation begins

  // Fluid responsive scaling with mathematically perfect FOV snap compensation
  const activeTargetSize = useMemo(() => {
    const baseSize = MODEL_CONFIG.targetSize

    // 1. Perfect CSS Height Snap Compensation
    // When the CSS canvas wrapper drops from 100vh to 55vh at 1024px, the camera's fixed vertical FOV 
    // causes the product to instantly shrink by 45%. We completely neutralize this visual jump by 
    // scaling the 3D model inversely to the canvas height ratio.
    const aspectCompensation = window.innerHeight / size.height

    // 2. Fluid continuous reduction based strictly on width interpolation
    const MIN_SCALE = 0.70 // <-- Adjust this value to make the mobile model smaller or larger!
    const MAX_SCALE = 1.00

    const progress = Math.max(0, Math.min(1, (size.width - 430) / (1024 - 430)))
    const mobileReduction = MIN_SCALE + ((MAX_SCALE - MIN_SCALE) * progress)

    // Above 1024px, aspectCompensation is ~1.0 and mobileReduction is 1.0. 
    // Below 1024px, the model scales smoothly without ANY sudden breakpoint jumps.
    return baseSize * aspectCompensation * mobileReduction
  }, [size.width, size.height])

  // Fluid responsive positioning: smoothly moves the model left and up on mobile
  const activePosition = useMemo(() => {
    const basePos = MODEL_CONFIG.position
    if (size.width >= 1024) return basePos

    // mobileProgress is 0.0 at 1024px, and 1.0 at 430px
    const mobileProgress = Math.max(0, Math.min(1, (1024 - size.width) / (1024 - 430)))

    // Maximum offsets applied at the smallest mobile size
    const MAX_X_OFFSET = -0.1 // <-- Adjust this negative to move further left
    const MAX_Y_OFFSET = 0.25  // <-- Adjust this positive to move further up

    return [
      basePos[0] + (MAX_X_OFFSET * mobileProgress),
      basePos[1] + (MAX_Y_OFFSET * mobileProgress),
      basePos[2]
    ]
  }, [size.width])

  // Compute bounding box from original unmodified scene
  const { normScale, centerOffset } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(originalScene)
    const sz = new THREE.Vector3()
    const center = new THREE.Vector3()
    box.getSize(sz)
    box.getCenter(center)
    const maxAxis = Math.max(sz.x, sz.y, sz.z)
    return { normScale: activeTargetSize / maxAxis, centerOffset: center }
  }, [originalScene, activeTargetSize])

  /* ── Apply normalization + luxury product photography materials ── */
  useEffect(() => {
    if (!scene) return

    const { materials } = MODEL_CONFIG

    scene.traverse((child) => {
      if (child.name === '__switch_hit__') return

      const rawName = child.name || ''
      const meshName = rawName.toLowerCase()
      const normalizedName = meshName.replace(/_/g, ' ')

      // Record direct references to interactive switch toggle & LED indicator without altering GLB hierarchy
      if (rawName === 'Switch Head' || rawName === 'Switch_Head' || normalizedName.includes('switch head')) {
        switchMeshRef.current = child

        // Attach a single invisible hit-zone box as a DIRECT CHILD of the Switch_Head mesh.
        // As a child, it automatically inherits the parent's position.z animation — no tracking needed.
        child.geometry.computeBoundingBox()
        const bb = child.geometry.boundingBox

        // The Switch_Head mesh contains hidden internal geometry extending to the right (+X).
        // We crop the hit zone to manually match only the exposed knob on the left.
        const sh = bb.max.y - bb.min.y
        const sd = bb.max.z - bb.min.z

        // The exposed knob is strictly on the left edge.
        // MANUALLY ADJUST THIS MULTIPLIER (e.g., 0.6 to 0.8) to shrink or expand the length of the hitbox!
        const sw = sh * 0.4

        // Center Y and Z normally using the full bounds
        const cy = (bb.max.y + bb.min.y) / 2
        const cz = (bb.max.z + bb.min.z) / 2

        // Anchor the X center strictly to the left edge (min.x) where the knob is exposed
        const cx = bb.min.x + (sw / 2)

        // Only pad the Y and Z axes for easier clicking, keep X strictly cropped
        const hitGeo = new THREE.BoxGeometry(sw, sh * 1.2, sd * 1.2)
        const hitMat = new THREE.MeshBasicMaterial({ visible: false, depthWrite: false, side: THREE.DoubleSide })
        const hitZone = new THREE.Mesh(hitGeo, hitMat)
        hitZone.name = '__switch_hit__'

        // Position at the newly cropped geometry center in Switch_Head local space.
        hitZone.position.set(cx, cy, cz)
        hitZoneRef.current = hitZone

        child.add(hitZone)   // child of the mesh, NOT the scene
      }
      if (rawName === 'LED' || (child.isMesh && normalizedName.includes('led'))) {
        ledMeshRef.current = child
      }

      if (child.isMesh && child.material) {
        // Disable raycasting strictly on imported product geometry while leaving it enabled for our __switch_hit__ box
        if (child.name !== '__switch_hit__') {
          child.raycast = () => null
        }

        const mat = child.material
        const matName = (mat.name || '').toLowerCase()

        // Remove baked environment maps so dynamic studio HDRI drives reflections
        if ('envMap' in mat) mat.envMap = null

        const isAcrylic = meshName.includes('acrylic') || matName.includes('acrylic') ||
          meshName.includes('plate') || matName.includes('plate')
        const isLED = meshName.includes('led') || matName.includes('led') ||
          meshName.includes('light') || matName.includes('light') ||
          meshName.includes('indicator') || meshName.includes('dot') || meshName.includes('glow')

        if (isAcrylic) {
          // STRICTLY apply glossy tempered glass overrides ONLY to the 'Acrylic Plate'
          if ('envMapIntensity' in mat) mat.envMapIntensity = materials.envMapIntensity
          if (mat.roughness !== undefined) {
            const floorRoughness = materials.acrylicRoughness ?? 0.02
            mat.roughness = Math.max(floorRoughness, mat.roughness * materials.roughnessMultiplier)
          }
          if (mat.metalness !== undefined) {
            mat.metalness = Math.max(mat.metalness, materials.metalnessFloor)
          }
          if ('clearcoat' in mat || mat.isMeshPhysicalMaterial) {
            mat.clearcoat = materials.clearcoat
            mat.clearcoatRoughness = materials.clearcoatRoughness
          }
        } else if (!isLED) {
          // For BlackPLA, BlackPLA Dark, Brass Terminal: preserve exact authored roughness & metalness!
          // Simply ensure HDRI reflections are visible at natural physical intensity.
          if ('envMapIntensity' in mat) {
            mat.envMapIntensity = 1.2
          }
        }

        child.castShadow = true
        child.receiveShadow = true

        if (isLED) {
          mat.emissive = new THREE.Color(materials.emissiveColor)
          mat.emissiveIntensity = animValues.current.emissive
          mat.toneMapped = false
          ledMaterialRef.current = mat
        }

        mat.needsUpdate = true
      }
    })

    // Force pre-compile of all materials and geometries in the scene before the first render
    gl.compile(scene, camera)

    // After materials are configured, wait for the browser to paint the actual frame.
    // The double requestAnimationFrame ensures we clear the React render cycle and the WebGL draw call.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // Add a deliberate warm-up delay. This gives frameloop="always" time to render
        // 15-30 frames invisibly in the background, fully warming up the Post-Processing passes
        // and shadow maps before we drop the loading screen.
        setTimeout(() => {
          if (onModelReady) onModelReady()
        }, 500)
      })
    })
  }, [scene])

  /* ── Attach soft ambient LED Halo sprite ── */
  useEffect(() => {
    const ledMesh = ledMeshRef.current
    if (!ledMesh) return
    const texture = createHaloTexture()
    if (!texture) return

    const material = new THREE.SpriteMaterial({
      map: texture,
      color: new THREE.Color(MODEL_CONFIG.materials.emissiveColor),
      transparent: true,
      opacity: animValues.current.haloOpacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    haloMaterialRef.current = material
    const sprite = new THREE.Sprite(material)

    ledMesh.geometry.computeBoundingBox()
    const center = new THREE.Vector3()
    ledMesh.geometry.boundingBox.getCenter(center)

    sprite.position.copy(center)
    sprite.scale.set(0.55, 0.55, 1)
    ledMesh.add(sprite)

    return () => {
      ledMesh.remove(sprite)
      material.dispose()
      texture.dispose()
      haloMaterialRef.current = null
    }
  }, [scene])

  /* ── Animation loop (60 FPS interpolation without React re-renders) ── */
  useFrame((state, delta) => {
    if (!groupRef.current) return

    // Cap delta to prevent massive jumps after browser tab switches or heavy load (max 20fps equivalent step)
    const safeDelta = Math.min(delta, 0.05)

    // 1. High-performance rotation drift
    const sensitivityMultiplier = Math.max(1.0, Math.min(3.0, 1920 / size.width))

    // Desktop and landscape/tablet rely on absolute pointer position tracking.
    // On small portrait phone screens, we lock the rotation to zero so touch dragging doesn't move the model.
    const isSmallPortrait = size.width < 768 && size.height > size.width
    const targetX = isSmallPortrait ? 0 : -pointer.y * MODEL_CONFIG.mouseSensitivity.y * sensitivityMultiplier
    const targetY = isSmallPortrait ? 0 : pointer.x * MODEL_CONFIG.mouseSensitivity.x * sensitivityMultiplier

    rotation.current.x = lerp(rotation.current.x, targetX, MODEL_CONFIG.lerpFactor)
    rotation.current.y = lerp(rotation.current.y, targetY, MODEL_CONFIG.lerpFactor)

    // Intro load animation — smoothly driven by absolute clock time, totally immune to frame drops!
    const intro = introRef.current
    if (startAnimations) {
      if (intro.startTime === null) {
        intro.startTime = state.clock.elapsedTime + INTRO_DELAY
      }
      
      if (state.clock.elapsedTime >= intro.startTime && !intro.started) {
        intro.started = true
      }
    }

    if (intro.started) {
      const rawProgress = (state.clock.elapsedTime - intro.startTime) / ANIMATION_TIMING.duration
      const progress = Math.max(0, Math.min(1, rawProgress))
      const ease = easeInOutCubic(progress)

      intro.yOffset = lerp(intro.startY, 0, ease)
      intro.zOffset = lerp(intro.startZ, 0, ease)
      intro.scale = lerp(intro.startScale, 1, ease)
    }

    const activeBaseRot = MODEL_CONFIG.baseRotation

    groupRef.current.rotation.x = activeBaseRot.x + rotation.current.x
    groupRef.current.rotation.y = activeBaseRot.y + rotation.current.y + intro.yOffset
    groupRef.current.rotation.z = activeBaseRot.z + intro.zOffset
    groupRef.current.scale.setScalar(intro.scale)

    // 2. High-performance switch translation & LED behavior damping (~200ms mechanical feel)
    const targetZ = isOn ? 0 : 0.389
    const targetEmissive = isOn ? MODEL_CONFIG.materials.emissiveIntensity : 0
    const targetHaloOpacity = isOn ? 0.85 : 0

    const damp = THREE.MathUtils.damp
    animValues.current.switchZ = damp(animValues.current.switchZ, targetZ, 16, safeDelta)
    animValues.current.emissive = damp(animValues.current.emissive, targetEmissive, 12, safeDelta)
    animValues.current.haloOpacity = damp(animValues.current.haloOpacity, targetHaloOpacity, 12, safeDelta)

    // Directly mutate Three.js instances without triggering React state changes
    if (switchMeshRef.current) {
      switchMeshRef.current.position.z = animValues.current.switchZ
      // hitZoneRef is a child of switchMeshRef — no separate update needed; it inherits the parent's Z.
    }

    if (ledMaterialRef.current) {
      ledMaterialRef.current.emissiveIntensity = animValues.current.emissive
      // Physically transition base diffuse color between bright lit white and dark unlit bulb
      const targetColor = isOn ? LED_COLOR_ON : LED_COLOR_OFF
      const targetEmissiveColor = isOn ? LED_EMISSIVE_ON : LED_EMISSIVE_OFF
      ledMaterialRef.current.color.lerp(targetColor, 0.15)
      ledMaterialRef.current.emissive.lerp(targetEmissiveColor, 0.15)
    }
    if (haloMaterialRef.current) {
      haloMaterialRef.current.opacity = animValues.current.haloOpacity
      haloMaterialRef.current.visible = animValues.current.haloOpacity > 0.005
    }
  })

  /* ── Only our invisible sentinel hit-zones trigger switch interaction ── */
  const isHitZone = (obj) => {
    let curr = obj
    while (curr) {
      if (curr.name === '__switch_hit__') return true
      curr = curr.parent
    }
    return false
  }

  const handleClick = (e) => {
    e.stopPropagation()
    if (isHitZone(e.object)) {
      setIsOn((prev) => !prev)
    }
  }

  const handlePointerMove = (e) => {
    e.stopPropagation()
    if (isHitZone(e.object)) {
      document.body.style.cursor = 'pointer'
      if (switchMeshRef.current?.material && switchMeshRef.current.material.emissiveIntensity === 0) {
        switchMeshRef.current.material.emissive = HOVER_EMISSIVE_COLOR
        switchMeshRef.current.material.emissiveIntensity = 0.06
      }
    } else {
      document.body.style.cursor = 'auto'
      if (switchMeshRef.current?.material && switchMeshRef.current.material.emissiveIntensity !== 0) {
        switchMeshRef.current.material.emissiveIntensity = 0
      }
    }
  }

  const handlePointerOut = (e) => {
    e.stopPropagation()
    document.body.style.cursor = 'auto'
    if (switchMeshRef.current?.material && switchMeshRef.current.material.emissiveIntensity !== 0) {
      switchMeshRef.current.material.emissiveIntensity = 0
    }
  }

  return (
    <group ref={groupRef} position={activePosition} dispose={null}>
      {/* Declaratively apply the centering and normalization scale so it is strictly enforced on frame 1 */}
      <group
        scale={normScale}
        position={[
          -centerOffset.x * normScale,
          -centerOffset.y * normScale,
          -centerOffset.z * normScale
        ]}
      >
        <primitive
          object={scene}
          onClick={handleClick}
          onPointerMove={handlePointerMove}
          onPointerOut={handlePointerOut}
        />
      </group>
    </group>
  )
})

