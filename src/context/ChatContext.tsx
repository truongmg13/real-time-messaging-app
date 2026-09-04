import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import * as api from '../api/client'
import { useWebSocket } from '../hooks/useWebSocket'
import { useAuth } from './AuthContext'
import { WS_URL } from '../config'
import type { ConnectionStatus, ErrorMessage, IncomingMessage, Message, User } from '../types'

interface ChatContextValue {
    myUserId: string
    wsStatus: ConnectionStatus
    users: User[]
    conversations: Record<string, Message[]>
    activeConversationId: string | null
    setActiveConversation: (peerId: string | null) => void
    sendMessage: (recipientId: string, content: string) => void
    searchQuery: string
    setSearchQuery: (query: string) => void
    searchResults: User[]
    isSearching: boolean
}

const ChatContext = createContext<ChatContextValue | null>(null)

function mergeMessages(existing: Message[], incoming: Message[]): Message[] {
    const byId = new Map(existing.map((m) => [m.id, m]))
    for (const m of incoming) {
        if (!byId.has(m.id)) byId.set(m.id, m)
    }
    return Array.from(byId.values()).sort((a, b) => a.sentAt.localeCompare(b.sentAt))
}

export function ChatProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth()
    if (!user) throw new Error('ChatProvider requires an authenticated user')

    const [users, setUsers] = useState<User[]>([])
    const [conversations, setConversations] = useState<Record<string, Message[]>>({})
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<User[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const loadedHistory = useRef<Set<string>>(new Set())

    const handleAuthOk = useCallback(() => {
        api.fetchUsers(user.token).then(setUsers).catch(() => {})
    }, [user.token])

    const handleMessage = useCallback((msg: IncomingMessage) => {
        const message: Message = {
            id: msg.id,
            senderId: msg.senderId,
            recipientId: user.userId,
            content: msg.content,
            sentAt: msg.sentAt
        }
        setConversations((prev) => ({
            ...prev,
            [msg.senderId]: mergeMessages(prev[msg.senderId] ?? [], [message])
        }))
    }, [user.userId])

    const handleError = useCallback((msg: ErrorMessage) => {
        console.warn(`[ws] ${msg.code}: ${msg.reason}`)
    }, [])

    const { status, connect, disconnect, sendAuth, sendMsg } = useWebSocket({
        onAuthOk: handleAuthOk,
        onMessage: handleMessage,
        onError: handleError
    })

    useEffect(() => {
        connect(WS_URL)
        return () => disconnect()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user.token])

    useEffect(() => {
        if (status === 'connected') sendAuth(user.token)
    }, [status, user.token, sendAuth])

    useEffect(() => {
        const query = searchQuery.trim()
        if (!query) {
            setIsSearching(false)
            setSearchResults([])
            return
        }

        let ignore = false
        setIsSearching(true)
        const timer = setTimeout(() => {
            api.searchUsers(user.token, query)
                .then((results) => { if (!ignore) setSearchResults(results) })
                .catch(() => { if (!ignore) setSearchResults([]) })
                .finally(() => { if (!ignore) setIsSearching(false) })
        }, 300)

        return () => {
            ignore = true
            clearTimeout(timer)
        }
    }, [searchQuery, user.token])

    const setActiveConversation = useCallback((peerId: string | null) => {
        setActiveConversationId(peerId)
        if (!peerId || loadedHistory.current.has(peerId)) return
        loadedHistory.current.add(peerId)

        api.fetchMessages(user.token, peerId)
            .then((history) => {
                setConversations((prev) => ({
                    ...prev,
                    [peerId]: mergeMessages(prev[peerId] ?? [], history)
                }))
            })
            .catch(() => {
                loadedHistory.current.delete(peerId)
            })
    }, [user.token])

    const sendMessage = useCallback((recipientId: string, content: string) => {
        if (!sendMsg(recipientId, content)) return
        const message: Message = {
            id: `local-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            senderId: user.userId,
            recipientId,
            content,
            sentAt: new Date().toISOString()
        }
        setConversations((prev) => ({
            ...prev,
            [recipientId]: [...(prev[recipientId] ?? []), message]
        }))
    }, [sendMsg, user.userId])

    const value = useMemo<ChatContextValue>(() => ({
        myUserId: user.userId,
        wsStatus: status,
        users,
        conversations,
        activeConversationId,
        setActiveConversation,
        sendMessage,
        searchQuery,
        setSearchQuery,
        searchResults,
        isSearching
    }), [
        user.userId, status, users, conversations, activeConversationId, setActiveConversation, sendMessage,
        searchQuery, searchResults, isSearching
    ])

    return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export function useChat(): ChatContextValue {
    const ctx = useContext(ChatContext)
    if (!ctx) throw new Error('useChat must be used within ChatProvider')
    return ctx
}
