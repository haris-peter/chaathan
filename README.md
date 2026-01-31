# Chaathan: Kerala Horror Multiplayer Game 🎭

A co-op survival horror game inspired by Kerala folklore. Four Poojaris must work together to banish the Twin Chaathans before the darkness consumes them.

## 🎮 Game Overview (V2 - Twin Terror Survival)

### Premise
Four Poojaris have entered a haunted tharavad to perform a ritual that will banish the Twin Chaathans forever. They must light the sacred lamps, manage their Light Aura, and complete the ritual in the Pooja Room while avoiding the AI-controlled Chaathans that hunt them relentlessly.

### Win Conditions
- **Poojaris Win**: Light all 4 mini lamps, activate the Grand Lamp, then all surviving players gather in the ritual circle for 10 seconds
- **Chaathans Win**: Eliminate all Poojaris (they run out of talismans)

---

## 🆕 V2 Changes

| Feature | V1 | V2 |
|---------|----|----|
| Game Mode | Asymmetric PvP (1v3) | Co-op Survival (4 vs AI) |
| Chaathan | Human player | 2 AI-controlled enemies |
| Lamps | 3 lamps | 4 mini + 1 grand lamp |
| Lives | None | 3 Talismans per player |
| Resource | None | Light Aura (decays over time) |
| Death | N/A | Respawn until 0 talismans |

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
│   │       ├── GameScene.js      # Main gameplay
│   │       └── EndScene.js       # Win/lose screen
│   └── package.json
│
└── server/                    # Node.js Game Server
    ├── index.js              # Express + Socket.IO server
    ├── gameState.js          # Game state + AI Chaathan logic
    ├── constants.js          # Game constants
    └── package.json
```

---

## 🎯 Game Mechanics

### Map Layout
- **25 interconnected rooms** in a 5x5 grid (4000x3000 pixels)
- Rooms include: Entrance Hall, Main Hall, East Wing, Grand Gallery, Tower East, West Chamber, Central Room, Ancestors Hall, Library, Study, Storage, Kitchen, Pooja Room, Garden, Chapel, Cellar, Wine Room, Shrine, Courtyard, Stable, Dungeon, Crypt, Secret Room, Treasury, Tower West

### Poojari Mechanics (All 4 Players)

| Mechanic | Description |
|----------|-------------|
| **Movement** | WASD/Arrow keys |
| **Interact** | E key (light lamps, refuel aura) |
| **Light Aura** | Decays at 2%/sec. Refuel at lit lamps. 0% = lose 1 talisman |
| **Talismans** | 3 lives. Caught by Chaathan = lose 1. 0 talismans = permadeath |
| **Respawn** | After losing a talisman, respawn with full aura |

### AI Chaathan Behavior

| State | Behavior |
|-------|----------|
| **Patrol** | Wander randomly around the map |
| **Hunt** | Chase players within 200px detection range |
| **Attack** | Touch a player = they lose 1 talisman |

### Objective

1. **Light 4 mini lamps** scattered across the map
2. **Grand Lamp activates** automatically when all 4 are lit
3. **Gather in the ritual circle** (Pooja Room center)
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
4. Survive the Twin Chaathans!

---

## 🌐 Deployment

| Component | Service | URL |
|-----------|---------|-----|
| Client | Vercel | *your-vercel-url* |
| Server | Render | https://chaathan-server.onrender.com |

**Note:** Render free tier sleeps after 15min inactivity. First load may take ~30s.

---

## 📡 Network Events

### Client → Server
| Event | Description |
|-------|-------------|
| `join-game` | Quick join lobby |
| `create-room` | Create private room |
| `join-specific-room` | Join by room code |
| `player-ready` | Confirm readiness |
| `player-move` | Position update |
| `light-lamp` | Light a mini lamp |
| `refuel-aura` | Refuel at lit lamp |

### Server → Client
| Event | Description |
|-------|-------------|
| `joined-room` | Room join confirmation |
| `show-instructions` | Transition to instructions |
| `game-start` | Game initialization data |
| `chaathan-update` | AI positions & states |
| `aura-update` | Player aura level |
| `talisman-update` | Player lives remaining |
| `player-respawn` | Respawn position |
| `player-died` | Permadeath notification |
| `grand-lamp-activated` | Ritual circle unlocked |
| `ritual-progress` | Ritual completion % |
| `game-over` | Win/lose result |

---

## 📋 Game Constants

```javascript
// Players
PLAYERS_REQUIRED: 4
TALISMAN_COUNT: 3       // Lives per player
AURA_MAX: 100           // Max light aura
AURA_DECAY_RATE: 2      // 2% per second

// AI
AI_CHAATHAN_COUNT: 2
AI_DETECTION_RANGE: 200
AI_PATROL_SPEED: 80
AI_HUNT_SPEED: 150

// Lamps
LAMP_COUNT: 5           // 4 mini + 1 grand

// Ritual
RITUAL_DURATION: 10000  // 10 seconds
```

---

## 🎨 Assets

### Sprites
- **Poojari**: `poojari_walk.png/json` - 4-frame walk animation
- **Chaathan**: `chathan_walk.png/json` - 4-frame walk animation

### Procedural (Generated in BootScene)
- Lamps (unlit/lit states)
- Floor tiles, walls
- Ritual circle, minimap

---

## 🛠️ Development Status

### ✅ Completed
- [x] Co-op 4-player gameplay
- [x] 2 AI-controlled Chaathans (patrol/hunt)
- [x] Light Aura system with decay
- [x] Talisman (lives) system
- [x] Respawn mechanics
- [x] Spectator mode on permadeath
- [x] 4 mini lamps + Grand Lamp objective
- [x] Room-based camera transitions
- [x] Multiplayer lobby with room codes
- [x] Vercel + Render deployment

### 🔲 Planned
- [ ] Sound effects and music
- [ ] Darkness/fog of war
- [ ] More visual polish
- [ ] Mobile controls
- [ ] Difficulty levels

---

## 📄 License

MIT License

---

*Inspired by Kerala folklore and survival horror games like Phasmophobia.*
