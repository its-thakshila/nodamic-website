import {
  EffectComposer,
  Bloom,
  Vignette,
  HueSaturation,
  ChromaticAberration,
} from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { Vector2 } from 'three'

export default function PostProcessing() {
  return (
    <EffectComposer>
      {/*
       * Bloom — targets bright/emissive pixels only (LED glow).
       * High luminanceThreshold means only very bright spots bloom.
       */}
      <Bloom
        intensity={1.4}
        luminanceThreshold={0.82}
        luminanceSmoothing={0.88}
        mipmapBlur={true}
        radius={0.7}
      />

      {/*
       * Subtle chromatic aberration — luxury lens distortion at edges.
       * Very low offset keeps it tasteful.
       */}
      <ChromaticAberration
        blendFunction={BlendFunction.NORMAL}
        offset={new Vector2(0.0005, 0.0005)}
        radialModulation={true}
        modulationOffset={0.65}
      />

      {/*
       * Desaturation — pulls scene toward monochrome for moody aesthetic.
       * -0.3 is subtle; -1.0 would be fully B&W.
       */}
      <HueSaturation
        blendFunction={BlendFunction.NORMAL}
        saturation={-0.3}
      />

      {/*
       * Vignette — darkens edges to keep eye focused on the product.
       */}
      <Vignette
        blendFunction={BlendFunction.MULTIPLY}
        offset={0.28}
        darkness={0.72}
      />
    </EffectComposer>
  )
}
