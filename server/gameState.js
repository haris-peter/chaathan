import { v4 as uuidv4 } from 'uuid';
import {
    GAME_DURATION,
    RITUAL_DURATION,
    MAX_PLAYERS,
    LAMP_COUNT,
    DOOR_COUNT,
    ROLES,
    LAMP_STATES,
    LAMP_TYPES,
    DOOR_STATES,
    GAME_STATES,
    CHAATHAN_STATES,
    TALISMAN_COUNT,
    AURA_MAX,
    AURA_DECAY_RATE,
    AURA_REFUEL_DISTANCE,
    AI_CHAATHAN_COUNT,
    AI_UPDATE_INTERVAL,
    AI_PATROL_SPEED,
    AI_CHASE_SPEED,
    AI_DETECTION_RANGE,
    AI_CATCH_DISTANCE,
    AI_LOSE_SIGHT_DISTANCE
} from './constants.js';

class AIChaathan {
    constructor(id, startX, startY, roomBounds) {
        this.id = id;
        this.x = startX;
        this.y = startY;
        this.state = CHAATHAN_STATES.PATROL;
        this.targetPlayerId = null;
        this.patrolTarget = { x: startX, y: startY };
        this.roomBounds = roomBounds;
        this.lastDirectionChange = 0;
        this.direction = { x: 0, y: 0 };
        this.pickNewPatrolTarget();
    }

    pickNewPatrolTarget() {
        const margin = 100;
        this.patrolTarget = {
            x: margin + Math.random() * (this.roomBounds.width - margin * 2),
            y: margin + Math.random() * (this.roomBounds.height - margin * 2)
        };
    }

    getDistanceToPlayer(player) {
        return Math.hypot(this.x - player.x, this.y - player.y);
    }

    findNearestVisiblePlayer(players) {
        let nearest = null;
        let nearestDist = Infinity;

        players.forEach((player) => {
            if (!player.isAlive) return;
            const dist = this.getDistanceToPlayer(player);
            if (dist < AI_DETECTION_RANGE && dist < nearestDist) {
                nearest = player;
                nearestDist = dist;
            }
        });

        return nearest;
    }

    update(players, deltaTime) {
        const alivePlayers = Array.from(players.values()).filter(p => p.isAlive);

        if (this.state === CHAATHAN_STATES.PATROL) {
            const nearestPlayer = this.findNearestVisiblePlayer(players);
            if (nearestPlayer) {
                this.state = CHAATHAN_STATES.HUNT;
                this.targetPlayerId = nearestPlayer.id;
                return;
            }

            const distToTarget = Math.hypot(this.x - this.patrolTarget.x, this.y - this.patrolTarget.y);
            if (distToTarget < 20) {
                this.pickNewPatrolTarget();
            }

            const speed = AI_PATROL_SPEED * (deltaTime / 1000);
            const angle = Math.atan2(this.patrolTarget.y - this.y, this.patrolTarget.x - this.x);
            this.x += Math.cos(angle) * speed;
            this.y += Math.sin(angle) * speed;

        } else if (this.state === CHAATHAN_STATES.HUNT) {
            const target = players.get(this.targetPlayerId);

            if (!target || !target.isAlive) {
                this.state = CHAATHAN_STATES.PATROL;
                this.targetPlayerId = null;
                this.pickNewPatrolTarget();
                return;
            }

            const distToTarget = this.getDistanceToPlayer(target);

            if (distToTarget > AI_LOSE_SIGHT_DISTANCE) {
                this.state = CHAATHAN_STATES.PATROL;
                this.targetPlayerId = null;
                this.pickNewPatrolTarget();
                return;
            }

            const speed = AI_CHASE_SPEED * (deltaTime / 1000);
            const angle = Math.atan2(target.y - this.y, target.x - this.x);
            this.x += Math.cos(angle) * speed;
            this.y += Math.sin(angle) * speed;
        }

        this.x = Math.max(50, Math.min(this.roomBounds.width - 50, this.x));
        this.y = Math.max(50, Math.min(this.roomBounds.height - 50, this.y));
    }

