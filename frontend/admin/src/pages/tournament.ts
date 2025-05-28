import { AuthAPI } from '../api/auth';
import { BASE      } from '../api/auth';

export const tournamentView = `
<section class="p-6">
  <!-- Создать / Инфо -->
  <div id="create-or-info" class="mb-6">
    <div id="create-block" class="space-y-2">
      <input id="tournament-name"
             type="text"
             class="w-full p-2 bg-gray-700 rounded text-white"
             placeholder="Название турнира (опционально)" />
      <select id="required-players" class="p-2 bg-gray-700 rounded text-white">
        <option value="4">4 игрока</option>
        <option value="8" selected>8 игроков</option>
        <option value="16">16 игроков</option>
      </select>
      <button id="create-tournament-btn"
              class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded">
        Создать турнир
      </button>
    </div>
    <div id="info-block" class="hidden">
      <h1 class="text-3xl font-bold mb-2">
        Tournament: <span id="tournament-name-display"></span>
      </h1>
      <p>ID турнира: <span id="tournament-id-display"></span></p>
    </div>
    <div id="participants-list"
        class="mt-6 bg-gray-800 p-4 rounded-lg text-white">
      <h2 class="text-xl font-semibold mb-2">Участники</h2>
      <ul id="participants-ul" class="list-disc list-inside"></ul>
    </div>
  </div>
  <!-- Контейнер для бракета -->
  <div id="bracket-container" class="mt-8 p-4 bg-gray-800 text-white rounded-lg max-h-[60vh] overflow-auto whitespace-nowrap">
    <!-- сетка появится здесь -->
  </div>

  <!-- Кнопки действия -->
  <div class="mt-4 space-x-2">
    <button id="start-tournament-btn"
            class="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded hidden">
      Начать турнир
    </button>
    <div id="actions-block" class="mt-4 hidden space-x-2">
      <input id="participant-name"
            type="text"
            placeholder="Как вас называть?"
            class="px-2 py-1 bg-gray-700 rounded text-white" />
      <button id="join-tournament-btn"
              class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded">
        Присоединиться к турниру
      </button>
    </div>
</section>
`;

let bracketPoller: number | null = null;

