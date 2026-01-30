# Chaathan - Multiplayer Horror Game

A browser-based 4-player co-op horror game where 3 Poojaris attempt to complete a ritual while 1 invisible Chaathan tries to stop them.

## Quick Start

### 1. Start the Server
```bash
cd server
npm install
npm start
```

### 2. Start the Client (in another terminal)
```bash
cd client
npm install
npm run dev
```

### 3. Open 4 browser tabs to http://localhost:5173

## How to Play

### Poojaris (3 players)
- **WASD/Arrows**: Move
- **E**: Interact (light lamps, pick up item)
- **Q**: Drop item
- **Goal**: Light all 3 lamps, collect the ritual item, gather in the ritual circle for 10 seconds

### Chaathan (1 player)
- **WASD/Arrows**: Move (invisible to others)
- **Click**: Select target (lamp/door/player)
- **1**: Flicker lamp (5s cooldown)
- **2**: Extinguish lamp (15s cooldown)
- **3**: Seal door (20s cooldown)
- **4**: Push player from circle (10s cooldown)
- **Goal**: Prevent ritual completion until 5-minute timer expires

## Win Conditions
- **Poojaris Win**: Complete ritual (all lamps lit + item in circle + all 3 Poojaris in circle for 10 seconds)
- **Chaathan Wins**: Timer expires before ritual is complete
