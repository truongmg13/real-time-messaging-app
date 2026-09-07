import type { User } from '../../types'
import styles from './UserList.module.css'

function initials(name: string): string {
  return name.trim().slice(0, 2).toUpperCase()
}

interface UserListProps {
  users: User[]
  activeUserId: string | null
  onSelect: (userId: string) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  searchResults: User[]
  isSearching: boolean
}

export default function UserList({
  users,
  activeUserId,
  onSelect,
  searchQuery,
  onSearchChange,
  searchResults,
  isSearching
}: UserListProps) {
  const isSearchActive = searchQuery.trim().length > 0
  const list = isSearchActive ? searchResults : users

  return (
    <aside className={styles.panel}>
      <div className={styles.searchBox}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {isSearchActive && isSearching && <div className={styles.empty}>Searching…</div>}
      {isSearchActive && !isSearching && list.length === 0 && (
        <div className={styles.empty}>No users found</div>
      )}
      {!isSearchActive && list.length === 0 && <div className={styles.empty}>No other users yet</div>}

      {list.map((user) => (
        <button
          key={user.id}
          type="button"
          className={`${styles.item} ${user.id === activeUserId ? styles.itemActive : ''}`}
          onClick={() => onSelect(user.id)}
        >
          <span className={styles.avatar}>{initials(user.displayName)}</span>
          <span className={styles.meta}>
            <span className={styles.name}>{user.displayName}</span>
            <br />
            <span className={styles.username}>@{user.username}</span>
          </span>
        </button>
      ))}
    </aside>
  )
}
