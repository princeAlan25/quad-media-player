import { AppShell } from './layouts/AppShell'

function App() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#050816] text-[#e7ecff] antialiased">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[18%] top-[20%] h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-500/25 blur-3xl" />
        <div className="absolute left-[80%] top-[10%] h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute left-1/2 top-[85%] h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-400/20 blur-3xl" />
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] bg-size-[100px_100px]" />
      </div>

      <div className="relative z-10 min-h-screen w-full p-4">
        <AppShell />
      </div>
    </div>
  )
}

export default App
