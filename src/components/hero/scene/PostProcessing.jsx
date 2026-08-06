import { memo } from 'react'
import {
  EffectComposer,
  Bloom,
  Vignette,
  HueSaturation,
  BrightnessContrast,
  ChromaticAberration,
  N8AO,
  Noise,
} from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { Vector2 } from 'three'
import { POST_PROCESSING_CONFIG } from '../../../config/hero.config'

const CHROMATIC_OFFSET = new Vector2(0.00035, 0.00035)

export default memo(function PostProcessing() {
  const { bloom, ssao, colorGrade, vignette, noise } = POST_PROCESSING_CONFIG

  return (
    <EffectComposer>
      {/*
       * Screen-Space Ambient Occlusion (N8AO Engine)
       * Carves deep contact shadows inside socket terminal cavities and rounded seams.
       */}
      <N8AO
        halfRes={true}
        quality="medium"
        aoRadius={ssao.radius}
        intensity={ssao.intensity}
        distanceFalloff={ssao.distanceFalloff}
      />

      {/*
       * Targeted Bloom — luminanceThreshold locked high to strictly target emissive LED dots
       * and bright mirror specular reflections without fogging matte black hardware surfaces.
       */}
      <Bloom
        intensity={bloom.intensity}
        luminanceThreshold={bloom.luminanceThreshold}
        luminanceSmoothing={bloom.luminanceSmoothing}
        mipmapBlur={true}
        radius={bloom.radius}
      />

      {/* Tasteful studio photographic optics dispersion */}
      <ChromaticAberration
        blendFunction={BlendFunction.NORMAL}
        offset={CHROMATIC_OFFSET}
        radialModulation={true}
        modulationOffset={0.65}
      />

      {/*
       * Monochrome Studio Grading Pass
       * Introduces near-complete monochrome halftones while elevating contrast and luminance
       * to ensure rich dynamic range and liquid reflections rather than flat grayscale.
       */}
      <HueSaturation
        blendFunction={BlendFunction.NORMAL}
        saturation={colorGrade.saturation}
      />
      <BrightnessContrast
        brightness={colorGrade.brightness}
        contrast={colorGrade.contrast}
      />

      {/* Subtle photographic sensor grain texture */}
      <Noise
        opacity={noise.opacity}
        blendFunction={BlendFunction.OVERLAY}
      />

      {/* Perimeter vignette anchoring visual focus centrally onto product geometry */}
      <Vignette
        blendFunction={BlendFunction.MULTIPLY}
        offset={vignette.offset}
        darkness={vignette.darkness}
      />
    </EffectComposer>
  )
})

