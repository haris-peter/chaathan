# Chaathan: Kerala Horror Multiplayer Game 🎭

A multiplayer asymmetric horror game inspired by Kerala folklore, where Poojaris (Hindu priests) must complete a ritual while the Chaathan (malevolent spirit) tries to stop them.

## 🎮 Game Overview

### Premise
Three Poojaris have entered a haunted mansion to perform a ritual that will banish the Chaathan forever. They must light lamps, collect the sacred ritual item, and gather in the Pooja Room to complete the ritual. Meanwhile, the Chaathan lurks in the shadows, using supernatural abilities to sabotage their efforts.

### Win Conditions
- **Poojaris Win**: Complete the ritual in the Pooja Room before time runs out
- **Chaathan Wins**: Prevent the ritual from completing within 5 minutes

---

## 🏗️ Architecture

```
chaathan/
├── client/                    # Phaser 3 Game Client
│   ├── public/
│   │   └── assets/
│   │       └── sprites/       # Character sprites
│   │           ├── chaathan_sprite.png   # 4-frame walk animation
│   │           ├── chaathan_1.png        # Walking spritesheet
│   │           └── chaathan_2.png        # Idle sprite
│   ├── src/
│   │   ├── main.js           # Entry point
│   │   ├── config.js         # Phaser config & game constants
│   │   ├── network/
│   │   │   └── SocketManager.js   # Socket.IO client wrapper
│   │   └── scenes/
│   │       ├── BootScene.js      # Asset loading & animations
│   │       ├── TitleScene.js     # Game Title & Start
│   │       ├── LobbyScene.js     # Multiplayer lobby & Room Management
│   │       ├── InstructionScene.js # Role instructions & Ready check
│   │       ├── GameScene.js      # Main gameplay
│   │       └── EndScene.js       # Win/lose screen
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
└── server/                    # Node.js Game Server
    ├── index.js              # Express + Socket.IO server
    ├── gameState.js          # Game room state management
    ├── constants.js          # Shared game constants
    └── package.json
```

---

## 🎯 Game Mechanics

### Map Layout
- **9 interconnected rooms** in a 3x3 grid (2400x1800 pixels)
- Rooms: Entrance Hall, Main Hall, East Wing, West Chamber, Central Room, Ancestors Hall, Storage, Kitchen, Pooja Room
- Doors connect rooms horizontally and vertically

### Roles

#### Poojari (3 Players)
- **Objective**: Complete the ritual
- **Actions**:
  - Move with WASD/Arrow keys
  - Light lamps (E key near unlit lamp)
  - Pick up ritual item (E key)
  - Drop ritual item (Q key)
- **Requirements to win**:
  1. Light all 3 lamps
  2. Collect the ritual item
  3. All 3 Poojaris gather in the ritual circle in Pooja Room
  4. Hold position for 10 seconds

#### Chaathan (1 Player)
- **Objective**: Prevent the ritual
- **Abilities** (click target, then press key):
  - `[1] Flicker` - Make a lit lamp flicker (5s cooldown)
  - `[2] Extinguish` - Put out a lit lamp (15s cooldown)
  - `[3] Seal Door` - Block a door for 8 seconds (20s cooldown)
  - `[4] Push` - Push a Poojari out of the ritual circle (10s cooldown)
- **Visibility**: Invisible to Poojaris (only sees other Chaathan players)

### Interactive Objects

| Object | States | Interaction |
|--------|--------|-------------|
| Lamps | Unlit → Lit → Flickering | Poojaris light, Chaathan extinguishes |
| Doors | Open ↔ Sealed | Chaathan can temporarily seal |
| Ritual Item | On ground / Carried | Poojaris pick up and carry |
| Ritual Circle | Inactive → Charging → Complete | Activates when conditions met |

---

## 🔧 Technical Stack

### Client
- **Phaser 3** - 2D game framework
- **Vite** - Build tool & dev server
- **Socket.IO Client** - Real-time communication

### Server
- **Node.js** - Runtime
- **Express** - HTTP server
- **Socket.IO** - WebSocket server for real-time multiplayer

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- npm

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd chaathan

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### Running the Game

**Terminal 1 - Server:**
```bash
cd server
npm start
# Server runs on http://localhost:3000
```

**Terminal 2 - Client:**
```bash
cd client
npm run dev
# Client runs on http://localhost:5173
```

### Playing
1. Open http://localhost:5173 in 4 browser tabs
2. **Lobby Phase**:
   - create a Room (optional: set custom duration) OR
   - Enter a Room ID to join a specific room OR
   - Click "Quick Join" to find an open room
3. **Instruction Phase**:
   - Once 4 players join, everyone sees their Role (Poojari/Chaathan)
   - Read your objective carefully
   - Click "I AM READY" when prepared
4. **Game Phase**:
   - Game starts automatically when ALL players are ready
   - One player becomes Chaathan, others are Poojaris

---

## 🚀 Deployment

### GitHub Actions

The server can be automatically deployed using GitHub Actions. The workflow is configured to:

1. **Trigger on**:
   - Push to `main` or `master` branch
   - Manual workflow dispatch

