import type { Chat, Credentials, Message, MessagesResponse, Session } from './types'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  })
  const result = response.status === 204 ? null : await response.json()
  if (!response.ok) throw new Error(result?.error || 'Не удалось выполнить запрос')
  return result as T
}

const post = <T>(path: string, body: object) =>
  request<T>(path, { method: 'POST', body: JSON.stringify(body) })

export const chatApi = {
  getSession: () => request<Session>('/session'),
  connect: (credentials: Credentials) => post<Session>('/session', credentials),
  disconnect: () => request<void>('/session', { method: 'DELETE' }),
  createChat: (phone: string) => post<Chat>('/chats', { phone }),
  sendMessage: (chatId: string, text: string) => post<Message>('/messages', { chatId, text }),
  receiveMessages: () => request<MessagesResponse>('/messages'),
}
