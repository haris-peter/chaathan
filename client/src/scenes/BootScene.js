import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const progressBox = this.add.graphics();
        const progressBar = this.add.graphics();

        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

        const loadingText = this.add.text(width / 2, height / 2 - 50, 'Loading...', {
            font: '20px Courier New',
            fill: '#cccccc'
        }).setOrigin(0.5, 0.5);

        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0x8b0000, 1);
            progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
        });

        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
        });

        this.load.atlas(
            'chaathan-sprite',
            'assets/sprites/chathan/chathan_walk.png',
            'assets/sprites/chathan/chathan_walk.json'
        );

        this.load.atlas(
            'poojari-sprite',
            'assets/sprites/poojari/poojari_walk.png',
            'assets/sprites/poojari/poojari_walk.json'
        );

        this.load.image('mini-lamp-unlit', 'assets/sprites/mini_lamp/mini_lamp_no_flame.png');

        this.load.atlas(
            'mini-lamp-lit',
            'assets/sprites/mini_lamp/mini_lamp_flame.png',
            'assets/sprites/mini_lamp/mini_lamp_flame.json'
        );

        this.load.image('poster', 'assets/poster.png');

        const bgTypes = ['hallway', 'chamber', 'storage', 'sacred', 'dark', 'outdoor', 'tower', 'kitchen'];
        bgTypes.forEach(type => {
            this.load.image(`bg-${type}`, `assets/background/${type}.png`);
        });

        this.load.video('start-cinematic', 'assets/start_cinematic.mp4', true);
        this.load.video('end-cinematic', 'assets/end_cinematic.mp4', true);
        this.load.audio('theme', 'assets/audio/theme.mp3');

        this.createPlaceholderAssets();
    }

    createPlaceholderAssets() {
        this.createPlayerSprite();
        this.createLampSprite();
        this.createDoorSprite();
        this.createRitualItemSprite();
        this.createChaathanMask();
        this.createSaltSprite();
        this.createMapTiles();
    }

    createPlayerSprite() {
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });

        graphics.fillStyle(0xffffff, 1);
        graphics.fillCircle(16, 12, 8);
        graphics.fillRect(10, 20, 12, 20);
        graphics.fillRect(6, 22, 6, 16);
        graphics.fillRect(20, 22, 6, 16);
        graphics.fillRect(10, 38, 5, 14);
        graphics.fillRect(17, 38, 5, 14);

        graphics.generateTexture('player', 32, 52);
        graphics.destroy();

        const ghostGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        ghostGraphics.fillStyle(0x333333, 0.3);
        ghostGraphics.fillCircle(16, 12, 8);
        ghostGraphics.fillRect(10, 20, 12, 20);
        ghostGraphics.generateTexture('chaathan-ghost', 32, 52);
        ghostGraphics.destroy();
    }

    createLampSprite() {
        const unlitGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        unlitGraphics.fillStyle(0x444444, 1);
        unlitGraphics.fillRect(12, 20, 8, 20);
        unlitGraphics.fillStyle(0x333333, 1);
        unlitGraphics.fillCircle(16, 18, 8);
        unlitGraphics.generateTexture('lamp-unlit', 32, 40);
        unlitGraphics.destroy();

        const litGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        litGraphics.fillStyle(0xffaa00, 0.3);
        litGraphics.fillCircle(16, 16, 20);
        litGraphics.fillStyle(0xff6600, 0.5);
        litGraphics.fillCircle(16, 16, 14);
        litGraphics.fillStyle(0xff8800, 1);
        litGraphics.fillCircle(16, 16, 6);
        litGraphics.fillStyle(0x8b4513, 1);
        litGraphics.fillRect(12, 20, 8, 20);
        litGraphics.generateTexture('lamp-lit', 40, 44);
        litGraphics.destroy();

        const flickerGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        flickerGraphics.fillStyle(0xff4400, 0.2);
        flickerGraphics.fillCircle(16, 16, 18);
        flickerGraphics.fillStyle(0xff2200, 0.4);
        flickerGraphics.fillCircle(16, 16, 10);
        flickerGraphics.fillStyle(0x8b4513, 1);
        flickerGraphics.fillRect(12, 20, 8, 20);
        flickerGraphics.generateTexture('lamp-flicker', 40, 44);
        flickerGraphics.destroy();
    }

    createDoorSprite() {
        const openGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        openGraphics.fillStyle(0x3d2817, 1);
        openGraphics.fillRect(0, 0, 40, 60);
        openGraphics.fillStyle(0x2a1a0f, 1);
        openGraphics.fillRect(4, 4, 14, 24);
        openGraphics.fillRect(22, 4, 14, 24);
        openGraphics.fillRect(4, 32, 14, 24);
        openGraphics.fillRect(22, 32, 14, 24);
        openGraphics.fillStyle(0xc9a227, 1);
        openGraphics.fillCircle(34, 30, 3);
        openGraphics.generateTexture('door-open', 40, 60);
        openGraphics.destroy();

        const sealedGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        sealedGraphics.fillStyle(0x3d2817, 1);
        sealedGraphics.fillRect(0, 0, 40, 60);
        sealedGraphics.fillStyle(0x8b0000, 0.8);
        sealedGraphics.fillRect(0, 0, 40, 60);
        sealedGraphics.lineStyle(3, 0xff0000, 1);
        sealedGraphics.strokeCircle(20, 30, 18);
        sealedGraphics.lineBetween(8, 18, 32, 42);
        sealedGraphics.lineBetween(8, 42, 32, 18);
        sealedGraphics.generateTexture('door-sealed', 40, 60);
        sealedGraphics.destroy();
    }

    createRitualItemSprite() {
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });
        graphics.fillStyle(0xffd700, 1);
        graphics.fillTriangle(12, 0, 0, 24, 24, 24);
        graphics.fillStyle(0xff4500, 1);
        graphics.fillCircle(12, 16, 6);
        graphics.generateTexture('ritual-item', 24, 24);
        graphics.destroy();
    }

    createChaathanMask() {
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });
        graphics.fillStyle(0x1a1a1a, 1);
        graphics.fillEllipse(50, 60, 80, 100);
        graphics.fillStyle(0x8b0000, 1);
        graphics.fillEllipse(30, 50, 15, 10);
        graphics.fillEllipse(70, 50, 15, 10);
        graphics.fillStyle(0xff0000, 1);
        graphics.fillCircle(30, 50, 4);
        graphics.fillCircle(70, 50, 4);
        graphics.lineStyle(3, 0x8b0000, 1);
        graphics.arc(50, 75, 25, Phaser.Math.DegToRad(20), Phaser.Math.DegToRad(160), false);
        graphics.strokePath();
        graphics.lineStyle(2, 0x4a0000, 1);
        for (let i = 0; i < 6; i++) {
            graphics.lineBetween(20 + i * 12, 10, 15 + i * 14, 0);
        }
        graphics.generateTexture('chaathan-mask', 100, 120);
        graphics.destroy();
    }

    createMapTiles() {
        const floorGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        floorGraphics.fillStyle(0x1a1410, 1);
        floorGraphics.fillRect(0, 0, 32, 32);
        floorGraphics.lineStyle(1, 0x2a2420, 0.5);
        floorGraphics.strokeRect(0, 0, 32, 32);
        floorGraphics.generateTexture('floor', 32, 32);
        floorGraphics.destroy();

        const wallGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        wallGraphics.fillStyle(0x2d2520, 1);
        wallGraphics.fillRect(0, 0, 32, 32);
        wallGraphics.lineStyle(2, 0x1a1510, 1);
        wallGraphics.strokeRect(0, 0, 32, 32);
        wallGraphics.generateTexture('wall', 32, 32);
        wallGraphics.destroy();

        const circleGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        circleGraphics.lineStyle(4, 0x8b0000, 0.6);
        circleGraphics.strokeCircle(80, 80, 76);
        circleGraphics.lineStyle(2, 0x660000, 0.4);
        circleGraphics.strokeCircle(80, 80, 60);
        circleGraphics.strokeCircle(80, 80, 40);
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI * 2) / 8;
            const x1 = 80 + Math.cos(angle) * 40;
            const y1 = 80 + Math.sin(angle) * 40;
            const x2 = 80 + Math.cos(angle) * 76;
            const y2 = 80 + Math.sin(angle) * 76;
            circleGraphics.lineBetween(x1, y1, x2, y2);
        }
        circleGraphics.generateTexture('ritual-circle', 160, 160);
        circleGraphics.destroy();

        const crackGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        crackGraphics.lineStyle(3, 0xff0000, 0.8);
        crackGraphics.lineBetween(0, 80, 40, 60);
        crackGraphics.lineBetween(40, 60, 80, 90);
        crackGraphics.lineBetween(80, 90, 120, 50);
        crackGraphics.lineBetween(120, 50, 160, 80);
        crackGraphics.lineBetween(40, 60, 50, 30);
        crackGraphics.lineBetween(80, 90, 100, 120);
        crackGraphics.generateTexture('ritual-crack', 160, 160);
        crackGraphics.destroy();

        const shadowGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        shadowGraphics.fillStyle(0x000000, 0.7);
        shadowGraphics.fillEllipse(40, 80, 60, 140);
        shadowGraphics.fillCircle(40, 20, 20);
        shadowGraphics.generateTexture('shadow-silhouette', 80, 160);
        shadowGraphics.destroy();
    }

    createSaltSprite() {
        const saltGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        saltGraphics.fillStyle(0xffffff, 0.9);
        saltGraphics.fillEllipse(16, 20, 28, 12);
        saltGraphics.fillStyle(0xeeeeee, 1);
        saltGraphics.fillEllipse(16, 18, 24, 10);
        saltGraphics.fillStyle(0xdddddd, 1);
        saltGraphics.fillCircle(10, 16, 4);
        saltGraphics.fillCircle(18, 14, 5);
        saltGraphics.fillCircle(22, 17, 3);
        saltGraphics.generateTexture('salt-pile', 32, 28);
        saltGraphics.destroy();
    }

    create() {
        this.anims.create({
            key: 'chaathan-walk',
            frames: [
                { key: 'chaathan-sprite', frame: 'chathan_1.png' },
                { key: 'chaathan-sprite', frame: 'chathan_2.png' },
                { key: 'chaathan-sprite', frame: 'chathan_3.png' },
                { key: 'chaathan-sprite', frame: 'chathan_4.png' }
            ],
            frameRate: 8,
            repeat: -1
        });

        this.anims.create({
            key: 'poojari-walk',
            frames: [
                { key: 'poojari-sprite', frame: 'poojari_1.png' },
                { key: 'poojari-sprite', frame: 'poojari_2.png' },
                { key: 'poojari-sprite', frame: 'poojari_3.png' },
                { key: 'poojari-sprite', frame: 'poojari_4.png' }
            ],
            frameRate: 8,
            repeat: -1
        });

        this.anims.create({
            key: 'mini-lamp-flame',
            frames: [
                { key: 'mini-lamp-lit', frame: 'mini_lamp_1.png' },
                { key: 'mini-lamp-lit', frame: 'mini_lamp_2.png' },
                { key: 'mini-lamp-lit', frame: 'mini_lamp_3.png' },
                { key: 'mini-lamp-lit', frame: 'mini_lamp_4.png' }
            ],
            frameRate: 8,
            repeat: -1
        });

        this.scene.start('TitleScene');
    }
}
