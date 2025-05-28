import { BASE } from './auth'

async function post<T>(endpoint: string, body?: unknown): Promise<T> {
  const token = localStorage.getItem('token')
  const resp = await fetch(BASE + endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!resp.ok) throw new Error((await resp.json()).message)
  return resp.json()
}

export interface MatchInviteResponse {
  matchId: number
}

export const MatchAPI = {
  /**
   * Создаёт матч-инвайт между текущим юзером и otherUserId.
   * Серверный контроллер должен обрабатывать POST /matchmaking/invite/:id
   * и возвращать { matchId: number }.
   */
  createMatchInvite: (otherUserId: number): Promise<MatchInviteResponse> =>
    post(`/match/invite/${otherUserId}`, {}),

  /**
   * Если понадобятся другие методы (например, принимкния инвайта),
   * их можно добавить по аналогии:
   */
  // acceptMatchInvite: (matchId: number): Promise<void> =>
  //   post(`/matchmaking/accept/${matchId}`),
}