export const GAME_DURATION = 300000;
export const RITUAL_DURATION = 10000;
export const MAX_PLAYERS = 4;
export const LAMP_COUNT = 4;
export const DOOR_COUNT = 12;

export const TALISMAN_COUNT = 3;
export const AURA_MAX = 100;
export const AURA_DECAY_RATE = 2;
export const AURA_REFUEL_DISTANCE = 60;

export const AI_CHAATHAN_COUNT = 2;
export const AI_UPDATE_INTERVAL = 50;
export const AI_PATROL_SPEED = 80;
export const AI_CHASE_SPEED = 150;
export const AI_DETECTION_RANGE = 200;
export const AI_CATCH_DISTANCE = 40;
export const AI_LOSE_SIGHT_DISTANCE = 350;

export const ROLES = {
  POOJARI: 'poojari'
};

export const LAMP_STATES = {
  UNLIT: 'unlit',
  LIT: 'lit'
};

export const LAMP_TYPES = {
  MINI: 'mini',
  GRAND: 'grand'
};

export const DOOR_STATES = {
  OPEN: 'open',
  SEALED: 'sealed'
};

export const GAME_STATES = {
  WAITING: 'waiting',
  INSTRUCTIONS: 'instructions',
  PLAYING: 'playing',
  POOJARI_WIN: 'poojari_win',
  CHAATHAN_WIN: 'chaathan_win'
};

export const CHAATHAN_STATES = {
  PATROL: 'patrol',
  HUNT: 'hunt',
  STUNNED: 'stunned'
};

export const CHAATHAN_TYPES = {
  STALKER: 'stalker',
  SPECTER: 'specter'
};

export const CHAATHAN_CONFIG = {
  stalker: {
    patrolSpeed: 60,
    chaseSpeed: 170,
    detectionRange: 250,
    color: 0xff4444,
    alpha: 1.0
  },
  specter: {
    patrolSpeed: 100,
    chaseSpeed: 130,
    detectionRange: 180,
    color: 0x4488ff,
    alpha: 0.6
  }
};

export const STUN_DURATION = 3000;
export const SALT_COUNT = 4;

export const SALT_POSITIONS = [
  { x: 1200, y: 900 },
  { x: 2800, y: 900 },
  { x: 1200, y: 2100 },
  { x: 2800, y: 2100 }
];
