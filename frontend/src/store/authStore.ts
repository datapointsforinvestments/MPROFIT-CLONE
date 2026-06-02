import { create } from 'zustand'
import type { User } from '../types'

const ROLE_DEFAULT_TABS: Record<string, string[]> = {
  analyst: ['dashboard', 'upload', 'tasks', 'slack'],
  fm: ['dashboard', 'upload', 'tasks', 'database', 'portfolio', 'mom', 'execution', 'slack'],
  admin: ['dashboard', 'upload', 'tasks', 'database', 'portfolio', 'mom', 'execution', 'slack'],
}

export function getUserTabs(user: User | null): string[] {
  if (!user) return []
  if (user.tab_permissions && user.tab_permissions.length > 0) return user.tab_permissions
  return ROLE_DEFAULT_TABS[user.role] ?? ['dashboard']
}

interface AuthState {
  user: User | null
  token: string | null
  setAuth: (user: User, token: string) => void
  clearAuth: () => void
  isAdmin: () => boolean
  hasTab: (tab: string) => boolean
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('m3_token'),

  setAuth: (user, token) => {
    localStorage.setItem('m3_token', token)
    set({ user, token })
  },

  clearAuth: () => {
    localStorage.removeItem('m3_token')
    set({ user: null, token: null })
  },

  isAdmin: () => get().user?.role === 'admin',

  hasTab: (tab: string) => getUserTabs(get().user).includes(tab),
}))
