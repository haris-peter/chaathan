import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { GameManager } from './gameState.js';
import { MAX_PLAYERS, GAME_STATES } from './constants.js';

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    },
    pingTimeout: 30000,
    pingInterval: 10000
});

const gameManager = new GameManager();

// Server configuration constants
const DEFAULT_SERVER_DURATION_MS = 3 * 60 * 60 * 1000; // 3 hours in milliseconds

io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);

    socket.on('join-game', (playerName) => {
        console.log(`[${socket.id}] Quick join requested: ${playerName}`);
        const { room, player } = gameManager.joinRoom(socket.id, playerName);

        if (!player) {
            socket.emit('error', { message: 'Could not join game' });
            return;
        }

        joinRoomSuccess(socket, room, player);
    });

    socket.on('create-room', ({ playerName, duration }) => {
        console.log(`[${socket.id}] Create room requested: ${playerName} duration ${duration}`);
        const { room, player, error } = gameManager.createNewRoom(socket.id, playerName, duration);

        if (error) {
            console.error(`[${socket.id}] Create room failed: ${error}`);
            socket.emit('error', { message: error });
            return;
        }

        console.log(`[${socket.id}] Room created: ${room.roomId}`);
        joinRoomSuccess(socket, room, player);
    });

    socket.on('join-specific-room', ({ playerName, roomId }) => {
        console.log(`[${socket.id}] Join specific room requested: ${roomId} as ${playerName}`);
        const { room, player, error } = gameManager.joinSpecificRoom(socket.id, playerName, roomId);

        if (error) {
            console.error(`[${socket.id}] Join specific room failed: ${error}`);
            socket.emit('error', { message: error });
            return;
        }

        console.log(`[${socket.id}] Joined room: ${room.roomId}`);
        joinRoomSuccess(socket, room, player);
    });

    function joinRoomSuccess(socket, room, player) {
        socket.join(room.roomId);
        socket.emit('joined-room', {
            roomId: room.roomId,
            player,
            state: room.getState()
        });

        socket.to(room.roomId).emit('player-joined', {
            player,
            playerCount: room.players.size
        });

        checkGameStart(room);
    }

    function checkGameStart(room) {
        if (room.players.size === MAX_PLAYERS) {
            room.startInstructions(io);
        }
    }

    socket.on('player-ready', () => {
        const room = gameManager.getPlayerRoom(socket.id);
        if (!room || room.gameState !== GAME_STATES.INSTRUCTIONS) return;

        if (room.setPlayerReady(socket.id)) {
            io.to(room.roomId).emit('player-ready-update', {
                playerId: socket.id,
                readyCount: Array.from(room.players.values()).filter(p => p.ready).length
            });

            if (room.allPlayersReady()) {
                if (room.startGame(io)) {
                    const state = room.getState();
                    room.players.forEach((p, id) => {
                        io.to(id).emit('game-start', {
                            ...state,
                            yourId: id,
                            players: state.players
                        });
                    });
                }
            }
        }
    });

    socket.on('player-move', ({ x, y }) => {
        const room = gameManager.getPlayerRoom(socket.id);
        if (!room || room.gameState !== GAME_STATES.PLAYING) return;

        const player = room.updatePlayerPosition(socket.id, x, y);
        if (player && player.isAlive) {
            socket.to(room.roomId).emit('player-moved', {
                playerId: socket.id,
                x,
                y
            });
        }
    });

    socket.on('light-lamp', (lampId) => {
        const room = gameManager.getPlayerRoom(socket.id);
        if (!room || room.gameState !== GAME_STATES.PLAYING) return;

        const result = room.lightLamp(lampId, socket.id, io);
        if (result) {
            io.to(room.roomId).emit('lamp-update', result);
        }
    });

    socket.on('refuel-aura', (lampId) => {
        const room = gameManager.getPlayerRoom(socket.id);
        if (!room || room.gameState !== GAME_STATES.PLAYING) return;

        const result = room.refuelAura(socket.id, lampId);
        if (result) {
            io.to(socket.id).emit('aura-update', result);
        }
    });

    socket.on('disconnect', () => {
        console.log(`Player disconnected: ${socket.id}`);
        const room = gameManager.getPlayerRoom(socket.id);

        if (room) {
            socket.to(room.roomId).emit('player-left', { playerId: socket.id });
        }

        gameManager.leaveRoom(socket.id);
    });
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

// Parse and validate SERVER_DURATION
let serverDuration = DEFAULT_SERVER_DURATION_MS;
if (process.env.SERVER_DURATION) {
    const parsed = parseInt(process.env.SERVER_DURATION, 10);
    if (!isNaN(parsed) && parsed > 0) {
        serverDuration = parsed;
    } else if (parsed === 0) {
        serverDuration = 0; // Disable auto-shutdown
    } else {
        console.warn(`Invalid SERVER_DURATION value: ${process.env.SERVER_DURATION}. Using default: ${DEFAULT_SERVER_DURATION_MS}ms`);
    }
}

server.listen(PORT, () => {
    const startTime = new Date();
    
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║              CHAATHAN V2 SERVER - RUNNING                      ║
╚════════════════════════════════════════════════════════════════╝

🌐 Server URLs:
   - Local:    http://localhost:${PORT}
   - Network:  http://${HOST}:${PORT}

📡 Socket.IO: Ready for connections
⏱️  Server Start Time: ${startTime.toISOString()}`);
    
    if (serverDuration > 0) {
        const endTime = new Date(startTime.getTime() + serverDuration);
        console.log(`⏰  Auto-Shutdown:     ${endTime.toISOString()}
⏳  Duration:          ${serverDuration / 1000 / 60 / 60} hours`);
    } else {
        console.log(`⏰  Auto-Shutdown:     Disabled`);
    }
    
    console.log(`
Waiting for players to connect...
`);

    // Auto-shutdown after specified duration (if enabled)
    if (serverDuration > 0) {
        setTimeout(() => {
            console.log(`
╔════════════════════════════════════════════════════════════════╗
║              SERVER AUTO-SHUTDOWN                              ║
╚════════════════════════════════════════════════════════════════╝

⏰  Shutdown Time: ${new Date().toISOString()}
📊  Session Duration: ${serverDuration / 1000 / 60 / 60} hours completed

Closing all connections...
`);
            
            // Notify all connected clients
            io.emit('server-shutdown', { 
                message: 'Server is shutting down after scheduled duration',
                duration: serverDuration
            });
            
            // Close server gracefully
            server.close(() => {
                console.log('Server closed successfully');
                process.exit(0);
            });
        }, serverDuration);
    }
});
