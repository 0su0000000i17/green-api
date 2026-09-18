import { useState } from 'react'
import { ChatSidebar, ConnectScreen, Conversation, NewChatDialog } from './components'
import { useChatSession } from './hooks'
import type { Chat } from './lib'

export default function App() {
  const { ready, session, connect, createChat, sendMessage, disconnect } = useChatSession()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [newChatOpen, setNewChatOpen] = useState(false)
  const [showMobileChat, setShowMobileChat] = useState(false)

  if (!ready) return <div className="loading">Загрузка чата…</div>
  if (!session.connected) return <ConnectScreen onConnect={connect} />

  const selectChat = (chatId: string) => {
    setActiveId(chatId)
    setShowMobileChat(true)
  }

  const onCreated = (chat: Chat) => {
    selectChat(chat.chatId)
    setNewChatOpen(false)
  }

  const onDisconnect = async () => {
    await disconnect()
    setActiveId(null)
    setShowMobileChat(false)
  }

  return (
    <main className={`app-shell ${showMobileChat ? 'mobile-chat' : ''}`}>
      <ChatSidebar
        chats={session.chats || []}
        messages={session.messages || []}
        activeId={activeId}
        idInstance={session.idInstance}
        onSelect={selectChat}
        onNewChat={() => setNewChatOpen(true)}
        onDisconnect={onDisconnect}
      />
      <Conversation
        chat={session.chats?.find((chat) => chat.chatId === activeId)}
        messages={session.messages || []}
        receiveError={session.receiveError}
        onSend={sendMessage}
        onBack={() => setShowMobileChat(false)}
        onNewChat={() => setNewChatOpen(true)}
      />
      {newChatOpen && (
        <NewChatDialog
          onCreate={createChat}
          onCreated={onCreated}
          onClose={() => setNewChatOpen(false)}
        />
      )}
    </main>
  )
}