    checkCollision(players) {
        const caughtPlayers = [];
        players.forEach((player) => {
            if (!player.isAlive) return;
            const dist = this.getDistanceToPlayer(player);
            if (dist < AI_CATCH_DISTANCE) {
                caughtPlayers.push(player.id);
            }
        });
        return caughtPlayers;
    }

    getState() {
        return {
            id: this.id,
            x: this.x,
            y: this.y,
            state: this.state
        };
    }
}

export class GameRoom {
    constructor(roomId, duration) {
        this.roomId = roomId;
        this.players = new Map();
        this.gameState = GAME_STATES.WAITING;
        this.timeRemaining = duration || GAME_DURATION;
        this.initialDuration = duration || GAME_DURATION;
        this.timerInterval = null;
        this.gameLoopInterval = null;
        this.lastUpdateTime = Date.now();
        this.lamps = this.initLamps();
        this.doors = this.initDoors();
        this.ritualCircle = {
            x: 1200,
            y: 900,
            radius: 100,
            playersInside: new Set(),
            progress: 0,
            progressInterval: null,
            isActive: false
        };
        this.aiChaathans = [];
        this.roomBounds = { width: 2400, height: 1800 };
        this.spawnPoints = [
            { x: 200, y: 200 },
            { x: 200, y: 600 },
            { x: 600, y: 200 },
            { x: 600, y: 600 }
        ];
    }

    initLamps() {
        return [
            { id: 0, x: 400, y: 300, state: LAMP_STATES.UNLIT, type: LAMP_TYPES.MINI },
            { id: 1, x: 2000, y: 300, state: LAMP_STATES.UNLIT, type: LAMP_TYPES.MINI },
            { id: 2, x: 400, y: 1500, state: LAMP_STATES.UNLIT, type: LAMP_TYPES.MINI },
            { id: 3, x: 2000, y: 1500, state: LAMP_STATES.UNLIT, type: LAMP_TYPES.MINI },
            { id: 4, x: 1200, y: 900, state: LAMP_STATES.UNLIT, type: LAMP_TYPES.GRAND }
        ];
    }

    initDoors() {
        return [
            { id: 0, x: 800, y: 300, state: DOOR_STATES.OPEN },
            { id: 1, x: 800, y: 900, state: DOOR_STATES.OPEN },
            { id: 2, x: 800, y: 1500, state: DOOR_STATES.OPEN },
            { id: 3, x: 1600, y: 300, state: DOOR_STATES.OPEN },
            { id: 4, x: 1600, y: 900, state: DOOR_STATES.OPEN },
            { id: 5, x: 1600, y: 1500, state: DOOR_STATES.OPEN },
            { id: 6, x: 400, y: 600, state: DOOR_STATES.OPEN },
            { id: 7, x: 1200, y: 600, state: DOOR_STATES.OPEN },
            { id: 8, x: 2000, y: 600, state: DOOR_STATES.OPEN },
            { id: 9, x: 400, y: 1200, state: DOOR_STATES.OPEN },
            { id: 10, x: 1200, y: 1200, state: DOOR_STATES.OPEN },
            { id: 11, x: 2000, y: 1200, state: DOOR_STATES.OPEN }
        ];
    }

    initAIChaathans() {
        this.aiChaathans = [
            new AIChaathan(0, 2200, 300, this.roomBounds),
            new AIChaathan(1, 2200, 1500, this.roomBounds)
        ];
    }

    addPlayer(socketId, playerName) {
        if (this.players.size >= MAX_PLAYERS) return null;

        const spawnIndex = this.players.size;
        const spawn = this.spawnPoints[spawnIndex] || this.spawnPoints[0];

        const player = {
            id: socketId,
            name: playerName || `Poojari${this.players.size + 1}`,
            role: ROLES.POOJARI,
            ready: false,
            x: spawn.x,
            y: spawn.y,
            talismans: TALISMAN_COUNT,
            aura: AURA_MAX,
            isAlive: true
        };

        this.players.set(socketId, player);
        return player;
    }

