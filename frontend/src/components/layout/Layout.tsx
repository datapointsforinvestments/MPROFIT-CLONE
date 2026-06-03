import { Outlet } from 'react-router-dom'
import TopBar from './TopBar'

export default function Layout() {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <TopBar />
      <main className="flex-1 overflow-y-auto bg-bg">
        <Outlet />
      </main>
    </div>
  )
}
