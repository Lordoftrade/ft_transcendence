import { BASE } from '../api/auth'; 

export const homeView = `
 <section class="relative w-full h-[calc(100vh-3.6rem)] overflow-hidden">
   <img src="/img/home.png" alt="Главная картинка" class="absolute inset-0 w-full h-full object-cover" />
   <div class="relative z-10 flex flex-col items-center justify-center h-full bg-black/40 pt-16">
     <h1 class="-mt-32 text-white text-5xl font-bold mb-8">Welcome to PONG!</h1>
     <div id="game-buttons" class="flex space-x-6 hidden">
       <button id="vs-computer"   class="bg-blue-500   hover:bg-blue-600   text-white text-2xl font-semibold py-4 px-8 rounded-lg">
         You VS AI
       </button>
       <button id="one-vs-one"     class="bg-green-500  hover:bg-green-600  text-white text-2xl font-semibold py-4 px-8 rounded-lg">
         1:1 locally
       </button>
        <button id="search-quick"     class="bg-yellow-500 hover:bg-yellow-600 text-white text-2xl font-semibold py-4 px-8 rounded-lg">
         Find 1:1 online
        </button>
       <button id="tournament"     class="bg-purple-500 hover:bg-purple-600 text-white text-2xl font-semibold py-4 px-8 rounded-lg">
         Tournament
       </button>
     </div>
   </div>
 </section>
 `;

export function initHome() {
  // Показываем кнопки, только если есть токен
  const isAuth = Boolean(localStorage.getItem('token'));
  const btns   = document.getElementById('game-buttons')!;
  btns.classList.toggle('hidden', !isAuth);

  // Находим кнопки
  const btnVsCPU  = document.querySelector<HTMLButtonElement>('#vs-computer');
  const btn1v1    = document.querySelector<HTMLButtonElement>('#one-vs-one');
  const btnSearch = document.querySelector<HTMLButtonElement>('#search-quick');
  const btnT      = document.querySelector<HTMLButtonElement>('#tournament');

  // Простые переходы
  btnVsCPU?.addEventListener('click', () => location.hash = '#/play/cpu');
  btn1v1?.addEventListener('click',   () => location.hash = '#/play/1v1');
  btnT?.addEventListener('click',     () => location.hash = '#/tournament');

  // Поиск Quick-Game
  btnSearch?.addEventListener('click', async () => {
    // Отключаем кнопку и показываем статус
    btnSearch.disabled    = true;
    btnSearch.textContent = 'Searching…';

    // Заголовки, если нужен JWT
    const token = localStorage.getItem('token');
    const headers: Record<string,string> = token
      ? { 'Authorization': `Bearer ${token}` }
      : {};

    try {
      // 1) Кладёмся в очередь
      let res = await fetch(`${BASE}/matchmaking/join`,    { method: 'POST', headers });
      if (!res.ok) throw new Error(`Error ${res.status}`);

      // 2) Пуллим, пока не найдём matchId
      let matchId: string | null = null;
      while (!matchId) {
        // Ждём 1 секунду между запросами
        await new Promise(r => setTimeout(r, 1000));

        res = await fetch(`${BASE}/matchmaking/checkPending`, { headers });
        if (!res.ok) throw new Error(`Error ${res.status}`);

        // Ожидаем { found: boolean; matchId?: string }
        const json = await res.json() as { found: boolean; matchId?: string };

        if (json.found && json.matchId) {
          // Как только нашли — уходим
          location.hash = `#/play/quick/${encodeURIComponent(json.matchId)}`;
          return;
        }
        // иначе остаёмся в ожидании, обновляем текст
        btnSearch.textContent = 'Searching…';
      }
    } catch (err) {
      console.error(err);
      // Восстанавливаем кнопку в исходное состояние
      btnSearch.disabled    = false;
      btnSearch.textContent = 'Search quick';
    }
  });
}
