import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { ChatProvider } from './context/ChatContext'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ChatPage from './pages/ChatPage'
import './App.css'

function RequireAuth({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/chat" replace /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/chat" replace /> : <RegisterPage />} />
      <Route
        path="/chat"
        element={
          <RequireAuth>
            <ChatProvider>
              <ChatPage />
            </ChatProvider>
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to={user ? '/chat' : '/login'} replace />} />
    </Routes>
  )
}
