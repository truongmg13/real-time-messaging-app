import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ApiError } from '../api/client'
import styles from './Auth.module.css'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!username.trim() || !password) {
      setError('Enter your username and password')
      return
    }

    setSubmitting(true)
    try {
      await login({ username: username.trim(), password })
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
        <h1 className={styles.title}>Welcome back</h1>
        <p className={styles.subtitle}>Log in to continue messaging</p>

        {error && <div className={styles.error}>{error}</div>}

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className="field">
            <label>Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              autoComplete="username"
              autoFocus
            />
          </div>
          <div className="field">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password"
              autoComplete="current-password"
            />
          </div>
          <button type="submit" className={`btn-primary ${styles.submit}`} disabled={submitting}>
            {submitting ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <p className={styles.footer}>
          No account yet? <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  )
}
