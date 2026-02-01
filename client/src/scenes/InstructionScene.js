import Phaser from 'phaser';
import { SocketManager } from '../network/SocketManager.js';

export class InstructionScene extends Phaser.Scene {
    constructor() {
        super({ key: 'InstructionScene' });
    }

    init(data) {
        this.playerName = data.name;
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.cameras.main.setBackgroundColor('#0d0d0d');

        const bgGraphics = this.add.graphics();
        bgGraphics.fillGradientStyle(0x1a0a0a, 0x1a0a0a, 0x0a0a1a, 0x0a0a1a, 1);
        bgGraphics.fillRect(0, 0, width, height);

        this.add.text(width / 2, 35, '🕯️ POOJARI 🕯️', {
            font: 'bold 36px Georgia',
            fill: '#ffd700',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        this.add.text(width / 2, 70, `${this.playerName}`, {
            font: '18px Courier New',
            fill: '#888888'
        }).setOrigin(0.5);

        const panelY = 90;
        const panelHeight = 440;
        const panel = this.add.graphics();
        panel.fillStyle(0x1a1a1a, 0.9);
        panel.fillRoundedRect(30, panelY, width - 60, panelHeight, 12);
        panel.lineStyle(2, 0x444444);
        panel.strokeRoundedRect(30, panelY, width - 60, panelHeight, 12);

        const sections = [
            {
                icon: '🎯',
                title: 'OBJECTIVE',
                color: '#4CAF50',
                items: [
                    'Find and light all 4 MINI LAMPS',
                    'Lamps spawn in random rooms each game',
                    'This activates the GRAND LAMP',
                    'Gather at Ritual Circle for 10 seconds'
                ]
            },
            {
                icon: '⚠️',
                title: 'DANGERS',
                color: '#f44336',
                items: [
                    'RED Stalker: Slower but larger range',
                    'BLUE Specter: Faster but semi-invisible',
                    'Your LIGHT AURA drains constantly',
                    'Getting caught = lose 1 TALISMAN'
                ]
            },
            {
                icon: '❤️',
                title: 'SURVIVAL',
                color: '#E91E63',
                items: [
                    '3 Talismans = 3 Lives total',
                    'Refuel aura at any LIT LAMP',
                    'Collect HOLY SALT to stun Chaathans',
                    '0 Talismans = become Spectator'
                ]
            },
            {
                icon: '🎮',
                title: 'CONTROLS',
                color: '#2196F3',
                items: [
                    'WASD or Arrow Keys to move',
                    'E = interact with lamps',
                    'Q = use Holy Salt (stuns nearby)'
                ]
            }
        ];

        const startY = panelY + 25;
        const leftX = 55;
        const rightX = width / 2 + 15;
        const sectionWidth = (width - 100) / 2 - 15;
        const sectionHeight = 195;
        const rowGap = 15;

        sections.forEach((section, index) => {
            const isLeft = index % 2 === 0;
            const x = isLeft ? leftX : rightX;
            const row = Math.floor(index / 2);
            const y = startY + (row * (sectionHeight + rowGap));

            const sectionBg = this.add.graphics();
            sectionBg.fillStyle(0x252525, 1);
            sectionBg.fillRoundedRect(x - 10, y, sectionWidth, sectionHeight, 8);
            sectionBg.lineStyle(1, 0x3a3a3a);
            sectionBg.strokeRoundedRect(x - 10, y, sectionWidth, sectionHeight, 8);

            this.add.text(x + 5, y + 15, `${section.icon} ${section.title}`, {
                font: 'bold 16px Courier New',
                fill: section.color
            });

            const divider = this.add.graphics();
            divider.lineStyle(1, section.color, 0.3);
            divider.moveTo(x + 5, y + 40);
            divider.lineTo(x + sectionWidth - 25, y + 40);
            divider.strokePath();

            section.items.forEach((item, itemIndex) => {
                this.add.text(x + 15, y + 55 + (itemIndex * 32), `• ${item}`, {
                    font: '13px Courier New',
                    fill: '#cccccc',
                    wordWrap: { width: sectionWidth - 40 }
                });
            });
        });

        this.readyBtn = this.createReadyButton(width / 2, height - 40);

        this.waitingText = this.add.text(width / 2, height - 40, 'Waiting for other players...', {
            font: '18px Courier New',
            fill: '#666666',
            fontStyle: 'italic'
        }).setOrigin(0.5).setVisible(false);

        SocketManager.on('game-start', (data) => {
            SocketManager.removeAllListeners();
            this.scene.start('CinematicScene', {
                type: 'start',
                nextScene: 'GameScene',
                nextSceneData: data
            });
        });

        SocketManager.on('player-ready-update', (data) => {
        });
    }

    createReadyButton(x, y) {
        const button = this.add.container(x, y);

        const bg = this.add.graphics();
        bg.fillGradientStyle(0x2d5a27, 0x2d5a27, 0x1a3a17, 0x1a3a17, 1);
        bg.fillRoundedRect(-110, -25, 220, 50, 10);
        bg.lineStyle(2, 0x4CAF50);
        bg.strokeRoundedRect(-110, -25, 220, 50, 10);

        const hitArea = this.add.rectangle(0, 0, 220, 50, 0x000000, 0);
        hitArea.setInteractive({ useHandCursor: true });

        const label = this.add.text(0, 0, '✓ I AM READY', {
            font: 'bold 20px Courier New',
            fill: '#ffffff'
        }).setOrigin(0.5);

        hitArea.on('pointerover', () => {
            bg.clear();
            bg.fillGradientStyle(0x4CAF50, 0x4CAF50, 0x2d5a27, 0x2d5a27, 1);
            bg.fillRoundedRect(-110, -25, 220, 50, 10);
            bg.lineStyle(2, 0x66BB6A);
            bg.strokeRoundedRect(-110, -25, 220, 50, 10);
        });

        hitArea.on('pointerout', () => {
            bg.clear();
            bg.fillGradientStyle(0x2d5a27, 0x2d5a27, 0x1a3a17, 0x1a3a17, 1);
            bg.fillRoundedRect(-110, -25, 220, 50, 10);
            bg.lineStyle(2, 0x4CAF50);
            bg.strokeRoundedRect(-110, -25, 220, 50, 10);
        });

        hitArea.on('pointerdown', () => {
            button.setScale(0.95);
        });

        hitArea.on('pointerup', () => {
            button.setScale(1);
            this.onReady();
        });

        button.add([bg, hitArea, label]);
        return button;
    }

    onReady() {
        this.readyBtn.setVisible(false);
        this.waitingText.setVisible(true);
        SocketManager.sendReady();
    }
}
