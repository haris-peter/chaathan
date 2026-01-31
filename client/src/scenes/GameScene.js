import Phaser from 'phaser';
import { SocketManager } from '../network/SocketManager.js';
import { GAME_CONSTANTS } from '../config.js';

export class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    init(data) {
        this.gameData = data;
        this.myId = data.yourId;
        this.players = new Map();
        this.lamps = [];
        this.doors = [];
        this.aiChaathans = [];
        this.myAura = GAME_CONSTANTS.AURA_MAX;
        this.myTalismans = GAME_CONSTANTS.TALISMAN_COUNT;
        this.isAlive = true;
        this.isTransitioning = false;
        this.currentRoomX = 0;
        this.currentRoomY = 0;
        this.ritualProgress = 0;
        this.ritualTotal = 10000;
        this.grandLampActive = false;
        this.doorOpenings = this.buildDoorOpeningsMap();
    }

    buildDoorOpeningsMap() {
        const doorMap = new Map();
        const tileSize = GAME_CONSTANTS.TILE_SIZE;

        GAME_CONSTANTS.DOOR_POSITIONS.forEach(door => {
            const doorTileX = Math.floor(door.x / tileSize);
            const doorTileY = Math.floor(door.y / tileSize);

            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    const key = `${doorTileX + dx},${doorTileY + dy}`;
                    doorMap.set(key, true);
                }
            }
        });

        return doorMap;
    }

    create() {
        this.createRoomBackgrounds();
        this.createMap();
        this.addRoomLabels();
        this.createLamps();
        this.createDoors();
        this.createRitualCircle();
        this.createPlayers();
        this.createAIChaathans();
        this.createUI();
        this.setupCamera();
        this.setupControls();
        this.setupNetwork();
    }

    createRoomBackgrounds() {
        this.roomBackgrounds = [];
        const roomWidth = GAME_CONSTANTS.ROOM_WIDTH;
        const roomHeight = GAME_CONSTANTS.ROOM_HEIGHT;

        for (let row = 0; row < GAME_CONSTANTS.ROOM_ROWS; row++) {
            for (let col = 0; col < GAME_CONSTANTS.ROOM_COLS; col++) {
                const key = `${col},${row}`;
                const roomInfo = GAME_CONSTANTS.ROOM_BACKGROUNDS[key];

                if (roomInfo) {
                    const bgKey = `bg-${roomInfo.bg}`;
                    const x = col * roomWidth + roomWidth / 2;
                    const y = row * roomHeight + roomHeight / 2;

                    if (this.textures.exists(bgKey)) {
                        const bg = this.add.image(x, y, bgKey);
                        bg.setDisplaySize(roomWidth, roomHeight);
                        bg.setDepth(0);
                        this.roomBackgrounds.push(bg);
                    }
                }
            }
        }
    }

    createMap() {
        const graphics = this.add.graphics();
        graphics.setDepth(1);
        const tileSize = GAME_CONSTANTS.TILE_SIZE;
        const mapWidth = GAME_CONSTANTS.MAP_WIDTH;
        const mapHeight = GAME_CONSTANTS.MAP_HEIGHT;

        for (let y = 0; y < mapHeight; y += tileSize) {
            for (let x = 0; x < mapWidth; x += tileSize) {
                const tileX = Math.floor(x / tileSize);
                const tileY = Math.floor(y / tileSize);

                const isWall = this.isWallTile(tileX, tileY, tileSize);
                if (isWall) {
                    graphics.fillStyle(0x1a1510, 1);
                    graphics.fillRect(x, y, tileSize, tileSize);
                    graphics.lineStyle(1, 0x2a2520, 0.8);
                    graphics.strokeRect(x, y, tileSize, tileSize);
                }
            }
        }

        graphics.lineStyle(3, 0x0a0a0a, 0.8);
        for (let i = 0; i <= GAME_CONSTANTS.ROOM_COLS; i++) {
            const x = i * GAME_CONSTANTS.ROOM_WIDTH;
            graphics.moveTo(x, 0);
            graphics.lineTo(x, mapHeight);
        }
        for (let i = 0; i <= GAME_CONSTANTS.ROOM_ROWS; i++) {
            const y = i * GAME_CONSTANTS.ROOM_HEIGHT;
            graphics.moveTo(0, y);
            graphics.lineTo(mapWidth, y);
        }
        graphics.strokePath();
    }

    isWallTile(tileX, tileY, tileSize) {
        const roomWidth = GAME_CONSTANTS.ROOM_WIDTH / tileSize;
        const roomHeight = GAME_CONSTANTS.ROOM_HEIGHT / tileSize;
        const localX = tileX % roomWidth;
        const localY = tileY % roomHeight;

        const isEdge = localX === 0 || localX === roomWidth - 1 ||
            localY === 0 || localY === roomHeight - 1;

        if (isEdge && this.isDoorOpening(tileX, tileY, tileSize)) {
            return false;
        }

        return isEdge;
    }

    isDoorOpening(tileX, tileY, tileSize) {
        const doorPositions = GAME_CONSTANTS.DOOR_POSITIONS;
        for (const door of doorPositions) {
            const doorTileX = Math.floor(door.x / tileSize);
            const doorTileY = Math.floor(door.y / tileSize);
            if (Math.abs(tileX - doorTileX) <= 1 && Math.abs(tileY - doorTileY) <= 1) {
                return true;
            }
        }
        return false;
    }

    canMoveTo(x, y) {
        const tileSize = GAME_CONSTANTS.TILE_SIZE;
        const playerRadius = 15;

        const checkPoints = [
            { x: x - playerRadius, y: y - playerRadius },
            { x: x + playerRadius, y: y - playerRadius },
            { x: x - playerRadius, y: y + playerRadius },
            { x: x + playerRadius, y: y + playerRadius },
            { x: x, y: y - playerRadius },
            { x: x, y: y + playerRadius },
            { x: x - playerRadius, y: y },
            { x: x + playerRadius, y: y }
        ];

        for (const point of checkPoints) {
            const tileX = Math.floor(point.x / tileSize);
            const tileY = Math.floor(point.y / tileSize);

            if (this.isWallTileForCollision(tileX, tileY, tileSize)) {
                return false;
            }
        }

        return true;
    }

    isWallTileForCollision(tileX, tileY, tileSize) {
        const roomWidth = GAME_CONSTANTS.ROOM_WIDTH / tileSize;
        const roomHeight = GAME_CONSTANTS.ROOM_HEIGHT / tileSize;
        const localX = tileX % roomWidth;
        const localY = tileY % roomHeight;

        const isEdge = localX === 0 || localX === roomWidth - 1 ||
            localY === 0 || localY === roomHeight - 1;

        if (!isEdge) {
            return false;
        }

        const key = `${tileX},${tileY}`;
        if (this.doorOpenings.has(key)) {
            return false;
        }

        return true;
    }

    addRoomLabels() {
        for (let row = 0; row < GAME_CONSTANTS.ROOM_ROWS; row++) {
            for (let col = 0; col < GAME_CONSTANTS.ROOM_COLS; col++) {
                const key = `${col},${row}`;
                const roomInfo = GAME_CONSTANTS.ROOM_BACKGROUNDS[key];
                const roomName = roomInfo ? roomInfo.name : `Room ${col},${row}`;

                const x = col * GAME_CONSTANTS.ROOM_WIDTH + GAME_CONSTANTS.ROOM_WIDTH / 2;
                const y = row * GAME_CONSTANTS.ROOM_HEIGHT + 40;
                const label = this.add.text(x, y, roomName, {
                    font: '16px Courier New',
                    fill: '#ffffff',
                    stroke: '#000000',
                    strokeThickness: 3
                }).setOrigin(0.5);
                label.setDepth(4);
            }
        }
    }

    setupCamera() {
        this.cameras.main.setBounds(0, 0, GAME_CONSTANTS.MAP_WIDTH, GAME_CONSTANTS.MAP_HEIGHT);

        const myPlayer = this.gameData.players.find(p => p.id === this.myId);
        if (myPlayer) {
            this.currentRoomX = Math.floor(myPlayer.x / GAME_CONSTANTS.ROOM_WIDTH);
            this.currentRoomY = Math.floor(myPlayer.y / GAME_CONSTANTS.ROOM_HEIGHT);
            this.setCameraToRoom(this.currentRoomX, this.currentRoomY);
        }
    }

    setCameraToRoom(roomX, roomY) {
        const camX = roomX * GAME_CONSTANTS.ROOM_WIDTH;
        const camY = roomY * GAME_CONSTANTS.ROOM_HEIGHT;
        this.cameras.main.setScroll(camX, camY);
    }

    checkRoomTransition() {
        if (this.isTransitioning || !this.isAlive) return;

        const mySprite = this.players.get(this.myId);
        if (!mySprite) return;

        const playerX = mySprite.x;
        const playerY = mySprite.y;

        const roomWidth = GAME_CONSTANTS.ROOM_WIDTH;
        const roomHeight = GAME_CONSTANTS.ROOM_HEIGHT;
        const threshold = GAME_CONSTANTS.EDGE_THRESHOLD;

        const localX = playerX % roomWidth;
        const localY = playerY % roomHeight;

        let newRoomX = this.currentRoomX;
        let newRoomY = this.currentRoomY;
        let newPlayerX = playerX;
        let newPlayerY = playerY;

        if (localX < threshold && this.currentRoomX > 0) {
            if (this.hasDoorBetweenRooms(this.currentRoomX, this.currentRoomY, 'left', { x: playerX, y: playerY })) {
                newRoomX = this.currentRoomX - 1;
                newPlayerX = (newRoomX + 1) * roomWidth - threshold - 10;
            }
        } else if (localX > roomWidth - threshold && this.currentRoomX < GAME_CONSTANTS.ROOM_COLS - 1) {
            if (this.hasDoorBetweenRooms(this.currentRoomX, this.currentRoomY, 'right', { x: playerX, y: playerY })) {
                newRoomX = this.currentRoomX + 1;
                newPlayerX = newRoomX * roomWidth + threshold + 10;
            }
        }

        if (localY < threshold && this.currentRoomY > 0) {
            if (this.hasDoorBetweenRooms(this.currentRoomX, this.currentRoomY, 'up', { x: playerX, y: playerY })) {
                newRoomY = this.currentRoomY - 1;
                newPlayerY = (newRoomY + 1) * roomHeight - threshold - 10;
            }
        } else if (localY > roomHeight - threshold && this.currentRoomY < GAME_CONSTANTS.ROOM_ROWS - 1) {
            if (this.hasDoorBetweenRooms(this.currentRoomX, this.currentRoomY, 'down', { x: playerX, y: playerY })) {
                newRoomY = this.currentRoomY + 1;
                newPlayerY = newRoomY * roomHeight + threshold + 10;
            }
        }

        if (newRoomX !== this.currentRoomX || newRoomY !== this.currentRoomY) {
            this.transitionToRoom(newRoomX, newRoomY, newPlayerX, newPlayerY);
        }
    }

    hasDoorBetweenRooms(roomX, roomY, direction, playerPos) {
        const doorPositions = GAME_CONSTANTS.DOOR_POSITIONS;
        const roomWidth = GAME_CONSTANTS.ROOM_WIDTH;
        const roomHeight = GAME_CONSTANTS.ROOM_HEIGHT;
        const doorCheckDistance = 80;

        const currentRoomLeft = roomX * roomWidth;
        const currentRoomTop = roomY * roomHeight;

        for (const door of doorPositions) {
            if (direction === 'left') {
                if (Math.abs(door.x - currentRoomLeft) < 10 &&
                    Math.abs(door.y - playerPos.y) < doorCheckDistance) {
                    return true;
                }
            }
            if (direction === 'right') {
                const rightEdge = currentRoomLeft + roomWidth;
                if (Math.abs(door.x - rightEdge) < 10 &&
                    Math.abs(door.y - playerPos.y) < doorCheckDistance) {
                    return true;
                }
            }
            if (direction === 'up') {
                if (Math.abs(door.y - currentRoomTop) < 10 &&
                    Math.abs(door.x - playerPos.x) < doorCheckDistance) {
                    return true;
                }
            }
            if (direction === 'down') {
                const bottomEdge = currentRoomTop + roomHeight;
                if (Math.abs(door.y - bottomEdge) < 10 &&
                    Math.abs(door.x - playerPos.x) < doorCheckDistance) {
                    return true;
                }
            }
        }
        return false;
    }

    transitionToRoom(newRoomX, newRoomY, newPlayerX, newPlayerY) {
        this.isTransitioning = true;

        const mySprite = this.players.get(this.myId);
        if (mySprite) {
            mySprite.x = newPlayerX;
            mySprite.y = newPlayerY;
            SocketManager.sendMove(newPlayerX, newPlayerY);
        }

        const camX = newRoomX * GAME_CONSTANTS.ROOM_WIDTH;
        const camY = newRoomY * GAME_CONSTANTS.ROOM_HEIGHT;

        this.tweens.add({
            targets: this.cameras.main,
            scrollX: camX,
            scrollY: camY,
            duration: GAME_CONSTANTS.TRANSITION_DURATION,
            ease: 'Power2',
            onComplete: () => {
                this.currentRoomX = newRoomX;
                this.currentRoomY = newRoomY;
                this.isTransitioning = false;
            }
        });
    }

    createRitualCircle() {
        const { x, y, radius } = GAME_CONSTANTS.RITUAL_CIRCLE;

        this.ritualCircleGraphics = this.add.graphics();
        this.ritualCircleGraphics.setDepth(3);
        this.ritualCircleGraphics.lineStyle(3, 0x666666, 0.5);
        this.ritualCircleGraphics.strokeCircle(x, y, radius);

        const label = this.add.text(x, y - radius - 20, 'Ritual Circle', {
            font: '14px Courier New',
            fill: '#666666'
        }).setOrigin(0.5);
        label.setDepth(3);
    }

    createLamps() {
        this.lamps = [];
        const miniLampScale = 0.15;

        this.gameData.lamps.forEach((lampData) => {
            const isGrand = lampData.type === 'grand';
            let lamp;

            if (isGrand) {
                const size = 30;
                const color = lampData.state === 'lit' ? 0xffd700 : 0x444444;
                lamp = this.add.circle(lampData.x, lampData.y, size, color);
                lamp.setStrokeStyle(2, 0xffd700);
            } else {
                if (lampData.state === 'lit' && this.textures.exists('mini-lamp-lit')) {
                    lamp = this.add.sprite(lampData.x, lampData.y, 'mini-lamp-lit', 'mini_lamp_1.png');
                    lamp.setScale(miniLampScale);
                    if (this.anims.exists('mini-lamp-flame')) {
                        lamp.play('mini-lamp-flame');
                    }
                } else if (this.textures.exists('mini-lamp-unlit')) {
                    lamp = this.add.image(lampData.x, lampData.y, 'mini-lamp-unlit');
                    lamp.setScale(miniLampScale);
                } else {
                    const size = 20;
                    const color = lampData.state === 'lit' ? 0xffaa00 : 0x444444;
                    lamp = this.add.circle(lampData.x, lampData.y, size, color);
                    lamp.setStrokeStyle(2, 0x885500);
                }
            }

            lamp.setInteractive();
            lamp.lampId = lampData.id;
            lamp.lampType = lampData.type;
            lamp.state = lampData.state;
            lamp.isSprite = !isGrand && this.textures.exists('mini-lamp-unlit');
            lamp.setDepth(5);

            lamp.on('pointerdown', () => this.onLampClick(lamp));

            this.lamps.push(lamp);
        });
    }

    createDoors() {
        this.doors = [];

        this.gameData.doors.forEach((doorData) => {
            const isVertical = doorData.orientation === 'vertical' ||
                (doorData.x % GAME_CONSTANTS.ROOM_WIDTH < 50 ||
                    doorData.x % GAME_CONSTANTS.ROOM_WIDTH > GAME_CONSTANTS.ROOM_WIDTH - 50);
            const width = isVertical ? 20 : 60;
            const height = isVertical ? 60 : 20;
            const door = this.add.rectangle(doorData.x, doorData.y, width, height, 0x654321);
            door.setStrokeStyle(2, 0x8b4513);
            door.setDepth(2);
            door.doorId = doorData.id;
            door.state = doorData.state;
            this.doors.push(door);
        });
    }

    createPlayers() {
        this.gameData.players.forEach((playerData) => {
            this.createPlayerSprite(playerData);
        });
    }

    createPlayerSprite(playerData) {
        let sprite;

        if (this.textures.exists('poojari-sprite')) {
            sprite = this.add.sprite(playerData.x, playerData.y, 'poojari-sprite', 'poojari_1.png');
            sprite.setScale(0.1);
            if (this.anims.exists('poojari-walk')) {
                sprite.play('poojari-walk');
            }
        } else {
            sprite = this.add.circle(playerData.x, playerData.y, 15, 0xffff00);
        }

        sprite.setDepth(10);
        sprite.playerId = playerData.id;
        sprite.playerName = playerData.name;
        sprite.isAlive = playerData.isAlive !== false;

        const nameTag = this.add.text(playerData.x, playerData.y - 30, playerData.name, {
            font: '12px Courier New',
            fill: '#ffffff'
        }).setOrigin(0.5);
        nameTag.setDepth(11);

        sprite.nameTag = nameTag;

        if (!sprite.isAlive) {
            sprite.setAlpha(0.3);
            nameTag.setAlpha(0.3);
        }

        this.players.set(playerData.id, sprite);
    }

    createAIChaathans() {
        this.aiChaathans = [];

        if (this.gameData.aiChaathans) {
            this.gameData.aiChaathans.forEach((chaathanData) => {
                const chaathan = this.createChaathanSprite(chaathanData);
                this.aiChaathans.push(chaathan);
            });
        }
    }

    createChaathanSprite(chaathanData) {
        let sprite;

        if (this.textures.exists('chaathan-sprite')) {
            sprite = this.add.sprite(chaathanData.x, chaathanData.y, 'chaathan-sprite', 'chathan_1.png');
            sprite.setScale(0.1);
            if (this.anims.exists('chaathan-walk')) {
                sprite.play('chaathan-walk');
            }
        } else {
            sprite = this.add.circle(chaathanData.x, chaathanData.y, 20, 0xff0000);
        }

        sprite.chaathanId = chaathanData.id;
        sprite.state = chaathanData.state;
        sprite.setDepth(10);

        return sprite;
    }

    createUI() {
        this.createTimerUI();
        this.createAuraUI();
        this.createTalismanUI();
        this.createRitualUI();
        this.createMinimap();
    }

    createTimerUI() {
        this.timerText = this.add.text(400, 20, '5:00', {
            font: 'bold 24px Courier New',
            fill: '#ffffff'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(100);
    }

    createAuraUI() {
        const barX = 20;
        const barY = 50;
        const barWidth = 200;
        const barHeight = 20;

        this.add.text(barX, barY - 20, 'Light Aura', {
            font: '14px Courier New',
            fill: '#ffff00'
        }).setScrollFactor(0).setDepth(100);

        this.auraBarBg = this.add.rectangle(barX + barWidth / 2, barY + barHeight / 2, barWidth, barHeight, 0x333333)
            .setScrollFactor(0).setDepth(100);
        this.auraBarBg.setStrokeStyle(2, 0x666666);

        this.auraBar = this.add.rectangle(barX + barWidth / 2, barY + barHeight / 2, barWidth - 4, barHeight - 4, 0xffff00)
            .setScrollFactor(0).setDepth(100);

        this.auraText = this.add.text(barX + barWidth + 10, barY + barHeight / 2, '100%', {
            font: '14px Courier New',
            fill: '#ffffff'
        }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(100);
    }

    createTalismanUI() {
        const startX = 600;
        const startY = 50;

        this.add.text(startX, startY - 20, 'Talismans', {
            font: '14px Courier New',
            fill: '#ff6666'
        }).setScrollFactor(0).setDepth(100);

        this.talismanIcons = [];
        for (let i = 0; i < GAME_CONSTANTS.TALISMAN_COUNT; i++) {
            const heart = this.add.text(startX + i * 30, startY, '❤️', {
                font: '20px Arial'
            }).setScrollFactor(0).setDepth(100);
            this.talismanIcons.push(heart);
        }
    }

    createRitualUI() {
        this.ritualText = this.add.text(400, 580, '', {
            font: '16px Courier New',
            fill: '#00ff00'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(100);
    }

    createMinimap() {
        const minimapX = 700;
        const minimapY = 500;
        const minimapScale = 0.03;

        this.minimapContainer = this.add.container(minimapX, minimapY);
        this.minimapContainer.setScrollFactor(0).setDepth(100);

        const minimapBg = this.add.rectangle(0, 0,
            GAME_CONSTANTS.MAP_WIDTH * minimapScale,
            GAME_CONSTANTS.MAP_HEIGHT * minimapScale,
            0x222222, 0.8);
        minimapBg.setStrokeStyle(1, 0x666666);
        this.minimapContainer.add(minimapBg);

        this.minimapDots = [];
        this.minimapChaathanDots = [];
        this.minimapScale = minimapScale;
    }

    updateMinimap() {
        this.minimapDots.forEach(d => d.destroy());
        this.minimapDots = [];

        this.minimapChaathanDots.forEach(d => d.destroy());
        this.minimapChaathanDots = [];

        const scale = this.minimapScale;
        const offsetX = -GAME_CONSTANTS.MAP_WIDTH * scale / 2;
        const offsetY = -GAME_CONSTANTS.MAP_HEIGHT * scale / 2;

        this.players.forEach((sprite) => {
            const dotColor = sprite.playerId === this.myId ? 0x00ff00 : 0xffff00;
            const dot = this.add.circle(
                offsetX + sprite.x * scale,
                offsetY + sprite.y * scale,
                3, dotColor
            ).setScrollFactor(0).setDepth(101);
            this.minimapContainer.add(dot);
            this.minimapDots.push(dot);
        });

        this.aiChaathans.forEach((chaathan) => {
            const dot = this.add.circle(
                offsetX + chaathan.x * scale,
                offsetY + chaathan.y * scale,
                4, 0xff0000
            ).setScrollFactor(0).setDepth(101);
            this.minimapContainer.add(dot);
            this.minimapChaathanDots.push(dot);
        });
    }

    setupControls() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });

        this.interactKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        this.interactKey.on('down', () => this.tryInteract());
    }

    setupNetwork() {
        SocketManager.on('player-moved', (data) => {
            const sprite = this.players.get(data.playerId);
            if (sprite) {
                sprite.x = data.x;
                sprite.y = data.y;
                if (sprite.nameTag) {
                    sprite.nameTag.x = data.x;
                    sprite.nameTag.y = data.y - 30;
                }
            }
        });

        SocketManager.on('player-joined', (data) => {
            if (!this.players.has(data.player.id)) {
                this.createPlayerSprite(data.player);
            }
        });

        SocketManager.on('player-left', (data) => {
            const sprite = this.players.get(data.playerId);
            if (sprite) {
                if (sprite.nameTag) sprite.nameTag.destroy();
                sprite.destroy();
                this.players.delete(data.playerId);
            }
        });

        SocketManager.on('lamp-update', (lampData) => {
            this.updateLamp(lampData);
        });

        SocketManager.on('grand-lamp-activated', () => {
            this.grandLampActive = true;
            this.ritualCircleGraphics.clear();
            this.ritualCircleGraphics.lineStyle(4, 0xffd700, 1);
            this.ritualCircleGraphics.strokeCircle(
                GAME_CONSTANTS.RITUAL_CIRCLE.x,
                GAME_CONSTANTS.RITUAL_CIRCLE.y,
                GAME_CONSTANTS.RITUAL_CIRCLE.radius
            );
        });

        SocketManager.on('chaathan-update', (data) => {
            this.updateAIChaathans(data.chaathans);
        });

        SocketManager.on('aura-update', (data) => {
            if (data.playerId === this.myId) {
                this.myAura = data.aura;
                this.updateAuraDisplay();
            }
        });

        SocketManager.on('talisman-update', (data) => {
            if (data.playerId === this.myId) {
                this.myTalismans = data.talismans;
                this.updateTalismanDisplay();
            }
        });

        SocketManager.on('player-respawn', (data) => {
            if (data.playerId === this.myId) {
                this.isTransitioning = true;

                const sprite = this.players.get(this.myId);
                if (sprite) {
                    sprite.x = data.x;
                    sprite.y = data.y;
                    if (sprite.nameTag) {
                        sprite.nameTag.x = data.x;
                        sprite.nameTag.y = data.y - 30;
                    }
                }
                this.myAura = data.aura;
                this.updateAuraDisplay();

                const newRoomX = Math.floor(data.x / GAME_CONSTANTS.ROOM_WIDTH);
                const newRoomY = Math.floor(data.y / GAME_CONSTANTS.ROOM_HEIGHT);

                const camX = newRoomX * GAME_CONSTANTS.ROOM_WIDTH;
                const camY = newRoomY * GAME_CONSTANTS.ROOM_HEIGHT;
                this.cameras.main.setScroll(camX, camY);

                this.currentRoomX = newRoomX;
                this.currentRoomY = newRoomY;

                this.showMessage('You respawned!', 0xff6666);

                this.time.delayedCall(300, () => {
                    this.isTransitioning = false;
                });
            } else {
                const sprite = this.players.get(data.playerId);
                if (sprite) {
                    sprite.x = data.x;
                    sprite.y = data.y;
                    if (sprite.nameTag) {
                        sprite.nameTag.x = data.x;
                        sprite.nameTag.y = data.y - 30;
                    }
                }
            }
        });

        SocketManager.on('player-died', (data) => {
            if (data.playerId === this.myId) {
                this.isAlive = false;
                this.enterSpectatorMode();
            }
            const sprite = this.players.get(data.playerId);
            if (sprite) {
                sprite.setAlpha(0.3);
                if (sprite.nameTag) sprite.nameTag.setAlpha(0.3);
            }
        });

        SocketManager.on('ritual-progress', (data) => {
            this.ritualProgress = data.progress;
            this.ritualTotal = data.total;
            this.updateRitualDisplay();
        });

        SocketManager.on('ritual-disrupted', () => {
            this.ritualText.setText('Ritual disrupted!');
            this.time.delayedCall(2000, () => {
                this.ritualText.setText('');
            });
        });

        SocketManager.on('timer-update', (time) => {
            this.timerText.setText(this.formatTime(time));
        });

        SocketManager.on('game-over', (data) => {
            SocketManager.removeAllListeners();
            if (data.winner === 'poojari_win') {
                this.scene.start('CinematicScene', {
                    type: 'end',
                    nextScene: 'EndScene',
                    nextSceneData: { winner: data.winner }
                });
            } else {
                this.scene.start('EndScene', { winner: data.winner });
            }
        });
    }

    updateAIChaathans(chaathansData) {
        chaathansData.forEach((cData, index) => {
            if (this.aiChaathans[index]) {
                this.aiChaathans[index].x = cData.x;
                this.aiChaathans[index].y = cData.y;
                this.aiChaathans[index].state = cData.state;
            }
        });
    }

    updateAuraDisplay() {
        const maxWidth = 196;
        const newWidth = (this.myAura / GAME_CONSTANTS.AURA_MAX) * maxWidth;
        this.auraBar.width = Math.max(0, newWidth);

        const percent = Math.round(this.myAura);
        this.auraText.setText(`${percent}%`);

        if (this.myAura < 30) {
            this.auraBar.setFillStyle(0xff0000);
        } else if (this.myAura < 60) {
            this.auraBar.setFillStyle(0xffaa00);
        } else {
            this.auraBar.setFillStyle(0xffff00);
        }
    }

    updateTalismanDisplay() {
        for (let i = 0; i < GAME_CONSTANTS.TALISMAN_COUNT; i++) {
            if (i < this.myTalismans) {
                this.talismanIcons[i].setText('❤️');
            } else {
                this.talismanIcons[i].setText('🖤');
            }
        }
    }

    enterSpectatorMode() {
        this.showMessage('You have died! Spectating...', 0xff0000);

        const alivePlayers = [];
        this.players.forEach((sprite) => {
            if (sprite.playerId !== this.myId && sprite.isAlive) {
                alivePlayers.push(sprite);
            }
        });

        if (alivePlayers.length > 0) {
            const target = alivePlayers[0];
            this.currentRoomX = Math.floor(target.x / GAME_CONSTANTS.ROOM_WIDTH);
            this.currentRoomY = Math.floor(target.y / GAME_CONSTANTS.ROOM_HEIGHT);
            this.setCameraToRoom(this.currentRoomX, this.currentRoomY);
        }
    }

    showMessage(text, color) {
        const msg = this.add.text(400, 300, text, {
            font: 'bold 24px Courier New',
            fill: Phaser.Display.Color.IntegerToColor(color).rgba
        }).setOrigin(0.5).setScrollFactor(0).setDepth(200);

        this.tweens.add({
            targets: msg,
            alpha: 0,
            y: 250,
            duration: 2000,
            onComplete: () => msg.destroy()
        });
    }

    update() {
        if (!this.isAlive || this.isTransitioning) return;

        this.handleMovement();
        this.checkRoomTransition();
        this.updateMinimap();
    }

    handleMovement() {
        const mySprite = this.players.get(this.myId);
        if (!mySprite) return;

        let vx = 0;
        let vy = 0;

        if (this.cursors.left.isDown || this.wasd.left.isDown) vx = -1;
        else if (this.cursors.right.isDown || this.wasd.right.isDown) vx = 1;

        if (this.cursors.up.isDown || this.wasd.up.isDown) vy = -1;
        else if (this.cursors.down.isDown || this.wasd.down.isDown) vy = 1;

        if (vx !== 0 || vy !== 0) {
            const speed = GAME_CONSTANTS.PLAYER_SPEED / 60;
            let newX = mySprite.x + vx * speed;
            let newY = mySprite.y + vy * speed;

            newX = Phaser.Math.Clamp(newX, 50, GAME_CONSTANTS.MAP_WIDTH - 50);
            newY = Phaser.Math.Clamp(newY, 50, GAME_CONSTANTS.MAP_HEIGHT - 50);

            if (vx !== 0 && vy !== 0) {
                if (this.canMoveTo(newX, newY)) {
                    mySprite.x = newX;
                    mySprite.y = newY;
                } else if (this.canMoveTo(newX, mySprite.y)) {
                    mySprite.x = newX;
                } else if (this.canMoveTo(mySprite.x, newY)) {
                    mySprite.y = newY;
                }
            } else {
                if (this.canMoveTo(newX, newY)) {
                    mySprite.x = newX;
                    mySprite.y = newY;
                }
            }

            if (mySprite.nameTag) {
                mySprite.nameTag.x = mySprite.x;
                mySprite.nameTag.y = mySprite.y - 30;
            }

            SocketManager.sendMove(mySprite.x, mySprite.y);
        }
    }

    tryInteract() {
        if (!this.isAlive) return;

        const mySprite = this.players.get(this.myId);
        if (!mySprite) return;

        const interactDist = GAME_CONSTANTS.INTERACTION_DISTANCE;

        for (const lamp of this.lamps) {
            const dist = Phaser.Math.Distance.Between(mySprite.x, mySprite.y, lamp.x, lamp.y);
            if (dist < interactDist) {
                if (lamp.state === 'unlit' && lamp.lampType === 'mini') {
                    SocketManager.emit('light-lamp', lamp.lampId);
                    return;
                } else if (lamp.state === 'lit') {
                    SocketManager.emit('refuel-aura', lamp.lampId);
                    return;
                }
            }
        }
    }

    onLampClick(lamp) {
        if (!this.isAlive) return;

        const mySprite = this.players.get(this.myId);
        if (!mySprite) return;

        const dist = Phaser.Math.Distance.Between(mySprite.x, mySprite.y, lamp.x, lamp.y);
        if (dist < GAME_CONSTANTS.INTERACTION_DISTANCE) {
            if (lamp.state === 'unlit' && lamp.lampType === 'mini') {
                SocketManager.emit('light-lamp', lamp.lampId);
            } else if (lamp.state === 'lit') {
                SocketManager.emit('refuel-aura', lamp.lampId);
            }
        }
    }

    updateLamp(lampData) {
        const lampIndex = this.lamps.findIndex(l => l.lampId === lampData.id);
        if (lampIndex === -1) return;

        const lamp = this.lamps[lampIndex];
        const isGrand = lampData.type === 'grand';
        const miniLampScale = 0.15;

        if (lampData.state === 'lit') {
            if (isGrand) {
                lamp.state = lampData.state;
                lamp.setFillStyle(0xffd700);
                this.tweens.add({
                    targets: lamp,
                    scaleX: 1.2,
                    scaleY: 1.2,
                    duration: 200,
                    yoyo: true
                });
            } else if (lamp.isSprite && this.textures.exists('mini-lamp-lit')) {
                const x = lamp.x;
                const y = lamp.y;
                const lampId = lamp.lampId;
                const lampType = lamp.lampType;

                lamp.destroy();

                const newLamp = this.add.sprite(x, y, 'mini-lamp-lit', 'mini_lamp_1.png');
                newLamp.setScale(miniLampScale);
                newLamp.setInteractive();
                newLamp.setDepth(5);
                newLamp.lampId = lampId;
                newLamp.lampType = lampType;
                newLamp.state = 'lit';
                newLamp.isSprite = true;

                if (this.anims.exists('mini-lamp-flame')) {
                    newLamp.play('mini-lamp-flame');
                }

                newLamp.on('pointerdown', () => this.onLampClick(newLamp));

                this.lamps[lampIndex] = newLamp;

                this.tweens.add({
                    targets: newLamp,
                    scaleX: miniLampScale * 1.2,
                    scaleY: miniLampScale * 1.2,
                    duration: 200,
                    yoyo: true
                });
            } else {
                lamp.state = lampData.state;
                if (lamp.setFillStyle) {
                    lamp.setFillStyle(0xffaa00);
                }
                this.tweens.add({
                    targets: lamp,
                    scaleX: 1.2,
                    scaleY: 1.2,
                    duration: 200,
                    yoyo: true
                });
            }
        } else {
            lamp.state = lampData.state;
            if (!lamp.isSprite && lamp.setFillStyle) {
                lamp.setFillStyle(0x444444);
            }
        }
    }

    updateRitualDisplay() {
        if (this.ritualProgress > 0) {
            const percent = Math.round((this.ritualProgress / this.ritualTotal) * 100);
            this.ritualText.setText(`Ritual: ${percent}%`);
        } else {
            this.ritualText.setText('');
        }
    }

    formatTime(ms) {
        const totalSeconds = Math.max(0, Math.floor(ms / 1000));
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
}
