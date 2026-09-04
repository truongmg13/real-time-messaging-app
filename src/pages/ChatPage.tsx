import { useAuth } from '../context/AuthContext'
import { useChat } from '../context/ChatContext'
import UserList from '../components/chat/UserList'
import ChatWindow from '../components/chat/ChatWindow'
import styles from './ChatPage.module.css'

export default function ChatPage() {
  const { user, logout } = useAuth()
  const {
    wsStatus,
    users,
    conversations,
    activeConversationId,
    setActiveConversation,
    sendMessage,
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching
  } = useChat()

  if (!user) return null

  const activePeer =
    users.find((u) => u.id === activeConversationId) ??
    searchResults.find((u) => u.id === activeConversationId) ??
    null
  const messages = activeConversationId ? conversations[activeConversationId] ?? [] : []
  const canSend = wsStatus === 'authenticated' && activeConversationId !== null

  const badgeClass =
    wsStatus === 'authenticated' ? styles.badgeAuthenticated : wsStatus === 'closed' ? styles.badgeClosed : ''

  return (
    <div className={styles.page}>
      <header className={styles.topbar}>
        <div className={styles.identity}>
          <span className={styles.title}>{user.displayName}</span>
          <span className={`${styles.badge} ${badgeClass}`}>{wsStatus}</span>
        </div>
        <button type="button" className="btn-ghost" onClick={logout}>
          Log out
        </button>
      </header>

      <div className={styles.body}>
        <UserList
          users={users}
          activeUserId={activeConversationId}
          onSelect={setActiveConversation}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchResults={searchResults}
          isSearching={isSearching}
        />
        <ChatWindow
          peer={activePeer}
          messages={messages}
          myUserId={user.userId}
          canSend={canSend}
          onSend={(content) => activeConversationId && sendMessage(activeConversationId, content)}
        />
      </div>
    </div>
  )
}
