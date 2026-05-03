import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AgentPage } from '@/pages/agent'
import { AudioPage } from '@/pages/audio'
import { ImagePage } from '@/pages/image'
import { VideoPage } from '@/pages/video'
import { Sidebar } from '@/widgets/sidebar'

const shellPanelClass = 'neo-shell-panel relative ml-4 max-sm:m-0 max-lg:m-0 min-h-[calc(100vh-2rem)] min-w-0 flex-1 overflow-x-auto overflow-y-auto rounded-3xl border max-sm:text-xs max-lg:text-sm p-6 backdrop-blur-xl max-sm:w-full max-lg:w-full max-sm:border-none max-lg:border-none max-sm:p-2 max-lg:p-4 max-sm:rounded-md max-lg:rounded-xl'

export const AppShell = () => {
  return (
    <BrowserRouter>
      <div className="flex max-sm:flex-col max-lg:flex-col min-h-[calc(100vh-2rem)] w-full min-w-0 justify-between gap-4 max-sm:gap-1 max-lg:gap-2 max-sm:text-xs max-lg:text-sm">
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
