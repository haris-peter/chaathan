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
    }

    create() {
        this.createMap();
        this.createRitualCircle();
        this.createLamps();
        this.createDoors();
        this.createRitualItem();
        this.createPlayers();
        this.createUI();
        this.setupControls();
        this.setupNetwork();
        this.createShadowEffects();
    }

    createMap() {
        for (let x = 0; x < 25; x++) {
            for (let y = 0; y < 19; y++) {
                const isWall = x === 0 || x === 24 || y === 0 || y === 18 ||
                    (x === 8 && y < 12) || (x === 16 && y > 6) ||
                    (y === 8 && x > 3 && x < 8) || (y === 12 && x > 16 && x < 21);

                if (isWall) {
                    this.add.image(x * 32 + 16, y * 32 + 16, 'wall');
                } else {
                    this.add.image(x * 32 + 16, y * 32 + 16, 'floor');
                }
            }
        }

        this.walls = this.physics.add.staticGroup();

        const wallPositions = [
            { x: 0, y: 0, w: 800, h: 32 },
            { x: 0, y: 568, w: 800, h: 32 },
            { x: 0, y: 0, w: 32, h: 600 },
            { x: 768, y: 0, w: 32, h: 600 },
            { x: 256, y: 0, w: 16, h: 384 },
            { x: 512, y: 216, w: 16, h: 384 }
        ];

        wallPositions.forEach(wall => {
            const rect = this.add.rectangle(wall.x + wall.w / 2, wall.y + wall.h / 2, wall.w, wall.h, 0x2d2520);
            this.physics.add.existing(rect, true);
            this.walls.add(rect);
        });

        this.add.text(100, 50, 'ENTRANCE', { font: '10px Courier New', fill: '#333333' });
        this.add.text(400, 50, 'MAIN HALL', { font: '10px Courier New', fill: '#333333' });
        this.add.text(650, 400, 'POOJA ROOM', { font: '10px Courier New', fill: '#550000' });
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

            door.on('pointerdown', () => this.onDoorClick(door));

            this.doors.set(doorData.id, door);
        });
    }

    createRitualItem() {
        const item = this.gameData.ritualItem;
        this.ritualItem = this.add.image(item.x, item.y, 'ritual-item');
        this.ritualItem.setInteractive();
        this.ritualItem.carrier = item.carrier;

        this.ritualItem.on('pointerdown', () => this.onItemClick());

        if (item.carrier) {
            this.ritualItem.setVisible(false);
        }
    }

    createPlayers() {
        this.gameData.players.forEach(playerData => {
            this.createPlayerSprite(playerData);
        });
    }

    createPlayerSprite(playerData) {
        const isMe = playerData.id === this.myId;
        const isChaathan = playerData.role === 'chaathan';

        let sprite;
        if (isChaathan && !isMe && this.myRole !== 'chaathan') {
            return;
        }

        if (isChaathan && !isMe) {
            sprite = this.physics.add.sprite(playerData.x, playerData.y, 'chaathan-ghost');
            sprite.setAlpha(0.4);
        } else {
            sprite = this.physics.add.sprite(playerData.x, playerData.y, 'player');
        }

        sprite.setCollideWorldBounds(true);
        sprite.playerId = playerData.id;
        sprite.playerRole = playerData.role;
        sprite.isCarryingItem = playerData.isCarryingItem;

        if (isMe) {
            sprite.setTint(0x88ff88);
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
            this.createChaathanUI();
        } else {
            this.createPoojariUI();
        }
    }

    createChaathanUI() {
        const maskBg = this.add.rectangle(700, 100, 120, 150, 0x1a0000, 0.8);
        maskBg.setScrollFactor(0).setDepth(100);

        this.add.image(700, 80, 'chaathan-mask').setScale(0.5).setScrollFactor(0).setDepth(101);

        this.add.text(700, 140, 'CHAATHAN', {
            font: 'bold 12px Courier New',
            fill: '#8b0000'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(101);

        this.abilityTexts = {};
        const abilities = [
            { key: 'flicker', label: '[1] Flicker', y: 200 },
            { key: 'extinguish', label: '[2] Extinguish', y: 225 },
            { key: 'seal', label: '[3] Seal Door', y: 250 },
            { key: 'push', label: '[4] Push', y: 275 }
        ];

        abilities.forEach(ab => {
            this.abilityTexts[ab.key] = this.add.text(700, ab.y, ab.label, {
                font: '12px Courier New',
                fill: '#cccccc'
            }).setOrigin(0.5).setScrollFactor(0).setDepth(101);
        });

        this.add.text(700, 310, 'Click target\nthen press key', {
            font: '10px Courier New',
            fill: '#666666',
            align: 'center'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(101);
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
        const x = Phaser.Math.Between(100, 700);
        const y = Phaser.Math.Between(100, 500);

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

        this.handleMovement();
        this.updateCooldownDisplay();
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
        this.highlightGraphics.strokeCircle(target.x, target.y, 30);

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
