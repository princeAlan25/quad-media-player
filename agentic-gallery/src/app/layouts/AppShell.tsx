import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AgentPage } from '@/pages/agent'
import { AudioPage } from '@/pages/audio'
import { ImagePage } from '@/pages/image'
import { VideoPage } from '@/pages/video'
import { Sidebar } from '@/widgets/sidebar'

const shellPanelClass = 'relative ml-4 max-sm:m-0 min-h-[calc(100vh-2rem)] flex-1 overflow-x-auto overflow-y-auto rounded-3xl border max-sm:text-xs border-violet-500/35 bg-white/5 p-6 backdrop-blur-xl shadow-[0_10px_40px_rgba(139,92,246,0.25),0_0_0_1px_rgba(34,211,238,0.12),0_0_20px_rgba(245,158,11,0.08)] max-sm:w-full max-sm:border-none max-sm:p-2 max-sm:rounded-md'

export const AppShell = () => {
  return (
    <BrowserRouter>
      <div className="flex max-sm:flex-col min-h-[calc(100vh-2rem)] w-full justify-between gap-4 max-sm:gap-1 max-sm:text-xs">
        <Sidebar />
        <div className={shellPanelClass}>
          <Routes>
            <Route path="/agent" Component={AgentPage} />
            <Route path="/" Component={AudioPage} />
            <Route path="/video" Component={VideoPage} />
            <Route path="/image" Component={ImagePage} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  )
}
