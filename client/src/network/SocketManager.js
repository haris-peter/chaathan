import { io } from 'socket.io-client';

class SocketManagerClass {
    constructor() {
        this.socket = null;
        this.listeners = new Map();
    }

    connect(serverUrl = 'http://localhost:3000') {
        if (this.socket?.connected) return this.socket;

        this.socket = io(serverUrl, {
            transports: ['websocket', 'polling']
        });

        this.socket.on('connect', () => {
            console.log('Connected to server:', this.socket.id);
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
        });

        this.socket.on('error', (error) => {
            console.error('Socket error:', error);
        });

        return this.socket;
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    emit(event, data) {
        if (this.socket?.connected) {
            this.socket.emit(event, data);
        }
    }

    on(event, callback) {
        if (this.socket) {
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
        this.emit('join-game', playerName);
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
