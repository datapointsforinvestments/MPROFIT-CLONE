import { NavLink } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import clsx from 'clsx'

interface Props {
  onClose?: () => void
}

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  clsx(
    'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors',
    isActive ? 'bg-white/15 text-white font-medium' : 'text-white/60 hover:text-white hover:bg-white/10'
  )

export default function Sidebar({ onClose }: Props) {
  const { user, clearAuth } = useAuthStore()
  const role = user?.role

  return (
    <div className="w-[214px] bg-accent flex flex-col flex-shrink-0 h-full">
      {/* Logo + close button */}
      <div className="px-5 py-5 border-b border-white/10 flex items-start justify-between">
        <div>
          <div className="font-display text-white text-xl font-semibold tracking-tight">M3</div>
          <div className="text-white/50 text-xs mt-0.5">Portfolio Tracker</div>
        </div>
        <button
          onClick={onClose}
          className="md:hidden text-white/50 hover:text-white p-1 -mr-1 -mt-1"
          aria-label="Close menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <NavLink to="/portfolio" className={navLinkClass} onClick={onClose}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Portfolio
        </NavLink>
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="text-white/80 text-sm font-medium">{user?.full_name || user?.username}</div>
        <div className="text-white/40 text-xs capitalize">{role === 'fm' ? 'Fund Manager' : role}</div>
        <button
          onClick={() => {
            clearAuth()
            window.location.href = '/login'
          }}
          className="mt-2 text-white/40 text-xs hover:text-white/70 transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
