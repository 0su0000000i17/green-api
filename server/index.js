import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  createGreenApi,
  createSessionId,
  normalizeApiUrl,
  normalizePhone,
  notificationMessage,
} from './core.js'

const app = express()
app.disable('x-powered-by')
app.use(express.json({ limit: '16kb' }))
app.use((_, response, next) => {
  response.setHeader('Cache-Control', 'no-store')
  next()
})

const sessions = new Map()
const cookieName = 'max_chat_session'
const sessionFrom = (request) => {
  const raw = request.headers.cookie
    ?.split(';')
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${cookieName}=`))
    ?.slice(cookieName.length + 1)
  return raw ? sessions.get(raw) : undefined
}
const route = (handler) => async (request, response) => {
  try {
    await handler(request, response)
  } catch (error) {
    response
      .status(400)
      .json({ error: error instanceof Error ? error.message : 'Неизвестная ошибка' })
  }
}
const requireSession = (request, response) => {
  const session = sessionFrom(request)
  if (!session) response.status(401).json({ error: 'Подключите инстанс GREEN-API' })
  return session
}

async function poll(session) {
  if (session.polling) return
  session.polling = true
  try {
    for (let i = 0; i < 20; i += 1) {
      const notification = await session.api.receive()
      if (!notification) break
      const message = notificationMessage(notification.body)
      if (message && !session.messages.some((item) => item.id === message.id))
        session.messages.push(message)
      await session.api.remove(notification.receiptId)
    }
    session.error = ''
  } catch (error) {
    session.error = error instanceof Error ? error.message : 'Не удалось получить сообщения'
  } finally {
    session.polling = false
  }
}

app.get(
  '/api/session',
  route(async (request, response) => {
    const session = sessionFrom(request)
    response.json(
      session
        ? {
            connected: true,
            idInstance: session.credentials.idInstance,
            chats: session.chats,
            messages: session.messages,
            receiveError: session.error,
          }
        : { connected: false },
    )
  }),
)

app.post(
  '/api/session',
  route(async (request, response) => {
    const { idInstance, apiTokenInstance } = request.body || {}
    if (
      !/^\d+$/.test(String(idInstance || '')) ||
      !/^[A-Za-z0-9_-]{12,}$/.test(String(apiTokenInstance || ''))
    )
      throw new Error('Проверьте idInstance и apiTokenInstance')
    const credentials = {
      apiUrl: normalizeApiUrl(request.body.apiUrl),
      idInstance: String(idInstance),
      apiTokenInstance: String(apiTokenInstance),
    }
    const id = createSessionId()
    const session = {
      credentials,
      api: createGreenApi(credentials),
      chats: [],
      messages: [],
      error: '',
      polling: false,
    }
    const previous = request.headers.cookie
      ?.split(';')
      .map((item) => item.trim())
      .find((item) => item.startsWith(`${cookieName}=`))
      ?.slice(cookieName.length + 1)
    if (previous) sessions.delete(previous)
    sessions.set(id, session)
    response.setHeader('Set-Cookie', `${cookieName}=${id}; HttpOnly; SameSite=Strict; Path=/`)
    response.json({ connected: true, idInstance: credentials.idInstance, chats: [], messages: [] })
  }),
)

app.delete(
  '/api/session',
  route(async (request, response) => {
    const id = request.headers.cookie
      ?.split(';')
      .map((item) => item.trim())
      .find((item) => item.startsWith(`${cookieName}=`))
      ?.slice(cookieName.length + 1)
    if (id) sessions.delete(id)
    response.setHeader('Set-Cookie', `${cookieName}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`)
    response.status(204).end()
  }),
)

app.post(
  '/api/chats',
  route(async (request, response) => {
    const session = requireSession(request, response)
    if (!session) return
    const phone = normalizePhone(request.body?.phone)
    const existing = session.chats.find((chat) => chat.phone === phone)
    if (existing) return response.json(existing)
    const account = await session.api.checkAccount(phone)
    if (!account?.exist || !account?.chatId)
      throw new Error('Аккаунт MAX для этого номера не найден')
    const chat = { chatId: String(account.chatId), phone }
    session.chats.push(chat)
    response.json(chat)
  }),
)

app.post(
  '/api/messages',
  route(async (request, response) => {
    const session = requireSession(request, response)
    if (!session) return
    const { chatId, text } = request.body || {}
    if (!session.chats.some((chat) => chat.chatId === chatId))
      throw new Error('Сначала создайте чат')
    if (typeof text !== 'string' || !text.trim() || text.length > 4000)
      throw new Error('Сообщение должно содержать от 1 до 4000 символов')
    const result = await session.api.sendMessage(chatId, text.trim())
    if (!result?.idMessage)
      throw new Error('GREEN-API не подтвердил постановку сообщения в очередь')
    const message = {
      id: result.idMessage,
      chatId,
      text: text.trim(),
      direction: 'outgoing',
      time: Date.now(),
    }
    session.messages.push(message)
    response.json(message)
  }),
)

app.get(
  '/api/messages',
  route(async (request, response) => {
    const session = requireSession(request, response)
    if (!session) return
    await poll(session)
    response.json({ chats: session.chats, messages: session.messages, receiveError: session.error })
  }),
)

const port = Number(process.env.PORT || 3001)
const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist')
app.use(express.static(dist))
app.get('*', (_, response) => response.sendFile(path.join(dist, 'index.html')))
app.listen(port, '127.0.0.1', () => process.stdout.write(`API ready: http://127.0.0.1:${port}\n`))
