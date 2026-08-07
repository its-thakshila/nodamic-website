import { useDiagnostic } from './DiagnosticContext'

export default function MobileDiagnosticUI() {
  const diag = useDiagnostic()

  return (
    <div className="absolute top-0 right-0 p-4 z-[9999] max-h-screen overflow-y-auto flex flex-col gap-2 pointer-events-auto w-64 bg-black/80 backdrop-blur-md rounded-bl-xl border-l border-b border-white/10 shadow-2xl">
      <h3 className="text-white text-xs font-bold mb-2 uppercase tracking-widest text-center text-emerald-400">Diag Mode Active</h3>
      
      <ToggleButton 
        label="1. r3f-perf (FPS)" 
        active={diag.showPerf} 
        onClick={() => diag.setShowPerf(!diag.showPerf)} 
      />
      <ToggleButton 
        label="2. Use Box (Kill GLB)" 
        active={diag.useBoxGeometry} 
        onClick={() => diag.setUseBoxGeometry(!diag.useBoxGeometry)} 
      />
      <ToggleButton 
        label="3. BasicMaterial (Kill Lighting Math)" 
        active={diag.useBasicMaterial} 
        onClick={() => diag.setUseBasicMaterial(!diag.useBasicMaterial)} 
      />
      <ToggleButton 
        label="4. HDRI On" 
        active={diag.enableHDRI} 
        onClick={() => diag.setEnableHDRI(!diag.enableHDRI)} 
        warning={!diag.enableHDRI}
      />
      <ToggleButton 
        label="5. StandardMaterial (Kill Clearcoat)" 
        active={diag.useStandardMaterial} 
        onClick={() => diag.setUseStandardMaterial(!diag.useStandardMaterial)} 
      />
      <ToggleButton 
        label="6. Studio Lights On" 
        active={diag.enableLights} 
        onClick={() => diag.setEnableLights(!diag.enableLights)} 
        warning={!diag.enableLights}
      />
      <ToggleButton 
        label="7. ContactShadows On" 
        active={diag.enableContactShadows} 
        onClick={() => diag.setEnableContactShadows(!diag.enableContactShadows)} 
        warning={!diag.enableContactShadows}
      />
      <ToggleButton 
        label="8. PostProcessing On" 
        active={diag.enablePostProcessing} 
        onClick={() => diag.setEnablePostProcessing(!diag.enablePostProcessing)} 
        warning={!diag.enablePostProcessing}
      />

      <div className="mt-4 p-2 bg-white/5 border border-white/10 rounded text-[10px] text-white/50 leading-tight">
        Test sequentially on your mobile device. If disabling a feature fixes the stutter, that is the primary bottleneck.
      </div>
    </div>
  )
}

function ToggleButton({ label, active, onClick, warning }) {
  return (
    <button
      onClick={onClick}
      className={`w-full py-2 px-3 rounded text-left text-xs font-medium transition-colors ${
        active 
          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
          : warning 
            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
            : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
      }`}
    >
      {label}
    </button>
  )
}
