import { Component } from 'react'

/**
 * Catches errors thrown by the R3F Canvas (e.g., WebGL context loss)
 * and renders a graceful fallback instead of crashing the whole UI.
 */
export default class WebGLErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.warn('[WebGL Error Boundary]', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse at 60% 40%, #1a1a1a 0%, #0a0a0a 70%)',
            zIndex: 1,
          }}
        />
      )
    }
    return this.props.children
  }
}
