import { BASE } from './auth'

export interface UserStats {
	  wins: number
	  losses: number
}

// Helpers
async function get<T>(endpoint: string): Promise<T> {
  const token = localStorage.getItem('token')
  const resp = await fetch(BASE + endpoint, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: 'include',
  })
  if (!resp.ok) throw new Error((await resp.json()).message)
  return resp.json()
}

async function put<T>(endpoint: string, body: unknown): Promise<T> {
  const token = localStorage.getItem('token')
  const resp = await fetch(BASE + endpoint, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
    body: JSON.stringify(body),
  })
  if (!resp.ok) throw new Error((await resp.json()).message)
  return resp.json()
}

// Data types
export interface Profile {
  id:       	number
  username: 	string
  email:    	string
  avatarUrl:	string
}

// API object
export const UserAPI = {
  /**
   * Получить свой профиль
   * GET /user/profile
   */
  getProfile: (): Promise<Profile> =>
    get('/user/profile'),

  /**
   * Получить чужой профиль по ID
   * GET /user/:id
   */
  getUserById: (id: number): Promise<Profile> =>
    get(`/user/${id}`),

  /**
   * Обновить свой профиль
   * PUT /user/profile
   */
  updateProfile: (
    data: Partial<Omit<Profile, 'id'>> & { password?: string }
  ): Promise<Profile> =>
    put('/user/profile', data),

  /**
   * Загрузить новый аватар
   * POST /user/avatar
   * Возвращает URL загруженного аватара
   */
  uploadAvatar: async (file: File): Promise<string> => {
    const token = localStorage.getItem('token')
    const form = new FormData()
    form.append('avatar', file)
    const resp = await fetch(BASE + '/user/avatar', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: 'include',
      body: form,
    })
    if (!resp.ok) throw new Error((await resp.json()).message)
    // Сервер возвращает { message: string, profile: Profile }
    const data: { profile: Profile } = await resp.json()
    return data.profile.avatarUrl
  },

  /**
   * Получить статистику пользователя
   * GET /user/:id/stats
   */
  	getUserStats: (id: number): Promise<UserStats> =>
		get(`/user/${id}/stats`),

	  /**
   * Получить статистику своего профиля
   * GET /user/profile/stats
   */
  	getMyStats: (): Promise<UserStats> =>
		get('/user/profile/stats'),
}