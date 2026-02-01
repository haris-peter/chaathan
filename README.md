# Chaathan: Kerala Horror Multiplayer Game 🎭

A co-op survival horror game inspired by Kerala folklore. Four Poojaris must work together to banish the Chaathans before the darkness consumes them.

## 🎮 Game Overview (V3 - Holy Salt Update)

### Premise
Four Poojaris have entered a haunted tharavad to perform a ritual that will banish the Chaathans forever. They must light the sacred lamps, manage their Light Aura, and complete the ritual in the Pooja Room while avoiding the AI-controlled Chaathans that hunt them relentlessly. Use **Holy Salt** to momentarily stun the spirits and survive!

### Win Conditions
- **Poojaris Win**: Light all 4 mini lamps (spawned in random rooms), activate the Grand Lamp, then all surviving players gather in the ritual circle for 10 seconds.
- **Chaathans Win**: Eliminate all Poojaris (they run out of talismans).

---

## 🆕 V3 Changes

| Feature | V1 | V2 | V3 (Current) |
|---------|----|----|--------------|
| **Game Mode** | Asymmetric PvP (1v3) | Co-op Survival (4 vs AI) | Co-op Survival with Items |
| **Chaathan** | Human player | 2 Generic AI | **Stalker (Red)** & **Specter (Blue)** (Variable Count) |
| **Mechanics** | Hide & Seek | Aura Management | **Holy Salt**, **Difficulty**, **Immunity** |
| **Lamps** | 3 lamps | 4 corners + 1 grand | **Randomized locations** + 1 grand (Larger Visuals) |
| **Spawning** | Random | Corners | **Ritual Circle**, **Smart Respawn System** |

---

## 🏗️ Architecture

```
chaathan/
├── client/                    # Phaser 3 Game Client
│   ├── public/assets/sprites/ # Character sprites
│   ├── src/
│   │   ├── main.js           # Entry point
│   │   ├── config.js         # Phaser config & game constants
│   │   ├── network/
│   │   │   └── SocketManager.js   # Socket.IO client
│   │   └── scenes/
│   │       ├── BootScene.js      # Asset loading & animations
│   │       ├── TitleScene.js     # Title screen
│   │       ├── LobbyScene.js     # Room management
│   │       ├── InstructionScene.js # Poojari instructions
│   │       ├── GameScene.js      # Main gameplay (V3 Logic)
│   │       └── EndScene.js       # Win/lose screen
│   └── package.json
│
└── server/                    # Node.js Game Server
    ├── index.js              # Express + Socket.IO server
    ├── gameState.js          # Game state + Advanced AI logic
    ├── constants.js          # Game constants (chaathan types, salt)
    └── package.json
```

---

## 🎯 Game Mechanics

### Map Layout
- **25 interconnected rooms** in a 5x5 grid (4000x3000 pixels)
- **Randomized Mini Lamps**: 4 lamps spawn in random rooms (excluding the central ritual room) every game.
- **Central Hub**: Players spawn at the Ritual Circle in the center.

### Poojari Mechanics (All 4 Players)

| Mechanic | Description |
|----------|-------------|
| **Movement** | WASD/Arrow keys (**Interpolated smoothing** + Sprite flipping) |
| **Interact** | **E key** (light lamps, refuel aura, pickup salt) |
| **Holy Salt** | **Q key** to use. Stuns nearby Chaathans for 3s. |
| **Light Aura** | Decays at 2%/sec. Refuel at lit lamps. 0% = lose 1 talisman |
| **Talismans** | 3 lives. Caught by Chaathan = lose 1 + **3s Immunity**. 0 = permadeath |
| **Respawn** | Teleports to specific safe point + Aura restores to 50% + "You Respawned!" msg |

### Selectable Difficulty
Host can toggle difficulty on the Main Menu:
- **Easy (Green)**: 2 Chaathans.
- **Medium (Yellow)**: 4 Chaathans.
- **Hard (Red)**: 6 Chaathans (Distinct spawn locations).

### AI Chaathan Behavior

| Type | Color | Behavior |
|------|-------|----------|
| **Stalker** | 🔴 Red | **Slower**, but has a larger detection range. Relentless pursuer. |
| **Specter** | 🔵 Blue | **Faster**, semi-transparent ghost. Harder to see, quick to catch. |

**Fear System**: When a Chaathan is nearby, a dark vignette closes in on your screen. Run!

### Objective

1. **Find & Light 4 Mini Lamps** (Locations randomized each game).
2. **Grand Lamp activates** automatically when all 4 are lit (Notification appears).
3. **Gather in the Ritual Circle** (Center Room).
4. **Hold for 10 seconds** → Victory!

---

## 🔧 Technical Stack

### Client
- **Phaser 3** - 2D game framework
- **Vite** - Build tool & dev server
- **Socket.IO Client** - Real-time communication

### Server
- **Node.js** - Runtime
- **Express** - HTTP server
- **Socket.IO** - WebSocket server

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- npm

### Installation

```bash
git clone https://github.com/haris-peter/chaathan.git
cd chaathan

# Server
cd server && npm install

# Client
cd ../client && npm install
```

### Running Locally

**Terminal 1 - Server:**
```bash
cd server
npm run dev
# Runs on http://localhost:3000
```

**Terminal 2 - Client:**
```bash
cd client
npm run dev
# Runs on http://localhost:5173
```

### Playing
1. Open http://localhost:5173 in 4 browser tabs
2. Create/Join a room
3. All players click "I AM READY"
4. Survive the Chaathans!

---

## 🌐 Deployment

| Component | Service | URL |
|-----------|---------|-----|
| Client | Vercel | *your-vercel-url* |
| Server | Render | https://chaathan-server.onrender.com |

**Note:** Render free tier sleeps after 15min inactivity. First load may take ~30s.

---

## 📡 Network Events (Updated)

| Event | Description |
|-------|-------------|
| `pickup-salt` | Player picks up holy salt item |
| `use-salt` | Player uses salt to stun nearby AI |
| `chaathan-stunned` | Server confirms stun effect on AI |
| `grand-lamp-activated` | All lamps lit notification |
| `game-over` | Win/lose result |

---

## 🎨 Assets

### Sprites
- **Poojari**: `poojari_walk.png/json` (Scaled 0.15x, Direction flip)
- **Chaathan**: `chathan_walk.png/json` (Scaled 0.15x, Tinted Red/Blue)

### Procedural
- **Holy Salt**: Generated sprite (white pile)
- Lamps, Walls, Floor, Ritual Circle

---

## 🛠️ Development Status

### ✅ Completed
- [x] Co-op 4-player gameplay
- [x] **Chaathan AI** (Stalker & Specter types)
- [x] **Holy Salt Stun Mechanic**
- [x] **Fear Vignette System**
- [x] Light Aura system with decay
- [x] Talisman (lives) system
- [x] **Randomized Lamp Spawning**
- [x] **Central Ritual Spawn**
- [x] Spectator mode
- [x] Room-based camera transitions
- [x] **Difficulty Selection (UI + Logic)**
- [x] **Smart Respawn System** (Teleport + Immunity)
- [x] **Network Smoothing** (Interpolation)

### 🔲 Planned
- [x] Sound effects (Footsteps)
- [ ] Mobile controls

---

## 📄 License

MIT License

---

*Inspired by Kerala folklore and survival horror games like Phasmophobia.*