    removePlayer(socketId) {
        this.ritualCircle.playersInside.delete(socketId);
        this.players.delete(socketId);
    }

    startInstructions(io) {
        this.gameState = GAME_STATES.INSTRUCTIONS;

        this.players.forEach((player, socketId) => {
            io.to(socketId).emit('show-instructions', {
                role: ROLES.POOJARI,
                name: player.name
            });
        });
    }

    setPlayerReady(socketId) {
        const player = this.players.get(socketId);
        if (player) {
            player.ready = true;
            return true;
        }
        return false;
    }

    allPlayersReady() {
        return Array.from(this.players.values()).every(p => p.ready);
    }

    startGame(io) {
        if (this.gameState !== GAME_STATES.INSTRUCTIONS) return false;

        this.gameState = GAME_STATES.PLAYING;
        this.timeRemaining = this.initialDuration;
        this.lastUpdateTime = Date.now();

        this.initAIChaathans();

        this.timerInterval = setInterval(() => {
            this.timeRemaining -= 1000;
            io.to(this.roomId).emit('timer-update', this.timeRemaining);

            if (this.timeRemaining <= 0) {
                this.endGame(io, GAME_STATES.CHAATHAN_WIN);
            }
        }, 1000);

        this.gameLoopInterval = setInterval(() => {
            this.gameLoop(io);
        }, AI_UPDATE_INTERVAL);

        return true;
    }

    gameLoop(io) {
        const now = Date.now();
        const deltaTime = now - this.lastUpdateTime;
        this.lastUpdateTime = now;

        this.players.forEach((player) => {
            if (!player.isAlive) return;

            player.aura -= AURA_DECAY_RATE * (deltaTime / 1000);

            if (player.aura <= 0) {
                player.aura = 0;
                this.playerLoseTalisman(player.id, io, 'aura_depleted');
            }
        });

        this.aiChaathans.forEach((chaathan) => {
            chaathan.update(this.players, deltaTime);

            const caughtPlayers = chaathan.checkCollision(this.players);
            caughtPlayers.forEach((playerId) => {
                this.playerLoseTalisman(playerId, io, 'caught');
            });
        });

        io.to(this.roomId).emit('chaathan-update', {
            chaathans: this.aiChaathans.map(c => c.getState())
        });

        this.players.forEach((player) => {
            io.to(player.id).emit('aura-update', {
                playerId: player.id,
                aura: player.aura
            });
        });

        this.checkRitualCircle(io);
        this.checkAllPlayersDead(io);
    }

    playerLoseTalisman(playerId, io, reason) {
        const player = this.players.get(playerId);
        if (!player || !player.isAlive) return;

        player.talismans -= 1;

        io.to(this.roomId).emit('talisman-update', {
            playerId: player.id,
            talismans: player.talismans,
            reason: reason
        });

        if (player.talismans <= 0) {
            player.isAlive = false;
            io.to(this.roomId).emit('player-died', {
                playerId: player.id,
                name: player.name
            });
        } else {
            this.respawnPlayer(player, io);
        }
    }

    respawnPlayer(player, io) {
        const spawnIndex = Math.floor(Math.random() * this.spawnPoints.length);
        const spawn = this.spawnPoints[spawnIndex];
        player.x = spawn.x;
        player.y = spawn.y;
        player.aura = AURA_MAX;

        io.to(this.roomId).emit('player-respawn', {
            playerId: player.id,
            x: player.x,
            y: player.y,
            aura: player.aura
        });
    }

    checkAllPlayersDead(io) {
        const alivePlayers = Array.from(this.players.values()).filter(p => p.isAlive);
        if (alivePlayers.length === 0) {
            this.endGame(io, GAME_STATES.CHAATHAN_WIN);
        }
    }

    endGame(io, result) {
        this.gameState = result;
        clearInterval(this.timerInterval);
        clearInterval(this.gameLoopInterval);
        clearInterval(this.ritualCircle.progressInterval);
        io.to(this.roomId).emit('game-over', { winner: result });
    }

