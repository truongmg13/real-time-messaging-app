import { useRef, useState, useCallback } from 'react'

import type { LogEntry, LogType, ConnectionStatus, OutboundEnvelop, InboundEnvelope } from '../types'

export interface UseWebSocketReturn {
    status: ConnectionStatus
    userId: string | null
    isConnected: boolean
    log: LogEntry[]
    connect: (url: string) => void
    disconnect: () => void
    sendAuth: (token: string) => void
    sendMsg: (recipientId: string, content: string) => void
    addLog: (type: LogType, message: string) => void
}

export function useWebSocket():UseWebSocketReturn {
    const wsRef = useRef<WebSocket | null>(null)

    const [status, setStatus] = useState<ConnectionStatus>('disconnected')
    const [userId, setUserId] = useState<string | null>(null)
    const [log, setLog] = useState<LogEntry[]>([])

    const addLog = useCallback((type: LogType, message: string) => {
        const now = new Date()
        const ts = now.toTimeString().slice(0, 8) + '.' + String(now.getMilliseconds()).padStart(3, '0')
        setLog((prev) => [
            ...prev,
            { id: Date.now() + Math.random(), type, message, ts },
        ])
    }, [])

    /* --- Connect --------------- */
    const connect = useCallback(
        (url: string) => {
            wsRef.current?.close();
            addLog('system', `Connecting to ${url} ...`)

            const ws = new WebSocket(url);
            wsRef.current = ws
            
            ws.onopen = () => {
                setStatus('connected')
                addLog('info', 'Handshake complete. You have 30s to send AUTH.')
            }

            ws.onmessage = (e: MessageEvent<string>) => {
                try {
                    const msg = JSON.parse(e.data) as InboundEnvelope
                    addLog('recv', JSON.stringify(msg, null, 2))

                    if (msg.type === 'AUTH_OK') {
                        setStatus('authenticated')
                        setUserId(msg.userId)
                        addLog('info', `Authenticated as userId: ${msg.userId}`)
                    }
                    if (msg.type === 'ERROR') {
                        addLog('error', `[${msg.code} ${msg.reason}]`)    
                    }
                } catch (err) {
                    addLog('error', e.data)
                }
            }

            ws.onerror = () => {
                addLog('error', 'WebSocket error - is server running on port 8081')
            }
            
            ws.onclose = (e: CloseEvent) => {
                setStatus('closed')
                setUserId(null)
                addLog('system', `Closed - code ${e.code}${e.reason ? ' -- ' + e.reason : ''}`)   
                wsRef.current = null
            }

        }, [addLog]
    )

    const disconnect = useCallback(() => {
        wsRef.current?.close(1000, 'Client closed');
    }, [])

    const send = useCallback(
        (obj: OutboundEnvelop): boolean => {
            const ws = wsRef.current
            if (!ws || ws.readyState !== WebSocket.OPEN) {
                addLog('error', 'Not connected')
                return false
            }
            ws.send(JSON.stringify(obj))
            addLog('sent', JSON.stringify(obj, null, 2));
            return true
        },
        [addLog]
    )

    const sendAuth = useCallback(
        (token: string) => send({ type: 'AUTH', token }),
        [send]
    )

    const sendMsg = useCallback(
        (recipientId: string, content: string) =>
            send({ type: 'SEND', recipientId, content }),
        [send]
    )
    
    const isConnected = status === 'connected' || status === 'authenticated'

    return {
        status,
        userId,
        isConnected,
        log,
        connect,
        disconnect,
        sendAuth,
        sendMsg,
        addLog
    }
}