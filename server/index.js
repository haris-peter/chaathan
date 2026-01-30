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
    }
});

const gameManager = new GameManager();

io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);

    socket.on('join-game', (playerName) => {
        const { room, player } = gameManager.joinRoom(socket.id, playerName);

        if (!player) {
            socket.emit('error', { message: 'Could not join game' });
            return;
        }

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

        if (room.players.size === MAX_PLAYERS) {
            if (room.startGame(io)) {
                const state = room.getState();
                room.players.forEach((p, id) => {
                    io.to(id).emit('game-start', {
                        ...state,
                        yourRole: p.role,
                        players: state.players.map(pl => ({
                            ...pl,
                            role: pl.id === id ? pl.role : (p.role === 'chaathan' ? pl.role : undefined)
                        }))
                    });
                });
            }
        }
    });

    socket.on('player-move', ({ x, y }) => {
        const room = gameManager.getPlayerRoom(socket.id);
        if (!room || room.gameState !== GAME_STATES.PLAYING) return;

        const player = room.updatePlayerPosition(socket.id, x, y);
        if (player) {
            socket.to(room.roomId).emit('player-moved', {
                playerId: socket.id,
                x,
                y,
                isCarryingItem: player.isCarryingItem
            });

            if (player.role !== 'chaathan') {
                room.checkRitualCircle(io);
            }
        }
    });

    socket.on('light-lamp', (lampId) => {
        const room = gameManager.getPlayerRoom(socket.id);
        if (!room || room.gameState !== GAME_STATES.PLAYING) return;

        const result = room.lightLamp(lampId, socket.id);
        if (result) {
            io.to(room.roomId).emit('lamp-update', result);
            room.checkRitualCircle(io);
        }
    });

    socket.on('chaathan-flicker', (lampId) => {
        const room = gameManager.getPlayerRoom(socket.id);
        if (!room || room.gameState !== GAME_STATES.PLAYING) return;

        const player = room.players.get(socket.id);
        if (player?.role !== 'chaathan') return;

        const result = room.flickerLamp(lampId, io);
        if (result) {
            io.to(room.roomId).emit('lamp-update', result.lamp);
            socket.emit('cooldown-update', { ability: 'flicker', cooldownEnd: result.cooldownEnd });
        }
    });

    socket.on('chaathan-extinguish', (lampId) => {
        const room = gameManager.getPlayerRoom(socket.id);
        if (!room || room.gameState !== GAME_STATES.PLAYING) return;

        const player = room.players.get(socket.id);
        if (player?.role !== 'chaathan') return;

        const result = room.extinguishLamp(lampId, io);
        if (result) {
            io.to(room.roomId).emit('lamp-update', result.lamp);
            socket.emit('cooldown-update', { ability: 'extinguish', cooldownEnd: result.cooldownEnd });
        }
    });

    socket.on('chaathan-seal-door', (doorId) => {
        const room = gameManager.getPlayerRoom(socket.id);
        if (!room || room.gameState !== GAME_STATES.PLAYING) return;

        const player = room.players.get(socket.id);
        if (player?.role !== 'chaathan') return;

        const result = room.sealDoor(doorId, io);
        if (result) {
            io.to(room.roomId).emit('door-update', result.door);
            socket.emit('cooldown-update', { ability: 'seal', cooldownEnd: result.cooldownEnd });
        }
    });

    socket.on('chaathan-push', (targetId) => {
        const room = gameManager.getPlayerRoom(socket.id);
        if (!room || room.gameState !== GAME_STATES.PLAYING) return;

        const player = room.players.get(socket.id);
        if (player?.role !== 'chaathan') return;

        const result = room.pushPlayer(targetId, io);
        if (result) {
            io.to(room.roomId).emit('player-pushed', {
                playerId: targetId,
                x: result.target.x,
                y: result.target.y
            });
            socket.emit('cooldown-update', { ability: 'push', cooldownEnd: result.cooldownEnd });
        }
    });

    socket.on('pickup-item', () => {
        const room = gameManager.getPlayerRoom(socket.id);
        if (!room || room.gameState !== GAME_STATES.PLAYING) return;

        const result = room.pickupItem(socket.id);
        if (result) {
            io.to(room.roomId).emit('item-pickup', {
                playerId: socket.id,
                item: result.item
            });
        }
    });

    socket.on('drop-item', () => {
        const room = gameManager.getPlayerRoom(socket.id);
        if (!room || room.gameState !== GAME_STATES.PLAYING) return;

        const result = room.dropItem(socket.id);
        if (result) {
            io.to(room.roomId).emit('item-drop', {
                playerId: socket.id,
                item: result.item
            });
            room.checkRitualCircle(io);
        }
    });

    socket.on('disconnect', () => {
        console.log(`Player disconnected: ${socket.id}`);
        const room = gameManager.getPlayerRoom(socket.id);

        if (room) {
            socket.to(room.roomId).emit('player-left', { playerId: socket.id });

            if (room.gameState === GAME_STATES.PLAYING) {
                const player = room.players.get(socket.id);
                if (player?.role === 'chaathan') {
                    room.endGame(io, GAME_STATES.POOJARI_WIN);
                }
            }
        }

        gameManager.leaveRoom(socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Chaathan server running on port ${PORT}`);
});
