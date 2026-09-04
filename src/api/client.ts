import { API_BASE_URL } from '../config'
import type { AuthResponse, ConversationPageResponse, LoginRequest, RegisterRequest, User, Message } from '../types'

export class ApiError extends Error {
    status: number
    constructor(status: number, message: string) {
        super(message)
        this.status = status
    }
}

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> | undefined)
    }
    if (token) headers.Authorization = `Bearer ${token}`

    const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers })

    let body: unknown = null
    const text = await res.text()
    if (text) {
        try { body = JSON.parse(text) } catch { body = text }
    }

    if (!res.ok) {
        const reason =
            body && typeof body === 'object' && 'reason' in body
                ? String((body as { reason: unknown }).reason)
                : res.statusText
        throw new ApiError(res.status, reason || `Request failed (${res.status})`)
    }

    return body as T
}

export function login(req: LoginRequest): Promise<AuthResponse> {
    return request('/api/auth/login', { method: 'POST', body: JSON.stringify(req) })
}

export function register(req: RegisterRequest): Promise<AuthResponse> {
    return request('/api/auth/register', { method: 'POST', body: JSON.stringify(req) })
}

export function fetchUsers(token: string): Promise<User[]> {
    return request('/api/users', { method: 'GET' }, token)
}

export function searchUsers(token: string, query: string): Promise<User[]> {
    return request(`/api/users/search?q=${encodeURIComponent(query)}`, { method: 'GET' }, token)
}

export async function fetchMessages(token: string, peerId: string): Promise<Message[]> {
    const page = await request<ConversationPageResponse>(`/api/messages/conversation/${peerId}`, { method: 'GET' }, token)
    return page.messages ?? []
}
