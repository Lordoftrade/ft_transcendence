import { FriendsAPI } from '../api/friends';
import { AuthAPI } from '../api/auth';
import type { User, Friend, IncomingRequest, UserStatus } from '../api/friends';

export const friendsView = `
<section class="p-6 space-y-8">
  <h1 class="text-3xl font-bold">Friends</h1>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <div>
      <h2 class="text-xl font-semibold mb-2">All users</h2>
      <ul id="all-users-list" class="space-y-2"></ul>
    </div>
    <div>
      <h2 class="text-xl font-semibold mb-2">My friends</h2>
      <ul id="my-friends-list" class="space-y-2"></ul>
    </div>
    <div>
      <h2 class="text-xl font-semibold mb-2">Incoming messages</h2>
      <ul id="incoming-requests-list" class="space-y-2"></ul>
    </div>
  </div>
</section>
`;

export async function initFriends(): Promise<void> {
  const allUsersUL  = document.getElementById('all-users-list')! as HTMLUListElement;
  const myFriendsUL = document.getElementById('my-friends-list')! as HTMLUListElement;
  const incomingUL  = document.getElementById('incoming-requests-list')! as HTMLUListElement;

  // показываем «Загрузка…»
  allUsersUL.innerHTML  = '<li>Loading…</li>';
  myFriendsUL.innerHTML = '<li>Loading…</li>';
  incomingUL.innerHTML  = '<li>Loading…</li>';

  try {
    // ==== 1) Получаем базовые списки ====
    const me = await AuthAPI.getProfile();
    const [users, friends, incoming] = await Promise.all([
      FriendsAPI.getAllUsers(),
      FriendsAPI.getFriends(),
      FriendsAPI.getIncomingRequests(),
    ]);

    const selfId      = me.id;
    // используем Массив, а не Set, чтобы URLSearchParams точно итерался
    const friendIds   = friends.map(f => f.id);
    const incomingIds = new Set(incoming.map(r => r.requester.id));

    // ==== 2) Пытаемся подгрузить статусы, если есть друзья ====
    let statusMap = new Map<number, boolean>();
    if (friendIds.length > 0) {
      try {
        const statuses: UserStatus[] = await FriendsAPI.getOnlineStatuses(friendIds);
        statusMap = new Map(statuses.map(s => [s.id, s.online]));
      } catch (err) {
        console.warn('Failed to get online statuses:', err);
      }
    }

    // ==== 3) Рендер «Мои друзья» с индикатором ====
    myFriendsUL.innerHTML = '';
    if (friends.length === 0) {
      myFriendsUL.innerHTML = '<li>You dont have any friends yet.</li>';
    } else {
      friends.forEach((f: Friend) => {
        const online = statusMap.get(f.id) ?? false;
        const li = document.createElement('li');
        li.className = 'flex items-center p-2 bg-gray-800 rounded text-white';

        const dot = document.createElement('span');
        dot.className = `h-2 w-2 rounded-full inline-block mr-2 ${
          online ? 'bg-green-500' : 'bg-gray-500'
        }`;

        const name = document.createElement('span');
        name.textContent = f.username;

        li.append(dot, name);
        myFriendsUL.appendChild(li);
      });
    }

    // ==== 4) Рендер «Входящие запросы» (без изменений) ====
    incomingUL.innerHTML = '';
    if (incoming.length === 0) {
      incomingUL.innerHTML = '<li>No new requests</li>';
    } else {
      incoming.forEach((req: IncomingRequest) => {
        const li = document.createElement('li');
        li.className = 'flex justify-between p-2 bg-gray-800 rounded';
        li.innerHTML = `<span class="text-white">${req.requester.username}</span>`;
        const btn = document.createElement('button');
        btn.textContent = 'Принять';
        btn.className = 'px-2 py-1 bg-green-500 text-white rounded';
        btn.onclick = async () => {
          btn.disabled = true;
          try {
            await FriendsAPI.acceptFriendRequest(req.requester.id);
            await initFriends();
          } catch {
            btn.textContent = 'Error';
          }
        };
        li.appendChild(btn);
        incomingUL.appendChild(li);
      });
    }

    // ==== 5) Рендер «Все пользователи» (без изменений) ====
    allUsersUL.innerHTML = '';
    if (users.length === 0) {
      allUsersUL.innerHTML = '<li>No one found</li>';
    } else {
      users.forEach((u: User) => {
        if (
        u.id === selfId ||
        friendIds.includes(u.id) ||
        incomingIds.has(u.id) ||
        u.username === 'TBD_Placeholder'
        ) return;

        const li = document.createElement('li');
        li.className = 'flex justify-between p-2 bg-gray-800 rounded';

        const name = document.createElement('span');
        name.textContent = u.username;
        name.className = 'text-white';

        const btn = document.createElement('button');
        btn.textContent = 'Добавить';
        btn.className = 'px-2 py-1 bg-blue-500 text-white rounded';
        btn.onclick = async () => {
          btn.disabled = true;
          btn.textContent = 'Request sent';
          try {
            await FriendsAPI.sendFriendRequest(u.id);
          } catch {
            /* ничего */
          }
        };

        li.append(name, btn);
        allUsersUL.appendChild(li);
      });
    }

  } catch (e) {
    console.error('Initialization error:', e);
    allUsersUL.innerHTML  = '<li class="text-red-500">Error</li>';
    myFriendsUL.innerHTML = '<li class="text-red-500">Error</li>';
    incomingUL.innerHTML  = '<li class="text-red-500">Error</li>';
  }
}