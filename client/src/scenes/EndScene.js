import Phaser from 'phaser';
import { SocketManager } from '../network/SocketManager.js';

export class EndScene extends Phaser.Scene {
    constructor() {
        super({ key: 'EndScene' });
    }

    init(data) {
        this.winner = data.winner;
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const isPoojariWin = this.winner === 'poojari_win';

        this.cameras.main.setBackgroundColor(isPoojariWin ? '#001a00' : '#1a0000');

        const title = isPoojariWin ? 'VICTORY' : 'DEFEAT';
        const titleColor = isPoojariWin ? '#00ff00' : '#ff0000';

        this.add.text(width / 2, 120, title, {
            font: 'bold 64px Courier New',
            fill: titleColor,
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        let message;
        if (isPoojariWin) {
            message = 'The Poojaris completed the ritual!\nThe Twin Chaathans have been banished forever.';
        } else {
            message = 'All hope is lost...\nThe Twin Chaathans claim the tharavad.';
        }

        this.add.text(width / 2, 250, message, {
            font: '20px Courier New',
            fill: '#cccccc',
            align: 'center'
        }).setOrigin(0.5);

        const subtitle = isPoojariWin
            ? '🕯️ The light prevails! 🕯️'
            : '💀 Darkness consumes all 💀';

        this.add.text(width / 2, 340, subtitle, {
            font: '24px Courier New',
            fill: isPoojariWin ? '#ffff00' : '#880000'
        }).setOrigin(0.5);

        const playAgainBtn = this.add.rectangle(width / 2, 450, 200, 50, 0x333333);
        playAgainBtn.setInteractive({ useHandCursor: true });

        this.add.text(width / 2, 450, 'PLAY AGAIN', {
            font: 'bold 18px Courier New',
            fill: '#ffffff'
        }).setOrigin(0.5);

        playAgainBtn.on('pointerover', () => playAgainBtn.setFillStyle(0x555555));
        playAgainBtn.on('pointerout', () => playAgainBtn.setFillStyle(0x333333));
        playAgainBtn.on('pointerdown', () => {
            SocketManager.disconnect();
            this.scene.start('LobbyScene');
        });

        this.createAmbientEffects(isPoojariWin);
    }

    createAmbientEffects(isWin) {
        const particles = this.add.graphics();

        for (let i = 0; i < 30; i++) {
            const x = Phaser.Math.Between(0, 800);
            const y = Phaser.Math.Between(0, 600);
            const alpha = Phaser.Math.FloatBetween(0.1, 0.4);
            const size = Phaser.Math.Between(1, 4);

            const color = isWin ? 0xffff00 : 0xff0000;
            particles.fillStyle(color, alpha);
            particles.fillCircle(x, y, size);
        }
    }
}
