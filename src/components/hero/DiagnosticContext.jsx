import { createContext, useContext, useState, useEffect } from 'react'

const DiagnosticContext = createContext()

export function useDiagnostic() {
  return useContext(DiagnosticContext)
}

function useStickyState(defaultValue, key) {
  const [value, setValue] = useState(() => {
    const stickyValue = window.localStorage.getItem(key)
    return stickyValue !== null ? JSON.parse(stickyValue) : defaultValue
  })
  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])
  return [value, setValue]
}

export function DiagnosticProvider({ children }) {
  const [showPerf, setShowPerf] = useStickyState(false, 'diag_showPerf')
  const [useBoxGeometry, setUseBoxGeometry] = useStickyState(false, 'diag_useBox')
  const [useBasicMaterial, setUseBasicMaterial] = useStickyState(false, 'diag_useBasic')
  const [enableHDRI, setEnableHDRI] = useStickyState(true, 'diag_enableHDRI')
  const [useStandardMaterial, setUseStandardMaterial] = useStickyState(false, 'diag_useStandard')
  const [enableLights, setEnableLights] = useStickyState(true, 'diag_enableLights')
  const [enableContactShadows, setEnableContactShadows] = useStickyState(true, 'diag_enableContactShadows')
  const [enablePostProcessing, setEnablePostProcessing] = useStickyState(true, 'diag_enablePostProcessing')
  const [hdriRotation, setHdriRotation] = useStickyState(null, 'diag_hdriRotation')

  const value = {
    showPerf, setShowPerf,
    useBoxGeometry, setUseBoxGeometry,
    useBasicMaterial, setUseBasicMaterial,
    enableHDRI, setEnableHDRI,
    useStandardMaterial, setUseStandardMaterial,
    enableLights, setEnableLights,
    enableContactShadows, setEnableContactShadows,
    enablePostProcessing, setEnablePostProcessing,
    hdriRotation, setHdriRotation
  }

  return (
    <DiagnosticContext.Provider value={value}>
      {children}
    </DiagnosticContext.Provider>
  )
}
