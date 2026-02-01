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
    CHAATHAN_TYPES,
    CHAATHAN_CONFIG,
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
    AI_LOSE_SIGHT_DISTANCE,
    STUN_DURATION,
    SALT_COUNT,
    SALT_POSITIONS
} from './constants.js';

const MAP_WIDTH = 4000;
const MAP_HEIGHT = 3000;
const ROOM_WIDTH = 800;
const ROOM_HEIGHT = 600;
const ROOM_COLS = 5;
const ROOM_ROWS = 5;
const TILE_SIZE = 32;

class AIChaathan {
    constructor(id, startX, startY, roomBounds, type = CHAATHAN_TYPES.STALKER) {
        this.id = id;
        this.x = startX;
        this.y = startY;
        this.type = type;
        this.config = CHAATHAN_CONFIG[type];
        this.state = CHAATHAN_STATES.PATROL;
        this.targetPlayerId = null;
        this.patrolTarget = { x: startX, y: startY };
        this.roomBounds = roomBounds;
        this.lastDirectionChange = 0;
        this.direction = { x: 0, y: 0 };
        this.doorOpenings = this.buildDoorOpeningsMap();
        this.doorPositions = this.getDoorPositions();
        this.stunUntil = 0;
        this.pickNewPatrolTarget();
    }

