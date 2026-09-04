import { useState } from 'react'
import type { KeyboardEvent } from 'react'
import styles from './MessageInput.module.css'

interface MessageInputProps {
  disabled: boolean
  onSend: (content: string) => void
}

export default function MessageInput({ disabled, onSend }: MessageInputProps) {
  const [value, setValue] = useState('')

  function submit() {
    const content = value.trim()
    if (!content || disabled) return
    onSend(content)
    setValue('')
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className={styles.bar}>
      <textarea
        rows={1}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={disabled ? 'Connecting...' : 'Type a message'}
        disabled={disabled}
      />
      <button type="button" className={`btn-primary ${styles.send}`} onClick={submit} disabled={disabled || !value.trim()}>
        Send
      </button>
    </div>
  )
}
