export default function LightingLayer() {
  return (
    <div
      className="absolute inset-0 w-full h-full z-[1] pointer-events-none"
      style={{
        background: `
          radial-gradient(
            ellipse 65% 60% at 68% 35%,
            rgba(28, 28, 28, 1) 0%,
            rgba(17, 17, 17, 0.65) 35%,
            rgba(10, 10, 10, 0) 75%
          )
        `,
      }}
      aria-hidden="true"
    />
  )
}
