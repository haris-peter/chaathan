import Phaser from 'phaser';
import { SocketManager } from '../network/SocketManager.js';

export class LobbyScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LobbyScene' });
        this.playerCount = 0;
        this.playerName = `Player_${Date.now().toString().slice(-4)}`;
        this.currentRoomId = null;
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

        this.add.text(width / 2, 140, 'Survival Horror', {
            font: '22px Courier New',
            fill: '#666666'
        }).setOrigin(0.5);

        this.createMainMenu(width, height);
        this.createLobbyUI(width, height);

        this.createFlickeringEffect();
        this.setupNetwork();
    }

    createMainMenu(width, height) {
        this.mainMenuContainer = this.add.container(0, 0);

        const nameInputLabel = this.add.text(width / 2, height / 2 - 80, `Name: ${this.playerName}`, {
            font: '20px Courier New',
            fill: '#cccccc'
        }).setOrigin(0.5);
        this.mainMenuContainer.add(nameInputLabel);

        // Edit Name Button
        const editNameBtn = this.createButton(width / 2, height / 2 - 40, 'Edit Name', () => {
            const newName = prompt('Enter your name:', this.playerName);
            if (newName && newName.trim().length > 0) {
                this.playerName = newName.trim().substring(0, 12);
                nameInputLabel.setText(`Name: ${this.playerName}`);
            }
        });
        this.mainMenuContainer.add(editNameBtn);

        // Create Room Button
        const createBtn = this.createButton(width / 2, height / 2 + 20, 'Create Room', () => {
            const durationStr = prompt('Enter Game Duration in minutes (default 5):', '5');
            let duration = parseInt(durationStr);
            if (isNaN(duration) || duration < 1) duration = 5;
            if (duration > 60) duration = 60; // Max 60 mins

            this.statusText.setText(`Creating ${this.selectedDifficulty} room (${duration} min)...`);
            SocketManager.createRoom(this.playerName, duration * 60 * 1000, this.selectedDifficulty);
        });
        this.mainMenuContainer.add(createBtn);

        // Difficulty Toggle Button
        this.selectedDifficulty = 'medium';
        const difficultyBtn = this.createButton(width / 2, height / 2 + 80, 'Difficulty: Medium', () => {
            if (this.selectedDifficulty === 'easy') {
                this.selectedDifficulty = 'medium';
            } else if (this.selectedDifficulty === 'medium') {
                this.selectedDifficulty = 'hard';
            } else {
                this.selectedDifficulty = 'easy';
            }
            // Update button label manually since createButton doesn't expose it
            // Ideally we'd reconstruct or access the text object
            // For simplicity, we'll just clear and redraw the button label or use a variable
            // But checking createButton, it creates a new container. We need to update the existing text.
        });

        // HACK: To update the button text, we'll store the text object
        const diffText = difficultyBtn.list[1]; // label is index 1
        // Override the callback to update text
        const originalCallback = difficultyBtn.list[0].input.hitAreaCallback; // This is internal
        // Re-bind click
        difficultyBtn.list[0].off('pointerup');
        difficultyBtn.list[0].on('pointerup', () => {
            difficultyBtn.list[0].setFillStyle(0x555555);
            if (this.selectedDifficulty === 'easy') {
                this.selectedDifficulty = 'medium';
                diffText.setText('Difficulty: Medium');
                diffText.setFill('#ffff00'); // Yellow
            } else if (this.selectedDifficulty === 'medium') {
                this.selectedDifficulty = 'hard';
                diffText.setText('Difficulty: Hard');
                diffText.setFill('#ff0000'); // Red
            } else {
                this.selectedDifficulty = 'easy';
                diffText.setText('Difficulty: Easy');
                diffText.setFill('#00ff00'); // Green
            }
        });

        this.mainMenuContainer.add(difficultyBtn);

        // Join Room Button
        const joinBtn = this.createButton(width / 2, height / 2 + 140, 'Join Room', () => {
            const roomId = prompt('Enter Room ID:');
            if (roomId && roomId.trim().length > 0) {
                const trimmedId = roomId.trim();
                this.statusText.setText(`Joining room ${trimmedId}...`);
                SocketManager.joinSpecificRoom(this.playerName, trimmedId);
            }
        });
        this.mainMenuContainer.add(joinBtn);

        // Quick Join Button
        const quickJoinBtn = this.createButton(width / 2, height / 2 + 200, 'Quick Join', () => {
            this.statusText.setText('Finding room...');
            SocketManager.joinGame(this.playerName);
        });
        this.mainMenuContainer.add(quickJoinBtn);
    }

    createLobbyUI(width, height) {
        this.lobbyContainer = this.add.container(0, 0);
        this.lobbyContainer.setVisible(false);

        const roomLabel = this.add.text(width / 2, height / 2 - 80, 'ROOM CODE:', {
            font: '16px Courier New',
            fill: '#666666'
        }).setOrigin(0.5);
        this.lobbyContainer.add(roomLabel);

        this.roomIdText = this.add.text(width / 2, height / 2 - 40, '', {
            font: 'bold 36px Courier New',
            fill: '#ffcc00',
            stroke: '#ff0000',
            strokeThickness: 2
        }).setOrigin(0.5);
        this.roomIdText.setInteractive({ useHandCursor: true });

        const copyHint = this.add.text(width / 2, height / 2, '(Click code to copy)', {
            font: '12px Courier New',
            fill: '#444444'
        }).setOrigin(0.5);
        this.lobbyContainer.add(copyHint);
        this.lobbyContainer.add(this.roomIdText);

        this.roomIdText.on('pointerdown', () => {
            if (this.currentRoomId) {
                navigator.clipboard.writeText(this.currentRoomId);
                copyHint.setText('Copied!');
                copyHint.setFill('#00ff00');
                this.time.delayedCall(1000, () => {
                    copyHint.setText('(Click code to copy)');
                    copyHint.setFill('#444444');
                });
            }
        });

        this.playerCountText = this.add.text(width / 2, height / 2 + 50, '', {
            font: '18px Courier New',
            fill: '#888888'
        }).setOrigin(0.5);
        this.lobbyContainer.add(this.playerCountText);

        this.statusText = this.add.text(width / 2, height - 150, '', {
            font: '18px Courier New',
            fill: '#cccccc'
        }).setOrigin(0.5);
        // Status text is shared but mainly used here
    }

    createButton(x, y, text, callback) {
        const button = this.add.container(x, y);

        const bg = this.add.rectangle(0, 0, 200, 40, 0x333333);
        bg.setInteractive({ useHandCursor: true });

        const label = this.add.text(0, 0, text, {
            font: '16px Courier New',
            fill: '#ffffff'
        }).setOrigin(0.5);

        bg.on('pointerover', () => bg.setFillStyle(0x555555));
        bg.on('pointerout', () => bg.setFillStyle(0x333333));
        bg.on('pointerdown', () => bg.setFillStyle(0x222222));
        bg.on('pointerup', () => {
            bg.setFillStyle(0x555555);
            callback();
        });

        button.add([bg, label]);
        return button;
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
        console.log('[LobbyScene] Setting up network...');
        SocketManager.connect();

        SocketManager.on('joined-room', (data) => {
            console.log('[LobbyScene] Received joined-room:', data);
            this.currentRoomId = data.roomId;
            this.mainMenuContainer.setVisible(false);
            this.lobbyContainer.setVisible(true);

            this.roomIdText.setText(data.roomId);
            this.statusText.setText('Waiting for players...');
            this.updatePlayerCount(data.state.players.length);
        });

        SocketManager.on('player-joined', (data) => {
            console.log('[LobbyScene] Received player-joined:', data);
            this.updatePlayerCount(data.playerCount);
        });

        SocketManager.on('player-left', () => {
            this.playerCount = Math.max(0, this.playerCount - 1);
            this.updatePlayerCount(this.playerCount);
        });

        SocketManager.on('show-instructions', (data) => {
            console.log('[LobbyScene] Received show-instructions:', data);
            SocketManager.removeAllListeners(); // Clean up lobby listeners
            this.scene.start('InstructionScene', data);
        });

        SocketManager.on('game-start', (data) => {
            // Backup just in case logic bypasses instructions (shouldn't happen now)
            console.log('[LobbyScene] Received game-start (unexpected):', data);
            SocketManager.removeAllListeners();
            this.scene.start('GameScene', data);
        });

        SocketManager.on('error', (error) => {
            console.error('[LobbyScene] Received network error:', error);
            this.statusText.setText(`Error: ${error.message}`);
            // If error occurred during join, show main menu again
            if (!this.currentRoomId) {
                this.mainMenuContainer.setVisible(true);
                this.lobbyContainer.setVisible(false);
            }
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

