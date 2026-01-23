import { BrowserRouter, Route, Routes } from "react-router-dom"
import { SideBar } from "./components/SideBar"
import { AudioPage } from "./pages/AudioPage"
import { VideoPage } from "./pages/VideoPage"
import { ImagePage } from "./pages/ImagePage"

export const Dasboard = () => {
    return (
        <BrowserRouter>
            <SideBar />
            <div className="relative w-[80%] p-5 h-[100%] backdrop-blur-3xl">
                <Routes>
                    <Route path="/" Component={AudioPage} />
                    <Route path="/video" Component={VideoPage} />
                    <Route path="/image" Component={ImagePage} />
                </Routes>
            </div>
        </BrowserRouter>
    )
}