import { v4 as uuidv4 } from 'uuid';
import {
    GAME_DURATION,
    RITUAL_DURATION,
    MAX_PLAYERS,
    LAMP_COUNT,
    DOOR_COUNT,
    COOLDOWNS,
    ROLES,
    LAMP_STATES,
    DOOR_STATES,
    GAME_STATES
} from './constants.js';

export class GameRoom {
    constructor(roomId) {
        this.roomId = roomId;
        this.players = new Map();
        this.gameState = GAME_STATES.WAITING;
        this.timeRemaining = GAME_DURATION;
        this.timerInterval = null;
        this.lamps = this.initLamps();
        this.doors = this.initDoors();
        this.ritualItem = { x: 1200, y: 600, carrier: null };
        this.ritualCircle = {
            x: 2100,
            y: 1500,
            radius: 80,
            playersInside: new Set(),
            progress: 0,
            progressInterval: null
        };
        this.chaathanCooldowns = {
            flickerLamp: 0,
            extinguishLamp: 0,
            sealDoor: 0,
            pushPlayer: 0
        };
        this.spawnPoints = {
            poojari: [
                { x: 200, y: 200 },
                { x: 200, y: 900 },
                { x: 200, y: 1600 }
            ],
            chaathan: { x: 2200, y: 1600 }
        };
        this.poojariSpawnIndex = 0;
    }

    initLamps() {
        return [
            { id: 0, x: 400, y: 300, state: LAMP_STATES.UNLIT },
            { id: 1, x: 1200, y: 900, state: LAMP_STATES.UNLIT },
            { id: 2, x: 2000, y: 300, state: LAMP_STATES.UNLIT }
        ];
    }

    initDoors() {
        return [
            { id: 0, x: 800, y: 300, state: DOOR_STATES.OPEN, sealTimer: null },
            { id: 1, x: 800, y: 900, state: DOOR_STATES.OPEN, sealTimer: null },
            { id: 2, x: 800, y: 1500, state: DOOR_STATES.OPEN, sealTimer: null },
            { id: 3, x: 1600, y: 300, state: DOOR_STATES.OPEN, sealTimer: null },
            { id: 4, x: 1600, y: 900, state: DOOR_STATES.OPEN, sealTimer: null },
            { id: 5, x: 1600, y: 1500, state: DOOR_STATES.OPEN, sealTimer: null },
            { id: 6, x: 400, y: 600, state: DOOR_STATES.OPEN, sealTimer: null },
            { id: 7, x: 1200, y: 600, state: DOOR_STATES.OPEN, sealTimer: null },
            { id: 8, x: 2000, y: 600, state: DOOR_STATES.OPEN, sealTimer: null },
            { id: 9, x: 400, y: 1200, state: DOOR_STATES.OPEN, sealTimer: null },
            { id: 10, x: 1200, y: 1200, state: DOOR_STATES.OPEN, sealTimer: null },
            { id: 11, x: 2000, y: 1200, state: DOOR_STATES.OPEN, sealTimer: null }
        ];
    }

    addPlayer(socketId, playerName) {
        if (this.players.size >= MAX_PLAYERS) return null;

        const player = {
            id: socketId,
            name: playerName || `Player${this.players.size + 1}`,
            role: null,
            x: 400,
            y: 300,
            isCarryingItem: false
        };

        this.players.set(socketId, player);
        return player;
    }

    removePlayer(socketId) {
        const player = this.players.get(socketId);
        if (player && player.isCarryingItem) {
            this.ritualItem.carrier = null;
        }
        this.ritualCircle.playersInside.delete(socketId);
        this.players.delete(socketId);
    }

    assignRoles() {
        const playerIds = Array.from(this.players.keys());
        const shuffled = playerIds.sort(() => Math.random() - 0.5);

        let poojariIndex = 0;
        shuffled.forEach((id, index) => {
            const player = this.players.get(id);
            if (index === 0) {
                player.role = ROLES.CHAATHAN;
                player.x = this.spawnPoints.chaathan.x;
                player.y = this.spawnPoints.chaathan.y;
            } else {
                player.role = ROLES.POOJARI;
                const spawn = this.spawnPoints.poojari[poojariIndex];
                player.x = spawn.x;
                player.y = spawn.y;
                poojariIndex++;
            }
        });
    }

    startGame(io) {
        if (this.players.size !== MAX_PLAYERS) return false;

        this.assignRoles();
        this.gameState = GAME_STATES.PLAYING;
        this.timeRemaining = GAME_DURATION;

        this.timerInterval = setInterval(() => {
            this.timeRemaining -= 1000;
            io.to(this.roomId).emit('timer-update', this.timeRemaining);

            if (this.timeRemaining <= 0) {
                this.endGame(io, GAME_STATES.CHAATHAN_WIN);
            }
        }, 1000);

        return true;
    }

    endGame(io, result) {
        this.gameState = result;
        clearInterval(this.timerInterval);
        clearInterval(this.ritualCircle.progressInterval);
        io.to(this.roomId).emit('game-over', { winner: result });
    }

    updatePlayerPosition(socketId, x, y) {
        const player = this.players.get(socketId);
        if (player) {
            player.x = x;
            player.y = y;

            if (player.isCarryingItem) {
                this.ritualItem.x = x;
                this.ritualItem.y = y;
            }
        }
        return player;
    }

    lightLamp(lampId, socketId) {
        const player = this.players.get(socketId);
        if (!player || player.role === ROLES.CHAATHAN) return null;

        const lamp = this.lamps.find(l => l.id === lampId);
        if (lamp && lamp.state === LAMP_STATES.UNLIT) {
            lamp.state = LAMP_STATES.LIT;
            return lamp;
        }
        return null;
    }