2. **Deployment Steps**:
   - Checkout code
   - Set up Node.js 18
   - Install server dependencies
   - Start the server on port 3000
   - Run for 5 minutes (for testing/demonstration)

To manually trigger the deployment:
1. Go to the **Actions** tab in your GitHub repository
2. Select **Deploy Server** workflow
3. Click **Run workflow**

The workflow file is located at `.github/workflows/deploy-server.yml`.

**Note**: For production deployments, consider using a cloud platform like:
- Heroku
- Railway
- Render
- DigitalOcean
- AWS/GCP/Azure

These platforms provide persistent hosting with proper SSL certificates and domain management.

---

## 📡 Network Events

### Client → Server
| Event | Data | Description |
|-------|------|-------------|
| `create-room` | `{ playerName, duration }` | Create new private room |
| `join-specific-room` | `{ playerName, roomId }` | Join specific room ID |
| `join-game` | `{ playerName }` | Quick join lobby |
| `player-ready` | - | Player confirms readiness |
| `start-game` | - | Host starts game |
| `player-move` | `{ x, y }` | Position update |
| `light-lamp` | `{ lampId }` | Poojari lights lamp |
| `pickup-item` | - | Poojari picks up ritual item |
| `drop-item` | - | Poojari drops ritual item |
| `chaathan-flicker` | `{ lampId }` | Chaathan flickers lamp |
| `chaathan-extinguish` | `{ lampId }` | Chaathan extinguishes lamp |
| `chaathan-seal` | `{ doorId }` | Chaathan seals door |
| `chaathan-push` | `{ playerId }` | Chaathan pushes player |

### Server → Client
| Event | Data | Description |
|-------|------|-------------|
| `show-instructions` | `{ role, name }` | Transition to instructions |
| `player-ready-update` | `{ playerId, readyCount }` | Sync ready status |
| `game-start` | `{ players, lamps, doors, ... }` | Game initialization |
| `player-moved` | `{ playerId, x, y }` | Player position sync |
| `lamp-update` | `{ id, state }` | Lamp state change |
| `door-update` | `{ id, state }` | Door state change |
| `item-pickup` | `{ playerId }` | Item picked up |
| `item-drop` | `{ item, playerId }` | Item dropped |
| `ritual-progress` | `{ progress, total }` | Ritual completion status |
| `timer-update` | `time` | Game timer sync |
| `game-over` | `{ winner }` | Game end |

---

## 🎨 Assets

### Chaathan Sprite
- `chaathan_sprite.png` - 4-frame walking animation (640x200, 160x200 per frame)
- Animation: `chaathan-walk` at 8fps
- Scale: 0.25x

### Poojari Sprite
- `poojari_walk.png` + `poojari_walk.json` - 4-frame walking animation
- Animation: `poojari-walk` at 8fps
- Scale: 0.12x

### Procedural Assets (Generated in BootScene)
- Player sprite (replaced with custom sprite for Poojaris)
- Lamps (unlit, lit, flickering states)
- Doors (open, sealed states)
- Ritual item, ritual circle, shadow silhouettes
- Floor and wall tiles

---

## 📋 Game Constants

```javascript
// Timing
GAME_DURATION: 300000      // 5 minutes
RITUAL_DURATION: 10000     // 10 seconds to complete ritual

// Cooldowns (Chaathan abilities)
FLICKER_LAMP: 5000         // 5 seconds
EXTINGUISH_LAMP: 15000     // 15 seconds
SEAL_DOOR: 20000           // 20 seconds
PUSH_PLAYER: 10000         // 10 seconds

// Map
MAP_WIDTH: 2400
MAP_HEIGHT: 1800
PLAYER_SPEED: 200
```

---

## 🛠️ Development Status

### ✅ Completed
- [x] Client-server architecture with Socket.IO
- [x] Multiplayer lobby system
- [x] Role assignment (Chaathan vs Poojaris)
- [x] 9-room explorable map with walls
- [x] Player movement and collision
- [x] Lamp system (light/flicker/extinguish)
- [x] Door system (open/seal)
- [x] Ritual item pickup/drop
- [x] Ritual circle progress tracking
- [x] Chaathan abilities with cooldowns
- [x] Chaathan custom sprite with walk animation
- [x] Minimap
- [x] Game timer
- [x] Win/lose conditions
- [x] UI for both roles
- [x] Hollow Knight-style room transitions (camera pans when moving between rooms)
- [x] Custom Chaathan Sprite Animation (TexturePacker Atlas)
- [x] Role-Based Minimap (Poojaris are blind)
- [x] **Room System** (Create, Join, Private Codes)
- [x] **Instruction Phase** (Role Reveal & Ready Check)
- [x] **Server Registry** (Live room monitoring)

### 🔲 Planned
- [ ] Sound effects and music
- [ ] Darkness/fog of war system
- [ ] More visual polish and animations
- [ ] Mobile touch controls
- [ ] Multiple game rooms support
- [ ] Spectator mode

---

## 📄 License

MIT License - Feel free to use and modify!

---

*Inspired by Kerala folklore and asymmetric horror games like Dead by Daylight and Phasmophobia.*
