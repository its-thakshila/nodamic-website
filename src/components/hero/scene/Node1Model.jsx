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

  // Refs for custom drag-to-rotate interaction on Screen 2
  const activeScreenRef = useRef(activeScreen)
  useEffect(() => {
    activeScreenRef.current = activeScreen
  }, [activeScreen])

  const dragStateRef = useRef({
    isDragging: false,
    startX: 0,
    targetDragRot: 0,
    currentDragRot: 0
  })

  useEffect(() => {
    const handlePointerDown = (e) => {
      if (activeScreenRef.current !== 2) return
      dragStateRef.current.isDragging = true
      dragStateRef.current.startX = e.clientX ?? (e.touches ? e.touches[0].clientX : 0)
    }

    const handlePointerMove = (e) => {
      if (!dragStateRef.current.isDragging || activeScreenRef.current !== 2) return
      const currentX = e.clientX ?? (e.touches ? e.touches[0].clientX : 0)
      const deltaX = currentX - dragStateRef.current.startX
      
      // Map screen width to a full 360 degree rotation (Math.PI * 2)
      // Dragging right rotates positive, dragging left rotates negative
      dragStateRef.current.targetDragRot += (deltaX / window.innerWidth) * Math.PI * 2
      dragStateRef.current.startX = currentX
    }

    const handlePointerUp = () => {
      dragStateRef.current.isDragging = false
      
      // Calculate the nearest multiple of 2*PI to avoid unwinding multiple full rotations
      const currentRot = dragStateRef.current.currentDragRot
      const closestReset = Math.round(currentRot / (Math.PI * 2)) * (Math.PI * 2)
      dragStateRef.current.targetDragRot = closestReset
    }

    window.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointercancel', handlePointerUp)
    
    // Touch fallbacks
    window.addEventListener('touchstart', handlePointerDown, { passive: true })
    window.addEventListener('touchmove', handlePointerMove, { passive: true })
    window.addEventListener('touchend', handlePointerUp)
    window.addEventListener('touchcancel', handlePointerUp)

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerUp)
      window.removeEventListener('touchstart', handlePointerDown)
      window.removeEventListener('touchmove', handlePointerMove)
      window.removeEventListener('touchend', handlePointerUp)
      window.removeEventListener('touchcancel', handlePointerUp)
    }
  }, [])

  const outerGroupRef = useRef()
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

  const screenTransitionRef = useRef({
    startTime: null,
    isTransitioning: false,
    duration: 2.2, // increased total delay for cinematic ease
    lastScreen: 0,
    startRot: { x: 0, y: 0, z: 0 },
    startPos: [0, 0, 0],
    startOffset: { x: 0, y: 0 }
  })

  const INTRO_DELAY = ANIMATION_TIMING.introDelay  // seconds before the settle animation begins

  // For mobile, we no longer shift the 3D position to avoid breaking reflections/lighting.
  // Instead, 3D position remains locked to the screen's base configuration, and 
  // we apply a 2D viewport offset to the camera in useFrame.
  const activePosition = useMemo(() => {
    // Determine the base position based on current active screen
    const screenConfig = MODEL_CONFIG.screens ? MODEL_CONFIG.screens[activeScreen] : MODEL_CONFIG
    return screenConfig.position
  }, [activeScreen])

  // Compute bounding box from original unmodified scene
  const { normScale, centerOffset } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(originalScene)
    const sz = new THREE.Vector3()
    const center = new THREE.Vector3()
    box.getSize(sz)
    box.getCenter(center)
    const maxAxis = Math.max(sz.x, sz.y, sz.z)

    // Only perform static normalization here. Responsive scaling is handled smoothly in useFrame.
    return { normScale: MODEL_CONFIG.targetSize / maxAxis, centerOffset: center }
  }, [originalScene])

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

          // CUSTOM SHADER INJECTION: 
          // Completely disable sharp specular reflections from physical lights (recess, rim, overhead) 
          // on the acrylic plate, while strictly preserving indirect HDRI environment reflections.
          mat.onBeforeCompile = (shader) => {
            shader.fragmentShader = shader.fragmentShader.replace(
              '#include <aomap_fragment>',
              `
              #include <aomap_fragment>
              reflectedLight.directSpecular = vec3(0.0);
              #ifdef USE_CLEARCOAT
                clearcoatSpecularDirect = vec3(0.0);
              #endif
              `
            )
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
    
    // Increase vertical tilt range when actively dragging on Screen 2
    const dragTiltMultiplier = (dragStateRef.current.isDragging && activeScreen === 2) ? 2.5 : 1.0
    
    const targetX = isSmallPortrait ? 0 : -pointer.y * MODEL_CONFIG.mouseSensitivity.y * sensitivityMultiplier * dragTiltMultiplier
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
      // -------------------------------------------------------------
      // Calculate target 2D Viewport Shifting and Responsive Scale
      // -------------------------------------------------------------
      let targetOffsetX = 0
      let targetOffsetY = 0
      let mobileReduction = 1.0

      const mConfig = activeBaseRot === MODEL_CONFIG.screens?.[activeScreen]?.baseRotation
        ? (MODEL_CONFIG.screens[activeScreen].mobileConfig || MODEL_CONFIG.mobileConfig)
        : MODEL_CONFIG.mobileConfig

      const forceMobile = mConfig.snapMobileOnPortrait1024 && state.size.width < 1024 && state.size.height > state.size.width
      const currentWidth = state.size.width

      if (MODEL_CONFIG.debugResponsive && window.__DEBUG_ENABLE) {
        // Tweak Mode (Leva Overrides)
        targetOffsetX = window.__DEBUG_OFFSET_X * state.size.width
        targetOffsetY = window.__DEBUG_OFFSET_Y * state.size.height
        mobileReduction = window.__DEBUG_SCALE
      } else if (mConfig.responsiveKeyframes && mConfig.responsiveKeyframes.length > 0) {
        // 2D Spatial Keyframe Interpolation (Inverse Distance Weighting)
        const frames = mConfig.responsiveKeyframes
        const currentHeight = state.size.height
        
        let totalWeight = 0
        let weightedOffsetX = 0
        let weightedOffsetY = 0
        let weightedScale = 0
        let exactMatch = null
        
        for (let i = 0; i < frames.length; i++) {
          const frame = frames[i]
          const dx = currentWidth - frame.width
          // Support legacy 1D keyframes by ignoring height distance if missing
          const dy = currentHeight - (frame.height || currentHeight)
          
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          if (distance < 1) { // Exact match threshold
            exactMatch = frame
            break
          }
          
          // IDW Power = 4 (high decay ensures tighter snapping to nearest keyframes)
          const weight = 1 / Math.pow(distance, 4)
          totalWeight += weight
          weightedOffsetX += frame.offsetX * weight
          weightedOffsetY += frame.offsetY * weight
          weightedScale += frame.scale * weight
        }

        let interpX, interpY, interpScale

        if (exactMatch) {
          interpX = exactMatch.offsetX
          interpY = exactMatch.offsetY
          interpScale = exactMatch.scale
        } else {
          interpX = weightedOffsetX / totalWeight
          interpY = weightedOffsetY / totalWeight
          interpScale = weightedScale / totalWeight
        }

        if (forceMobile) {
          // Portrait snap override (fallback for safety)
          const smallest = [...frames].sort((a, b) => a.width - b.width)[0]
          interpX = smallest.offsetX
          interpY = smallest.offsetY
          interpScale = smallest.scale
        }

        targetOffsetX = interpX * state.size.width
        targetOffsetY = interpY * state.size.height
        mobileReduction = interpScale
      } else {
        // -------------------------------------------------------------
        // Legacy Phase Math (Fallback)
        // -------------------------------------------------------------
        const globalViewConf = MODEL_CONFIG.mobileConfig.viewOffset
        const pConf = mConfig.viewOffset || globalViewConf
        const currentBreakpoint = pConf.breakpoint || globalViewConf.breakpoint

        if (state.size.width < currentBreakpoint) {
          let mobileProgress = Math.max(0, Math.min(1, (currentBreakpoint - state.size.width) / (currentBreakpoint - MODEL_CONFIG.mobileConfig.scale.minBreakpoint)))
          if (forceMobile) mobileProgress = 1.0
          
          const minOffsetX = pConf.minOffsetX || 0
          const minOffsetY = pConf.minOffsetY || 0
          const currentOffsetX = minOffsetX + ((pConf.maxOffsetX || 0) - minOffsetX) * mobileProgress
          const currentOffsetY = minOffsetY + ((pConf.maxOffsetY || 0) - minOffsetY) * mobileProgress

          targetOffsetX = currentOffsetX * state.size.width
          targetOffsetY = currentOffsetY * state.size.height
        }

        const sConf = mConfig.scale || MODEL_CONFIG.mobileConfig.scale
        const globalSConf = MODEL_CONFIG.mobileConfig.scale
        const currentPhase2Start = sConf.phase2Start || globalSConf.phase2Start

        if (state.size.width < globalSConf.phase1Start && state.size.width >= currentPhase2Start) {
          const progress = (state.size.width - currentPhase2Start) / (globalSConf.phase1Start - currentPhase2Start)
          mobileReduction = sConf.phase1Target + ((1.0 - sConf.phase1Target) * progress)
        } else if (state.size.width < currentPhase2Start) {
          const progress = Math.max(0, Math.min(1, (state.size.width - globalSConf.minBreakpoint) / (currentPhase2Start - globalSConf.minBreakpoint)))
          mobileReduction = sConf.minScale + ((sConf.phase1Target - sConf.minScale) * progress)
        }

        if (forceMobile) {
          mobileReduction = sConf.minScale
        }
      }

      const aspectCompensation = window.innerHeight / state.size.height
      const targetResponsiveScale = aspectCompensation * mobileReduction

      // -------------------------------------------------------------
      // Screen Transition (Ease-In-Out vs Damping)
      // -------------------------------------------------------------
      const trans = screenTransitionRef.current

      // If screen changed, initialize a new transition from EXACTLY where we are right now
      if (activeScreen !== trans.lastScreen) {
        // Use the cinematic time-based easeInOut ONLY for the 360-spin
        if ((trans.lastScreen === 1 && activeScreen === 2) || (trans.lastScreen === 2 && activeScreen === 1)) {
          trans.isTransitioning = true
          trans.duration = 2.0
          trans.startTime = state.clock.elapsedTime
          
          trans.startRot = {
            x: groupRef.current.userData.baseRotX ?? activeBaseRot.x,
            y: groupRef.current.userData.baseRotY ?? activeBaseRot.y,
            z: groupRef.current.userData.baseRotZ ?? activeBaseRot.z
          }
          trans.startPos = [
            groupRef.current.userData.posX ?? activePosition[0],
            groupRef.current.userData.posY ?? activePosition[1],
            groupRef.current.userData.posZ ?? activePosition[2]
          ]
          trans.startOffset = {
            x: state.camera.userData.offsetX ?? targetOffsetX,
            y: state.camera.userData.offsetY ?? targetOffsetY
          }
          trans.startScale = groupRef.current.userData.respScale ?? targetResponsiveScale
        } else {
          // Standard transitions rely on exponential damping instead
          trans.isTransitioning = false
        }
        
        trans.lastScreen = activeScreen
      }

      let currentBaseRotX = activeBaseRot.x
      let currentBaseRotY = activeBaseRot.y
      let currentBaseRotZ = activeBaseRot.z
      let currentPosX = activePosition[0]
      let currentPosY = activePosition[1]
      let currentPosZ = activePosition[2]
      let currentOffsetX = targetOffsetX
      let currentOffsetY = targetOffsetY
      let currentRespScale = targetResponsiveScale

      if (trans.isTransitioning) {
        const elapsed = state.clock.elapsedTime - trans.startTime
        const rawProgress = elapsed / trans.duration
        
        if (rawProgress >= 1) {
          trans.isTransitioning = false
        } else {
          // Time-based cinematic easeInOutCubic transition
          const ease = easeInOutCubic(rawProgress)
          
          currentBaseRotX = lerp(trans.startRot.x, activeBaseRot.x, ease)
          currentBaseRotY = lerp(trans.startRot.y, activeBaseRot.y, ease)
          currentBaseRotZ = lerp(trans.startRot.z, activeBaseRot.z, ease)

          currentPosX = lerp(trans.startPos[0], activePosition[0], ease)
          currentPosY = lerp(trans.startPos[1], activePosition[1], ease)
          currentPosZ = lerp(trans.startPos[2], activePosition[2], ease)

          currentOffsetX = lerp(trans.startOffset.x, targetOffsetX, ease)
          currentOffsetY = lerp(trans.startOffset.y, targetOffsetY, ease)
          
          currentRespScale = lerp(trans.startScale, targetResponsiveScale, ease)
        }
      } else {
        // Fallback to the original snappy exponential damping (ease-out)
        const dampRot = THREE.MathUtils.damp
        currentBaseRotX = dampRot(groupRef.current.userData.baseRotX ?? activeBaseRot.x, activeBaseRot.x, 3, safeDelta)
        currentBaseRotY = dampRot(groupRef.current.userData.baseRotY ?? activeBaseRot.y, activeBaseRot.y, 3, safeDelta)
        currentBaseRotZ = dampRot(groupRef.current.userData.baseRotZ ?? activeBaseRot.z, activeBaseRot.z, 3, safeDelta)

        currentPosX = dampRot(groupRef.current.userData.posX ?? activePosition[0], activePosition[0], 3, safeDelta)
        currentPosY = dampRot(groupRef.current.userData.posY ?? activePosition[1], activePosition[1], 3, safeDelta)
        currentPosZ = dampRot(groupRef.current.userData.posZ ?? activePosition[2], activePosition[2], 3, safeDelta)

        currentOffsetX = dampRot(state.camera.userData.offsetX ?? targetOffsetX, targetOffsetX, 3, safeDelta)
        currentOffsetY = dampRot(state.camera.userData.offsetY ?? targetOffsetY, targetOffsetY, 3, safeDelta)
        
        currentRespScale = dampRot(groupRef.current.userData.respScale ?? targetResponsiveScale, targetResponsiveScale, 3, safeDelta)
      }

      // Save state for interruptions
      groupRef.current.userData.baseRotX = currentBaseRotX
      groupRef.current.userData.baseRotY = currentBaseRotY
      groupRef.current.userData.baseRotZ = currentBaseRotZ
      groupRef.current.userData.posX = currentPosX
      groupRef.current.userData.posY = currentPosY
      groupRef.current.userData.posZ = currentPosZ
      groupRef.current.userData.respScale = currentRespScale
      state.camera.userData.offsetX = currentOffsetX
      state.camera.userData.offsetY = currentOffsetY

      // Custom Drag Rotation for Screen 2 (Applied to World coordinates via Outer Group)
      if (activeScreen === 2) {
        dragStateRef.current.currentDragRot = lerp(dragStateRef.current.currentDragRot, dragStateRef.current.targetDragRot, MODEL_CONFIG.lerpFactor * 1.5)
      } else {
        // Smoothly reset drag rotation when leaving Screen 2 to the closest 2*PI multiple
        const closestReset = Math.round(dragStateRef.current.currentDragRot / (Math.PI * 2)) * (Math.PI * 2)
        dragStateRef.current.targetDragRot = closestReset
        dragStateRef.current.currentDragRot = lerp(dragStateRef.current.currentDragRot, closestReset, MODEL_CONFIG.lerpFactor * 1.5)
      }

      // Apply transformations to the main model (Local axes)
      groupRef.current.rotation.x = currentBaseRotX + rotation.current.x
      groupRef.current.rotation.y = currentBaseRotY + rotation.current.y + intro.yOffset
      groupRef.current.rotation.z = currentBaseRotZ + intro.zOffset
      
      // Ensure groupRef remains centered within outerGroupRef
      groupRef.current.position.set(0, 0, 0)
      
      // Apply the position and drag spin to the outer wrapper 
      // This ensures it translates first, then spins in-place around the World Y-axis!
      if (outerGroupRef.current) {
        outerGroupRef.current.position.set(currentPosX, currentPosY, currentPosZ)
        outerGroupRef.current.rotation.y = dragStateRef.current.currentDragRot
      }

      if (Math.abs(currentOffsetX) > 0.5 || Math.abs(currentOffsetY) > 0.5) {
        state.camera.setViewOffset(state.size.width, state.size.height, currentOffsetX, currentOffsetY, state.size.width, state.size.height)
      } else {
        if (state.camera.view) state.camera.clearViewOffset()
      }

      // Combine damped responsive scale with the intro animation scale
      groupRef.current.scale.setScalar(currentRespScale * intro.scale)
    }

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
    <group ref={outerGroupRef} dispose={null}>
      <group ref={groupRef}>
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
    </group>
  )
})

