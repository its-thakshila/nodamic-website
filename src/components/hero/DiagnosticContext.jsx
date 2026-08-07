import { createContext, useContext, useState } from 'react'

const DiagnosticContext = createContext()

export function useDiagnostic() {
  return useContext(DiagnosticContext)
}

export function DiagnosticProvider({ children }) {
  const [showPerf, setShowPerf] = useState(false)
  
  // Step 2: Use Box instead of GLB
  const [useBoxGeometry, setUseBoxGeometry] = useState(false)
  // Step 3: Use MeshBasicMaterial for everything
  const [useBasicMaterial, setUseBasicMaterial] = useState(false)
  // Step 4: Toggle HDRI
  const [enableHDRI, setEnableHDRI] = useState(true)
  // Step 5: Replace MeshPhysicalMaterial with MeshStandardMaterial
  const [useStandardMaterial, setUseStandardMaterial] = useState(false)
  // Step 6: Toggle Lights
  const [enableLights, setEnableLights] = useState(true)
  // Step 7: Toggle ContactShadows
  const [enableContactShadows, setEnableContactShadows] = useState(true)
  // Step 8: Toggle PostProcessing
  const [enablePostProcessing, setEnablePostProcessing] = useState(true)

  const value = {
    showPerf, setShowPerf,
    useBoxGeometry, setUseBoxGeometry,
    useBasicMaterial, setUseBasicMaterial,
    enableHDRI, setEnableHDRI,
    useStandardMaterial, setUseStandardMaterial,
    enableLights, setEnableLights,
    enableContactShadows, setEnableContactShadows,
    enablePostProcessing, setEnablePostProcessing
  }

  return (
    <DiagnosticContext.Provider value={value}>
      {children}
    </DiagnosticContext.Provider>
  )
}
