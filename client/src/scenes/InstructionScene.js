import Phaser from 'phaser';
import { SocketManager } from '../network/SocketManager.js';

export class InstructionScene extends Phaser.Scene {
    constructor() {
        super({ key: 'InstructionScene' });
    }

    init(data) {
        this.role = data.role;
        this.playerName = data.name;
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.cameras.main.setBackgroundColor('#1a1a1a');

        // Role Title
        const roleTitleColor = this.role === 'chaathan' ? '#ff0000' : '#ffff00';
        this.add.text(width / 2, 80, `YOU ARE: ${this.role.toUpperCase()}`, {
            font: 'bold 40px Courier New',
            fill: roleTitleColor,
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        // Name
        this.add.text(width / 2, 130, this.playerName, {
            font: '24px Courier New',
            fill: '#cccccc'
        }).setOrigin(0.5);

        // Instruction Text
        let instructionText = '';
        if (this.role === 'chaathan') {
            instructionText = `
GOAL: Stop the ritual!

- You are the IMPOSTER.
- Blend in with the Poojaris.
- FLICKER lamps to slow them down.
- SEAL doors to trap them.
- PUSH them out of the ritual circle.
- EXTINGUISH lamps to reset their progress.

Ensure the timer runs out before they complete the ritual!
            `;
        } else {
            instructionText = `
GOAL: Complete the Ritual!

- Light all 3 sacred LAMPS.
- Find the RITUAL ITEM (Golden Triangle).
- Gather ALL Poojaris in the Ritual Circle.
- Bring the Ritual Item to the center.
- Hold the position until the ritual completes.

Beware of the CHAATHAN hiding among you!
            `;
        }

        const instructions = this.add.text(width / 2, height / 2, instructionText, {
            font: '18px Courier New',
            fill: '#ffffff',
            align: 'center',
            lineSpacing: 10
        }).setOrigin(0.5);

        // Ready Button
        this.readyBtn = this.createButton(width / 2, height - 100, 'I AM READY', () => {
            this.onReady();
        });

        this.waitingText = this.add.text(width / 2, height - 100, 'Waiting for other players...', {
            font: '20px Courier New',
            fill: '#888888',
            fontStyle: 'italic'
        }).setOrigin(0.5).setVisible(false);

        // Listen for game start
        SocketManager.on('game-start', (data) => {
            SocketManager.removeAllListeners(); // Or specific ones if needed
            this.scene.start('GameScene', data);
        });

        // Listen for ready updates (optional visual feedback)
        SocketManager.on('player-ready-update', (data) => {
            // Can update UI here if we want to show "2/4 Ready"
        });
    }

    createButton(x, y, text, callback) {
        const button = this.add.container(x, y);

        const bg = this.add.rectangle(0, 0, 200, 50, 0x444444);
        bg.setInteractive({ useHandCursor: true });

        const label = this.add.text(0, 0, text, {
            font: 'bold 20px Courier New',
            fill: '#ffffff'
        }).setOrigin(0.5);

        bg.on('pointerover', () => bg.setFillStyle(0x666666));
        bg.on('pointerout', () => bg.setFillStyle(0x444444));
        bg.on('pointerdown', () => bg.setFillStyle(0x222222));
        bg.on('pointerup', () => {
            bg.setFillStyle(0x666666);
            callback();
        });

        button.add([bg, label]);
        return button;
    }

    onReady() {
        this.readyBtn.setVisible(false);
        this.waitingText.setVisible(true);
        SocketManager.sendReady();
    }
}
