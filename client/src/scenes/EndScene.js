import Phaser from 'phaser';
import { SocketManager } from '../network/SocketManager.js';

export class EndScene extends Phaser.Scene {
    constructor() {
        super({ key: 'EndScene' });
    }

    init(data) {
        this.winner = data.winner;
        this.myRole = data.role;
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const isPoojariWin = this.winner === 'poojari_win';
        const iWon = (isPoojariWin && this.myRole === 'poojari') ||
            (!isPoojariWin && this.myRole === 'chaathan');

        this.cameras.main.setBackgroundColor(iWon ? '#001a00' : '#1a0000');

        const title = iWon ? 'VICTORY' : 'DEFEAT';
        const titleColor = iWon ? '#00ff00' : '#ff0000';

        this.add.text(width / 2, 150, title, {
            font: 'bold 64px Courier New',
            fill: titleColor,
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        let message;
        if (isPoojariWin) {
            message = 'The Poojaris completed the ritual!\nThe Chaathan has been banished.';
        } else {
            message = 'Time has run out!\nThe Chaathan claims the tharavad.';
        }

        this.add.text(width / 2, 280, message, {
            font: '20px Courier New',
            fill: '#cccccc',
            align: 'center'
        }).setOrigin(0.5);

        const roleText = `You were: ${this.myRole.toUpperCase()}`;
        this.add.text(width / 2, 380, roleText, {
            font: '16px Courier New',
            fill: this.myRole === 'chaathan' ? '#880000' : '#008800'
        }).setOrigin(0.5);

        const playAgainBtn = this.add.rectangle(width / 2, 480, 200, 50, 0x333333);
        playAgainBtn.setInteractive({ useHandCursor: true });

        const btnText = this.add.text(width / 2, 480, 'PLAY AGAIN', {
            font: 'bold 18px Courier New',
            fill: '#ffffff'
        }).setOrigin(0.5);

        playAgainBtn.on('pointerover', () => {
            playAgainBtn.setFillStyle(0x555555);
        });

        playAgainBtn.on('pointerout', () => {
            playAgainBtn.setFillStyle(0x333333);
        });

        playAgainBtn.on('pointerdown', () => {
            SocketManager.disconnect();
            this.scene.start('LobbyScene');
        });

        this.createAmbientEffects();
    }

    createAmbientEffects() {
        const particles = this.add.graphics();

        for (let i = 0; i < 20; i++) {
            const x = Phaser.Math.Between(0, 800);
            const y = Phaser.Math.Between(0, 600);
            const alpha = Phaser.Math.FloatBetween(0.1, 0.3);
            const size = Phaser.Math.Between(1, 3);

            particles.fillStyle(0xffffff, alpha);
            particles.fillCircle(x, y, size);
        }
    }
}
