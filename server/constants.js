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
  HUNT: 'hunt'
};
