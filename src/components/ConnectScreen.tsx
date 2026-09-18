import { FormEvent, useState } from 'react'
import { ChevronRight, MessageCircle, ShieldCheck } from 'lucide-react'
import type { Credentials } from '../lib/types'

type Props = { onConnect: (credentials: Credentials) => Promise<void> }

export function ConnectScreen({ onConnect }: Props) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    const data = new FormData(event.currentTarget)
    try {
      await onConnect(Object.fromEntries(data) as Credentials)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Ошибка подключения')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="connect-page">
      <div className="connect-card">
        <div className="brand brand-large">
          <span className="brand-icon">
            <MessageCircle size={27} strokeWidth={2.5} />
          </span>
          <span>
            MAX <em>×</em> GREEN-API
          </span>
        </div>
        <div className="connect-intro">
          <span className="eyebrow">ТЕКСТОВЫЙ ЧАТ</span>
          <h1>
            Сообщения MAX
            <br />в одном окне
          </h1>
          <p>Подключите инстанс GREEN-API, чтобы начать переписку.</p>
        </div>
        <form onSubmit={submit} className="connect-form">
          <label>
            API URL
            <input
              name="apiUrl"
              type="url"
              placeholder="https://3100.api.green-api.com"
              required
              autoComplete="url"
            />
          </label>
          <label>
            ID инстанса
            <input
              name="idInstance"
              inputMode="numeric"
              pattern="[0-9]+"
              placeholder="Например, 3100000000"
              required
              autoComplete="off"
            />
          </label>
          <label>
            Токен инстанса
            <input
              name="apiTokenInstance"
              type="password"
              placeholder="Введите apiTokenInstance"
              required
              autoComplete="off"
            />
          </label>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button className="primary" disabled={busy}>
            {busy ? 'Подключаем…' : 'Открыть чат'} <ChevronRight size={18} />
          </button>
        </form>
        <div className="privacy">
          <ShieldCheck size={18} />
          <span>
            Токен хранится только в памяти локального сервера и удаляется при выходе или
            перезапуске.
          </span>
        </div>
        <a
          className="docs-link"
          href="https://console.green-api.com/"
          target="_blank"
          rel="noreferrer"
        >
          Где найти данные инстанса? <span>↗</span>
        </a>
      </div>
    </main>
  )
}
