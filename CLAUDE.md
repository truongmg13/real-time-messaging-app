# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this app is

A 1:1 real-time messaging web app (WhatsApp/Telegram-style): register/log in, pick a user from the left-hand list, chat with them on the right over a live WebSocket, with history loaded via REST. The backend (REST auth/data on `http://localhost:8080`, WebSocket on `ws://localhost:8081`) is **not part of this repo** — this is the frontend only, built against the contract described below. The backend must implement that contract for the app to actually work end-to-end.

`ws-chat.html` at the repo root is a leftover standalone prototype of the *original* raw protocol debugger this app evolved from. It is not wired into the Vite build and does not reflect the current REST/WS contract — treat it as historical, not a reference.

## Commands

- `npm run dev` — start the Vite dev server (port 3001, proxies `/api/*` to `http://localhost:8080`)
- `npm run build` — type-check via project references (`tsc -b`) then `vite build`
- `npm run preview` — preview the production build

There is no test suite and no lint tooling configured (the README's Oxlint section is unused boilerplate — `oxlint` is not in `package.json`).

## Backend contract this app assumes

REST, JSON, relative `/api/*` paths (dev server proxies these to `:8080`; production needs the same proxying/same-origin setup). Authenticated calls send `Authorization: Bearer <token>`.

- `POST /api/auth/register { username, password, displayName }` → `AuthResponse { token, userId, username, displayName }` (auto-login on register)
- `POST /api/auth/login { username, password }` → `AuthResponse`
- `GET /api/users` → `User[] { id, username, displayName }` (everyone except the caller)
- `GET /api/users/search?q=<query>` → `User[]`, same shape as `/api/users`, matching `q` against both `username` and `displayName` (everyone except the caller)
- `GET /api/messages/conversation/:peerId` → `ConversationPageResponse { messages: Message[] { id, senderId, recipientId, content, sentAt }, page, size, totalElements, hasMore }`, `messages` chronological. This is paginated (default page/size server-side); `src/api/client.ts#fetchMessages` currently only reads the first page (`.messages`) and ignores `page`/`hasMore` — a conversation with more history than one page won't have its older messages loaded until pagination is wired up.

WebSocket, `ws://localhost:8081` by default (override with `VITE_WS_URL`; REST base overridable with `VITE_API_URL`, see `src/config.ts`):

- Outbound: `{ type: 'AUTH', token }` sent immediately on open; `{ type: 'SEND', recipientId, content }`
- Inbound: `{ type: 'AUTH_OK', userId }`, `{ type: 'MESSAGE', id, senderId, senderUsername, senderDisplayName, content, sentAt }`, `{ type: 'ERROR', code, reason }`
- The server does **not** echo a sender's own `SEND` back as a `MESSAGE` — the client appends its own optimistic message to local state right after sending (see `ChatContext.sendMessage`). If the backend ever starts echoing sent messages back, that optimistic-append needs to be removed or de-duplicated against the echo.

Changing this contract means updating `src/types.ts`, `src/api/client.ts`, and the corresponding handling in `src/context/ChatContext.tsx` / `src/hooks/useWebSocket.ts` together.

## Architecture

- **`src/context/AuthContext.tsx`** owns the session: `user` (the full `AuthResponse`, persisted to `localStorage` under `auth` and restored on load — there's no session-verification endpoint, the stored token is trusted as-is), plus `login`/`register`/`logout`. This is the only source of "am I logged in."
- **`src/context/ChatContext.tsx`** is the behavioral core of the chat feature and only mounts under the authenticated `/chat` route (see `App.tsx`) — so the WebSocket only connects once a user is logged in, and unmounting it (via logout/navigation) tears the connection down. It wraps the transport hook, auto-connects and sends `AUTH` once `useWebSocket` reports `connected`, fetches the user list on `AUTH_OK`, normalizes inbound `MESSAGE` frames and lazily-fetched REST history into one `conversations: Record<peerId, Message[]>` map (merged/de-duplicated by `id`, sorted by `sentAt`), and exposes `sendMessage`/`setActiveConversation`. It also owns user search: `searchQuery`/`setSearchQuery`/`searchResults`/`isSearching` debounce (300ms) calls to `GET /api/users/search` and race-guard stale responses with an `ignore` flag; `UserList` swaps to showing `searchResults` whenever `searchQuery` is non-empty, and `ChatPage` falls back to `searchResults` (in addition to `users`) when resolving the active peer, since a selected search hit may not be in the base `users` list.
- **`src/hooks/useWebSocket.ts`** is deliberately dumb: just connection lifecycle (`status`), and callback props (`onAuthOk`/`onMessage`/`onError`/`onClose`) so `ChatContext` can react without the hook knowing about REST, users, or conversations.
- **`src/api/client.ts`** is the only place that calls `fetch` against the REST API; it throws `ApiError` (with the parsed `reason` from an error body) so page-level forms can show inline messages.
- **Routing** (`src/App.tsx`, wired up in `main.tsx` via `BrowserRouter` + `AuthProvider`): `/login`, `/register` (both redirect to `/chat` if already logged in), `/chat` (wrapped in an inline `RequireAuth` guard that redirects to `/login`, and only here is `ChatProvider` mounted). Any other path redirects based on auth state.
- **Pages vs. components**: `src/pages/*Page.tsx` are route-level (own the layout, talk to context). `src/components/chat/*` are the reusable pieces of the chat UI (`UserList`, `ChatWindow`, `MessageBubble`, `MessageInput`). Every component keeps its co-located CSS Module (`*.module.css`) convention; shared button/input styles (`.btn-primary`, `.field`, etc.) and CSS variables (`--surface`, `--indigo`, ...) live globally in `src/index.css`.
- **Message identity**: server-issued messages use the backend's `id`; optimistically-appended local sends use a generated `local-<timestamp>-<random>` id purely for the React `key`/de-dup map — don't assume that format has any meaning to the backend.
