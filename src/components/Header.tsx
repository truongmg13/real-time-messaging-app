import type { ConnectionStatus } from "../types"
import styles from './Header.module.css'

interface StatusMeta {
  cls: string
  label: string
}

const STATUS_META: Record<ConnectionStatus, StatusMeta> = {
  disconnected:   { cls: '',                    label: 'Disconnected' },
  connected:      { cls: styles.connected,      label: 'Disconnected' },
  authenticated:  { cls: styles.authenticated,  label: 'Disconnected' },
  closed:         { cls: styles.closed,         label: 'Disconnected' },
}

type HeaderProps = {
  status: ConnectionStatus
  userId: string | null
}

export default function Header({ status, userId }: HeaderProps) {
  const { cls, label } = STATUS_META[status] ?? STATUS_META.disconnected
  const badgeLabel = 
    status === 'authenticated' && userId
      ? `Authed ${userId.slice(0, 8)}`
      : label

  return (
    <header className={styles.header}>
      <h1 className={styles.title}>WebSocket Test: ws://localhost:8081</h1>
      <span className={`${styles.badge} ${cls}`}>{badgeLabel}</span>
    </header>
  )
}