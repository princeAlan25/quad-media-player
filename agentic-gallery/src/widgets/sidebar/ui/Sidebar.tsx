import { NavLink } from 'react-router-dom'

const sidebarPanelClass = 'neo-sidebar-panel w-full min-w-0 max-w-[240px] max-sm:max-w-full max-lg:max-w-full flex-none overflow-x-auto rounded-3xl max-sm:rounded-lg max-lg:rounded-xl border max-sm:border-none max-lg:border-none max-sm:bg-none max-lg:bg-none p-5 max-sm:p-2 max-lg:p-3 backdrop-blur-xl'

const getNavLinkClass = ({ isActive }: { isActive: boolean }) => (
  isActive
    ? 'neo-nav-link is-active relative max-sm:flex max-lg:flex justify-center rounded-xl max-sm:rounded-md max-lg:rounded-lg max-sm:scale-90 max-lg:scale-95 border px-4 py-3 max-sm:p-2 max-lg:p-3 transition-all duration-200'
    : 'neo-nav-link relative rounded-xl max-sm:flex max-lg:flex justify-center border max-sm:rounded-md max-lg:rounded-lg max-sm:scale-80 max-lg:scale-90 px-4 py-3 max-sm:p-2 max-lg:p-3 transition-all duration-200 hover:-translate-y-0.5'
)

export const Sidebar = () => {
  return (
    <div className={sidebarPanelClass}>
      <nav className="w-50 max-sm:w-full max-lg:w-full grid grid-cols-1 max-sm:grid-cols-4 max-lg:grid-cols-4 gap-4 max-sm:gap-0 max-lg:gap-2 text-sm font-semibold max-sm:text-xs max-lg:text-sm">
        <NavLink to="/agent" className={getNavLinkClass}>Agent</NavLink>
        <NavLink to="/" className={getNavLinkClass}>Audio</NavLink>
        <NavLink to="/video" className={getNavLinkClass}>Video</NavLink>
        <NavLink to="/image" className={getNavLinkClass}>Images</NavLink>
      </nav>
    </div>
  )
}
