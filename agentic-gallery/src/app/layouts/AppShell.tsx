import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AudioPage } from '@/pages/audio'
import { Sidebar } from '@/widgets/sidebar'

const shellPanelClass = 'relative ml-4 min-h-[calc(100vh-2rem)] flex-1 overflow-x-auto overflow-y-auto rounded-3xl border border-violet-500/35 bg-white/5 p-6 backdrop-blur-xl shadow-[0_10px_40px_rgba(139,92,246,0.25),0_0_0_1px_rgba(34,211,238,0.12),0_0_20px_rgba(245,158,11,0.08)]'

export const AppShell = () => {
  return (
    <BrowserRouter>
      <div className="flex min-h-[calc(100vh-2rem)] w-full justify-between gap-4">
        <Sidebar />
        <div className={shellPanelClass}>
          <Routes>
            <Route path="/" Component={AudioPage} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  )
}
