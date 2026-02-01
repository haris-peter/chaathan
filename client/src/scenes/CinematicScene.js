import Phaser from 'phaser';

export class CinematicScene extends Phaser.Scene {
    constructor() {
        super({ key: 'CinematicScene' });
    }

    init(data) {
        this.cinematicType = data.type || 'start';
        this.nextScene = data.nextScene || 'GameScene';
        this.nextSceneData = data.nextSceneData || {};
        this.isTransitioning = false;
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.cameras.main.setBackgroundColor('#000000');

        const videoKey = this.cinematicType === 'start' ? 'start-cinematic' : 'end-cinematic';

        if (!this.cache.video.exists(videoKey)) {
            console.warn(`Video ${videoKey} not found, skipping cinematic`);
            this.transitionToNextScene();
            return;
        }

        try {
            this.video = this.add.video(width / 2, height / 2, videoKey);

            const videoWidth = 688;
            const videoHeight = 464;

            const scaleX = width / videoWidth;
            const scaleY = height / videoHeight;
            const scale = Math.max(scaleX, scaleY);

            this.video.setScale(scale);
            this.video.setDepth(0);

            this.video.on('complete', () => {
                this.transitionToNextScene();
            });

            this.video.setMute(false);
            this.video.setVolume(1);
            this.video.play(false);

            this.time.delayedCall(10000, () => {
                if (this.scene.isActive('CinematicScene') && !this.isTransitioning) {
                    this.transitionToNextScene();
                }
            });

        } catch (error) {
            console.error('Video playback error:', error);
            this.transitionToNextScene();
            return;
        }

        this.skipText = this.add.text(width - 20, height - 20, 'Press SPACE to skip', {
            font: '14px Courier New',
            fill: '#666666'
        }).setOrigin(1, 1).setDepth(10);

        this.input.keyboard.once('keydown-SPACE', () => {
            this.transitionToNextScene();
        });

        this.input.once('pointerdown', () => {
            this.transitionToNextScene();
        });
    }

    transitionToNextScene() {
        if (this.isTransitioning) return;
        this.isTransitioning = true;

        if (this.video) {
            this.video.stop();
            this.video.destroy();
        }

        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start(this.nextScene, this.nextSceneData);
        });
    }
}
