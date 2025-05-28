import { homeView, initHome }        from './pages/home'
import { notFoundView }              from './pages/notFound'
import { registerView, registerInit }from './pages/register'
import { profileView, profileInit }  from './pages/profile'
import { loginView, loginInit }      from './pages/login'
import { startVsComputer, start1v1}  from '../../pong/src/game/gameLogic.js'
import { startQuickGame }            from '../../pong/src/game_online/gameLogic.js'
import { friendsView, initFriends }  from './pages/friends'
import { ChatPage }                  from './pages/chat'
import { tournamentView, initTournament } from './pages/tournament'
export const BACK = import.meta.env.VITE_BACK_URL ?? 'localhost:3000'

export const router = {
  navigate(to: string) {
    window.location.hash = to.startsWith('#') ? to : `#${to}`
  }
}

type Route = {
  view?: string
  init?: () => void | Promise<void>
}

const routes: Record<string, Route> = {
  '':      { view: homeView, init: initHome },
  '#/':        { view: homeView,   init: initHome },
  '#/register':{ view: registerView, init: registerInit },
  '#/profile': { view: profileView,  init: profileInit },
  '#/login':   { view: loginView,    init: loginInit },
  '#/play/cpu':{ view: '',           init: startVsComputer },
  '#/play/1v1':{ view: '',           init: start1v1 },
  '#/tournament': { view: tournamentView, init: initTournament },
  '#/friends': { view: friendsView, init: initFriends },
  '#/chat':    { 
    init: async () => {
      const outlet = document.getElementById('outlet')!
      outlet.innerHTML = ''
      const chatEl = await ChatPage()
      outlet.appendChild(chatEl)
    }
  },
}

async function mountRoute() {
  const outlet = document.getElementById('outlet')!
  let route: Route

  if (location.hash.startsWith('#/profile/')) {
    const id = Number(location.hash.split('/')[2])
    route = {
      view: profileView,
      init: () => profileInit(id)
    }
  }
else if (location.hash.startsWith('#/play/quick/')) {
  const matchId = location.hash.split('/')[3]!;
  route = {
    view: '',
    init: () => {
      const wsProtocol = location.protocol === 'https:' ? 'wss' : 'ws';
      // здесь подставляем реальный IP:порт бэкенда
      const token = encodeURIComponent(localStorage.getItem('token') || '');
      const ws = new WebSocket(
        `${wsProtocol}://${BACK}/ws?matchId=${matchId}&token=${token}`
      );
      ws.addEventListener('open', () => {
        console.log('Connected to WS on', BACK);
      });

ws.addEventListener('message', ({ data }) => {
  let msg: any;
  try {
    msg = JSON.parse(data);
  } catch {
    console.error('Invalid JSON:', data);
    return;
  }

  // console.log('WS message:', msg);

  switch (msg.type) {
    // 1) Установка соединения, вы добавлены в комнату
    case 'connection':
      if (msg.status === 'connected') {
        startQuickGame(ws, msg);
        console.log(`Connected as player ${msg.playerNumber} in room ${msg.roomId}`);
        // Можно здесь обновить UI, например:
        // showWaitingScreen(msg.playersConnected, msg.playersNeeded);
      }
      break;

    // 2) Подключился соперник
    case 'playerConnected':
      console.log(`Players in room: ${msg.playersConnected}/${msg.playersNeeded}`);
      // Обновляем индикатор ожидания
      // updateQueueIndicator(msg.playersConnected, msg.playersNeeded);
      // Если все на месте — ждем gameStart
      break;

    // 3) Keep-alive / ping
    case 'ping':
      // В ряде реализаций надо отвечать pong
      return;
    // 4) Ошибка формата
    case 'error':
      console.error('Server error:', msg.message);
      alert(`Error from server: ${msg.message}`);
      break;

    // 5) Отключился игрок
    case 'playerDisconnected':
      console.warn(msg.message);
      // Можно показать сообщение и поставить игру на паузу
      // showDisconnectMessage(msg.message);
      break;

    // 6) Статус готовности игроков
    case 'readyStatus':
      console.log(`Ready: ${msg.playersReady.join(', ')}`);
      if (msg.allReady) {
        console.log('All players ready');
        // можно, например, включить кнопку старт
        // enableStartButton();
      }
      break;

    // 7) Игра началась
    case 'gameStart':
      console.log('Game starting at', msg.timeStamp);
      // Запускаем игру, передаём WebSocket и начальные настройки
      // startQuickGame(ws, msg);
      break;

    default:
      console.warn('Unknown message type:', msg.type);
  }
});
      ws.addEventListener('error', () => {
        alert('WebSocket error for quick game');
      });
      ws.addEventListener('close', () => {
        console.warn('Quick game socket closed prematurely');
      });
    }
  }
}
  else {
    // ЗДЕСЬ НЕ КОНСТАНТА, А ПРИСВАИВАНИЕ
    const [rawPath] = location.hash.split('?')
    route = routes[rawPath] ?? { view: notFoundView, init: () => {} }
  }

  // теперь route гарантированно инициализирован
  if (route.view) outlet.innerHTML = route.view
  else outlet.innerHTML = ''

  if (route.init) await route.init()
}

export function initRouter() {
  window.addEventListener('hashchange', mountRoute)
  mountRoute()
}