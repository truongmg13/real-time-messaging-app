import { useState } from "react"
import type { LogType, AuthResponse } from '../types'
import styles from './ControlPanel.module.css'

interface SectionProps {
  title: string
  children: React.ReactNode
}

function Section({ title, children }: SectionProps) {
  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      {children}
    </div>
  )
}

interface ControlPanelProps {
  isConnected: boolean
  onConnect: (url: string) => void
  onDisconnect: () => void
  onSendAuth: (token: string) => void
  onSendMsg: (recipientId: string, content: string) => void
  addLog: (type: LogType, message: string) => void
}

export default function ControlPanel({
  isConnected,
  onConnect,
  onDisconnect,
  onSendAuth,
  onSendMsg,
  addLog
}: ControlPanelProps) {
  /* connection */
  const [wsUrl, setWsUrl] = useState('ws://localhost:8081')

  /* auth */
  const [restUrl,  setRestUrl]  = useState('http://localhost:8080')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [jwtToken, setJwtToken] = useState('')

  /* Send msg */
  const [recipientId, setRecipientId] = useState('')
  const [msgContent, setMsgContent]   = useState('')


  /* --- handlers --- */
  function handleConnect() {
    onConnect(wsUrl.trim())
  }

  async function handleLoginAndAuth() {
    const base = restUrl.trim()
    if (!username || !password) {
      addLog('error', 'Please enter username and password')
      return
    }
    try {
      const res = await fetch(`${base}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username, password: password })
      })
      const data = (await res.json()) as AuthResponse
      if (!res.ok) {
        addLog('error', `Login failed (${res.status}): ${JSON.stringify(data)}`)
        return
      }
      setJwtToken(data.token)
      addLog('info', `Login OK - token received`)
      onSendAuth(data.token)
    } catch (err) {
      addLog('error', `Fetch error: ${(err as Error).message}`)
    }
  }

  function handleSendMsg() {
    if (!recipientId.trim()) { addLog('error', 'Enter a recipient UUID'); return; }
    if (!msgContent.trim())  { addLog('error', 'Message is empty'); return; }
    onSendMsg(recipientId.trim(), msgContent.trim())
  }

  return (
    <aside className={styles.panel}>

      {/* --- Connection --- */}
      <Section title="Connection">
        <div className="field">
          <label>Server URL</label>
          <input value={wsUrl} onChange={e => setWsUrl(e.target.value)} />
        </div>
        <div className="btn-row">
          <button className="btn-primary" onClick={handleConnect} disabled={isConnected}>Connect</button>
          <button className="btn-danger" onClick={onDisconnect} disabled={!isConnected}>Disconnect</button>
        </div>
      </Section>

      {/* --- Authenticate --- */}
      <Section title="1 - Authenticate">
        <div className="field">
          <label>REST Base URL</label>
          <input value={restUrl} onChange={e => setRestUrl(e.target.value)} />
        </div>
        <div className="field">
          <label>Username</label>
          <input value={username} onChange={e => setUsername(e.target.value)} placeholder="username" />
        </div>
        <div className="field">
          <label>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="password" />
        </div>
        <div className="btn-row" style={{ marginBottom: 10 }}>
          <button className="btn-success" onClick={handleLoginAndAuth} disabled={!isConnected}>
            Login + Sent AUTH
          </button>
        </div>
      </Section>

      {/* Send Message */}
      <Section title="2 -- Send Mesage">
        <div className="field">
          <label>Recipient UserId (UUID)</label>
          <input value={recipientId} onChange={e => setRecipientId(e.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxxxxxxxxxx" />
        </div>
        <div className="field">
          <label>Content</label>
          <textarea rows={2} value={msgContent} onChange={e => setMsgContent(e.target.value)} placeholder="Hello!" />
        </div>
        <div className="btn-row">
          <button className="btn-success" onClick={handleSendMsg} disabled={!isConnected}>
            Send Message
          </button>
        </div>
      </Section>

    </aside>
  )
}