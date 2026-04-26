import { jest } from '@jest/globals';

// Mock canvas
globalThis.HTMLCanvasElement.prototype.getContext = () => ({
    clearRect: jest.fn(),
    fillRect: jest.fn(),
    strokeRect: jest.fn(),
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0
});

// Mock localStorage
const mockStorage = {};
const mockLocalStorage = {
    getItem: jest.fn(key => (key in mockStorage ? mockStorage[key] : null)),
    setItem: jest.fn((key, value) => {
        mockStorage[key] = value;
    }),
    removeItem: jest.fn(key => {
        delete mockStorage[key];
    }),
    clear: jest.fn(() => {
        Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
    })
};

Object.defineProperty(globalThis, 'localStorage', {
    value: mockLocalStorage,
    writable: false
});

// Mock confetti
globalThis.confetti = jest.fn();

// Mock canvas getBoundingClientRect
globalThis.HTMLCanvasElement.prototype.getBoundingClientRect = () => ({
    left: 0,
    top: 0,
    width: 300,
    height: 300
}); 