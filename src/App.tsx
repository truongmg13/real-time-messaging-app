// import { useRef, useState } from 'react'
import { useWebSocket } from './hooks/useWebSocket'
import './App.css'
import Header from './components/Header'
import ControlPanel from './components/ControlPanel'
import LogPanel from './components/LogPanel'

export default function App() {
  const {
    status, userId, isConnected, log,
    connect, disconnect, sendAuth, sendMsg, addLog
  } = useWebSocket()

  return (
    <div className="app-layout">
      <Header status={status} userId={userId} />
      
      <div className="app-body">
        <ControlPanel
          isConnected={isConnected}
          onConnect={connect}
          onDisconnect={disconnect}
          onSendAuth={sendAuth}
          onSendMsg={sendMsg}
          addLog={addLog}
         />

        <LogPanel log={log} />
      </div>

    </div>
  )
}


