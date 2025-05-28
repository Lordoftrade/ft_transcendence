import { Game } from './Game';
import { GameMode } from '../utils/types';

// Переменная для хранения состояния игры
let currentGame: Game | null = null;
let previousUrl: string | null = null;

// Добавляем обработчик popstate для обработки кнопки "назад" браузера
window.addEventListener('popstate', (event) => {
  if (currentGame && !window.location.href.includes('?game=true')) {
    exitGame();
    // Даем время роутеру для обработки навигации
    setTimeout(() => {
      // Если роутер не отрендерил контент, форсируем перезагрузку
      const outlet = document.getElementById('outlet');
      if (outlet && outlet.innerHTML === '') {
        window.location.reload();
      }
    }, 100);
  }
});

function renderGameScreen() {
  // Убираем манипуляции с историей браузеры
  // previousUrl = window.location.pathname + window.location.search;
  // window.history.pushState({page: 'game'}, 'Game', '?game=true');

  // Добавляем класс game-active к body для правильного применения стилей
  document.body.classList.add('game-active');

  const root = document.getElementById('outlet');
  if (!root) throw new Error('Контейнер #outlet не найден!');

  // Добавляем класс game-page к контейнеру
  root.classList.add('game-page');

  root.innerHTML = `
    <div class="game-container">
      <div id="scoreDisplay"
           class="absolute top-4 left-4 text-white text-2xl">
        0 - 0
      </div>
      <canvas id="gameCanvas" class="block mx-auto border border-white"></canvas>
      <div id="gameMessage"
           class="absolute inset-0 flex items-center justify-center text-white text-2xl">
      </div>
    </div>
  `;

  // Обновляем обработчик кнопки "Назад"
  document.getElementById('backButton')?.addEventListener('click', () => {
    exitGame();
    // Используйте ваш роутер для навигации назад
    window.history.back();
  });
}

// Функция для выхода из игры (без навигации)
function exitGame() {
  if (currentGame) {
    // Здесь должен быть метод остановки игры
    // currentGame.stop();
    currentGame = null;
  }

  // Очищаем CSS классы
  document.body.classList.remove('game-active');
  const root = document.getElementById('outlet');
  if (root) {
    root.classList.remove('game-page');
    // Очищаем контент, чтобы роутер мог отрисовать правильную страницу
    root.innerHTML = '';
  }
}

// Функции для запуска разных режимов игры
export function startVsComputer() {
  renderGameScreen();
  currentGame = new Game(GameMode.VS_COMPUTER);
  currentGame.start();
}

export function start1v1() {
  renderGameScreen();
  currentGame = new Game(GameMode.VS_PLAYER);
  currentGame.start();
}

export function startQuickGame() {
  renderGameScreen();
  currentGame = new Game(GameMode.VS_PLAYER);
  currentGame.start();
}

// Для явного вызова при переходе на предыдущую страницу через кнопку
export function navigateBack() {
  exitGame();
  window.history.back();
}

// Для навигации на главную
export function navigateToHome() {
  exitGame();
  window.location.href = '/';
}