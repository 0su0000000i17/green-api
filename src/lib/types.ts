export type Chat = { chatId: string; phone: string }

export type Message = {
  id: string
  chatId: string
  text: string
  direction: 'incoming' | 'outgoing'
  time: number
}

export type Session = {
  connected: boolean
  idInstance?: string
  chats?: Chat[]
  messages?: Message[]
  receiveError?: string
}

export type Credentials = {
  apiUrl: string
  idInstance: string
  apiTokenInstance: string
}

export type MessagesResponse = {
  chats: Chat[]
  messages: Message[]
  receiveError: string
}
