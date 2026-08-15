
export type ConnectionStatus = 'disconnected' | 'connected' | 'authenticated' | 'closed'

export type LogType = 'sent' | 'recv' | 'info' | 'error' | 'system'

export type OutboundEnvelop = AuthEnvelope | SendEnvelope

export interface LogEntry {
    id: number
    type: LogType
    message: string
    ts: string
}

export interface AuthResponse {
    token: string
    userId: string
    username: string
    displayName: string
}

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