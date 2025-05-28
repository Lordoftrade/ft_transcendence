export const registerView  = `
<section class="flex justify-center items-center py-10">
  <form class="shadow-lg">
    <table class="border border-gray-400 text-left">
      <thead>
        <tr><th colspan="2" class="table-head">Sign up to PONG</th></tr>
      </thead>

      <tbody>
        <tr>
          <td class="table-cell-label">Login</td>
          <td class="table-cell-input"><input type="text"  name="login"    class="input" required /></td>
        </tr>

        <tr class="table-row-alt">
          <td class="table-cell-label">Email</td>
          <td class="table-cell-input"><input type="email" name="email" class="input" required /></td>
        </tr>

        <tr class="table-row-alt">
          <td class="table-cell-label">Password</td>
          <td class="table-cell-input"><input type="password" name="password" class="input" required /></td>
        </tr>
        <tr>
          <td colspan="2" class="px-4 py-3 text-center">
            <button type="submit" class="btn-primary">Sign up</button>
          </td>
        </tr>
      </tbody>
    </table>
  </form>
</section>
`


import { AuthAPI } from '../api/auth'


export function registerInit() {
  const form = document.querySelector<HTMLFormElement>('form')!
  form.addEventListener('submit', async (e) => {
    e.preventDefault()

    const email    = (form.elements.namedItem('email')    as HTMLInputElement).value
    const username = (form.elements.namedItem('login')    as HTMLInputElement).value
    const password = (form.elements.namedItem('password') as HTMLInputElement).value

    try {
      const { accessToken } = await AuthAPI.register({ email, username, password })
      localStorage.setItem('token', accessToken)
      window.dispatchEvent(new Event('auth-changed'));
      location.hash = '#/profile'
    } catch (err) {
      alert((err as Error).message)
    }
  })
}
