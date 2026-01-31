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

        this.cameras.main.setBackgroundColor('#1a1a1a');

        this.add.text(width / 2, 60, 'YOU ARE A POOJARI', {
            font: 'bold 36px Courier New',
            fill: '#ffff00',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        this.add.text(width / 2, 100, this.playerName, {
            font: '22px Courier New',
            fill: '#cccccc'
        }).setOrigin(0.5);

        const instructionText = `
SURVIVE THE TWIN CHAATHANS!

🕯️ OBJECTIVE:
- Light all 4 MINI LAMPS scattered across the map
- This activates the GRAND LAMP in the center
- ALL survivors must gather in the Ritual Circle
- Hold position for 10 seconds to WIN

⚠️ DANGERS:
- Two AI CHAATHANS patrol the mansion
- If they catch you, you LOSE A TALISMAN
- Your LIGHT AURA slowly drains over time
- If Aura hits 0%, you LOSE A TALISMAN

❤️ TALISMANS (3 Lives):
- You start with 3 Talismans
- Lose all 3 = PERMADEATH (become spectator)
- If ALL players die, the Chaathans win!

✨ SURVIVAL:
- Refuel your Aura at any LIT LAMP (press E)
- Work together and watch each other's backs!
        `;

        this.add.text(width / 2, height / 2 + 20, instructionText, {
            font: '15px Courier New',
            fill: '#ffffff',
            align: 'center',
            lineSpacing: 6
        }).setOrigin(0.5);

        this.readyBtn = this.createButton(width / 2, height - 70, 'I AM READY', () => {
            this.onReady();
        });

        this.waitingText = this.add.text(width / 2, height - 70, 'Waiting for other players...', {
            font: '18px Courier New',
            fill: '#888888',
            fontStyle: 'italic'
        }).setOrigin(0.5).setVisible(false);

        SocketManager.on('game-start', (data) => {
            SocketManager.removeAllListeners();
            this.scene.start('GameScene', data);
        });

        SocketManager.on('player-ready-update', (data) => {
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
