
export type ConnectionStatus = 'disconnected' | 'connected' | 'authenticated' | 'closed'

export type OutboundEnvelop = AuthEnvelope | SendEnvelope

export interface AuthEnvelope {
    type: 'AUTH'
    token: string
}

export interface SendEnvelope {
    type: 'SEND'
    recipientId: string
    content: string
}

export type InboundEnvelope =
    | AuthOkMessge
    | IncomingMessage
    | ErrorMessage

export interface AuthOkMessge {
    type: 'AUTH_OK'
    userId: string
}

export interface IncomingMessage {
    type: 'MESSAGE'
    id: string
    senderId: string
    senderUsername: string
    senderDisplayName: string
    content: string
    sentAt: string
}

export interface ErrorMessage {
    type: 'ERROR'
    code: string
    reason: string
}

/* --- Domain / REST types --- */

export interface User {
    id: string
    username: string
    displayName: string
}

export interface Message {
    id: string
    senderId: string
    recipientId: string
    content: string
    sentAt: string
}

export interface ConversationPageResponse {
    messages: Message[]
    page: number
    size: number
    totalElements: number
    hasMore: boolean
}

export interface AuthResponse {
    token: string
    userId: string
    username: string
    displayName: string
}

export interface LoginRequest {
    username: string
    password: string
}

export interface RegisterRequest {
    username: string
    password: string
    displayName: string
}
