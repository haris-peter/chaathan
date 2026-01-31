import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { TitleScene } from './scenes/TitleScene.js';
import { LobbyScene } from './scenes/LobbyScene.js';
import { InstructionScene } from './scenes/InstructionScene.js';
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
    scene: [BootScene, TitleScene, LobbyScene, InstructionScene, GameScene, EndScene]
};

export const GAME_CONSTANTS = {
    MAP_WIDTH: 4000,
    MAP_HEIGHT: 3000,
    TILE_SIZE: 32,
    SCREEN_WIDTH: 800,
    SCREEN_HEIGHT: 600,
    ROOM_WIDTH: 800,
    ROOM_HEIGHT: 600,
    ROOM_COLS: 5,
    ROOM_ROWS: 5,
    WALL_THICKNESS: 32,
    TRANSITION_DURATION: 500,
    EDGE_THRESHOLD: 32,
    PLAYER_SPEED: 200,
    INTERACTION_DISTANCE: 60,

    TALISMAN_COUNT: 3,
    AURA_MAX: 100,

    RITUAL_CIRCLE: {
        x: 2000,
        y: 1500,
        radius: 100
    },

    LAMP_POSITIONS: [
        { x: 400, y: 300, type: 'mini' },
        { x: 3600, y: 300, type: 'mini' },
        { x: 400, y: 2700, type: 'mini' },
        { x: 3600, y: 2700, type: 'mini' },
        { x: 2000, y: 1500, type: 'grand' }
    ],

    DOOR_POSITIONS: [
        { x: 800, y: 300, orientation: 'vertical' },
        { x: 1600, y: 300, orientation: 'vertical' },
        { x: 2400, y: 300, orientation: 'vertical' },
        { x: 3200, y: 300, orientation: 'vertical' },

        { x: 800, y: 900, orientation: 'vertical' },
        { x: 1600, y: 900, orientation: 'vertical' },
        { x: 2400, y: 900, orientation: 'vertical' },
        { x: 3200, y: 900, orientation: 'vertical' },

        { x: 800, y: 1500, orientation: 'vertical' },
        { x: 1600, y: 1500, orientation: 'vertical' },
        { x: 2400, y: 1500, orientation: 'vertical' },
        { x: 3200, y: 1500, orientation: 'vertical' },

        { x: 800, y: 2100, orientation: 'vertical' },
        { x: 1600, y: 2100, orientation: 'vertical' },
        { x: 2400, y: 2100, orientation: 'vertical' },
        { x: 3200, y: 2100, orientation: 'vertical' },

        { x: 800, y: 2700, orientation: 'vertical' },
        { x: 1600, y: 2700, orientation: 'vertical' },
        { x: 2400, y: 2700, orientation: 'vertical' },
        { x: 3200, y: 2700, orientation: 'vertical' },

        { x: 400, y: 600, orientation: 'horizontal' },
        { x: 1200, y: 600, orientation: 'horizontal' },
        { x: 2000, y: 600, orientation: 'horizontal' },
        { x: 2800, y: 600, orientation: 'horizontal' },
        { x: 3600, y: 600, orientation: 'horizontal' },

        { x: 400, y: 1200, orientation: 'horizontal' },
        { x: 1200, y: 1200, orientation: 'horizontal' },
        { x: 2000, y: 1200, orientation: 'horizontal' },
        { x: 2800, y: 1200, orientation: 'horizontal' },
        { x: 3600, y: 1200, orientation: 'horizontal' },

        { x: 400, y: 1800, orientation: 'horizontal' },
        { x: 1200, y: 1800, orientation: 'horizontal' },
        { x: 2000, y: 1800, orientation: 'horizontal' },
        { x: 2800, y: 1800, orientation: 'horizontal' },
        { x: 3600, y: 1800, orientation: 'horizontal' },

        { x: 400, y: 2400, orientation: 'horizontal' },
        { x: 1200, y: 2400, orientation: 'horizontal' },
        { x: 2000, y: 2400, orientation: 'horizontal' },
        { x: 2800, y: 2400, orientation: 'horizontal' },
        { x: 3600, y: 2400, orientation: 'horizontal' }
    ],

    SPAWN_POINTS: [
        { x: 200, y: 200 },
        { x: 200, y: 400 },
        { x: 400, y: 200 },
        { x: 400, y: 400 }
    ]
};
