import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import * as api from '../api/client'
import type { AuthResponse, LoginRequest, RegisterRequest } from '../types'

const STORAGE_KEY = 'auth'

function readStoredAuth(): AuthResponse | null {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    try {
        return JSON.parse(raw) as AuthResponse
    } catch {
        return null
    }
}

interface AuthContextValue {
    user: AuthResponse | null
    login: (req: LoginRequest) => Promise<void>
    register: (req: RegisterRequest) => Promise<void>
    logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthResponse | null>(() => readStoredAuth())

    const persist = useCallback((auth: AuthResponse) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(auth))
        setUser(auth)
    }, [])

    const login = useCallback(async (req: LoginRequest) => {
        const auth = await api.login(req)
        persist(auth)
    }, [persist])

    const register = useCallback(async (req: RegisterRequest) => {
        const auth = await api.register(req)
        persist(auth)
    }, [persist])

    const logout = useCallback(() => {
        localStorage.removeItem(STORAGE_KEY)
        setUser(null)
    }, [])

    const value = useMemo(() => ({ user, login, register, logout }), [user, login, register, logout])

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used within AuthProvider')
    return ctx
}
