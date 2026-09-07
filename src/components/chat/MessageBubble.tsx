import type { Message } from '../../types'
import styles from './MessageBubble.module.css'

interface MessageBubbleProps {
  message: Message
  isMine: boolean
}

export default function MessageBubble({ message, isMine }: MessageBubbleProps) {
  const time = new Date(message.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div className={`${styles.row} ${isMine ? styles.rowMine : ''}`}>
      <div className={`${styles.bubble} ${isMine ? styles.bubbleMine : ''}`}>
        {message.content}
        <span className={styles.time}>{time}</span>
      </div>
    </div>
  )
}
