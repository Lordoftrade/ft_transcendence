import { Game } from './game/Game';
// import { socket, sendMessage, closeConnection } from './game_online/Connection';

// // Initialize the game when the DOM is loaded
// document.addEventListener('DOMContentLoaded', () => {
//   console.log('Initializing game...');
  
//   // Пример использования WebSocket
//   socket.onopen = () => {
//     console.log('WebSocket connection established from index.ts');
//     sendMessage('move', { direction: 'up' });
//   };

//   socket.onmessage = (event) => {
//     const message = JSON.parse(event.data);
//     console.log('Message received in index.ts:', message);
//   };

//   // Закрытие соединения при выгрузке страницы
//   window.addEventListener('beforeunload', closeConnection);

//   const game = new Game();
//   game.start();
// });