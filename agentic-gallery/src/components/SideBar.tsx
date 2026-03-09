import { NavLink } from "react-router-dom"

export const SideBar = () => {
    return (
        <div className="p-5 w-[16%] glass-surface neon-border shadow-neon rounded-3xl min-h-screen">
            <nav className="w-50 grid grid-cols-1 gap-4 text-sm font-semibold">
                <NavLink to={"/"} className={({ isActive }) => `nav-link rounded-xl px-4 py-3 ${isActive ? 'active' : ''}`}>Audio</NavLink>
                <NavLink to={"/video"} className={({ isActive }) => `nav-link rounded-xl px-4 py-3 ${isActive ? 'active' : ''}`}>Video</NavLink>
                <NavLink to={"/image"} className={({ isActive }) => `nav-link rounded-xl px-4 py-3 ${isActive ? 'active' : ''}`}>Images</NavLink>
                <NavLink to={"/trash"} className={({ isActive }) => `nav-link rounded-xl px-4 py-3 ${isActive ? 'active' : ''}`}>Trash</NavLink>
            </nav>
        </div>
    )
}
