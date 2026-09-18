import crypto from 'node:crypto'

export const normalizePhone = (value) => {
  const digits = String(value).replace(/\D/g, '')
  const phone = digits.length === 11 && digits[0] === '8' ? `7${digits.slice(1)}` : digits
  if (!/^(7\d{10}|375\d{9})$/.test(phone))
    throw new Error('Введите номер РФ или РБ в международном формате')
  return phone
}

export const normalizeApiUrl = (value) => {
  const url = new URL(value)
  if (
    url.protocol !== 'https:' ||
    !/^(?:[a-z0-9-]+\.)?api\.green-api\.com$/i.test(url.hostname) ||
    url.pathname !== '/' ||
    url.search ||
    url.hash
  ) {
    throw new Error('Укажите apiUrl из кабинета GREEN-API, например https://3100.api.green-api.com')
  }
  return url.origin
}

export const notificationMessage = (body) => {
  if (
    body?.typeWebhook !== 'incomingMessageReceived' ||
    body?.messageData?.typeMessage !== 'textMessage'
  )
    return null
  const chatId = body.senderData?.chatId
  const text = body.messageData?.textMessageData?.textMessage
  if (
    typeof chatId !== 'string' ||
    typeof text !== 'string' ||
    !text ||
    typeof body.idMessage !== 'string'
  )
    return null
  return {
    id: body.idMessage,
    chatId,
    text,
    direction: 'incoming',
    time: Number(body.timestamp) * 1000 || Date.now(),
  }
}

export const createSessionId = () => crypto.randomBytes(32).toString('hex')

export const createGreenApi = (credentials, fetcher = fetch) => {
  const root = `${credentials.apiUrl}/waInstance${credentials.idInstance}`
  const request = async (method, path, payload) => {
    const response = await fetcher(`${root}/${path}/${credentials.apiTokenInstance}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      ...(payload ? { body: JSON.stringify(payload) } : {}),
      signal: AbortSignal.timeout(30000),
    })
    const data = await response.json().catch(() => null)
    if (!response.ok || data?.status === false)
      throw new Error(data?.message || data?.reason || `GREEN-API вернул HTTP ${response.status}`)
    return data
  }
  return {
    checkAccount: (phone) => request('POST', 'checkAccount', { phoneNumber: Number(phone) }),
    sendMessage: (chatId, message) => request('POST', 'sendMessage', { chatId, message }),
    receive: () =>
      fetcher(`${root}/receiveNotification/${credentials.apiTokenInstance}?receiveTimeout=5`, {
        signal: AbortSignal.timeout(30000),
      }).then(async (response) => {
        const data = await response.json().catch(() => null)
        if (!response.ok || data?.status === false)
          throw new Error(data?.reason || `GREEN-API вернул HTTP ${response.status}`)
        return data
      }),
    remove: async (receiptId) => {
      const response = await fetcher(
        `${root}/deleteNotification/${credentials.apiTokenInstance}/${receiptId}`,
        { method: 'DELETE', signal: AbortSignal.timeout(30000) },
      )
      const data = await response.json().catch(() => null)
      if (!response.ok || data?.result !== true)
        throw new Error(data?.reason || 'Не удалось подтвердить уведомление')
    },
  }
}
