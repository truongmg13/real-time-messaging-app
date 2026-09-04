import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ApiError } from '../api/client'
import styles from './Auth.module.css'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!displayName.trim() || !username.trim() || !password) {
      setError('Fill in your name, username and password')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setSubmitting(true)
    try {
      await register({ displayName: displayName.trim(), username: username.trim(), password })
      navigate('/chat', { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reach the server')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.screen}>
      <div className={styles.card}>
        <h1 className={styles.title}>Create your account</h1>
        <p className={styles.subtitle}>Start chatting with anyone on the network</p>

        {error && <div className={styles.error}>{error}</div>}

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className="field">
            <label>Display name</label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Jane Doe"
              autoComplete="name"
              autoFocus
            />
          </div>
          <div className="field">
            <label>Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="janedoe"
              autoComplete="username"
            />
          </div>
          <div className="field">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              autoComplete="new-password"
            />
          </div>
          <button type="submit" className={`btn-primary ${styles.submit}`} disabled={submitting}>
            {submitting ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className={styles.footer}>
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  )
}
