import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { LobbyScene } from './scenes/LobbyScene.js';
import { GameScene } from './scenes/GameScene.js';
import { EndScene } from './scenes/EndScene.js';

export const gameConfig = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: 800,
    height: 600,
    backgroundColor: '#0a0a0a',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [BootScene, LobbyScene, GameScene, EndScene]
};

export const GAME_CONSTANTS = {
    MAP_WIDTH: 800,
    MAP_HEIGHT: 600,
    PLAYER_SPEED: 150,
    INTERACTION_DISTANCE: 50,
    RITUAL_CIRCLE: {
        x: 600,
        y: 450,
        radius: 80
    },
    LAMP_POSITIONS: [
        { x: 150, y: 150 },
        { x: 650, y: 150 },
        { x: 400, y: 350 }
    ],
    DOOR_POSITIONS: [
        { x: 200, y: 250 },
        { x: 400, y: 200 },
        { x: 600, y: 250 },
        { x: 500, y: 400 }
    ]
};
