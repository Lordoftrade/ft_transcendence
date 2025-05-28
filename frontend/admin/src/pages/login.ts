export const loginView  = `
<section class="flex justify-center items-center py-10">
  <form class="shadow-lg">
    <table class="border border-gray-400 text-left">
      <thead>
        <tr><th colspan="2" class="table-head">Sign in to PONG</th></tr>
      </thead>

      <tbody>
        <tr>
          <td class="table-cell-label">Email</td>
          <td class="table-cell-input"><input type="email"  name="email"    class="input" required /></td>
        </tr>

        <tr class="table-row-alt">
          <td class="table-cell-label">Password</td>
          <td class="table-cell-input"><input type="password" name="password" class="input" required /></td>
        </tr>

        <tr>
          <td colspan="2" class="px-4 py-3 text-center">
            <button type="submit" class="btn-primary">Sign in</button>
          </td>
        </tr>

        <tr>
          <td colspan="2" class="px-4 py-3 text-center">
            <!-- Container for the Google Sign-In button -->
            <div id="google-signin-button"></div>
          </td>
        </tr>
      </tbody>
    </table>
  </form>
</section>
`

import { AuthAPI } from '../api/auth'

export function loginInit() {
  const form = document.querySelector<HTMLFormElement>('form')!
  form.addEventListener('submit', handleEmailLogin)

  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: handleGoogleCredentialResponse
  })
  google.accounts.id.renderButton(
    document.getElementById('google-signin-button')!,
    { theme: 'outline', size: 'large' }
  )
}

async function handleEmailLogin(e: Event) {
  e.preventDefault()
  const form = e.currentTarget as HTMLFormElement
  const email = (form.elements.namedItem('email')    as HTMLInputElement).value
  const password = (form.elements.namedItem('password') as HTMLInputElement).value

  try {
    const { accessToken } = await AuthAPI.login({ email, password })
    localStorage.setItem('token', accessToken)
    window.dispatchEvent(new Event('auth-changed'))
    location.hash = '#/'
  } catch (err) {
    alert((err as Error).message)
  }
}

async function handleGoogleCredentialResponse(response: { credential: string }) {
  try {
    const { token } = await AuthAPI.googleLogin({ googleToken: response.credential })
    localStorage.setItem('token', token);
    window.dispatchEvent(new Event('auth-changed'))
    location.hash = '#/'
  } catch (err) {
    alert((err as Error).message)
  }
}