export async function initTournament(): Promise<void> {
  // 1) Контекст
  const user    = await AuthAPI.getProfile();
  const userId  = user.id;
  const token   = localStorage.getItem('token')!;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // 2) DOM-элементы
  const createBlock = document.getElementById('create-block')!;
  const infoBlock   = document.getElementById('info-block')!;
  const nameDisplay = document.getElementById('tournament-name-display')!;
  const idDisplay   = document.getElementById('tournament-id-display')!;
  const createBtn   = document.getElementById('create-tournament-btn') as HTMLButtonElement;
  const selectSize  = document.getElementById('required-players') as HTMLSelectElement;
  const startBtn    = document.getElementById('start-tournament-btn') as HTMLButtonElement;
  const joinBtn     = document.getElementById('join-tournament-btn') as HTMLButtonElement;
  const bracketCt   = document.getElementById('bracket-container')!;
  const actionsBlock = document.getElementById('actions-block')!;

  // 3) Парсим tourId из hash
  const [, qs] = window.location.hash.split('?');
  let tourId   = new URLSearchParams(qs).get('id');

  // 4) Если нет ?id, ищем первый открытый турнир
  if (!tourId) {
    const listRes = await fetch(`${BASE}/tournament`, { headers });
    if (listRes.ok) {
      const allTours: any[] = await listRes.json();
      const open = allTours.find((t: any) =>
        t.status === 'REGISTRATION' &&
        ((t.participants?.length ?? 0) < t.requiredPlayers)
      );
      if (open) tourId = String(open.id);
    }
  }

  // 5) Рендер турнира
  async function renderTournament(id: string) {
    const tourRes = await fetch(`${BASE}/tournament/${id}`, { headers });
    if (!tourRes.ok) return console.error('Tour fetch failed');
    const tour = await tourRes.json();

    const partsRes = await fetch(
      `${BASE}/tournamentParticipant/${id}/participants`,
      { headers }
    );
    const participants: any[] = partsRes.ok ? await partsRes.json() : [];

    // Заголовок
    nameDisplay.textContent = tour.name;
    idDisplay.textContent   = String(tour.id);
    const ul = document.getElementById('participants-ul')!;
    ul.innerHTML = '';  // очистить старый список
    participants.forEach(p => {
      const li = document.createElement('li');
      li.textContent = p.tournamentName ?? p.user.username;
      ul.appendChild(li);
    });

    // Кнопка «Присоединиться»
    const isIn = participants.some(p => p.userId === userId);
    if (tour.status === 'REGISTRATION' && !isIn) {
      actionsBlock.classList.remove('hidden');
    } else {
      actionsBlock.classList.add('hidden');
    }

    // Кнопка «Начать турнир»
    // const isOwner = participants.length > 0 && participants[0].userId === userId;
    const full    = participants.length === tour.requiredPlayers;
    const pending = tour.match?.status === 'ONGOING';
    if (pending && full) {
      startBtn.classList.remove('hidden');
    } else {
      startBtn.classList.add('hidden');
    }
  }

  // 6) Рендер бракета
async function renderBracket(id: string) {
  bracketCt.innerHTML = '';

  // 1) Получаем все матчи
  const res = await fetch(`${BASE}/tournament/${id}/bracket`, { headers });
  if (!res.ok) {
    bracketCt.textContent = 'Нет сетки';
    return;
  }
  const matches: any[] = await res.json();

  // 2) Получаем участников, чтобы собрать мапу userId → username
  const partsRes = await fetch(`${BASE}/tournamentParticipant/${id}/participants`, { headers });
  const participants: any[] = partsRes.ok ? await partsRes.json() : [];
  const nameMap = new Map<number,string>();
  participants.forEach(p => {
    const displayName = p.tournamentName?.trim() || p.user.username;
    nameMap.set(p.userId, displayName);
  });
  // 3) Группируем матчи по раундам
  const rounds = new Map<number, any[]>();
  matches.forEach(m => {
    if (!rounds.has(m.round)) rounds.set(m.round, []);
    rounds.get(m.round)!.push(m);
  });

  // 4) Рисуем колонки по раундам
  const wrapper = document.createElement('div');
  wrapper.className = 'flex gap-4';

  Array.from(rounds.entries())
    .sort(([a], [b]) => a - b)
    .forEach(([round, ms]) => {
      const col = document.createElement('div');
      col.className = 'min-w-[160px]';
      const h3 = document.createElement('h3');
      h3.textContent = `Раунд ${round}`;
      h3.className = 'text-lg font-semibold mb-2';
      col.appendChild(h3);

      ms.forEach(m => {
        // 4.1) Имёна игроков
        const p1 = nameMap.get(m.match.player1Id) ?? '—';
        const p2 = nameMap.get(m.match.player2Id) ?? '—';

        // 4.2) Основная карточка матча
        const card = document.createElement('div');
        card.className = 'mb-2 p-2 bg-gray-700 rounded';
        card.innerHTML = `
          <div class="flex justify-between">
            <span>${p1}</span>
            <span>vs</span>
            <span>${p2}</span>
          </div>
          <div class="text-sm text-gray-400">#${m.bracketPos}</div>
        `;

        // 4.3) Если матч PENDING и вы в нём — показываем кнопку
        if (
          m.match.status === 'PENDING' &&
          (m.match.player1Id === userId || m.match.player2Id === userId)
        ) {
          const playBtn = document.createElement('button');
          playBtn.textContent = 'Играть онлайн';
          playBtn.className = 'mt-2 px-2 py-1 bg-blue-600 rounded hover:bg-blue-500 text-sm';
          playBtn.addEventListener('click', () => {
            location.hash = `#/play/quick/${m.matchId}`;
          });
          card.appendChild(playBtn);
        }
        col.appendChild(card);
      });

      wrapper.appendChild(col);
    });

  bracketCt.appendChild(wrapper);
}

  // 7) Начальное отображение
  if (tourId) {
    createBlock.classList.add('hidden');
    infoBlock.classList.remove('hidden');
    await renderTournament(tourId);
    await renderBracket(tourId);

    // 8) Периодический опрос
  if (bracketPoller) {
        clearInterval(bracketPoller);
      }
      bracketPoller = window.setInterval(async () => {
        await renderTournament(tourId!);
        await renderBracket(tourId!);
      }, 15_000);

    } else {
      createBlock.classList.remove('hidden');
      infoBlock.classList.add('hidden');
    }

  // 9) Создать турнир
  createBtn.addEventListener('click', async () => {
    const size      = +selectSize.value;
    const rawName   = (document.getElementById('tournament-name') as HTMLInputElement)
                       .value.trim();
    const name      = rawName || user.username;
    const startDate = new Date().toISOString();
    const endDate   = new Date(Date.now() + 3600000).toISOString();

    const res = await fetch(`${BASE}/tournament`, {
      method: 'POST', headers,
      body: JSON.stringify({ requiredPlayers: size, name, startDate, endDate })
    });
    if (!res.ok) {
      const err = await res.json();
      return alert('Ошибка: ' + err.message);
    }
    const tour = await res.json();
    tourId = String(tour.id);

    createBlock.classList.add('hidden');
    infoBlock.classList.remove('hidden');
    await renderTournament(tourId);
    await renderBracket(tourId);
  });

  // 10) Присоединиться
  joinBtn.addEventListener('click', async () => {
    if (!tourId) return;
     const raw = (document.getElementById('participant-name') as HTMLInputElement)
                .value
                .trim();
    const tournamentName = raw.length > 0 ? raw : user.username;
    const res = await fetch(`${BASE}/tournament/${tourId}/register`, {
      method: 'POST', headers, body: JSON.stringify({tournamentName})
    });
    if (!res.ok) {
      const err = await res.json();
      return alert('Не удалось присоединиться: ' + err.message);
    }
    window.location.hash = `#/tournament?id=${tourId}`;
  // и перерисовываем
    window.location.reload();
    // await renderTournament(tourId);
    // await renderBracket(tourId);
  });

  // 11) Начать турнир
  startBtn.addEventListener('click', async () => {
    if (!tourId) return;
    console.log("TOURID", tourId);
    try {
      const res = await fetch(`${BASE}/tournament/${tourId}/start`, {
        method: 'POST',
        headers,
      });
      if (!res.ok) {
        const err = await res.json();
        return alert('Ошибка старта: ' + err.message);
      }
      // Предположим, что сервер в ответ присылает { matchId: number }
      const { matchId } = await res.json();

      // Перенаправляем на роут, где поднимается WebSocket
      location.hash = `#/play/quick/${matchId}`;
    } catch (e) {
      console.error(e);
      alert('Не удалось запустить игру');
    }
  });
}


