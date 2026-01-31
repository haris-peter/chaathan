import Phaser from 'phaser';
import { SocketManager } from '../network/SocketManager.js';
import { GAME_CONSTANTS } from '../config.js';

export class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    init(data) {
        this.gameData = data;
        this.myId = SocketManager.socket?.id;
        this.myRole = data.yourRole;
        this.players = new Map();
        this.lamps = new Map();
        this.doors = new Map();
        this.ritualItem = null;
        this.ritualCircle = null;
        this.ritualProgress = 0;
        this.timeRemaining = data.timeRemaining || 300000;
        this.chaathanCooldowns = {
            flicker: 0,
            extinguish: 0,
            seal: 0,
            push: 0
        };
        this.selectedTarget = null;
        this.currentRoomX = 0;
        this.currentRoomY = 0;
        this.isTransitioning = false;
    }

    create() {
        this.physics.world.setBounds(0, 0, GAME_CONSTANTS.MAP_WIDTH, GAME_CONSTANTS.MAP_HEIGHT);

        this.createMap();
        this.createRitualCircle();
        this.createLamps();
        this.createDoors();
        this.createRitualItem();
        this.createPlayers();
        this.setupCamera();
        this.createUI();
        this.setupControls();
        this.setupNetwork();
        this.createShadowEffects();
    }

    createMap() {
        const tileSize = GAME_CONSTANTS.TILE_SIZE;
        const mapTilesX = Math.ceil(GAME_CONSTANTS.MAP_WIDTH / tileSize);
        const mapTilesY = Math.ceil(GAME_CONSTANTS.MAP_HEIGHT / tileSize);

        for (let x = 0; x < mapTilesX; x++) {
            for (let y = 0; y < mapTilesY; y++) {
                const gridX = Math.floor(x / 25);
                const gridY = Math.floor(y / 19);
                const localX = x % 25;
                const localY = y % 19;

                const isOuterWall = x === 0 || x === mapTilesX - 1 || y === 0 || y === mapTilesY - 1;
                const isGridBorder = (localX === 0 || localX === 24) && (gridX > 0 || localX === 24);
                const isHorizontalWall = localY === 0 && gridY > 0;

                const hasDoorOpening = this.isDoorOpening(x, y, tileSize);

                if ((isOuterWall || isGridBorder || isHorizontalWall) && !hasDoorOpening) {
                    this.add.image(x * tileSize + tileSize / 2, y * tileSize + tileSize / 2, 'wall');
                } else {
                    this.add.image(x * tileSize + tileSize / 2, y * tileSize + tileSize / 2, 'floor');
                }
            }
        }

        this.walls = this.physics.add.staticGroup();

        this.add.rectangle(GAME_CONSTANTS.MAP_WIDTH / 2, 16, GAME_CONSTANTS.MAP_WIDTH, 32, 0x2d2520);
        this.add.rectangle(GAME_CONSTANTS.MAP_WIDTH / 2, GAME_CONSTANTS.MAP_HEIGHT - 16, GAME_CONSTANTS.MAP_WIDTH, 32, 0x2d2520);
        this.add.rectangle(16, GAME_CONSTANTS.MAP_HEIGHT / 2, 32, GAME_CONSTANTS.MAP_HEIGHT, 0x2d2520);
        this.add.rectangle(GAME_CONSTANTS.MAP_WIDTH - 16, GAME_CONSTANTS.MAP_HEIGHT / 2, 32, GAME_CONSTANTS.MAP_HEIGHT, 0x2d2520);

        const outerWalls = [
            { x: 0, y: 0, w: GAME_CONSTANTS.MAP_WIDTH, h: 32 },
            { x: 0, y: GAME_CONSTANTS.MAP_HEIGHT - 32, w: GAME_CONSTANTS.MAP_WIDTH, h: 32 },
            { x: 0, y: 0, w: 32, h: GAME_CONSTANTS.MAP_HEIGHT },
            { x: GAME_CONSTANTS.MAP_WIDTH - 32, y: 0, w: 32, h: GAME_CONSTANTS.MAP_HEIGHT }
        ];

        outerWalls.forEach(wall => {
            const rect = this.add.rectangle(wall.x + wall.w / 2, wall.y + wall.h / 2, wall.w, wall.h, 0x2d2520);
            rect.setAlpha(0);
            this.physics.add.existing(rect, true);
            this.walls.add(rect);
        });

        for (let gx = 1; gx < 3; gx++) {
            const wallX = gx * 800;
            for (let gy = 0; gy < 3; gy++) {
                const hasOpening = this.gameData.doors.some(d =>
                    Math.abs(d.x - wallX) < 50 && d.y >= gy * 600 && d.y < (gy + 1) * 600
                );
                if (!hasOpening) {
                    const rect = this.add.rectangle(wallX, gy * 600 + 300, 32, 600, 0x2d2520);
                    rect.setAlpha(0);
                    this.physics.add.existing(rect, true);
                    this.walls.add(rect);
                }
            }
        }

        this.addRoomLabels();
    }

    isDoorOpening(tileX, tileY, tileSize) {
        const pixelX = tileX * tileSize + tileSize / 2;
        const pixelY = tileY * tileSize + tileSize / 2;

        return this.gameData.doors.some(door => {
            const dx = Math.abs(door.x - pixelX);
            const dy = Math.abs(door.y - pixelY);
            return dx < 40 && dy < 40;
        });
    }

    addRoomLabels() {
        if (this.myRole !== 'chaathan') return;

        const rooms = [
            { x: 400, y: 300, name: 'ENTRANCE HALL' },
            { x: 1200, y: 300, name: 'MAIN HALL' },
            { x: 2000, y: 300, name: 'EAST WING' },
            { x: 400, y: 900, name: 'WEST CHAMBER' },
            { x: 1200, y: 900, name: 'CENTRAL ROOM' },
            { x: 2000, y: 900, name: 'ANCESTORS HALL' },
            { x: 400, y: 1500, name: 'STORAGE' },
            { x: 1200, y: 1500, name: 'KITCHEN' },
            { x: 2000, y: 1500, name: 'POOJA ROOM' }
        ];

        rooms.forEach(room => {
            const color = room.name === 'POOJA ROOM' ? '#550000' : '#333333';
            this.add.text(room.x, room.y - 200, room.name, {
                font: '14px Courier New',
                fill: color
            }).setOrigin(0.5);
        });
    }

    setupCamera() {
        this.cameras.main.setBounds(0, 0, GAME_CONSTANTS.MAP_WIDTH, GAME_CONSTANTS.MAP_HEIGHT);
        this.cameras.main.setZoom(1);

        if (this.myPlayer) {
            this.currentRoomX = Math.floor(this.myPlayer.x / GAME_CONSTANTS.ROOM_WIDTH);
            this.currentRoomY = Math.floor(this.myPlayer.y / GAME_CONSTANTS.ROOM_HEIGHT);
            this.setCameraToRoom(this.currentRoomX, this.currentRoomY);
        }
    }

    setCameraToRoom(roomX, roomY) {
        const camX = roomX * GAME_CONSTANTS.ROOM_WIDTH + GAME_CONSTANTS.ROOM_WIDTH / 2;
        const camY = roomY * GAME_CONSTANTS.ROOM_HEIGHT + GAME_CONSTANTS.ROOM_HEIGHT / 2;
        this.cameras.main.centerOn(camX, camY);
    }

    checkRoomTransition() {
        if (this.isTransitioning || !this.myPlayer) return;

        const playerX = this.myPlayer.x;
        const playerY = this.myPlayer.y;
        const threshold = GAME_CONSTANTS.EDGE_THRESHOLD;
        const roomWidth = GAME_CONSTANTS.ROOM_WIDTH;
        const roomHeight = GAME_CONSTANTS.ROOM_HEIGHT;

        const roomLeft = this.currentRoomX * roomWidth;
        const roomRight = roomLeft + roomWidth;
        const roomTop = this.currentRoomY * roomHeight;
        const roomBottom = roomTop + roomHeight;

        let newRoomX = this.currentRoomX;
        let newRoomY = this.currentRoomY;
        let newPlayerX = playerX;
        let newPlayerY = playerY;

        if (playerX < roomLeft + threshold && this.currentRoomX > 0) {
            if (this.hasDoorBetweenRooms(this.currentRoomX - 1, this.currentRoomY, 'horizontal', playerY)) {
                newRoomX = this.currentRoomX - 1;
                newPlayerX = (newRoomX + 1) * roomWidth - threshold - 10;
            }
        } else if (playerX > roomRight - threshold && this.currentRoomX < GAME_CONSTANTS.ROOM_COLS - 1) {
            if (this.hasDoorBetweenRooms(this.currentRoomX, this.currentRoomY, 'horizontal', playerY)) {
                newRoomX = this.currentRoomX + 1;
                newPlayerX = newRoomX * roomWidth + threshold + 10;
            }
        }

        if (playerY < roomTop + threshold && this.currentRoomY > 0) {
            if (this.hasDoorBetweenRooms(this.currentRoomX, this.currentRoomY - 1, 'vertical', playerX)) {
                newRoomY = this.currentRoomY - 1;
                newPlayerY = (newRoomY + 1) * roomHeight - threshold - 10;
            }
        } else if (playerY > roomBottom - threshold && this.currentRoomY < GAME_CONSTANTS.ROOM_ROWS - 1) {
            if (this.hasDoorBetweenRooms(this.currentRoomX, this.currentRoomY, 'vertical', playerX)) {
                newRoomY = this.currentRoomY + 1;
                newPlayerY = newRoomY * roomHeight + threshold + 10;
            }
        }

        if (newRoomX !== this.currentRoomX || newRoomY !== this.currentRoomY) {
            this.transitionToRoom(newRoomX, newRoomY, newPlayerX, newPlayerY);
        }
    }

    hasDoorBetweenRooms(roomX, roomY, direction, playerPos) {
        const doorProximity = 80;

        for (const door of this.gameData.doors) {
            if (direction === 'horizontal') {
                const wallX = (roomX + 1) * GAME_CONSTANTS.ROOM_WIDTH;
                const roomTop = roomY * GAME_CONSTANTS.ROOM_HEIGHT;
                const roomBottom = roomTop + GAME_CONSTANTS.ROOM_HEIGHT;

                if (Math.abs(door.x - wallX) < 50 && door.y >= roomTop && door.y < roomBottom) {
                    if (Math.abs(playerPos - door.y) < doorProximity) {
                        const doorSprite = this.doors.get(door.id);
                        if (!doorSprite || doorSprite.doorState !== 'sealed') {
                            return true;
                        }
                    }
                }
            } else {
                const wallY = (roomY + 1) * GAME_CONSTANTS.ROOM_HEIGHT;
                const roomLeft = roomX * GAME_CONSTANTS.ROOM_WIDTH;
                const roomRight = roomLeft + GAME_CONSTANTS.ROOM_WIDTH;

                if (Math.abs(door.y - wallY) < 50 && door.x >= roomLeft && door.x < roomRight) {
                    if (Math.abs(playerPos - door.x) < doorProximity) {
                        const doorSprite = this.doors.get(door.id);
                        if (!doorSprite || doorSprite.doorState !== 'sealed') {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }

    transitionToRoom(newRoomX, newRoomY, newPlayerX, newPlayerY) {
        this.isTransitioning = true;
        this.myPlayer.setVelocity(0, 0);

        const targetCamX = newRoomX * GAME_CONSTANTS.ROOM_WIDTH + GAME_CONSTANTS.ROOM_WIDTH / 2;
        const targetCamY = newRoomY * GAME_CONSTANTS.ROOM_HEIGHT + GAME_CONSTANTS.ROOM_HEIGHT / 2;

        this.cameras.main.stopFollow();

        this.add.rectangle(
            this.cameras.main.scrollX + GAME_CONSTANTS.SCREEN_WIDTH / 2,
            this.cameras.main.scrollY + GAME_CONSTANTS.SCREEN_HEIGHT / 2,
            GAME_CONSTANTS.SCREEN_WIDTH,
            GAME_CONSTANTS.SCREEN_HEIGHT,
            0x000000, 0
        ).setDepth(200).setScrollFactor(0);

        this.tweens.add({
            targets: this.cameras.main,
            scrollX: targetCamX - GAME_CONSTANTS.SCREEN_WIDTH / 2,
            scrollY: targetCamY - GAME_CONSTANTS.SCREEN_HEIGHT / 2,
            duration: GAME_CONSTANTS.TRANSITION_DURATION,
            ease: 'Power2',
            onComplete: () => {
                this.myPlayer.setPosition(newPlayerX, newPlayerY);
                this.currentRoomX = newRoomX;
                this.currentRoomY = newRoomY;
                this.isTransitioning = false;
                SocketManager.sendMove(this.myPlayer.x, this.myPlayer.y);
            }
        });
    }

    createRitualCircle() {
        const rc = this.gameData.ritualCircle;
        this.ritualCircle = this.add.image(rc.x, rc.y, 'ritual-circle');
        this.ritualCircle.setAlpha(0.8);

        this.ritualCrack = this.add.image(rc.x, rc.y, 'ritual-crack');
        this.ritualCrack.setAlpha(0);

        this.ritualProgressGraphics = this.add.graphics();
    }

    createLamps() {
        this.gameData.lamps.forEach(lampData => {
            const texture = lampData.state === 'lit' ? 'lamp-lit' :
                lampData.state === 'flickering' ? 'lamp-flicker' : 'lamp-unlit';
            const lamp = this.add.image(lampData.x, lampData.y, texture);
            lamp.setInteractive();
            lamp.lampId = lampData.id;
            lamp.lampState = lampData.state;
            lamp.setScale(1.5);

            lamp.on('pointerdown', () => this.onLampClick(lamp));

            this.lamps.set(lampData.id, lamp);
        });
    }

    createDoors() {
        this.gameData.doors.forEach(doorData => {
            const texture = doorData.state === 'sealed' ? 'door-sealed' : 'door-open';
            const door = this.add.image(doorData.x, doorData.y, texture);
            door.setInteractive();
            door.doorId = doorData.id;
            door.doorState = doorData.state;
            door.setScale(1.5);

            door.on('pointerdown', () => this.onDoorClick(door));

            this.doors.set(doorData.id, door);
        });
    }

    createRitualItem() {
        const item = this.gameData.ritualItem;
        this.ritualItem = this.add.image(item.x, item.y, 'ritual-item');
        this.ritualItem.setInteractive();
        this.ritualItem.carrier = item.carrier;
        this.ritualItem.setScale(1.5);

        this.ritualItem.on('pointerdown', () => this.onItemClick());

        if (item.carrier) {
            this.ritualItem.setVisible(false);
        }
    }

    createPlayers() {
        this.gameData.players.forEach(playerData => {
            this.createPlayerSprite(playerData);
        });

        if (this.myPlayer) {
            this.cameras.main.startFollow(this.myPlayer, true, 0.1, 0.1);
        }
    }

    createPlayerSprite(playerData) {
        const isMe = playerData.id === this.myId;
        const isChaathan = playerData.role === 'chaathan';

        if (isChaathan && !isMe && this.myRole !== 'chaathan') {
            return;
        }

        let sprite;
        if (isChaathan) {
            sprite = this.physics.add.sprite(playerData.x, playerData.y, 'chaathan-sprite', 'chathan_1.png');
            sprite.setScale(0.12);
            if (!isMe) {
                sprite.setAlpha(0.6);
            }
        } else {
            sprite = this.physics.add.sprite(playerData.x, playerData.y, 'player');
            sprite.setScale(1.2);
        }

        sprite.setCollideWorldBounds(true);
        sprite.playerId = playerData.id;
        sprite.playerRole = playerData.role;
        sprite.isCarryingItem = playerData.isCarryingItem;
        sprite.isChaathan = isChaathan;

        if (isMe) {
            if (!isChaathan) {
                sprite.setTint(0x88ff88);
            }
            this.myPlayer = sprite;
            this.physics.add.collider(sprite, this.walls);
        } else {
            sprite.setInteractive();
            sprite.on('pointerdown', () => this.onPlayerClick(sprite));
        }

        this.players.set(playerData.id, sprite);
    }

    createUI() {
        this.timerText = this.add.text(400, 20, this.formatTime(this.timeRemaining), {
            font: 'bold 28px Courier New',
            fill: '#cc0000',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setScrollFactor(0).setDepth(100);

        this.ritualStatusText = this.add.text(400, 580, '', {
            font: '16px Courier New',
            fill: '#ffcc00'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(100);

        if (this.myRole === 'chaathan') {
            this.minimapGraphics = this.add.graphics();
            this.minimapGraphics.setScrollFactor(0).setDepth(100);
            this.createMinimap();
        }

        if (this.myRole === 'chaathan') {
            this.createChaathanUI();
        } else {
            this.createPoojariUI();
        }
    }

    createMinimap() {
        const mmX = 700, mmY = 500, mmW = 90, mmH = 68;

        this.minimapGraphics.fillStyle(0x000000, 0.7);
        this.minimapGraphics.fillRect(mmX - 5, mmY - 5, mmW + 10, mmH + 10);

        this.minimapGraphics.lineStyle(1, 0x444444, 1);
        for (let i = 0; i <= 3; i++) {
            this.minimapGraphics.lineBetween(mmX + i * 30, mmY, mmX + i * 30, mmY + mmH);
        }
        for (let i = 0; i <= 3; i++) {
            this.minimapGraphics.lineBetween(mmX, mmY + i * (mmH / 3), mmX + mmW, mmY + i * (mmH / 3));
        }

        this.minimapPlayerDot = this.add.circle(mmX, mmY, 3, 0x00ff00);
        this.minimapPlayerDot.setScrollFactor(0).setDepth(101);
    }

    updateMinimap() {
        if (!this.myPlayer || !this.minimapPlayerDot) return;

        const mmX = 700, mmY = 500, mmW = 90, mmH = 68;
        const px = (this.myPlayer.x / GAME_CONSTANTS.MAP_WIDTH) * mmW + mmX;
        const py = (this.myPlayer.y / GAME_CONSTANTS.MAP_HEIGHT) * mmH + mmY;
        this.minimapPlayerDot.setPosition(px, py);
    }

    createChaathanUI() {
        const maskBg = this.add.rectangle(80, 100, 140, 180, 0x1a0000, 0.8);
        maskBg.setScrollFactor(0).setDepth(100);

        this.add.image(80, 70, 'chaathan-mask').setScale(0.4).setScrollFactor(0).setDepth(101);

        this.add.text(80, 120, 'CHAATHAN', {
            font: 'bold 12px Courier New',
            fill: '#8b0000'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(101);

        this.abilityTexts = {};
        const abilities = [
            { key: 'flicker', label: '[1] Flicker', y: 145 },
            { key: 'extinguish', label: '[2] Extinguish', y: 160 },
            { key: 'seal', label: '[3] Seal Door', y: 175 },
            { key: 'push', label: '[4] Push', y: 190 }
        ];

        abilities.forEach(ab => {
            this.abilityTexts[ab.key] = this.add.text(80, ab.y, ab.label, {
                font: '10px Courier New',
                fill: '#cccccc'
            }).setOrigin(0.5).setScrollFactor(0).setDepth(101);
        });
    }

    createPoojariUI() {
        const statusBg = this.add.rectangle(100, 100, 160, 120, 0x001a00, 0.7);
        statusBg.setScrollFactor(0).setDepth(100);

        this.add.text(100, 60, 'POOJARI', {
            font: 'bold 14px Courier New',
            fill: '#00aa00'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(101);

        this.add.text(100, 85, 'Tasks:', {
            font: '11px Courier New',
            fill: '#88ff88'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(101);

        this.lampStatusText = this.add.text(100, 105, '◯ Light 3 lamps', {
            font: '11px Courier New',
            fill: '#cccccc'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(101);

        this.itemStatusText = this.add.text(100, 125, '◯ Get ritual item', {
            font: '11px Courier New',
            fill: '#cccccc'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(101);

        this.circleStatusText = this.add.text(100, 145, '◯ Gather in circle', {
            font: '11px Courier New',
            fill: '#cccccc'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(101);
    }

    setupControls() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            interact: Phaser.Input.Keyboard.KeyCodes.E,
            drop: Phaser.Input.Keyboard.KeyCodes.Q
        });

        if (this.myRole === 'chaathan') {
            this.input.keyboard.on('keydown-ONE', () => this.useChaathanAbility('flicker'));
            this.input.keyboard.on('keydown-TWO', () => this.useChaathanAbility('extinguish'));
            this.input.keyboard.on('keydown-THREE', () => this.useChaathanAbility('seal'));
            this.input.keyboard.on('keydown-FOUR', () => this.useChaathanAbility('push'));
        }

        this.input.keyboard.on('keydown-E', () => {
            if (this.myRole !== 'chaathan') {
                this.tryInteract();
            }
        });

        this.input.keyboard.on('keydown-Q', () => {
            if (this.myPlayer?.isCarryingItem) {
                SocketManager.dropItem();
            }
        });
    }

    setupNetwork() {
        SocketManager.on('player-moved', (data) => {
            const player = this.players.get(data.playerId);
            if (player) {
                this.tweens.add({
                    targets: player,
                    x: data.x,
                    y: data.y,
                    duration: 50,
                    ease: 'Linear'
                });
                player.isCarryingItem = data.isCarryingItem;
            }
        });

        SocketManager.on('player-joined', (data) => {
            if (!this.players.has(data.player.id)) {
                this.createPlayerSprite(data.player);
            }
        });

        SocketManager.on('player-left', (data) => {
            const player = this.players.get(data.playerId);
            if (player) {
                player.destroy();
                this.players.delete(data.playerId);
            }
        });

        SocketManager.on('lamp-update', (lamp) => {
            this.updateLamp(lamp);
        });

        SocketManager.on('door-update', (door) => {
            this.updateDoor(door);
        });

        SocketManager.on('item-pickup', (data) => {
            this.ritualItem.carrier = data.playerId;
            this.ritualItem.setVisible(false);

            const player = this.players.get(data.playerId);
            if (player) {
                player.isCarryingItem = true;
                if (data.playerId === this.myId) {
                    this.myPlayer.isCarryingItem = true;
                }
            }
            this.updatePoojariStatus();
        });

        SocketManager.on('item-drop', (data) => {
            this.ritualItem.carrier = null;
            this.ritualItem.setPosition(data.item.x, data.item.y);
            this.ritualItem.setVisible(true);

            const player = this.players.get(data.playerId);
            if (player) {
                player.isCarryingItem = false;
                if (data.playerId === this.myId) {
                    this.myPlayer.isCarryingItem = false;
                }
            }
            this.updatePoojariStatus();
        });

        SocketManager.on('player-pushed', (data) => {
            const player = this.players.get(data.playerId);
            if (player) {
                this.tweens.add({
                    targets: player,
                    x: data.x,
                    y: data.y,
                    duration: 200,
                    ease: 'Power2'
                });

                if (data.playerId === this.myId) {
                    this.myPlayer.x = data.x;
                    this.myPlayer.y = data.y;
                    this.cameras.main.shake(200, 0.01);
                }
            }
            this.showRitualDisruption();
        });

        SocketManager.on('timer-update', (time) => {
            this.timeRemaining = time;
            this.timerText.setText(this.formatTime(time));

            if (time <= 60000) {
                this.timerText.setFill('#ff0000');
            }
        });

        SocketManager.on('ritual-progress', (data) => {
            this.ritualProgress = data.progress;
            this.updateRitualProgressDisplay();

            if (data.progress > 0) {
                this.ritualStatusText.setText(`Ritual: ${Math.floor(data.progress / 1000)}/${data.total / 1000}s`);
            } else {
                this.ritualStatusText.setText('');
            }
        });

        SocketManager.on('ritual-disrupted', () => {
            this.showRitualDisruption();
        });

        SocketManager.on('cooldown-update', (data) => {
            this.chaathanCooldowns[data.ability] = data.cooldownEnd;
        });

        SocketManager.on('game-over', (data) => {
            SocketManager.removeAllListeners();
            this.scene.start('EndScene', { winner: data.winner, role: this.myRole });
        });
    }

    createShadowEffects() {
        if (this.myRole === 'chaathan') return;

        this.shadowSprites = [];

        this.time.addEvent({
            delay: Phaser.Math.Between(8000, 15000),
            callback: () => {
                this.showRandomShadow();
                this.time.addEvent({
                    delay: Phaser.Math.Between(8000, 15000),
                    callback: this.createShadowEffects,
                    callbackScope: this
                });
            },
            callbackScope: this
        });
    }

    showRandomShadow() {
        if (!this.myPlayer) return;

        const offsetX = Phaser.Math.Between(-300, 300);
        const offsetY = Phaser.Math.Between(-200, 200);
        const x = Phaser.Math.Clamp(this.myPlayer.x + offsetX, 50, GAME_CONSTANTS.MAP_WIDTH - 50);
        const y = Phaser.Math.Clamp(this.myPlayer.y + offsetY, 50, GAME_CONSTANTS.MAP_HEIGHT - 50);

        const shadow = this.add.image(x, y, 'shadow-silhouette');
        shadow.setAlpha(0).setDepth(50);

        this.tweens.add({
            targets: shadow,
            alpha: 0.4,
            duration: 500,
            yoyo: true,
            hold: 1000,
            onComplete: () => shadow.destroy()
        });
    }

    update() {
        if (!this.myPlayer) return;

        if (!this.isTransitioning) {
            this.handleMovement();
            this.checkRoomTransition();
        }
        this.updateCooldownDisplay();
        this.updateMinimap();
    }

    handleMovement() {
        const speed = GAME_CONSTANTS.PLAYER_SPEED;
        let vx = 0;
        let vy = 0;

        if (this.cursors.left.isDown || this.wasd.left.isDown) vx = -speed;
        else if (this.cursors.right.isDown || this.wasd.right.isDown) vx = speed;

        if (this.cursors.up.isDown || this.wasd.up.isDown) vy = -speed;
        else if (this.cursors.down.isDown || this.wasd.down.isDown) vy = speed;

        this.myPlayer.setVelocity(vx, vy);

        if (vx < 0) {
            this.myPlayer.setFlipX(true);
        } else if (vx > 0) {
            this.myPlayer.setFlipX(false);
        }

        if (this.myPlayer.isChaathan) {
            if (vx !== 0 || vy !== 0) {
                if (!this.myPlayer.anims.isPlaying) {
                    this.myPlayer.play('chaathan-walk');
                }
            } else {
                this.myPlayer.stop();
                this.myPlayer.setFrame('chathan_1.png');
            }
        }

        if (vx !== 0 || vy !== 0) {
            SocketManager.sendMove(this.myPlayer.x, this.myPlayer.y);
        }
    }

    tryInteract() {
        const playerX = this.myPlayer.x;
        const playerY = this.myPlayer.y;
        const interactDist = GAME_CONSTANTS.INTERACTION_DISTANCE;

        if (!this.myPlayer.isCarryingItem && this.ritualItem.visible) {
            const itemDist = Phaser.Math.Distance.Between(playerX, playerY, this.ritualItem.x, this.ritualItem.y);
            if (itemDist < interactDist) {
                SocketManager.pickupItem();
                return;
            }
        }

        this.lamps.forEach((lamp, id) => {
            if (lamp.lampState === 'unlit') {
                const dist = Phaser.Math.Distance.Between(playerX, playerY, lamp.x, lamp.y);
                if (dist < interactDist) {
                    SocketManager.lightLamp(id);
                }
            }
        });
    }

    onLampClick(lamp) {
        this.selectedTarget = { type: 'lamp', id: lamp.lampId };
        this.highlightTarget(lamp);
    }

    onDoorClick(door) {
        this.selectedTarget = { type: 'door', id: door.doorId };
        this.highlightTarget(door);
    }

    onPlayerClick(player) {
        if (this.myRole === 'chaathan' && player.playerRole === 'poojari') {
            this.selectedTarget = { type: 'player', id: player.playerId };
            this.highlightTarget(player);
        }
    }

    onItemClick() {
        if (this.myRole !== 'chaathan' && !this.myPlayer.isCarryingItem) {
            const dist = Phaser.Math.Distance.Between(
                this.myPlayer.x, this.myPlayer.y,
                this.ritualItem.x, this.ritualItem.y
            );
            if (dist < GAME_CONSTANTS.INTERACTION_DISTANCE) {
                SocketManager.pickupItem();
            }
        }
    }

    highlightTarget(target) {
        if (this.highlightGraphics) this.highlightGraphics.destroy();

        this.highlightGraphics = this.add.graphics();
        this.highlightGraphics.lineStyle(2, 0xff0000, 1);
        this.highlightGraphics.strokeCircle(target.x, target.y, 40);

        this.time.delayedCall(2000, () => {
            if (this.highlightGraphics) {
                this.highlightGraphics.destroy();
                this.highlightGraphics = null;
            }
        });
    }

    useChaathanAbility(ability) {
        if (this.myRole !== 'chaathan') return;

        const now = Date.now();
        if (now < this.chaathanCooldowns[ability]) return;

        if (!this.selectedTarget) return;

        switch (ability) {
            case 'flicker':
                if (this.selectedTarget.type === 'lamp') {
                    SocketManager.chaathanFlicker(this.selectedTarget.id);
                }
                break;
            case 'extinguish':
                if (this.selectedTarget.type === 'lamp') {
                    SocketManager.chaathanExtinguish(this.selectedTarget.id);
                }
                break;
            case 'seal':
                if (this.selectedTarget.type === 'door') {
                    SocketManager.chaathanSealDoor(this.selectedTarget.id);
                }
                break;
            case 'push':
                if (this.selectedTarget.type === 'player') {
                    SocketManager.chaathanPush(this.selectedTarget.id);
                }
                break;
        }

        this.selectedTarget = null;
        if (this.highlightGraphics) {
            this.highlightGraphics.destroy();
            this.highlightGraphics = null;
        }
    }

    updateLamp(lampData) {
        const lamp = this.lamps.get(lampData.id);
        if (lamp) {
            lamp.lampState = lampData.state;

            const texture = lampData.state === 'lit' ? 'lamp-lit' :
                lampData.state === 'flickering' ? 'lamp-flicker' : 'lamp-unlit';
            lamp.setTexture(texture);

            if (lampData.state === 'flickering') {
                this.tweens.add({
                    targets: lamp,
                    alpha: { from: 1, to: 0.3 },
                    duration: 100,
                    yoyo: true,
                    repeat: 10
                });
            }
        }
        this.updatePoojariStatus();
    }

    updateDoor(doorData) {
        const door = this.doors.get(doorData.id);
        if (door) {
            door.doorState = doorData.state;
            door.setTexture(doorData.state === 'sealed' ? 'door-sealed' : 'door-open');
        }
    }

    updateRitualProgressDisplay() {
        this.ritualProgressGraphics.clear();

        if (this.ritualProgress > 0) {
            const rc = this.gameData.ritualCircle;
            const progress = this.ritualProgress / 10000;

            this.ritualProgressGraphics.lineStyle(6, 0x00ff00, 0.8);
            this.ritualProgressGraphics.beginPath();
            this.ritualProgressGraphics.arc(rc.x, rc.y, 85, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * progress));
            this.ritualProgressGraphics.strokePath();
        }
    }

    showRitualDisruption() {
        this.ritualCrack.setAlpha(1);
        this.cameras.main.shake(300, 0.02);

        this.tweens.add({
            targets: this.ritualCrack,
            alpha: 0,
            duration: 1000,
            ease: 'Power2'
        });
    }

    updatePoojariStatus() {
        if (this.myRole === 'chaathan') return;

        let litCount = 0;
        this.lamps.forEach(lamp => {
            if (lamp.lampState === 'lit') litCount++;
        });

        const lampsComplete = litCount === 3;
        this.lampStatusText.setText(lampsComplete ? '● Light 3 lamps' : `◯ Light lamps (${litCount}/3)`);
        this.lampStatusText.setFill(lampsComplete ? '#00ff00' : '#cccccc');

        const hasItem = this.ritualItem.carrier !== null;
        this.itemStatusText.setText(hasItem ? '● Item collected' : '◯ Get ritual item');
        this.itemStatusText.setFill(hasItem ? '#00ff00' : '#cccccc');
    }

    updateCooldownDisplay() {
        if (this.myRole !== 'chaathan') return;

        const now = Date.now();
        const abilities = ['flicker', 'extinguish', 'seal', 'push'];
        const labels = ['[1] Flicker', '[2] Extinguish', '[3] Seal Door', '[4] Push'];

        abilities.forEach((ab, i) => {
            const remaining = Math.max(0, this.chaathanCooldowns[ab] - now);
            if (remaining > 0) {
                this.abilityTexts[ab].setText(`${labels[i]} (${Math.ceil(remaining / 1000)}s)`);
                this.abilityTexts[ab].setFill('#666666');
            } else {
                this.abilityTexts[ab].setText(labels[i]);
                this.abilityTexts[ab].setFill('#cccccc');
            }
        });
    }

    formatTime(ms) {
        const seconds = Math.floor(ms / 1000);
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
}
