import Phaser from 'phaser';

export class TitleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TitleScene' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Display the poster image
        const poster = this.add.image(width / 2, height / 2, 'poster');

        // Scale poster to fit screen while maintaining aspect ratio
        const scaleX = width / poster.width;
        const scaleY = height / poster.height;
        const scale = Math.max(scaleX, scaleY);
        poster.setScale(scale);

        // Add "Click to Start" text with blinking effect
        const startText = this.add.text(width / 2, height - 50, 'Click anywhere to start', {
            font: 'bold 24px Courier New',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);

        this.tweens.add({
            targets: startText,
            alpha: 0,
            duration: 800,
            yoyo: true,
            repeat: -1
        });

        // Add input listener to transition to LobbyScene
        this.input.on('pointerdown', () => {
            this.scene.start('LobbyScene');
        });

        // Also allow keyboard press
        this.input.keyboard.on('keydown', () => {
            this.scene.start('LobbyScene');
        });
    }
}
