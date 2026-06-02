import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { authApi } from './api/client'
import Login from './pages/Login'
import Portfolio from './pages/Portfolio'
import Layout from './components/layout/Layout'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore()
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  const { token, setAuth, clearAuth } = useAuthStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      authApi
        .me()
        .then((res) => setAuth(res.data, token))
        .catch(() => clearAuth())
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-ink3 text-sm">Loading...</div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/portfolio" replace />} />
          <Route path="portfolio" element={<Portfolio />} />
        </Route>
        <Route path="*" element={<Navigate to="/portfolio" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