    buildDoorOpeningsMap() {
        const doorMap = new Map();
        const doorPositions = this.getDoorPositions();

        doorPositions.forEach(door => {
            const doorTileX = Math.floor(door.x / TILE_SIZE);
            const doorTileY = Math.floor(door.y / TILE_SIZE);

            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    const key = `${doorTileX + dx},${doorTileY + dy}`;
                    doorMap.set(key, true);
                }
            }
        });

        return doorMap;
    }

    getDoorPositions() {
        return [
            { x: 800, y: 300 }, { x: 1600, y: 300 }, { x: 2400, y: 300 }, { x: 3200, y: 300 },
            { x: 800, y: 900 }, { x: 1600, y: 900 }, { x: 2400, y: 900 }, { x: 3200, y: 900 },
            { x: 800, y: 1500 }, { x: 1600, y: 1500 }, { x: 2400, y: 1500 }, { x: 3200, y: 1500 },
            { x: 800, y: 2100 }, { x: 1600, y: 2100 }, { x: 2400, y: 2100 }, { x: 3200, y: 2100 },
            { x: 800, y: 2700 }, { x: 1600, y: 2700 }, { x: 2400, y: 2700 }, { x: 3200, y: 2700 },
            { x: 400, y: 600 }, { x: 1200, y: 600 }, { x: 2000, y: 600 }, { x: 2800, y: 600 }, { x: 3600, y: 600 },
            { x: 400, y: 1200 }, { x: 1200, y: 1200 }, { x: 2000, y: 1200 }, { x: 2800, y: 1200 }, { x: 3600, y: 1200 },
            { x: 400, y: 1800 }, { x: 1200, y: 1800 }, { x: 2000, y: 1800 }, { x: 2800, y: 1800 }, { x: 3600, y: 1800 },
            { x: 400, y: 2400 }, { x: 1200, y: 2400 }, { x: 2000, y: 2400 }, { x: 2800, y: 2400 }, { x: 3600, y: 2400 }
        ];
    }

    isWallTile(tileX, tileY) {
        const roomWidthTiles = ROOM_WIDTH / TILE_SIZE;
        const roomHeightTiles = ROOM_HEIGHT / TILE_SIZE;
        const localX = tileX % roomWidthTiles;
        const localY = tileY % roomHeightTiles;

        const isEdge = localX === 0 || localX === roomWidthTiles - 1 ||
            localY === 0 || localY === roomHeightTiles - 1;

        if (!isEdge) {
            return false;
        }

        const key = `${tileX},${tileY}`;
        if (this.doorOpenings.has(key)) {
            return false;
        }

        return true;
    }

    canMoveTo(x, y) {
        const radius = 20;
        const checkPoints = [
            { x: x - radius, y: y - radius },
            { x: x + radius, y: y - radius },
            { x: x - radius, y: y + radius },
            { x: x + radius, y: y + radius }
        ];

        for (const point of checkPoints) {
            const tileX = Math.floor(point.x / TILE_SIZE);
            const tileY = Math.floor(point.y / TILE_SIZE);

            if (this.isWallTile(tileX, tileY)) {
                return false;
            }
        }

        return true;
    }

    pickNewPatrolTarget() {
        const margin = 100;
        const attempts = 10;
        for (let i = 0; i < attempts; i++) {
            const newX = margin + Math.random() * (this.roomBounds.width - margin * 2);
            const newY = margin + Math.random() * (this.roomBounds.height - margin * 2);
            if (this.canMoveTo(newX, newY)) {
                this.patrolTarget = { x: newX, y: newY };
                return;
            }
        }
        this.patrolTarget = {
            x: this.x + (Math.random() - 0.5) * 200,
            y: this.y + (Math.random() - 0.5) * 200
        };
    }

    getDistanceToPlayer(player) {
        return Math.hypot(this.x - player.x, this.y - player.y);
    }

    findBestTarget(players) {
        let bestTarget = null;
        let lowestScore = Infinity;
        const detectionRange = this.config.detectionRange;

        players.forEach((player) => {
            if (!player.isAlive) return;
            const dist = this.getDistanceToPlayer(player);

            // Score based on distance and aura (lower is better)
            // Weight Aura heavily so AI prioritizes weak players
            // Score = Distance + (Aura * 5)
            // E.g., Dist 100, Aura 100 => 100 + 500 = 600
            // E.g., Dist 200, Aura 20 => 200 + 100 = 300 (Prefer slightly farther but weaker player)

            if (dist < detectionRange) {
                const score = dist + (player.aura * 5);
                if (score < lowestScore) {
                    lowestScore = score;
                    bestTarget = player;
                }
            }
        });

        return bestTarget;
    }

    stun() {
        this.stunUntil = Date.now() + STUN_DURATION;
        this.state = CHAATHAN_STATES.STUNNED;
        this.targetPlayerId = null;
    }

    isStunned() {
        return Date.now() < this.stunUntil;
    }

    getCurrentRoom(x, y) {
        return {
            col: Math.floor(x / ROOM_WIDTH),
            row: Math.floor(y / ROOM_HEIGHT)
        };
    }

    getDoorTarget(startX, startY, targetX, targetY) {
        const startRoom = this.getCurrentRoom(startX, startY);
        const targetRoom = this.getCurrentRoom(targetX, targetY);

        if (startRoom.col === targetRoom.col && startRoom.row === targetRoom.row) {
            return { x: targetX, y: targetY };
        }

        let nextCol = startRoom.col;
        let nextRow = startRoom.row;
        let findingVerticalDoor = false;

        // Simple Manhattan routing: prioritize matching axis with largest difference or verify connectivity
        // For grid 5x5, we can just move towards target room one step at a time

        if (startRoom.col < targetRoom.col) {
            nextCol++;
            findingVerticalDoor = true;
        } else if (startRoom.col > targetRoom.col) {
            nextCol--;
            findingVerticalDoor = true;
        } else if (startRoom.row < targetRoom.row) {
            nextRow++;
            findingVerticalDoor = false;
        } else if (startRoom.row > targetRoom.row) {
            nextRow--;
            findingVerticalDoor = false;
        }

        // Find door connecting current room to next room
        // Vertical Step: Changes Row. Door is Horizontal type (y is constant boundary).
        // Horizontal Step: Changes Col. Door is Vertical type (x is constant boundary).

        // CORRECTION: 
        // Moving Left/Right (Col change) -> Crosses Vertical Door.
        // Moving Up/Down (Row change) -> Crosses Horizontal Door.

        // Filter door positions
        const possibleDoors = this.doorPositions.filter(door => {
            if (findingVerticalDoor) {
                // Determine expected X of door
                // If moving Right (0->1), door is at 800.
                // If moving Left (1->0), door is at 800.
                // Door X should be max(startCol, nextCol) * 800? 
                // Doors are at 800, 1600, etc.
                const expectedX = Math.max(startRoom.col, nextCol) * ROOM_WIDTH;

                // Door must be at this X, and within the current ROW's Y range
                const rowTop = startRoom.row * ROOM_HEIGHT;
                const rowBottom = (startRoom.row + 1) * ROOM_HEIGHT;

                return Math.abs(door.x - expectedX) < 10 && door.y > rowTop && door.y < rowBottom;
            } else {
                // Moving Up/Down
                const expectedY = Math.max(startRoom.row, nextRow) * ROOM_HEIGHT;

                const colLeft = startRoom.col * ROOM_WIDTH;
                const colRight = (startRoom.col + 1) * ROOM_WIDTH;

                return Math.abs(door.y - expectedY) < 10 && door.x > colLeft && door.x < colRight;
            }
        });

        if (possibleDoors.length > 0) {
            // Pick closest door or random? Closest is better.
            let closestDoor = possibleDoors[0];
            let minDist = Math.hypot(startX - closestDoor.x, startY - closestDoor.y);

            for (let i = 1; i < possibleDoors.length; i++) {
                const d = Math.hypot(startX - possibleDoors[i].x, startY - possibleDoors[i].y);
                if (d < minDist) {
                    minDist = d;
                    closestDoor = possibleDoors[i];
                }
            }
            return closestDoor;
        }

        // Fallback: direct line if no door found (shouldn't happen with valid map)
        return { x: targetX, y: targetY };
    }

    update(players, deltaTime) {
        if (this.isStunned()) {
            this.state = CHAATHAN_STATES.STUNNED;
            return;
        }

        if (this.state === CHAATHAN_STATES.STUNNED) {
            this.state = CHAATHAN_STATES.PATROL;
            this.pickNewPatrolTarget();
        }

        const alivePlayers = Array.from(players.values()).filter(p => p.isAlive);

        if (this.state === CHAATHAN_STATES.PATROL) {
            const bestTarget = this.findBestTarget(players);
            if (bestTarget) {
                this.state = CHAATHAN_STATES.HUNT;
                this.targetPlayerId = bestTarget.id;
                return;
            }

            // Patrol Logic with door navigation
            let moveTarget = this.getDoorTarget(this.x, this.y, this.patrolTarget.x, this.patrolTarget.y);

            const distToTarget = Math.hypot(this.x - this.patrolTarget.x, this.y - this.patrolTarget.y);
            if (distToTarget < 20) {
                this.pickNewPatrolTarget();
                moveTarget = this.patrolTarget; // Update immediately
            }

            // Move towards moveTarget (which is either final target or intermediate door)
            const speed = this.config.patrolSpeed * (deltaTime / 1000);
            const angle = Math.atan2(moveTarget.y - this.y, moveTarget.x - this.x);
            const newX = this.x + Math.cos(angle) * speed;
            const newY = this.y + Math.sin(angle) * speed;

            if (this.canMoveTo(newX, newY)) {
                this.x = newX;
                this.y = newY;
            } else if (this.canMoveTo(newX, this.y)) {
                this.x = newX;
            } else if (this.canMoveTo(this.x, newY)) {
                this.y = newY;
            } else {
                // If stuck, pick new target
                this.pickNewPatrolTarget();
            }

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

            // HUNT Logic with door navigation
            let moveTarget = this.getDoorTarget(this.x, this.y, target.x, target.y);

            const speed = this.config.chaseSpeed * (deltaTime / 1000);
            const angle = Math.atan2(moveTarget.y - this.y, moveTarget.x - this.x);
            const newX = this.x + Math.cos(angle) * speed;
            const newY = this.y + Math.sin(angle) * speed;

            if (this.canMoveTo(newX, newY)) {
                this.x = newX;
                this.y = newY;
            } else if (this.canMoveTo(newX, this.y)) {
                this.x = newX;
            } else if (this.canMoveTo(this.x, newY)) {
                this.y = newY;
            }
        }

        this.x = Math.max(50, Math.min(this.roomBounds.width - 50, this.x));
        this.y = Math.max(50, Math.min(this.roomBounds.height - 50, this.y));
    }

    checkCollision(players) {
        if (this.isStunned()) return [];
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
            state: this.state,
            type: this.type,
            stunned: this.isStunned(),
            alpha: this.config.alpha,
            color: this.config.color
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
            x: 2000,
            y: 1500,
            radius: 100,
            playersInside: new Set(),
            progress: 0,
            progressInterval: null,
            isActive: false
        };
        this.aiChaathans = [];
        this.roomBounds = { width: MAP_WIDTH, height: MAP_HEIGHT };
        this.spawnPoints = [
            { x: 1900, y: 1400 },
            { x: 2100, y: 1400 },
            { x: 1900, y: 1600 },
            { x: 2100, y: 1600 }
        ];
    }

    initLamps() {
        const ritualRoomCol = 2;
        const ritualRoomRow = 2;

        const roomCenters = [];
        for (let row = 0; row < ROOM_ROWS; row++) {
            for (let col = 0; col < ROOM_COLS; col++) {
                if (col === ritualRoomCol && row === ritualRoomRow) continue;
                roomCenters.push({
                    x: col * ROOM_WIDTH + ROOM_WIDTH / 2,
                    y: row * ROOM_HEIGHT + ROOM_HEIGHT / 2
                });
            }
        }

        for (let i = roomCenters.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [roomCenters[i], roomCenters[j]] = [roomCenters[j], roomCenters[i]];
        }

        const selectedRooms = roomCenters.slice(0, 4);

        return [
            { id: 0, x: selectedRooms[0].x, y: selectedRooms[0].y, state: LAMP_STATES.UNLIT, type: LAMP_TYPES.MINI },
            { id: 1, x: selectedRooms[1].x, y: selectedRooms[1].y, state: LAMP_STATES.UNLIT, type: LAMP_TYPES.MINI },
            { id: 2, x: selectedRooms[2].x, y: selectedRooms[2].y, state: LAMP_STATES.UNLIT, type: LAMP_TYPES.MINI },
            { id: 3, x: selectedRooms[3].x, y: selectedRooms[3].y, state: LAMP_STATES.UNLIT, type: LAMP_TYPES.MINI },
            { id: 4, x: 2000, y: 1500, state: LAMP_STATES.UNLIT, type: LAMP_TYPES.GRAND }
        ];
    }

    initDoors() {
        return [
            { id: 0, x: 800, y: 300, state: DOOR_STATES.OPEN, orientation: 'vertical' },
            { id: 1, x: 1600, y: 300, state: DOOR_STATES.OPEN, orientation: 'vertical' },
            { id: 2, x: 2400, y: 300, state: DOOR_STATES.OPEN, orientation: 'vertical' },
            { id: 3, x: 3200, y: 300, state: DOOR_STATES.OPEN, orientation: 'vertical' },
            { id: 4, x: 800, y: 900, state: DOOR_STATES.OPEN, orientation: 'vertical' },
            { id: 5, x: 1600, y: 900, state: DOOR_STATES.OPEN, orientation: 'vertical' },
            { id: 6, x: 2400, y: 900, state: DOOR_STATES.OPEN, orientation: 'vertical' },
            { id: 7, x: 3200, y: 900, state: DOOR_STATES.OPEN, orientation: 'vertical' },
            { id: 8, x: 800, y: 1500, state: DOOR_STATES.OPEN, orientation: 'vertical' },
            { id: 9, x: 1600, y: 1500, state: DOOR_STATES.OPEN, orientation: 'vertical' },
            { id: 10, x: 2400, y: 1500, state: DOOR_STATES.OPEN, orientation: 'vertical' },
            { id: 11, x: 3200, y: 1500, state: DOOR_STATES.OPEN, orientation: 'vertical' },
            { id: 12, x: 800, y: 2100, state: DOOR_STATES.OPEN, orientation: 'vertical' },
            { id: 13, x: 1600, y: 2100, state: DOOR_STATES.OPEN, orientation: 'vertical' },
            { id: 14, x: 2400, y: 2100, state: DOOR_STATES.OPEN, orientation: 'vertical' },
            { id: 15, x: 3200, y: 2100, state: DOOR_STATES.OPEN, orientation: 'vertical' },
            { id: 16, x: 800, y: 2700, state: DOOR_STATES.OPEN, orientation: 'vertical' },
            { id: 17, x: 1600, y: 2700, state: DOOR_STATES.OPEN, orientation: 'vertical' },
            { id: 18, x: 2400, y: 2700, state: DOOR_STATES.OPEN, orientation: 'vertical' },
            { id: 19, x: 3200, y: 2700, state: DOOR_STATES.OPEN, orientation: 'vertical' },
            { id: 20, x: 400, y: 600, state: DOOR_STATES.OPEN, orientation: 'horizontal' },
            { id: 21, x: 1200, y: 600, state: DOOR_STATES.OPEN, orientation: 'horizontal' },
            { id: 22, x: 2000, y: 600, state: DOOR_STATES.OPEN, orientation: 'horizontal' },
            { id: 23, x: 2800, y: 600, state: DOOR_STATES.OPEN, orientation: 'horizontal' },
            { id: 24, x: 3600, y: 600, state: DOOR_STATES.OPEN, orientation: 'horizontal' },
            { id: 25, x: 400, y: 1200, state: DOOR_STATES.OPEN, orientation: 'horizontal' },
            { id: 26, x: 1200, y: 1200, state: DOOR_STATES.OPEN, orientation: 'horizontal' },
            { id: 27, x: 2000, y: 1200, state: DOOR_STATES.OPEN, orientation: 'horizontal' },
            { id: 28, x: 2800, y: 1200, state: DOOR_STATES.OPEN, orientation: 'horizontal' },
            { id: 29, x: 3600, y: 1200, state: DOOR_STATES.OPEN, orientation: 'horizontal' },
            { id: 30, x: 400, y: 1800, state: DOOR_STATES.OPEN, orientation: 'horizontal' },
            { id: 31, x: 1200, y: 1800, state: DOOR_STATES.OPEN, orientation: 'horizontal' },
            { id: 32, x: 2000, y: 1800, state: DOOR_STATES.OPEN, orientation: 'horizontal' },
            { id: 33, x: 2800, y: 1800, state: DOOR_STATES.OPEN, orientation: 'horizontal' },
            { id: 34, x: 3600, y: 1800, state: DOOR_STATES.OPEN, orientation: 'horizontal' },
            { id: 35, x: 400, y: 2400, state: DOOR_STATES.OPEN, orientation: 'horizontal' },
            { id: 36, x: 1200, y: 2400, state: DOOR_STATES.OPEN, orientation: 'horizontal' },
            { id: 37, x: 2000, y: 2400, state: DOOR_STATES.OPEN, orientation: 'horizontal' },
            { id: 38, x: 2800, y: 2400, state: DOOR_STATES.OPEN, orientation: 'horizontal' },
            { id: 39, x: 3600, y: 2400, state: DOOR_STATES.OPEN, orientation: 'horizontal' }
        ];
    }

    initAIChaathans() {
        this.aiChaathans = [
            new AIChaathan(0, 3600, 300, this.roomBounds, CHAATHAN_TYPES.STALKER),
            new AIChaathan(1, 400, 2700, this.roomBounds, CHAATHAN_TYPES.SPECTER)
        ];
    }

    initSaltItems() {
        this.saltItems = SALT_POSITIONS.map((pos, idx) => ({
            id: idx,
            x: pos.x,
            y: pos.y,
            pickedUp: false
        }));
    }

    pickupSalt(socketId, saltId) {
        const player = this.players.get(socketId);
        if (!player || !player.isAlive) return null;

        const salt = this.saltItems.find(s => s.id === saltId && !s.pickedUp);
        if (!salt) return null;

        const dist = Math.hypot(player.x - salt.x, player.y - salt.y);
        if (dist <= 60) {
            salt.pickedUp = true;
            player.saltCount = (player.saltCount || 0) + 1;
            return { saltId: salt.id, playerId: player.id, saltCount: player.saltCount };
        }
        return null;
    }

    useSalt(socketId) {
        const player = this.players.get(socketId);
        if (!player || !player.isAlive || !player.saltCount || player.saltCount <= 0) return null;

        let stunnedChaathan = null;
        const SALT_RANGE = 100;

        for (const chaathan of this.aiChaathans) {
            const dist = Math.hypot(player.x - chaathan.x, player.y - chaathan.y);
            if (dist <= SALT_RANGE && !chaathan.isStunned()) {
                chaathan.stun();
                stunnedChaathan = chaathan.id;
                break;
            }
        }

        player.saltCount -= 1;
        return { playerId: player.id, saltCount: player.saltCount, stunnedChaathanId: stunnedChaathan };
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
            isAlive: true,
            saltCount: 0,
            invulnerableUntil: 0,
            lastHitTime: 0
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
        this.initSaltItems();

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

        // Immunity check for collisions
        if (reason === 'caught') {
            const now = Date.now();
            if (now < player.invulnerableUntil) return;
            // Set immunity for 3 seconds
            player.invulnerableUntil = now + 3000;
        }

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
            saltItems: this.saltItems || [],
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
