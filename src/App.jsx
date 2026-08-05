import Header from './components/Header'
import Hero from './components/hero/Hero'

function App() {
  return (
    <div className="relative w-screen min-h-screen bg-[#0a0a0a]">
      {/* Fixed top navigation */}
      <Header />

      {/* Main architectural Hero section (100vh) */}
      <Hero />
    </div>
  )
}

export default App
