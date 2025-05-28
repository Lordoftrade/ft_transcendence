export const profileView = `
<section class="p-6 max-w-4xl">
  <h1 class="text-3xl font-semibold mb-4">My profile</h1>

  <div class="flex flex-col md:flex-row items-start gap-8">
    <div class="flex-shrink-0">
      <div class="relative w-24 h-24 rounded-full overflow-hidden border">
        <img
          id="avatar-img"
          src="/img/default_avatar.jpg"
          onerror="this.onerror=null;this.src='/img/default_avatar.jpg'"
          class="w-full h-full object-cover"
        />
        <input
          id="avatar-input"
          type="file"
          accept="image/*"
          class="absolute inset-0 w-full h-full opacity-0 cursor-pointer hidden"
        />
      </div>
    </div>

    <div class="flex-grow space-y-4">
      <div class="flex flex-col md:flex-row gap-8">
        <!-- Левая таблица (профиль) -->
        <div class="flex-1">
          <table class="text-left w-full">
            <tbody>
              <tr>
                <td class="table-cell-label">Login</td>
                <td class="table-cell-input">
                  <input name="login" class="input" readonly />
                </td>
              </tr>
              <tr>
                <td class="table-cell-label">Email</td>
                <td class="table-cell-input">
                  <input name="email" type="email" class="input" readonly>
                </td>
              </tr>
              <tr>
                <td class="table-cell-label">Password</td>
                <td class="table-cell-input">
                  <input
                    name="password"
                    type="password"
                    class="input"
                    placeholder="••••••"
                    readonly
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- Правая таблица (статистика) -->
        <div class="flex-1">
          <h2 class="text-xl font-semibold mb-3">Statistics</h2>
          <table class="text-left w-full border-collapse">
            <tbody>
              <tr>
                <td class="table-cell-label">Wins</td>
                <td class="table-cell-value" id="stats-wins">0</td>
              </tr>
              <tr>
                <td class="table-cell-label">Losses</td>
                <td class="table-cell-value" id="stats-losses">0</td>
              </tr>
              <tr>
                <td class="table-cell-label">Total Games</td>
                <td class="table-cell-value" id="stats-total">0</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="flex gap-4">
        <button id="edit-btn"   type="button" class="btn-primary w-24">Edit</button>
        <button id="save-btn"   type="button" class="btn-primary w-24 hidden">Save</button>
        <button id="cancel-btn" type="button" class="btn-secondary w-24 hidden">Cancel</button>
      </div>

      <span id="status" class="text-sm text-gray-500"></span>
    </div>
  </div>
</section>
`;

import { AuthAPI } from '../api/auth';
import type { Profile } from '../api/auth';
import { BASE } from '../api/auth'
import { UserAPI, UserStats } from '../api/user';

