import { useRef, useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { MODEL_CONFIG } from '../config/hero.config'

useGLTF.preload(MODEL_CONFIG.path)

/* ─── Lerp helper ─────────────────────────────────────────────────────────── */
function lerp(a, b, t) {
  return a + (b - a) * t
}

export default function Node1Model() {
  const groupRef = useRef()

  const { scene: originalScene } = useGLTF(MODEL_CONFIG.path)

  // Clone so we never mutate the useGLTF cache
  const scene = useMemo(() => originalScene.clone(true), [originalScene])

  const mouse = useRef({ x: 0, y: 0 })
  const rotation = useRef({ x: 0, y: 0 })
  const { gl } = useThree()

  // Compute bounding box from the ORIGINAL unmodified scene
  const { normScale, centerOffset } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(originalScene)
    const size = new THREE.Vector3()
    const center = new THREE.Vector3()
    box.getSize(size)
    box.getCenter(center)
    const maxAxis = Math.max(size.x, size.y, size.z)
    return { normScale: MODEL_CONFIG.targetSize / maxAxis, centerOffset: center }
  }, [originalScene])

  /* ── Mouse / touch tracking ── */
  useEffect(() => {
    const onMouseMove = (e) => {
      mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 2
      mouse.current.y = (e.clientY / window.innerHeight - 0.5) * 2
    }
    const onTouchMove = (e) => {
      if (!e.touches[0]) return
      mouse.current.x = (e.touches[0].clientX / window.innerWidth - 0.5) * 2
      mouse.current.y = (e.touches[0].clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('mousemove', onMouseMove, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('touchmove', onTouchMove)
    }
  }, [gl])

  /* ── Apply normalization + materials to clone ── */
  useEffect(() => {
    if (!scene) return

    scene.scale.setScalar(normScale)
    scene.position.set(
      -centerOffset.x * normScale,
      -centerOffset.y * normScale,
      -centerOffset.z * normScale,
    )

    scene.traverse((child) => {
      if (child.isMesh && child.material) {
        const mat = child.material

        // CRITICAL: GLBs often export with envMapIntensity=0 or a baked
        // envMap that blocks the scene's HDRI from showing.
        // Clear the baked envMap so Three.js falls back to scene.environment,
        // then set a strong envMapIntensity so reflections are actually visible.
        if ('envMap' in mat) mat.envMap = null
        if ('envMapIntensity' in mat) mat.envMapIntensity = 1.0

        // Preserve original roughness — acrylic face keeps its authored value.
        if (mat.metalness !== undefined)
          mat.metalness = Math.max(mat.metalness, MODEL_CONFIG.materials.metalnessFloor)

        mat.needsUpdate  = true
        child.castShadow    = true
        child.receiveShadow = true

        const name = (child.name || '').toLowerCase()
        if (
          name.includes('led') || name.includes('light') ||
          name.includes('indicator') || name.includes('dot') || name.includes('glow')
        ) {
          mat.emissive          = new THREE.Color(MODEL_CONFIG.materials.emissiveColor)
          mat.emissiveIntensity = MODEL_CONFIG.materials.emissiveIntensity
          mat.toneMapped        = false
        }

        mat.needsUpdate = true
      }
    })
  }, [scene, normScale, centerOffset])

  /* ── Animation loop ── */
  useFrame(({ clock }) => {
    if (!groupRef.current) return

    // Tiny subtle follow — model gently leans toward the cursor
    const targetX = mouse.current.y * MODEL_CONFIG.mouseSensitivity.y
    const targetY = mouse.current.x * MODEL_CONFIG.mouseSensitivity.x

    rotation.current.x = lerp(rotation.current.x, targetX, MODEL_CONFIG.lerpFactor)
    rotation.current.y = lerp(rotation.current.y, targetY, MODEL_CONFIG.lerpFactor)

    groupRef.current.rotation.x = MODEL_CONFIG.baseRotation.x + rotation.current.x
    groupRef.current.rotation.y = MODEL_CONFIG.baseRotation.y + rotation.current.y
    groupRef.current.rotation.z = MODEL_CONFIG.baseRotation.z
  })

  return (
    // Centered on page
    <group ref={groupRef} position={[0, 0, 0]} dispose={null}>
      <primitive object={scene} />
    </group>
  )
}
