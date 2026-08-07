import { memo } from 'react'
import * as THREE from 'three'
import {
  EffectComposer,
  Bloom,
  Vignette,
  HueSaturation,
  BrightnessContrast,
  Noise,
  SMAA,
} from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { POST_PROCESSING_CONFIG, DEBUG_FLAGS } from '../../../config/hero.config'
import { useDiagnostic } from '../DiagnosticContext'

export default memo(function PostProcessing() {
  const { bloom, colorGrade, vignette, noise } = POST_PROCESSING_CONFIG
  const diag = useDiagnostic()

  if (diag && !diag.enablePostProcessing) return null

  return (
    <EffectComposer
      multisampling={0}
      disableNormalPass={true}
      frameBufferType={THREE.HalfFloatType}
      dithering={false}
    >
      {/*
       * Targeted Bloom — luminanceThreshold locked high to strictly target emissive LED dots
       * and bright mirror specular reflections without fogging matte black hardware surfaces.
       */}
      {DEBUG_FLAGS.enableBloom && (
        <Bloom
          intensity={bloom.intensity}
          luminanceThreshold={bloom.luminanceThreshold}
          luminanceSmoothing={bloom.luminanceSmoothing}
          mipmapBlur={true}
          radius={bloom.radius}
        />
      )}

      {/*
       * Monochrome Studio Grading Pass
       * Introduces near-complete monochrome halftones while elevating contrast and luminance
       * to ensure rich dynamic range and liquid reflections rather than flat grayscale.
       */}
      {DEBUG_FLAGS.enableColorGrading && (
        <>
          <HueSaturation
            blendFunction={BlendFunction.NORMAL}
            saturation={colorGrade.saturation}
          />
          <BrightnessContrast
            brightness={colorGrade.brightness}
            contrast={colorGrade.contrast}
          />
        </>
      )}

      {/* Subtle photographic sensor grain texture */}
      {DEBUG_FLAGS.enableNoise && (
        <Noise
          opacity={noise.opacity}
          blendFunction={BlendFunction.OVERLAY}
        />
      )}

      {/* Perimeter vignette anchoring visual focus centrally onto product geometry */}
      {DEBUG_FLAGS.enableVignette && (
        <Vignette
          blendFunction={BlendFunction.MULTIPLY}
          offset={vignette.offset}
          darkness={vignette.darkness}
        />
      )}

      {/* Lightweight Subpixel Morphological Antialiasing to smooth harsh geometric edges */}
      {DEBUG_FLAGS.enableSMAA && <SMAA />}
    </EffectComposer>
  )
})