    updatePlayerPosition(socketId, x, y) {
        const player = this.players.get(socketId);
        if (player && player.isAlive) {
            player.x = x;
            player.y = y;
        }
        return player;
    }

    lightLamp(lampId, socketId, io) {
        const player = this.players.get(socketId);
        if (!player || !player.isAlive) return null;

        const lamp = this.lamps.find(l => l.id === lampId);
        if (!lamp) return null;

        if (lamp.type === LAMP_TYPES.GRAND) {
            return null;
        }

        if (lamp.state === LAMP_STATES.UNLIT) {
            lamp.state = LAMP_STATES.LIT;
            this.checkGrandLampActivation(io);
            return lamp;
        }
        return null;
    }

    checkGrandLampActivation(io) {
        const miniLamps = this.lamps.filter(l => l.type === LAMP_TYPES.MINI);
        const allMiniLit = miniLamps.every(l => l.state === LAMP_STATES.LIT);

        if (allMiniLit) {
            const grandLamp = this.lamps.find(l => l.type === LAMP_TYPES.GRAND);
            if (grandLamp && grandLamp.state === LAMP_STATES.UNLIT) {
                grandLamp.state = LAMP_STATES.LIT;
                this.ritualCircle.isActive = true;
                io.to(this.roomId).emit('grand-lamp-activated', { lampId: grandLamp.id });
                io.to(this.roomId).emit('lamp-update', grandLamp);
            }
        }
    }

    refuelAura(socketId, lampId) {
        const player = this.players.get(socketId);
        if (!player || !player.isAlive) return null;

        const lamp = this.lamps.find(l => l.id === lampId);
        if (!lamp || lamp.state !== LAMP_STATES.LIT) return null;

        const dist = Math.hypot(player.x - lamp.x, player.y - lamp.y);
        if (dist <= AURA_REFUEL_DISTANCE) {
            player.aura = AURA_MAX;
            return { playerId: player.id, aura: player.aura };
        }
        return null;
    }

    checkRitualCircle(io) {
        if (!this.ritualCircle.isActive) {
            if (this.ritualCircle.progressInterval) {
                this.resetRitualProgress(io);
            }
            return;
        }

        this.ritualCircle.playersInside.clear();

        const circleX = this.ritualCircle.x;
        const circleY = this.ritualCircle.y;
        const radius = this.ritualCircle.radius;

        const alivePlayers = Array.from(this.players.values()).filter(p => p.isAlive);

        alivePlayers.forEach((player) => {
            const dist = Math.hypot(player.x - circleX, player.y - circleY);
            if (dist <= radius) {
                this.ritualCircle.playersInside.add(player.id);
            }
        });

        const allAliveInCircle = alivePlayers.length > 0 &&
            this.ritualCircle.playersInside.size === alivePlayers.length;

        if (allAliveInCircle) {
            if (!this.ritualCircle.progressInterval) {
                this.startRitualProgress(io);
            }
        } else {
            this.resetRitualProgress(io);
        }
    }

    startRitualProgress(io) {
        this.ritualCircle.progressInterval = setInterval(() => {
            this.ritualCircle.progress += 1000;
            io.to(this.roomId).emit('ritual-progress', {
                progress: this.ritualCircle.progress,
                total: RITUAL_DURATION
            });

            if (this.ritualCircle.progress >= RITUAL_DURATION) {
                this.endGame(io, GAME_STATES.POOJARI_WIN);
            }
        }, 1000);
    }

    resetRitualProgress(io) {
        if (this.ritualCircle.progressInterval) {
            clearInterval(this.ritualCircle.progressInterval);
            this.ritualCircle.progressInterval = null;
        }
        if (this.ritualCircle.progress > 0) {
            this.ritualCircle.progress = 0;
            io.to(this.roomId).emit('ritual-progress', { progress: 0, total: RITUAL_DURATION });
            io.to(this.roomId).emit('ritual-disrupted');
        }
    }

