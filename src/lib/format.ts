export const formatTime = (time: number) =>
  new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' }).format(time)

export const formatPhone = (phone: string) =>
  phone.startsWith('7')
    ? `+7 ${phone.slice(1, 4)} ${phone.slice(4, 7)}-${phone.slice(7, 9)}-${phone.slice(9)}`
    : `+${phone}`
