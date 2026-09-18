import { useEffect, useState } from 'react'
import { chatApi } from '../lib/api'
import type { Chat, Credentials, Message, Session } from '../lib/types'

export function useChatSession() {
  const [ready, setReady] = useState(false)
  const [session, setSession] = useState<Session>({ connected: false })

  useEffect(() => {
    let active = true
    chatApi
      .getSession()
      .then((value) => {
        if (active) setSession(value)
      })
      .catch(() => {
        if (active) setSession({ connected: false })
      })
      .finally(() => {
        if (active) setReady(true)
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!session.connected) return
    let stopped = false
    let timer: ReturnType<typeof setTimeout>

    const refresh = async () => {
      try {
        const data = await chatApi.receiveMessages()
        if (!stopped) setSession((current) => ({ ...current, ...data }))
      } catch (cause) {
        if (!stopped) {
          setSession((current) => ({
            ...current,
            receiveError: cause instanceof Error ? cause.message : 'Ошибка получения',
          }))
        }
      } finally {
        if (!stopped) timer = setTimeout(refresh, 2000)
      }
    }

    refresh()
    return () => {
      stopped = true
      clearTimeout(timer)
    }
  }, [session.connected])

  const connect = async (credentials: Credentials) => {
    setSession(await chatApi.connect(credentials))
  }

  const createChat = async (phone: string): Promise<Chat> => {
    const chat = await chatApi.createChat(phone)
    setSession((current) => ({
      ...current,
      chats: current.chats?.some((item) => item.chatId === chat.chatId)
        ? current.chats
        : [...(current.chats || []), chat],
    }))
    return chat
  }

  const sendMessage = async (chatId: string, text: string): Promise<Message> => {
    const message = await chatApi.sendMessage(chatId, text)
    setSession((current) => ({ ...current, messages: [...(current.messages || []), message] }))
    return message
  }

  const disconnect = async () => {
    await chatApi.disconnect()
    setSession({ connected: false })
  }

  return { ready, session, connect, createChat, sendMessage, disconnect }
}
