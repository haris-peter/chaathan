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
    MAP_WIDTH: 2400,
    MAP_HEIGHT: 1800,
    TILE_SIZE: 32,
    SCREEN_WIDTH: 800,
    SCREEN_HEIGHT: 600,
    ROOM_WIDTH: 800,
    ROOM_HEIGHT: 600,
    ROOM_COLS: 3,
    ROOM_ROWS: 3,
    TRANSITION_DURATION: 500,
    EDGE_THRESHOLD: 32,
    PLAYER_SPEED: 200,
    INTERACTION_DISTANCE: 60,
    RITUAL_CIRCLE: {
        x: 2100,
        y: 1500,
        radius: 80
    },
    LAMP_POSITIONS: [
        { x: 400, y: 300 },
        { x: 1200, y: 900 },
        { x: 2000, y: 300 }
    ],
    DOOR_POSITIONS: [
        { x: 800, y: 300 },
        { x: 800, y: 900 },
        { x: 1600, y: 600 },
        { x: 1600, y: 1200 }
    ],
    SPAWN_POINTS: {
        POOJARI: [
            { x: 200, y: 200 },
            { x: 200, y: 900 },
            { x: 200, y: 1600 }
        ],
        CHAATHAN: { x: 2200, y: 1600 }
    }
};
