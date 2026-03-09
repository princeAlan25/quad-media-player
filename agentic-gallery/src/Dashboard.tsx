import { BrowserRouter, Route, Routes } from "react-router-dom"
import { SideBar } from "./components/SideBar"
import { AudioPage } from "./pages/AudioPage"
import { VideoPage } from "./pages/VideoPage"
import { ImagePage } from "./pages/ImagePage"
import { TrashPage } from "./pages/TrashPage"

export const Dasboard = () => {
    return (
        <BrowserRouter>
            <SideBar />
            <div className="relative w-[84%] p-6 h-full glass-surface neon-border neon-glow rounded-3xl ml-4 min-h-screen">
                <Routes>
                    <Route path="/" Component={AudioPage} />
                    <Route path="/video" Component={VideoPage} />
                    <Route path="/image" Component={ImagePage} />
                    <Route path="/trash" Component={TrashPage} />
                </Routes>
            </div>
        </BrowserRouter>
    )
}
