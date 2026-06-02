import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — hidden on mobile unless open */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 transition-transform duration-200 md:relative md:translate-x-0 md:z-auto md:flex
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <div className="flex flex-col min-w-0 overflow-hidden flex-1">
        <TopBar onMenuOpen={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto bg-bg p-4">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
