import { Check, LogOut, MessageCircle, Plus } from 'lucide-react'
import { formatPhone, formatTime } from '../lib/format'
import type { Chat, Message } from '../lib/types'

type Props = {
  chats: Chat[]
  messages: Message[]
  activeId: string | null
  idInstance?: string
  onSelect: (chatId: string) => void
  onNewChat: () => void
  onDisconnect: () => void
}

export function ChatSidebar({
  chats,
  messages,
  activeId,
  idInstance,
  onSelect,
  onNewChat,
  onDisconnect,
}: Props) {
  return (
    <aside className="sidebar">
      <header className="sidebar-header">
        <div className="brand">
          <span className="brand-icon">
            <MessageCircle size={21} strokeWidth={2.6} />
          </span>
          <span>MAX</span>
        </div>
        <button
          className="icon-button"
          onClick={onNewChat}
          title="Новый чат"
          aria-label="Новый чат"
        >
          <Plus size={21} />
        </button>
      </header>
      <div className="sidebar-title">
        <div>
          <span className="eyebrow">ВАШИ ДИАЛОГИ</span>
          <h2>Сообщения</h2>
        </div>
        <span className="count">{chats.length}</span>
      </div>
      <div className="chat-list">
        {chats.length ? (
          chats.map((chat) => {
            const last = messages.filter((message) => message.chatId === chat.chatId).at(-1)
            return (
              <button
                key={chat.chatId}
                className={`chat-row ${activeId === chat.chatId ? 'selected' : ''}`}
                onClick={() => onSelect(chat.chatId)}
              >
                <span className="avatar">{chat.phone.slice(-2)}</span>
                <span className="chat-summary">
                  <strong>{formatPhone(chat.phone)}</strong>
                  <small>{last?.text || 'Начните разговор'}</small>
                </span>
                <span className="chat-time">{last ? formatTime(last.time) : ''}</span>
              </button>
            )
          })
        ) : (
          <div className="empty-list">
            <span className="empty-list-icon">
              <MessageCircle size={25} />
            </span>
            <strong>Пока нет чатов</strong>
            <p>Создайте чат по номеру телефона, чтобы начать переписку.</p>
            <button onClick={onNewChat}>
              Новый чат <Plus size={16} />
            </button>
          </div>
        )}
      </div>
      <footer className="sidebar-footer">
        <div className="account-dot">
          <Check size={15} />
        </div>
        <div className="account-details">
          <strong>Инстанс {idInstance}</strong>
          <span>GREEN-API подключен</span>
        </div>
        <button
          className="icon-button"
          onClick={onDisconnect}
          title="Отключить"
          aria-label="Отключить"
        >
          <LogOut size={18} />
        </button>
      </footer>
    </aside>
  )
}
