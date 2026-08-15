import { useEffect, useRef } from 'react'
import type { LogEntry, LogType } from '../types'
import styles from './LogPanel.module.css'

const TYPE_CLASS: Record<LogType | 'system', string> = {
    sent: styles.sent,
    recv: styles.recv,
    info: styles.info,
    error: styles.error,
    system: styles.system
}

function LogEntryRow({ entry }: {entry: LogEntry}) {
    const cls = TYPE_CLASS[entry.type] ?? styles.system
    return (
        <div className={`${styles.entry} ${cls}`}>
            <span className={styles.ts}>{entry.ts}</span>
            <span className={styles.bubble}>{entry.message}</span>
        </div>
    )
}

interface LogPanelProps {
    log: LogEntry[]
}

export default function LogPanel({ log }: LogPanelProps) {
    const bottomRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [log])

    return (
        <div className={styles.panel}>
            <div className={styles.toolbar}>
                <span>{log.length} event{log.length !== 1 ? 's' : ''}</span>
            </div>

            <div className={styles.log}>
                {log.map(entry => (
                    <LogEntryRow key={entry.id} entry={entry} />
                ))}
            </div>
        </div>
    )
}