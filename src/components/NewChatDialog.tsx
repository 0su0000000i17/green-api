import { FormEvent, useState } from 'react'
import { ChevronRight, Plus, X } from 'lucide-react'
import type { Chat } from '../lib/types'

type Props = {
  onCreate: (phone: string) => Promise<Chat>
  onCreated: (chat: Chat) => void
  onClose: () => void
}

export function NewChatDialog({ onCreate, onCreated, onClose }: Props) {
  const [phone, setPhone] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      onCreated(await onCreate(phone))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось создать чат')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="new-chat-title">
        <button className="icon-button close" onClick={onClose} aria-label="Закрыть">
          <X size={20} />
        </button>
        <span className="modal-icon">
          <Plus size={25} />
        </span>
        <h2 id="new-chat-title">Новый чат</h2>
        <p>Введите номер пользователя MAX. Мы проверим его и откроем диалог.</p>
        <form onSubmit={submit}>
          <label>
            Номер телефона
            <input
              autoFocus
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              type="tel"
              placeholder="+7 999 123-45-67"
              required
            />
          </label>
          <small>Поддерживаются номера России и Беларуси.</small>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button className="primary" disabled={busy}>
            {busy ? 'Проверяем номер…' : 'Создать чат'} <ChevronRight size={18} />
          </button>
        </form>
      </div>
    </div>
  )
}
