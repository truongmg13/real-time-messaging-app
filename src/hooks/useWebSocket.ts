import { useRef, useState, useCallback } from 'react'

import type { ConnectionStatus, OutboundEnvelop, InboundEnvelope, AuthOkMessge, IncomingMessage, ErrorMessage } from '../types'

export interface UseWebSocketOptions {
    onAuthOk?: (msg: AuthOkMessge) => void
    onMessage?: (msg: IncomingMessage) => void
    onError?: (msg: ErrorMessage) => void
    onClose?: (event: CloseEvent) => void
}

export interface UseWebSocketReturn {
    status: ConnectionStatus
    connect: (url: string) => void
    disconnect: () => void
    sendAuth: (token: string) => void
    sendMsg: (recipientId: string, content: string) => boolean
}

export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
    const wsRef = useRef<WebSocket | null>(null)
    const optionsRef = useRef(options)
    optionsRef.current = options

    const [status, setStatus] = useState<ConnectionStatus>('disconnected')

    const connect = useCallback((url: string) => {
        wsRef.current?.close()

        const ws = new WebSocket(url)
        wsRef.current = ws

        ws.onopen = () => {
            if (wsRef.current !== ws) return // stale socket from a superseded connect() call
            setStatus('connected')
        }

        ws.onmessage = (e: MessageEvent<string>) => {
            if (wsRef.current !== ws) return
            try {
                const msg = JSON.parse(e.data) as InboundEnvelope
                if (msg.type === 'AUTH_OK') {
                    setStatus('authenticated')
                    optionsRef.current.onAuthOk?.(msg)
                } else if (msg.type === 'MESSAGE') {
                    optionsRef.current.onMessage?.(msg)
                } else if (msg.type === 'ERROR') {
                    optionsRef.current.onError?.(msg)
                }
            } catch {
                // ignore malformed frames
            }
        }

        ws.onclose = (e: CloseEvent) => {
            if (wsRef.current !== ws) return // an already-superseded socket closing; don't clobber the live one
            setStatus('closed')
            wsRef.current = null
            optionsRef.current.onClose?.(e)
        }
    }, [])

    const disconnect = useCallback(() => {
        wsRef.current?.close(1000, 'Client closed')
    }, [])

    const send = useCallback((obj: OutboundEnvelop): boolean => {
        const ws = wsRef.current
        if (!ws || ws.readyState !== WebSocket.OPEN) return false
        ws.send(JSON.stringify(obj))
        return true
    }, [])

    const sendAuth = useCallback((token: string) => {
        send({ type: 'AUTH', token })
    }, [send])

    const sendMsg = useCallback(
        (recipientId: string, content: string) => send({ type: 'SEND', recipientId, content }),
        [send]
    )

    return { status, connect, disconnect, sendAuth, sendMsg }
}
