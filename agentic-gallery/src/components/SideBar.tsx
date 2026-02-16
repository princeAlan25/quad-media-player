import { Link } from "react-router-dom"

export const SideBar = () => {
    return (
        <div className="p-5 w-[16%] backdrop-blur-3xl">
            <nav className="w-50 text-white grid grid-cols-1 gap-5 *:border *:border-white/50 *:rounded-md *:p-2 *:hover:pl-3 *:hover:bg-white/20 *:active:bg-white/0 *:transition duration-700 ease-in-out">
                <Link to={"/"} className="p-2">Audio</Link>
                <Link to={"/video"}>Video</Link>
                <Link to={"/image"}>Images</Link>
            </nav>
        </div>
    )
}