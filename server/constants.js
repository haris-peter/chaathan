export const GAME_DURATION = 300000;
export const RITUAL_DURATION = 10000;
export const MAX_PLAYERS = 4;
export const LAMP_COUNT = 3;
export const DOOR_COUNT = 12;

export const COOLDOWNS = {
  FLICKER_LAMP: 5000,
  EXTINGUISH_LAMP: 15000,
  SEAL_DOOR: 20000,
  PUSH_PLAYER: 10000
};

export const ROLES = {
  POOJARI: 'poojari',
  CHAATHAN: 'chaathan'
};

export const LAMP_STATES = {
  UNLIT: 'unlit',
  LIT: 'lit',
  FLICKERING: 'flickering'
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
