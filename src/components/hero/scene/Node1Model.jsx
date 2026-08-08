import { useRef, useEffect, useState, useMemo, memo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { MODEL_CONFIG, ANIMATION_TIMING } from '../../../config/hero.config'
import { useDiagnostic } from '../DiagnosticContext'
import { useScrollState } from '../ScrollContext'

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
  const diag = useDiagnostic()
  const { activeScreen } = useScrollState() || { activeScreen: 0 }
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
    let mobileReduction = 1.0
    
    if (size.width < 1520 && size.width >= 1024) {
      // Phase 1: Slow reduction from 1.0 (at 1520px) down to 0.90 (at 1024px)
      const progress = (size.width - 1024) / (1520 - 1024) // 0 to 1
      mobileReduction = 0.90 + (0.10 * progress)
    } else if (size.width < 1024) {
      // Phase 2: From 1024px down to 430px, reduce at the exact same rate as before
      // (Originally dropped 0.30 between 1024 and 430. So from 0.90 it drops to 0.60)
      const MIN_SCALE = 0.60 
      const MAX_SCALE = 0.90
      const progress = Math.max(0, Math.min(1, (size.width - 430) / (1024 - 430)))
      mobileReduction = MIN_SCALE + ((MAX_SCALE - MIN_SCALE) * progress)
    }

    // Above 1520px, mobileReduction is 1.0. 
    // Below 1520px, the model scales smoothly without ANY sudden breakpoint jumps.
    return baseSize * aspectCompensation * mobileReduction
  }, [size.width, size.height])

  // Fluid responsive positioning: smoothly moves the model left and up on mobile
  const activePosition = useMemo(() => {
    // Determine the base position based on current active screen
    const screenConfig = MODEL_CONFIG.screens ? MODEL_CONFIG.screens[activeScreen] : MODEL_CONFIG
    const basePos = screenConfig.position

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
  }, [size.width, activeScreen])

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

        let mat = child.material
        const matName = (mat.name || '').toLowerCase()

        // Remove baked environment maps so dynamic studio HDRI drives reflections
        if ('envMap' in mat) mat.envMap = null

        const isAcrylic = meshName.includes('acrylic') || matName.includes('acrylic') ||
          meshName.includes('plate') || matName.includes('plate')
        const isLED = meshName.includes('led') || matName.includes('led') ||
          meshName.includes('light') || matName.includes('light') ||
          meshName.includes('indicator') || meshName.includes('dot') || meshName.includes('glow')

        if (isAcrylic) {
          if (diag && diag.useStandardMaterial && mat.isMeshPhysicalMaterial) {
            const stdMat = new THREE.MeshStandardMaterial({
              color: mat.color,
              roughness: mat.roughness,
              metalness: mat.metalness,
              map: mat.map
            })
            child.material = stdMat
            mat = stdMat
          }
          
          // STRICTLY apply glossy tempered glass overrides ONLY to the 'Acrylic Plate'
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
        }

        child.castShadow = true
        child.receiveShadow = true

        if (isLED) {
          mat.emissive = new THREE.Color(materials.emissiveColor)
          mat.emissiveIntensity = animValues.current.emissive
          mat.toneMapped = false
          ledMaterialRef.current = mat
        }

        // Diagnostic override: Force BasicMaterial for EVERYTHING
        if (diag && diag.useBasicMaterial) {
          const basicMat = new THREE.MeshBasicMaterial({
            color: isLED ? materials.emissiveColor : mat.color || 0x888888,
            map: mat.map || null
          })
          child.material = basicMat
          if (isLED) {
            ledMaterialRef.current = basicMat
          }
        } else {
          mat.needsUpdate = true
        }
      }
    })

    // Compile shaders and materials synchronously before first render
    console.log('[DEBUG] Node1Model.jsx: Entering gl.compile()')
    try {
      gl.compile(scene, camera)
      console.log('[DEBUG] Node1Model.jsx: gl.compile() completed successfully.')
    } catch (error) {
      console.error('[DEBUG] Node1Model.jsx: gl.compile() threw an exception:', error)
    }

    // Notify the parent that the model's assets and materials are ready
    if (onModelReady) {
      console.log('[DEBUG] Node1Model.jsx: Calling onModelReady via setTimeout(0)')
      // Use a micro-delay to let React commit the tree
      setTimeout(onModelReady, 0)
    } else {
      console.log('[DEBUG] Node1Model.jsx: onModelReady is undefined.')
    }
  }, [scene, JSON.stringify(MODEL_CONFIG.materials)])

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

    // Determine target rotation based on the active screen
    const activeBaseRot = (MODEL_CONFIG.screens && MODEL_CONFIG.screens[activeScreen]) 
      ? MODEL_CONFIG.screens[activeScreen].baseRotation 
      : MODEL_CONFIG.baseRotation

    // Smoothly damp the actual rotation towards the target screen rotation
    // We store the current damped rotation directly in the group's rotation (or a ref) to avoid state
    if (groupRef.current) {
      const dampRot = THREE.MathUtils.damp
      // Safe delta ensures we don't jump too far in one frame
      const currentBaseRotX = dampRot(groupRef.current.userData.baseRotX ?? activeBaseRot.x, activeBaseRot.x, 3, safeDelta)
      const currentBaseRotY = dampRot(groupRef.current.userData.baseRotY ?? activeBaseRot.y, activeBaseRot.y, 3, safeDelta)
      const currentBaseRotZ = dampRot(groupRef.current.userData.baseRotZ ?? activeBaseRot.z, activeBaseRot.z, 3, safeDelta)
      
      groupRef.current.userData.baseRotX = currentBaseRotX
      groupRef.current.userData.baseRotY = currentBaseRotY
      groupRef.current.userData.baseRotZ = currentBaseRotZ

      groupRef.current.rotation.x = currentBaseRotX + rotation.current.x
      groupRef.current.rotation.y = currentBaseRotY + rotation.current.y + intro.yOffset
      groupRef.current.rotation.z = currentBaseRotZ + intro.zOffset

      // Smoothly damp position
      const currentPosX = dampRot(groupRef.current.userData.posX ?? activePosition[0], activePosition[0], 3, safeDelta)
      const currentPosY = dampRot(groupRef.current.userData.posY ?? activePosition[1], activePosition[1], 3, safeDelta)
      const currentPosZ = dampRot(groupRef.current.userData.posZ ?? activePosition[2], activePosition[2], 3, safeDelta)

      groupRef.current.userData.posX = currentPosX
      groupRef.current.userData.posY = currentPosY
      groupRef.current.userData.posZ = currentPosZ

      groupRef.current.position.set(currentPosX, currentPosY, currentPosZ)
    }
    
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
    <group ref={groupRef} dispose={null}>
      {/* Declaratively apply the centering and normalization scale so it is strictly enforced on frame 1 */}
      <group
        scale={normScale}
        position={[
          -centerOffset.x * normScale,
          -centerOffset.y * normScale,
          -centerOffset.z * normScale
        ]}
      >
        {diag && diag.useBoxGeometry ? (
          <mesh scale={[10, 10, 10]}>
            <boxGeometry />
            <meshStandardMaterial color="#888888" />
          </mesh>
        ) : (
          <primitive
            object={scene}
            onClick={handleClick}
            onPointerMove={handlePointerMove}
            onPointerOut={handlePointerOut}
          />
        )}
      </group>
    </group>
  )
})