    getState() {
        return {
            gameState: this.gameState,
            timeRemaining: this.timeRemaining,
            players: Array.from(this.players.values()),
            lamps: this.lamps,
            doors: this.doors,
            aiChaathans: this.aiChaathans.map(c => c.getState()),
            ritualCircle: {
                x: this.ritualCircle.x,
                y: this.ritualCircle.y,
                radius: this.ritualCircle.radius,
                progress: this.ritualCircle.progress,
                isActive: this.ritualCircle.isActive,
                playersInside: Array.from(this.ritualCircle.playersInside)
            }
        };
    }
}

export class GameManager {
    constructor() {
        this.rooms = new Map();
        this.playerRoomMap = new Map();
    }

    createRoom(duration) {
        const roomId = uuidv4().substring(0, 8);
        const room = new GameRoom(roomId, duration);
        this.rooms.set(roomId, room);
        return room;
    }

    getRoom(roomId) {
        return this.rooms.get(roomId);
    }

    findAvailableRoom() {
        for (const [roomId, room] of this.rooms) {
            if (room.players.size < MAX_PLAYERS && room.gameState === GAME_STATES.WAITING) {
                return room;
            }
        }
        return this.createRoom();
    }

    joinRoom(socketId, playerName) {
        const room = this.findAvailableRoom();
        const player = room.addPlayer(socketId, playerName);
        if (player) {
            this.playerRoomMap.set(socketId, room.roomId);
            this.logRegistry();
        }
        return { room, player };
    }

    joinSpecificRoom(socketId, playerName, roomId) {
        const room = this.rooms.get(roomId);
        if (!room) return { error: 'Room not found' };

        if (room.gameState !== GAME_STATES.WAITING) {
            return { error: 'Game already in progress' };
        }

        if (room.players.size >= MAX_PLAYERS) {
            return { error: 'Room is full' };
        }

        const player = room.addPlayer(socketId, playerName);
        if (player) {
            this.playerRoomMap.set(socketId, room.roomId);
            this.logRegistry();
            return { room, player };
        }
        return { error: 'Could not join room' };
    }

    createNewRoom(socketId, playerName, duration) {
        const room = this.createRoom(duration);
        const player = room.addPlayer(socketId, playerName);
        if (player) {
            this.playerRoomMap.set(socketId, room.roomId);
            this.logRegistry();
            return { room, player };
        }
        return { error: 'Could not create room' };
    }

    leaveRoom(socketId) {
        const roomId = this.playerRoomMap.get(socketId);
        if (roomId) {
            const room = this.rooms.get(roomId);
            if (room) {
                room.removePlayer(socketId);
                if (room.players.size === 0) {
                    clearInterval(room.timerInterval);
                    clearInterval(room.gameLoopInterval);
                    clearInterval(room.ritualCircle.progressInterval);
                    this.rooms.delete(roomId);
                }
            }
            this.playerRoomMap.delete(socketId);
            this.logRegistry();
        }
    }

    getPlayerRoom(socketId) {
        const roomId = this.playerRoomMap.get(socketId);
        return roomId ? this.rooms.get(roomId) : null;
    }

    logRegistry() {
        console.log('\n--- Room Registry ---');
        if (this.rooms.size === 0) {
            console.log('(No active rooms)');
        } else {
            this.rooms.forEach(room => {
                const playerList = Array.from(room.players.values())
                    .map(p => `${p.name}[T:${p.talismans}]`)
                    .join(', ');
                console.log(`Room [${room.roomId}]:
  Status: ${room.gameState}
  Players: ${room.players.size}/${MAX_PLAYERS} [${playerList}]
  Lamps Lit: ${room.lamps.filter(l => l.state === LAMP_STATES.LIT).length}/${room.lamps.length}`);
            });
        }
        console.log('---------------------\n');
    }

    getRegistrySummary() {
        const summary = [];
        this.rooms.forEach(room => {
            summary.push({
                roomId: room.roomId,
                status: room.gameState,
                playerCount: room.players.size,
                maxPlayers: MAX_PLAYERS,
                progress: room.ritualCircle.progress
            });
        });
        return summary;
    }
}
