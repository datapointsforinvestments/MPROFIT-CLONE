import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../api/client'
import { useAuthStore } from '../store/authStore'

export default function Login() {
  const navigate = useNavigate()
  const { setAuth, token } = useAuthStore()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Already logged in
  if (token) {
    navigate('/dashboard', { replace: true })
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const loginRes = await authApi.login(username, password)
      const { access_token } = loginRes.data
      localStorage.setItem('m3_token', access_token)
      const meRes = await authApi.me()
      setAuth(meRes.data, access_token)
      navigate('/dashboard', { replace: true })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(msg || 'Invalid username or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="font-display text-accent text-4xl font-semibold">M3</div>
          <div className="text-ink3 text-sm mt-1">Investment Research Platform</div>
        </div>

        {/* Card */}
        <div className="bg-surface rounded-xl border border-border p-8 shadow-sm">
          <h1 className="text-lg font-semibold text-ink mb-6">Sign in</h1>

          {error && (
            <div className="bg-red-bg border border-red/20 text-red text-sm rounded-md px-3 py-2 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-ink2 mb-1.5">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface2 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                placeholder="e.g. mudit"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ink2 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface2 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-2.5 mt-2 text-sm font-medium"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-ink3 mt-6">
          M3 Family Office · Internal Platform
        </p>
      </div>
    </div>
  )
}
