import Phaser from 'phaser';
import { SocketManager } from '../network/SocketManager.js';

export class LobbyScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LobbyScene' });
        this.playerCount = 0;
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.cameras.main.setBackgroundColor('#0a0808');

        this.add.text(width / 2, 80, 'CHAATHAN', {
            font: 'bold 48px Courier New',
            fill: '#8b0000',
            stroke: '#2a0000',
            strokeThickness: 4
        }).setOrigin(0.5);

        this.add.text(width / 2, 140, 'The Haunting', {
            font: '24px Courier New',
            fill: '#666666'
        }).setOrigin(0.5);

        this.statusText = this.add.text(width / 2, height / 2, 'Connecting...', {
            font: '20px Courier New',
            fill: '#cccccc'
        }).setOrigin(0.5);

        this.playerCountText = this.add.text(width / 2, height / 2 + 50, '', {
            font: '18px Courier New',
            fill: '#888888'
        }).setOrigin(0.5);

        this.add.text(width / 2, height - 100, 'Poojaris must complete the ritual', {
            font: '14px Courier New',
            fill: '#555555'
        }).setOrigin(0.5);

        this.add.text(width / 2, height - 75, 'Chaathan must stop them', {
            font: '14px Courier New',
            fill: '#550000'
        }).setOrigin(0.5);

        this.createFlickeringEffect();
        this.setupNetwork();
    }

    createFlickeringEffect() {
        const graphics = this.add.graphics();

        this.time.addEvent({
            delay: Phaser.Math.Between(2000, 5000),
            callback: () => {
                graphics.fillStyle(0x000000, Phaser.Math.FloatBetween(0, 0.3));
                graphics.fillRect(0, 0, 800, 600);

                this.time.delayedCall(100, () => {
                    graphics.clear();
                });

                this.time.addEvent({
                    delay: Phaser.Math.Between(2000, 5000),
                    callback: this.createFlickeringEffect,
                    callbackScope: this
                });
            },
            callbackScope: this
        });
    }

    setupNetwork() {
        SocketManager.connect();

        SocketManager.on('joined-room', (data) => {
            this.statusText.setText('Waiting for players...');
            this.updatePlayerCount(data.state.players.length);
        });

        SocketManager.on('player-joined', (data) => {
            this.updatePlayerCount(data.playerCount);
        });

        SocketManager.on('player-left', () => {
            this.playerCount = Math.max(0, this.playerCount - 1);
            this.playerCountText.setText(`Players: ${this.playerCount}/4`);
        });

        SocketManager.on('game-start', (data) => {
            SocketManager.removeAllListeners();
            this.scene.start('GameScene', data);
        });

        SocketManager.on('error', (error) => {
            this.statusText.setText(`Error: ${error.message}`);
        });

        this.time.delayedCall(500, () => {
            SocketManager.joinGame(`Player_${Date.now().toString().slice(-4)}`);
        });
    }

    updatePlayerCount(count) {
        this.playerCount = count;
        this.playerCountText.setText(`Players: ${count}/4`);

        if (count === 4) {
            this.statusText.setText('All players joined! Starting...');
        }
    }
}
