export const BASE = import.meta.env.VITE_API_URL ?? 'https://localhost:3000'
import type { User } from './friends';

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email:    string;
  password: string;
}

export interface Profile extends User{
  username: string;
  email:    string;
  avatarUrl:string;
}

export interface GoogleLoginParams {
  googleToken: string
}

export interface GoogleLoginResponse {
  token: string
}

async function post<T>(endpoint: string, body?: unknown): Promise<T> {
  const token = localStorage.getItem('token');
  const resp = await fetch(BASE + '/auth' + endpoint, {
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

function authHeaders(): Record<string,string> {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function get<T>(url: string): Promise<T> {
  const r = await fetch(BASE + url, {
    headers: { ...authHeaders() },
    credentials: 'include',
  })
  if (!r.ok) throw new Error((await r.json()).message)
  return r.json()
}

async function put<T>(url: string, body: unknown): Promise<T> {
  const r = await fetch(BASE + url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    credentials: 'include',
    body: JSON.stringify(body),
  })
  if (!r.ok) throw new Error((await r.json()).message)
  return r.json()
}


export const AuthAPI = {

  async register(data: RegisterData) {
    const resp = await post<{ accessToken:string }>('/register', data);
    localStorage.setItem('token', resp.accessToken);
    return resp;
  },
  async login(data: LoginData) {
    const resp = await post<{ accessToken:string }>('/login', data);
    localStorage.setItem('token', resp.accessToken);
    return resp;
  },

  async googleLogin(data: GoogleLoginParams): Promise<GoogleLoginResponse> {
    const resp = await post<GoogleLoginResponse>('/google', data)
    localStorage.setItem('token', resp.token)
    return resp
  },

  refresh: () => post<{ accessToken: string }>('/refresh-token'),

  logout: async (): Promise<void> => {
    await post('/logout', {});          // бэкенд очистит refresh-cookie и markUserOffline
    localStorage.removeItem('token');
  },

  getProfile: () =>
      get<Profile>('/user/profile'),

    updateProfile: (data: {
      username: string
      email:    string
      password?: string
      avatarUrl?: string
    }) =>
      put<Profile>('/user/profile', data),

    uploadAvatar: (file: File): Promise<string> => {
        const form = new FormData()
        form.append('avatar', file)

        return fetch(BASE + '/user/avatar', {
          method:      'POST',
          credentials: 'include',
          headers:     authHeaders(),
          body:        form,
        })
        .then(async resp => {
          if (!resp.ok) {
            const err = await resp.json()
            throw new Error(err.message || resp.status.toString())
          }
          const data: { message: string; profile: Profile } = await resp.json()
          return data.profile.avatarUrl
        })
      }
}