export async function profileInit(userId?: number) {
  // 1. Вначале только получение профиля и refresh-логика
  let me: Profile;
  try {
    me = await AuthAPI.getProfile();
  } catch (err: any) {
    if (err.message === 'Unauthorized') {
      try {
        const { accessToken } = await AuthAPI.refresh();
        localStorage.setItem('token', accessToken);
        // повторяем попытку получить профиль
        me = await AuthAPI.getProfile();
      } catch {
        // если и refresh не прокатил — отправляем на логин
        window.location.href = '/login';
        return;
      }
    } else {
      throw err;
    }
  }

  // 2. Определяем, чей профиль
  const isOwn = !userId || userId === me.id;
  const p: Profile = isOwn
    ? me
    : await UserAPI.getUserById(userId!);

  // 3. Собираем элементы и функцию setEditing
  const loginEl     = document.querySelector<HTMLInputElement>('input[name="login"]')!;
  const emailEl     = document.querySelector<HTMLInputElement>('input[name="email"]')!;
  const passEl      = document.querySelector<HTMLInputElement>('input[name="password"]')!;
  const statusEl    = document.getElementById('status')! as HTMLElement;
  const editBtn     = document.getElementById('edit-btn')! as HTMLButtonElement;
  const saveBtn     = document.getElementById('save-btn')! as HTMLButtonElement;
  const cancelBtn   = document.getElementById('cancel-btn')! as HTMLButtonElement;
  const avatarImg   = document.getElementById('avatar-img')! as HTMLImageElement;
  const avatarInput = document.getElementById('avatar-input')! as HTMLInputElement;

  //statistics
  const statsWins = document.getElementById('stats-wins')! as HTMLElement;
  const statsLosses = document.getElementById('stats-losses')! as HTMLElement;
  // const statsWinrate = document.getElementById('stats-winrate')! as HTMLElement;
  const statsTotal = document.getElementById('stats-total')! as HTMLElement;

  function setEditing(enabled: boolean) {
    [loginEl, emailEl, passEl].forEach(el =>
      enabled ? el.removeAttribute('readonly') : el.setAttribute('readonly', 'true')
    );
    saveBtn.classList.toggle('hidden', !enabled);
    cancelBtn.classList.toggle('hidden', !enabled);
    avatarInput.classList.toggle('hidden', !enabled);
    statusEl.textContent = '';
  }

  // 4. Если это чужой профиль — спрячем кнопки
  if (!isOwn) {
    editBtn.classList.add('hidden');
    saveBtn.classList.add('hidden');
    cancelBtn.classList.add('hidden');
    avatarInput.classList.add('hidden');
    // statsWins.classList.add('hidden');
    // statsLosses.classList.add('hidden');
    // statsTotal.classList.add('hidden');

  }

  // 5. Заполняем поля
  loginEl.value = p.username;
  emailEl.value = p.email;
  passEl.value  = '';
  avatarImg.src = p.avatarUrl.startsWith('http') ? p.avatarUrl : BASE + p.avatarUrl;

  	const stats = (await UserAPI.getUserStats(p.id));
	statsWins.textContent = stats.wins.toString();
	statsLosses.textContent = stats.losses.toString();

	const totalGames = stats.wins + stats.losses;
	statsTotal.textContent = totalGames.toString();



  let original = p;
  let newAvatarFile: File | null = null;

  // 6. Навешиваем слушатели, только для своего профиля
  if (isOwn) {
    avatarInput.addEventListener('change', () => {
      const f = avatarInput.files?.[0];
      if (!f) return;
      newAvatarFile = f;
      const reader = new FileReader();
      reader.onload = () => { avatarImg.src = reader.result as string; };
      reader.readAsDataURL(f);
    });

    editBtn.addEventListener('click', () => {
      setEditing(true);
      loginEl.focus();
    });

    cancelBtn.addEventListener('click', () => {
      loginEl.value = original.username;
      emailEl.value = original.email;
      passEl.value  = '';
      avatarImg.src = original.avatarUrl.startsWith('http') ? original.avatarUrl : BASE + original.avatarUrl;
      setEditing(false);
    });

    saveBtn.addEventListener('click', async () => {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEl.value)) {
        statusEl.textContent = 'Incorrect email address';
        return;
      }
      try {
        let newAvatarUrl = original.avatarUrl;
        if (newAvatarFile) {
          const u = await AuthAPI.uploadAvatar(newAvatarFile);
          newAvatarUrl = u.startsWith('http') ? u : BASE + u;
        }
        const payload: {
          username: string;
          email:    string;
          password?: string;
          avatarUrl: string;
        } = {
          username: loginEl.value,
          email:    emailEl.value,
          avatarUrl: newAvatarUrl,
        };
        if (passEl.value.trim()) payload.password = passEl.value;

        const updated = await AuthAPI.updateProfile(payload);
        original = updated;
        setEditing(false);
        statusEl.textContent = 'Saved!';
      } catch (err: any) {
        statusEl.textContent = 'Error: ' + err.message;
      }
    });
  }

  // 7. Изначально — в режиме просмотра
  setEditing(false);
}