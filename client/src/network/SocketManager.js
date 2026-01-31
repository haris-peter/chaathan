import { io } from 'socket.io-client';

class SocketManagerClass {
    constructor() {
        this.socket = null;
        this.listeners = new Map();
    }

    connect(serverUrl = 'http://localhost:3000') {
        console.log(`[SocketManager] Connecting to ${serverUrl}...`);
        if (this.socket?.connected) {
            console.log('[SocketManager] Already connected');
            return this.socket;
        }

        this.socket = io(serverUrl, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            timeout: 10000
        });

        this.socket.on('connect', () => {
            console.log('[SocketManager] Connected to server:', this.socket.id);
        });

        this.socket.on('connect_error', (error) => {
            console.error('[SocketManager] Connection error:', error);
        });

        this.socket.on('disconnect', (reason) => {
            console.log('[SocketManager] Disconnected from server:', reason);
        });

        this.socket.on('error', (error) => {
            console.error('[SocketManager] Socket error:', error);
        });

        return this.socket;
    }

    disconnect() {
        if (this.socket) {
            console.log('[SocketManager] Disconnecting...');
            this.socket.disconnect();
            this.socket = null;
        }
    }

    emit(event, data) {
        if (this.socket) {
            console.log(`[SocketManager] Emitting ${event}`, data);
            this.socket.emit(event, data);
        } else {
            console.warn(`[SocketManager] Cannot emit ${event} - socket not initialized`);
        }
    }

    on(event, callback) {
        if (this.socket) {
            // console.log(`[SocketManager] Registering listener for ${event}`);
            this.socket.on(event, callback);
            if (!this.listeners.has(event)) {
                this.listeners.set(event, []);
            }
            this.listeners.get(event).push(callback);
        }
    }

    off(event, callback) {
        if (this.socket) {
            this.socket.off(event, callback);
            const callbacks = this.listeners.get(event);
            if (callbacks) {
                const index = callbacks.indexOf(callback);
                if (index > -1) callbacks.splice(index, 1);
            }
        }
    }

    removeAllListeners() {
        this.listeners.forEach((callbacks, event) => {
            callbacks.forEach(cb => this.socket?.off(event, cb));
        });
        this.listeners.clear();
    }

    joinGame(playerName) {
        console.log(`[SocketManager] joinGame called for ${playerName}`);
        this.emit('join-game', playerName);
    }
    createRoom(playerName, duration) {
        console.log(`[SocketManager] createRoom called for ${playerName} duration ${duration}`);
        this.emit('create-room', { playerName, duration });
    }

    sendReady() {
        console.log('[SocketManager] Sending player-ready');
        this.emit('player-ready');
    }

    joinSpecificRoom(playerName, roomId) {
        console.log(`[SocketManager] joinSpecificRoom called for ${playerName} in room ${roomId}`);
        this.emit('join-specific-room', { playerName, roomId });
    }

    sendMove(x, y) {
        this.emit('player-move', { x, y });
    }

    lightLamp(lampId) {
        this.emit('light-lamp', lampId);
    }

    pickupItem() {
        this.emit('pickup-item');
    }

    dropItem() {
        this.emit('drop-item');
    }

    chaathanFlicker(lampId) {
        this.emit('chaathan-flicker', lampId);
    }

    chaathanExtinguish(lampId) {
        this.emit('chaathan-extinguish', lampId);
    }

    chaathanSealDoor(doorId) {
        this.emit('chaathan-seal-door', doorId);
    }

    chaathanPush(targetId) {
        this.emit('chaathan-push', targetId);
    }
}

export const SocketManager = new SocketManagerClass();
