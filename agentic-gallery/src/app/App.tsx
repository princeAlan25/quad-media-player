import { AppShell } from './layouts/AppShell'

function App() {
  return (
    <div className="app-neumorph-root relative min-h-screen w-full overflow-hidden text-[#687185] antialiased">
      <div className="relative z-10 min-h-screen w-full p-4 max-sm:p-1">
        <AppShell />
      </div>
    </div>
  )
}

export default App
