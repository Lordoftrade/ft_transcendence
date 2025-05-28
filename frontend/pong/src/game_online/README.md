

---

# 🎮 Game WebSocket Protocol

This frontend communicates with the game server using a WebSocket-based protocol. Below are the message types exchanged during a game session.

---

## 🔗 1. Connection Established

Sent by the server when a player successfully connects and joins a room.

```ts
{
  type: 'connection',
  status: 'connected',
  playerId: userId,
  playerNumber: room.size,
  roomId: matchId,
  playersConnected: room.size,
  playersNeeded: 2
}
```

---

## 👥 2. Opponent Connected

Notifies that another player has joined the room.

```ts
{
  type: 'playerConnected',
  playersConnected: room.size,
  playersNeeded: 2
}
```

---

## 🤝 3. Handshake (Ping)

Used for connectivity checks.

```ts
{ type: 'ping' }
```

---

## ❌ 4. Invalid Message Format

Sent by the server if a malformed message is received.

```ts
{
  type: 'error',
  message: 'Invalid message format'
}
```

---

## 🔌 5. Player Disconnected

Indicates that the opponent has disconnected.

```ts
{
  type: 'playerDisconnected',
  message: 'Your opponent has disconnected. Waiting for reconnection...'
}
```

---

## ✅ 6. Ready Status Update

Notifies all players about current ready status.

```ts
{
  type: 'readyStatus',
  playersReady: Array.from(this.playersReady),
  allReady: this.playersReady.size === 2
}
```

---

## 🟢 7. Game Started

Sent when the game begins.

```ts
{
  type: 'gameStart',
  timeStamp: Date.now()
}
```

---

## 🔴 8. Game Ended

Sent when the game session ends.

```ts
{
  type: 'gameStop',
  reason: 'playerDisconnected', // remove in production if not needed
  timeStamp: Date.now()
}
```

---

## 📊 9. Game State Update

Describes the current state of the game, including ball and paddle positions, score, and winner status.

```ts
{
  type: "gameState",
  ballPos: Position,
  player1PaddlePos: Position,
  player2PaddlePos: Position,
  score: GameScore,
  gameState: string,
  isWaitingForBallSpawn: boolean,
  lastScoreTime: number,
  hasWinner: boolean,
  winnerId: number | null
}
```

---

