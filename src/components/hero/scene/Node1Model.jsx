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

export default memo(function Node1Model({ startAnimations }) {
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
  const { pointer, size } = useThree()

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
    elapsed: 0,
    started: false,
    startY: 0.5 - MODEL_CONFIG.baseRotation.y,
    startZ: -0.48 - MODEL_CONFIG.baseRotation.z,
    startScale: 0.72,
    yOffset: 0.5 - MODEL_CONFIG.baseRotation.y,
    zOffset: -0.48 - MODEL_CONFIG.baseRotation.z,
    scale: 0.72,
  })
  const INTRO_DELAY = ANIMATION_TIMING.introDelay  // seconds before the settle animation begins

  // Compute bounding box from original unmodified scene
  const { normScale, centerOffset } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(originalScene)
    const size = new THREE.Vector3()
    const center = new THREE.Vector3()
    box.getSize(size)
    box.getCenter(center)
    const maxAxis = Math.max(size.x, size.y, size.z)
    return { normScale: MODEL_CONFIG.targetSize / maxAxis, centerOffset: center }
  }, [originalScene])

  /* ── Apply normalization + luxury product photography materials ── */
  useEffect(() => {
    if (!scene) return

    scene.scale.setScalar(normScale)
    scene.position.set(
      -centerOffset.x * normScale,
      -centerOffset.y * normScale,
      -centerOffset.z * normScale,
    )

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
  }, [scene, normScale, centerOffset])

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
  useFrame((_, delta) => {
    if (!groupRef.current) return

    // Responsive viewport multiplier: amplifies pointer influence on smaller screens (laptops/tablets)
    // so the perceived rotation range remains consistent despite shorter physical mouse travel distance.
    const sensitivityMultiplier = Math.max(1.0, Math.min(3.0, 1920 / size.width))

    // 1. High-performance R3F pointer rotation drift (zero native DOM events)
    const targetX = -pointer.y * MODEL_CONFIG.mouseSensitivity.y * sensitivityMultiplier
    const targetY = pointer.x * MODEL_CONFIG.mouseSensitivity.x * sensitivityMultiplier

    rotation.current.x = lerp(rotation.current.x, targetX, MODEL_CONFIG.lerpFactor)
    rotation.current.y = lerp(rotation.current.y, targetY, MODEL_CONFIG.lerpFactor)

    // Intro load animation — damp rotation offsets and scale to rest after a short delay
    const intro = introRef.current
    if (startAnimations) {
      if (!intro.started) {
        intro.elapsed += delta
      } else if (intro.elapsed - INTRO_DELAY < ANIMATION_TIMING.duration) {
        intro.elapsed += delta
      }
    }

    if (!intro.started && intro.elapsed >= INTRO_DELAY) {
      intro.started = true
    }
    if (intro.started) {
      const progress = Math.min(1, (intro.elapsed - INTRO_DELAY) / ANIMATION_TIMING.duration)
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)

      intro.yOffset = lerp(intro.startY, 0, ease)
      intro.zOffset = lerp(intro.startZ, 0, ease)
      intro.scale = lerp(intro.startScale, 1, ease)
    }

    groupRef.current.rotation.x = MODEL_CONFIG.baseRotation.x + rotation.current.x
    groupRef.current.rotation.y = MODEL_CONFIG.baseRotation.y + rotation.current.y + intro.yOffset
    groupRef.current.rotation.z = MODEL_CONFIG.baseRotation.z + intro.zOffset
    groupRef.current.scale.setScalar(intro.scale)

    // 2. High-performance switch translation & LED behavior damping (~200ms mechanical feel)
    const targetZ = isOn ? 0 : 0.389
    const targetEmissive = isOn ? MODEL_CONFIG.materials.emissiveIntensity : 0
    const targetHaloOpacity = isOn ? 0.85 : 0

    const damp = THREE.MathUtils.damp
    animValues.current.switchZ = damp(animValues.current.switchZ, targetZ, 16, delta)
    animValues.current.emissive = damp(animValues.current.emissive, targetEmissive, 12, delta)
    animValues.current.haloOpacity = damp(animValues.current.haloOpacity, targetHaloOpacity, 12, delta)

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
    <group ref={groupRef} position={MODEL_CONFIG.position || [0, 0, 0]} dispose={null}>
      <primitive
        object={scene}
        onClick={handleClick}
        onPointerMove={handlePointerMove}
        onPointerOut={handlePointerOut}
      />
    </group>
  )
})

