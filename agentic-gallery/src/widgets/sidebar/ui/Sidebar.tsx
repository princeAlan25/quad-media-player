import { NavLink } from 'react-router-dom'

const sidebarPanelClass = 'w-full max-w-[240px] flex-none overflow-x-auto rounded-3xl border border-violet-500/35 bg-white/5 p-5 backdrop-blur-xl shadow-[0_10px_30px_rgba(34,211,238,0.25),0_0_25px_rgba(139,92,246,0.3)]'

const getNavLinkClass = ({ isActive }: { isActive: boolean }) => (
  isActive
    ? 'rounded-xl border border-violet-400/80 bg-violet-500/25 px-4 py-3 text-white shadow-[0_0_20px_rgba(139,92,246,0.45)] transition-all duration-200'
    : 'rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[#e5e7ff] transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-400/60 hover:bg-cyan-400/10 hover:text-white hover:shadow-[0_0_18px_rgba(34,211,238,0.35)]'
)

export const Sidebar = () => {
  return (
    <div className={sidebarPanelClass}>
      <nav className="w-50 grid grid-cols-1 gap-4 text-sm font-semibold">
        <NavLink to="/" className={getNavLinkClass}>Audio</NavLink>
        <NavLink to="/image" className={getNavLinkClass}>Images</NavLink>
      </nav>
    </div>
  )
}
