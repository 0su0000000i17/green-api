import { describe, expect, it, vi } from 'vitest'
import { createGreenApi, normalizeApiUrl, normalizePhone, notificationMessage } from './core.js'

describe('validation', () => {
  it('normalizes Russian and Belarusian numbers', () => {
    expect(normalizePhone('8 (999) 123-45-67')).toBe('79991234567')
    expect(normalizePhone('+375 29 123-45-67')).toBe('375291234567')
    expect(() => normalizePhone('+1 212 555 1234')).toThrow()
  })
  it('accepts only GREEN-API HTTPS hosts', () => {
    expect(normalizeApiUrl('https://3100.api.green-api.com/')).toBe(
      'https://3100.api.green-api.com',
    )
    expect(() => normalizeApiUrl('https://3100.api.green-api.com.evil.test/')).toThrow()
  })
})

describe('GREEN-API contract', () => {
  it('checks the MAX account and sends to its chatId', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ exist: true, chatId: '10000000' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ idMessage: 'message-1' }) })
    const api = createGreenApi(
      {
        apiUrl: 'https://3100.api.green-api.com',
        idInstance: '3100000000',
        apiTokenInstance: 'secret-token-123',
      },
      fetcher,
    )
    const account = await api.checkAccount('79991234567')
    await api.sendMessage(account.chatId, 'Привет')
    expect(fetcher.mock.calls[0][0]).toBe(
      'https://3100.api.green-api.com/waInstance3100000000/checkAccount/secret-token-123',
    )
    expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual({ phoneNumber: 79991234567 })
    expect(fetcher.mock.calls[1][0]).toBe(
      'https://3100.api.green-api.com/waInstance3100000000/sendMessage/secret-token-123',
    )
    expect(JSON.parse(fetcher.mock.calls[1][1].body)).toEqual({
      chatId: '10000000',
      message: 'Привет',
    })
  })
  it('receives and acknowledges a notification', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          receiptId: 123,
          body: {
            typeWebhook: 'incomingMessageReceived',
            timestamp: 1763115112,
            idMessage: 'incoming-1',
            senderData: { chatId: '10000000' },
            messageData: { typeMessage: 'textMessage', textMessageData: { textMessage: 'Ответ' } },
          },
        }),
      })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ result: true }) })
    const api = createGreenApi(
      {
        apiUrl: 'https://3100.api.green-api.com',
        idInstance: '3100000000',
        apiTokenInstance: 'secret-token-123',
      },
      fetcher,
    )
    const notification = await api.receive()
    expect(notificationMessage(notification.body)).toMatchObject({
      id: 'incoming-1',
      chatId: '10000000',
      text: 'Ответ',
    })
    await api.remove(notification.receiptId)
    expect(fetcher.mock.calls[0][0]).toContain(
      '/receiveNotification/secret-token-123?receiveTimeout=5',
    )
    expect(fetcher.mock.calls[1][0]).toContain('/deleteNotification/secret-token-123/123')
    expect(fetcher.mock.calls[1][1].method).toBe('DELETE')
  })
  it('ignores non-text notifications', () => {
    expect(notificationMessage({ typeWebhook: 'outgoingMessageStatus' })).toBeNull()
    expect(
      notificationMessage({
        typeWebhook: 'incomingMessageReceived',
        messageData: { typeMessage: 'imageMessage' },
      }),
    ).toBeNull()
  })
})
