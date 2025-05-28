import { ChatAPI } from '../api/chat';
import type { Message, Conversation } from '../api/chat';
import { FriendsAPI } from '../api/friends';
import { MatchAPI } from '../api/match';
import { router } from '../router';

// Интерфейс для UI-диалогов: приводим lastAt к Date и avatarUrl к строке
interface UIConversation {
  otherId:     number;
  username:    string;
  avatarUrl:   string;
  lastMessage: string;
  lastAt:      Date | null;
  unreadCount: number;
}

// Страница чата без WebSocket (REST-поллинг), с REST-приглашением в Pong
export async function ChatPage(): Promise<HTMLElement> {

  const shownInvites = new Set<number>();
  const systemUser = await ChatAPI.getSystemUser();
  const systemUserId = systemUser.id;
  const me = await ChatAPI.getMe();
  const currentUserId = me.id;

  let selectedUserId: number | null = null;
  let isBlocked = false;
  let pollTimer: number;

  // --- Построение DOM ---
  const container = document.createElement('div');
  container.className = 'flex h-full';

  // Сайдбар с пользователями
  const aside = document.createElement('aside');
  aside.className = 'w-1/4 border-r overflow-y-auto';
  const convList = document.createElement('ul');
  aside.append(convList);
  container.append(aside);

  // Главная область
  const main = document.createElement('main');
  main.className = 'flex-1 flex flex-col';
  container.append(main);

  // Header (скрываем по умолчанию)
  const header = document.createElement('div');
  header.className = 'flex items-center justify-between p-4 border-b hidden';
  main.append(header);

  const userInfo = document.createElement('div');
  userInfo.className = 'flex items-center space-x-2';
  const avatar = document.createElement('img');
  avatar.className = 'w-10 h-10 rounded-full';
  const userName = document.createElement('span');
  userName.className = 'font-semibold';
  userInfo.append(avatar, userName);

  const actions = document.createElement('div');
  actions.className = 'space-x-2';
  const blockBtn = document.createElement('button'); blockBtn.textContent = 'Block';
  const pongBtn = document.createElement('button'); pongBtn.textContent = 'Invite to Pong';
  const profileBtn = document.createElement('button'); profileBtn.textContent = 'Profile';
  actions.append(blockBtn, pongBtn, profileBtn);

  header.append(userInfo, actions);

  // Окно сообщений
  const chatWindow = document.createElement('div');
  chatWindow.className = 'flex-1 p-4 overflow-y-auto hidden';
  main.append(chatWindow);

  // Поле ввода
  const inputWrapper = document.createElement('div');
  inputWrapper.className = 'p-4 border-t flex space-x-2 hidden';
  const messageInput = document.createElement('input');
  messageInput.type = 'text'; messageInput.placeholder = 'Write a message...';
  messageInput.className = 'flex-1 p-2 border rounded';
  const sendBtn = document.createElement('button'); sendBtn.textContent = 'Send';
  inputWrapper.append(messageInput, sendBtn);
  main.append(inputWrapper);

  // Показать UI после выбора
  function showChatUI() {
    header.classList.remove('hidden');
    chatWindow.classList.remove('hidden');
    inputWrapper.classList.remove('hidden');
  }

function renderPongInvite(matchId: number, fromUserId: number) {
  const inviteEl = document.createElement('div');
  inviteEl.className = 'p-2 bg-blue-100 rounded mb-2';

  // Можно подтянуть имя через friends/fetch или хранить в conv
  const name = fromUserId === currentUserId ? 'Вы' : 'Игрок';
  inviteEl.textContent = `${name} приглашает вас в Pong. `;

  const accept = document.createElement('button');
  accept.textContent = 'Принять';
  accept.className = 'ml-2 p-1 bg-green-500 text-white rounded';
  accept.onclick = () => {
    router.navigate(`#/play/quick/${matchId}`);
  };

  inviteEl.append(accept);
  chatWindow.append(inviteEl);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

  // Добавление сообщения в окно
  function appendMessage(m: Message) {
    let data: any;
    try {
      data = JSON.parse(m.content);
    } catch {
      data = null;
    }

      // если это pong-invite и мы его уже показали — пропускаем
    if (data?.type === 'pong-invite') {
      if (shownInvites.has(m.id)) return;
      shownInvites.add(m.id);
      renderPongInvite(data.matchId, m.senderId);
      return;
    }
    if (m.type === 'TOURNAMENT') {
      const sysEl = document.createElement('div');
      sysEl.className = 'text-center italic text-gray-500 my-2';
      sysEl.textContent = m.content;
      chatWindow.append(sysEl);
      return;
    }
    const msgEl = document.createElement('div');
    msgEl.className = m.senderId === currentUserId ? 'text-right' : 'text-left';
    msgEl.textContent = m.content;
    chatWindow.append(msgEl);
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }

  // Загрузка списка диалогов + друзей
  async function loadConversations() {
    convList.innerHTML = '';
    const rawConvs: Conversation[] = await ChatAPI.getConversations();
    const friends = await FriendsAPI.getFriends();
    const map = new Map<number, UIConversation>();

    // Преобразуем API-диалоги в UI-диалоги
    for (const c of rawConvs) {
      map.set(c.otherId, {
        otherId: c.otherId,
        username: c.username,
        avatarUrl: c.avatarUrl ?? '',
        lastMessage: c.lastMessage,
        lastAt: c.lastAt ? new Date(c.lastAt) : null,
        unreadCount: c.unreadCount
      });
    }

    // Добавляем друзей без истории переписки
    for (const f of friends) {
      if (!map.has(f.id)) {
        map.set(f.id, {
          otherId: f.id,
          username: f.username,
          avatarUrl: f.avatarUrl ?? '',
          lastMessage: '',
          lastAt: null,
          unreadCount: 0
        });
      }
    }

    // Сортировка по дате последнего сообщения
    const list = Array.from(map.values()).sort((a, b) => {
      if (!a.lastAt && !b.lastAt) return 0;
      if (!a.lastAt) return 1;
      if (!b.lastAt) return -1;
      return b.lastAt.getTime() - a.lastAt.getTime();
    });

    // Рендер списка
    for (const item of list) {
      const li = document.createElement('li');
      li.className = 'p-2 hover:bg-gray-100 cursor-pointer flex justify-between';
      const nameSpan = document.createElement('span'); nameSpan.textContent = item.username;
      const badge = document.createElement('span'); badge.className = 'text-sm text-red-500';
      if (item.unreadCount) badge.textContent = String(item.unreadCount);
      li.append(nameSpan, badge);
      li.onclick = () => selectConversation(item.otherId);
      convList.append(li);
    }
  }

  // Выбор диалога
  async function selectConversation(userId: number) {
    selectedUserId = userId;
    clearInterval(pollTimer);
    const convs = await ChatAPI.getConversations();
    const conv = convs.find(c => c.otherId === userId);
    if (conv) {
      avatar.src = conv.avatarUrl ?? '';
      userName.textContent = conv.username;
    }
    const isSystemChat = userId === systemUserId;
    blockBtn .style.display = isSystemChat ? 'none' : '';
    pongBtn  .style.display = isSystemChat ? 'none' : '';
    profileBtn.style.display = isSystemChat ? 'none' : '';
    await checkBlock();
    chatWindow.innerHTML = '';
    shownInvites.clear();
    showChatUI();
    await loadMessages();
    pollTimer = window.setInterval(loadMessages, 3000);
  }

  // Загрузка сообщений
  async function loadMessages() {
    if (!selectedUserId) return;
    const msgs = await ChatAPI.getConversation(selectedUserId);
    chatWindow.innerHTML = '';
    msgs.forEach(appendMessage);
  }

  // Отправка сообщения
  async function doSend() {
    if (!selectedUserId) return;
    const text = messageInput.value.trim();
    if (!text) return;

    try {
      const msg = await ChatAPI.sendMessage(selectedUserId, text);
      appendMessage(msg);
      messageInput.value = '';
      await loadConversations();
    }
    catch (err: any) {
      // если это «заблокировали» — показываем дружелюбный алерт
      if (err.message.includes("you've been blocked")) {
        alert('Message cannot be sent: this user has blocked you.');
        // и отключаем ввод
        messageInput.disabled = true;
        sendBtn.disabled = true;
        return;
      }
      // иначе пробрасываем дальше (или показываем общее сообщение)
      console.error(err);
      alert('Send error: ' + err.message);
    }
  }

  // Проверка блока
  async function checkBlock() {
    if (!selectedUserId) return;
    const list = await ChatAPI.listBlocked();
    isBlocked = list.includes(selectedUserId);
    blockBtn.textContent = isBlocked ? 'Unblock' : 'Block';
    blockBtn.disabled = false;
  }

  // Тоггл блокировки
  async function toggleBlock() {
    if (!selectedUserId) return;

    blockBtn.disabled = true;
    try {
      if (isBlocked) {
        // раз-блокируем
        await ChatAPI.unblockUser(selectedUserId);
      } else {
        // блокируем
        await ChatAPI.blockUser(selectedUserId);
      }

      // после успеха меняем флаг и подпись
      isBlocked = !isBlocked;
      blockBtn.textContent = isBlocked ? 'Unblock' : 'Block';
    } catch (err) {
      console.error('Block/unblock failed', err);
      // здесь можно вывести уведомление пользователю
    } finally {
      blockBtn.disabled = false;
    }
  }

    // Приглашение в Pong
  async function invitePong() {
    if (!selectedUserId) return;
    pongBtn.disabled = true;
    try {
      const { matchId } = await MatchAPI.createMatchInvite(selectedUserId);
      await ChatAPI.sendMessage(
        selectedUserId,
        JSON.stringify({ type: 'pong-invite', matchId })
      );
      router.navigate(`#/play/quick/${matchId}`);
    } catch (err: any) {
      alert('Не удалось пригласить в Pong: ' + err.message);
    } finally {
      pongBtn.disabled = false;
    }
  }

  // --- Привязка событий ---
  sendBtn.onclick = doSend;
  messageInput.addEventListener('keyup', e => e.key === 'Enter' && doSend());
  blockBtn.onclick = toggleBlock;
  pongBtn.onclick = invitePong;
  profileBtn.onclick = () => selectedUserId && router.navigate(`#/profile/${selectedUserId}`);

  // Инициализация
  await loadConversations();
  return container;
}

