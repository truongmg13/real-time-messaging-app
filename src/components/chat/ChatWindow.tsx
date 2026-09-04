import { useEffect, useRef } from 'react'
import type { Message, User } from '../../types'
import MessageBubble from './MessageBubble'
import MessageInput from './MessageInput'
import styles from './ChatWindow.module.css'

interface ChatWindowProps {
  peer: User | null
  messages: Message[]
  myUserId: string
  canSend: boolean
  onSend: (content: string) => void
}

export default function ChatWindow({ peer, messages, myUserId, canSend, onSend }: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, peer])

  if (!peer) {
    return (
      <div className={styles.window}>
        <div className={styles.emptyState}>Select a conversation to start chatting</div>
      </div>
    )
  }

  return (
    <div className={styles.window}>
      <div className={styles.header}>
        <div className={styles.peerName}>{peer.displayName}</div>
        <div className={styles.peerUsername}>@{peer.username}</div>
      </div>

      <div className={styles.messages}>
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} isMine={message.senderId === myUserId} />
        ))}
        <div ref={bottomRef} />
      </div>

      <MessageInput disabled={!canSend} onSend={onSend} />
    </div>
  )
}
