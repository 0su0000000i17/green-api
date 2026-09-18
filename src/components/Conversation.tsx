import { FormEvent, useEffect, useRef, useState } from 'react'
import {
  ArrowLeft,
  Check,
  CircleHelp,
  MessageCircle,
  Plus,
  Send,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { formatPhone, formatTime } from '../lib/format'
import type { Chat, Message } from '../lib/types'

type Props = {
  chat?: Chat
  messages: Message[]
  receiveError?: string
  onSend: (chatId: string, text: string) => Promise<Message>
  onBack: () => void
  onNewChat: () => void
}

export function Conversation({ chat, messages, receiveError, onSend, onBack, onNewChat }: Props) {
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const bottom = useRef<HTMLDivElement>(null)
  const visibleMessages = messages.filter((message) => message.chatId === chat?.chatId)

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chat?.chatId, visibleMessages.length])
  useEffect(() => {
    setDraft('')
    setError('')
  }, [chat?.chatId])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!chat || !draft.trim() || busy) return
    setBusy(true)
    setError('')
    try {
      await onSend(chat.chatId, draft)
      setDraft('')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось отправить сообщение')
    } finally {
      setBusy(false)
    }
  }

  if (!chat) {
    return (
      <section className="conversation">
        <div className="welcome">
          <div className="welcome-mark">
            <MessageCircle size={43} />
          </div>
          <span className="eyebrow">MAX × GREEN-API</span>
          <h2>Ваши сообщения здесь</h2>
          <p>Выберите диалог слева или создайте новый чат по номеру телефона.</p>
          <button className="primary" onClick={onNewChat}>
            <Plus size={18} /> Новый чат
          </button>
          <span className="welcome-note">
            <CircleHelp size={16} /> Только текстовые сообщения
          </span>
        </div>
      </section>
    )
  }

  return (
    <section className="conversation">
      <header className="conversation-header">
        <button className="back-button icon-button" onClick={onBack} aria-label="Назад">
          <ArrowLeft size={22} />
        </button>
        <span className="avatar avatar-header">{chat.phone.slice(-2)}</span>
        <div className="conversation-contact">
          <strong>{formatPhone(chat.phone)}</strong>
          <span>Личный чат в MAX</span>
        </div>
        <span className={`connection-status ${receiveError ? 'offline' : ''}`}>
          {receiveError ? <WifiOff size={15} /> : <Wifi size={15} />}{' '}
          {receiveError ? 'Нет связи' : 'Получаем ответы'}
        </span>
      </header>
      <div className="message-area">
        <div className="date-pill">Сегодня</div>
        {visibleMessages.length ? (
          visibleMessages.map((message) => (
            <div key={message.id} className={`message ${message.direction}`}>
              <span>{message.text}</span>
              <small>
                {formatTime(message.time)}
                {message.direction === 'outgoing' && <Check size={13} />}
              </small>
            </div>
          ))
        ) : (
          <div className="conversation-empty">
            <span className="conversation-empty-icon">
              <MessageCircle size={30} />
            </span>
            <h3>Чат создан</h3>
            <p>Напишите первое сообщение. Ответ появится здесь автоматически.</p>
          </div>
        )}
        <div ref={bottom} />
      </div>
      {receiveError && (
        <div className="receive-error" role="status">
          Не удалось получить ответы: {receiveError}
        </div>
      )}
      {error && (
        <div className="send-error" role="alert">
          {error}
        </div>
      )}
      <form className="composer" onSubmit={submit}>
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Написать сообщение…"
          maxLength={4000}
          aria-label="Текст сообщения"
        />
        <span className="character-count">{draft.length > 3800 ? `${draft.length}/4000` : ''}</span>
        <button
          className="send-button"
          disabled={!draft.trim() || busy}
          aria-label="Отправить сообщение"
        >
          <Send size={19} />
        </button>
      </form>
    </section>
  )
}