    flickerLamp(lampId, io) {
        const now = Date.now();
        if (now < this.chaathanCooldowns.flickerLamp) return null;

        const lamp = this.lamps.find(l => l.id === lampId);
        if (lamp && lamp.state === LAMP_STATES.LIT) {
            lamp.state = LAMP_STATES.FLICKERING;
            this.chaathanCooldowns.flickerLamp = now + COOLDOWNS.FLICKER_LAMP;

            setTimeout(() => {
                if (lamp.state === LAMP_STATES.FLICKERING) {
                    lamp.state = LAMP_STATES.LIT;
                    io.to(this.roomId).emit('lamp-update', lamp);
                }
            }, 2000);

            return { lamp, cooldownEnd: this.chaathanCooldowns.flickerLamp };
        }
        return null;
    }

    extinguishLamp(lampId, io) {
        const now = Date.now();
        if (now < this.chaathanCooldowns.extinguishLamp) return null;

        const lamp = this.lamps.find(l => l.id === lampId);
        if (lamp && (lamp.state === LAMP_STATES.LIT || lamp.state === LAMP_STATES.FLICKERING)) {
            lamp.state = LAMP_STATES.UNLIT;
            this.chaathanCooldowns.extinguishLamp = now + COOLDOWNS.EXTINGUISH_LAMP;
            this.resetRitualProgress(io);
            return { lamp, cooldownEnd: this.chaathanCooldowns.extinguishLamp };
        }
        return null;
    }

    sealDoor(doorId, io) {
        const now = Date.now();
        if (now < this.chaathanCooldowns.sealDoor) return null;

        const door = this.doors.find(d => d.id === doorId);
        if (door && door.state === DOOR_STATES.OPEN) {
            door.state = DOOR_STATES.SEALED;
            this.chaathanCooldowns.sealDoor = now + COOLDOWNS.SEAL_DOOR;

            door.sealTimer = setTimeout(() => {
                door.state = DOOR_STATES.OPEN;
                io.to(this.roomId).emit('door-update', door);
            }, 8000);

            return { door, cooldownEnd: this.chaathanCooldowns.sealDoor };
        }
        return null;
    }

    pickupItem(socketId) {
        const player = this.players.get(socketId);
        if (!player || player.role === ROLES.CHAATHAN) return null;
        if (this.ritualItem.carrier) return null;

        const dist = Math.hypot(player.x - this.ritualItem.x, player.y - this.ritualItem.y);
        if (dist < 50) {
            this.ritualItem.carrier = socketId;
            player.isCarryingItem = true;
            return { player, item: this.ritualItem };
        }
        return null;
    }

    dropItem(socketId) {
        const player = this.players.get(socketId);
        if (!player || this.ritualItem.carrier !== socketId) return null;

        this.ritualItem.carrier = null;
        this.ritualItem.x = player.x;
        this.ritualItem.y = player.y;
        player.isCarryingItem = false;
        return { player, item: this.ritualItem };
    }

    checkRitualCircle(io) {
        this.ritualCircle.playersInside.clear();

        let itemInCircle = false;
        const circleX = this.ritualCircle.x;
        const circleY = this.ritualCircle.y;
        const radius = this.ritualCircle.radius;

        this.players.forEach((player, id) => {
            if (player.role === ROLES.POOJARI) {
                const dist = Math.hypot(player.x - circleX, player.y - circleY);
                if (dist <= radius) {
                    this.ritualCircle.playersInside.add(id);
                    if (player.isCarryingItem) itemInCircle = true;
                }
            }
        });

        const allLampsLit = this.lamps.every(l => l.state === LAMP_STATES.LIT);
        const allPoojariInCircle = this.ritualCircle.playersInside.size === 3;

        if (allLampsLit && allPoojariInCircle && itemInCircle) {
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

    pushPlayer(targetId, io) {
        const now = Date.now();
        if (now < this.chaathanCooldowns.pushPlayer) return null;

        const target = this.players.get(targetId);
        if (!target || target.role === ROLES.CHAATHAN) return null;

        if (this.ritualCircle.playersInside.has(targetId)) {
            const pushAngle = Math.random() * Math.PI * 2;
            const pushDistance = 100;
            target.x += Math.cos(pushAngle) * pushDistance;
            target.y += Math.sin(pushAngle) * pushDistance;

            this.chaathanCooldowns.pushPlayer = now + COOLDOWNS.PUSH_PLAYER;
            this.checkRitualCircle(io);

            return { target, cooldownEnd: this.chaathanCooldowns.pushPlayer };
        }
        return null;
    }

    getState() {
        return {
            gameState: this.gameState,
            timeRemaining: this.timeRemaining,
            players: Array.from(this.players.values()),
            lamps: this.lamps,
            doors: this.doors,
            ritualItem: this.ritualItem,
            ritualCircle: {
                x: this.ritualCircle.x,
                y: this.ritualCircle.y,
                radius: this.ritualCircle.radius,
                progress: this.ritualCircle.progress,
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

    createRoom() {
        const roomId = uuidv4().substring(0, 8);
        const room = new GameRoom(roomId);
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
        }
        return { room, player };
    }

    leaveRoom(socketId) {
        const roomId = this.playerRoomMap.get(socketId);
        if (roomId) {
            const room = this.rooms.get(roomId);
            if (room) {
                room.removePlayer(socketId);
                if (room.players.size === 0) {
                    clearInterval(room.timerInterval);
                    clearInterval(room.ritualCircle.progressInterval);
                    this.rooms.delete(roomId);
                }
            }
            this.playerRoomMap.delete(socketId);
        }
    }

    getPlayerRoom(socketId) {
        const roomId = this.playerRoomMap.get(socketId);
        return roomId ? this.rooms.get(roomId) : null;
    }
}
