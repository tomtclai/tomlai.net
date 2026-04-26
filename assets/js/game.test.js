import { TileGame } from './game.js';
import { jest } from '@jest/globals';

describe('TileGame', () => {
    let game;
    let container;

    beforeEach(() => {
        // Set up DOM elements
        document.body.innerHTML = '<div id="game"></div>';
        container = document.getElementById('game');
        
        // Clear localStorage before each test
        localStorage.clear();
        
        // Mock history.pushState
        window.history.pushState = jest.fn();
        
        // Create new game instance
        game = new TileGame('game');
    });

    afterEach(() => {
        document.body.innerHTML = '';
        localStorage.clear();
        jest.clearAllMocks();
    });

    describe('Initialization', () => {
        test('should create game with correct initial state', () => {
            // Create a new instance without calling newGame
            const freshGame = new TileGame('game');
            // Prevent newGame from being called
            freshGame.newGame = jest.fn();
            
            expect(freshGame.GRID_SIZE).toBe(3);
            expect(freshGame.gameState.grid.length).toBe(3);
            expect(freshGame.gameState.grid[0].length).toBe(3);
            expect(freshGame.gameState.moves).toBe(0);
            expect(freshGame.gameState.isGameOver).toBe(false);
        });

        test('should create all necessary DOM elements', () => {
            expect(document.getElementById('gameCanvas')).toBeTruthy();
            expect(document.getElementById('scoreDisplay')).toBeTruthy();
            expect(document.getElementById('bestScoreDisplay')).toBeTruthy();
            expect(document.getElementById('newGameBtn')).toBeTruthy();
            expect(document.querySelector('.close-button')).toBeTruthy();
        });
    });

    describe('Close Button', () => {
        test('should hide game container when close button is clicked', () => {
            // Show the game container first
            game.container.style.display = 'block';
            
            // Click the close button
            const closeButton = document.querySelector('.close-button');
            closeButton.click();
            
            // Check if container is hidden
            expect(game.container.style.display).toBe('none');
        });

        test('should update URL when close button is clicked', () => {
            // Show the game container and set URL hash
            game.container.style.display = 'block';
            window.location.hash = '#game';
            
            // Click the close button
            const closeButton = document.querySelector('.close-button');
            closeButton.click();
            
            // Check if history.pushState was called correctly
            expect(window.history.pushState).toHaveBeenCalledWith(null, '', '/');
        });

        test('should render with the .close-button class for SASS to position', () => {
            // Positioning is now handled by _sass/_game.scss (compiled by Jekyll),
            // not runtime style injection — so we only assert the hook is present.
            const closeButton = document.querySelector('.close-button');
            expect(closeButton).toBeTruthy();
            expect(closeButton.classList.contains('close-button')).toBe(true);
        });
    });

    describe('Game Logic', () => {
        test('should toggle correct tiles when clicking', () => {
            // Mock initial state
            game.gameState.grid = [
                [false, false, false],
                [false, false, false],
                [false, false, false]
            ];
            game.gameState.isGameOver = false;

            // Simulate click on center tile (1,1)
            game.toggleTiles(1, 1);

            // Check if center tile and adjacent tiles were toggled
            expect(game.gameState.grid[1][1]).toBe(true); // Center
            expect(game.gameState.grid[0][1]).toBe(true); // Top
            expect(game.gameState.grid[1][0]).toBe(true); // Left
            expect(game.gameState.grid[1][2]).toBe(true); // Right
            expect(game.gameState.grid[2][1]).toBe(true); // Bottom
            
            // Corner tiles should remain unchanged
            expect(game.gameState.grid[0][0]).toBe(false);
            expect(game.gameState.grid[0][2]).toBe(false);
            expect(game.gameState.grid[2][0]).toBe(false);
            expect(game.gameState.grid[2][2]).toBe(false);
        });

        test('should increment moves counter when making valid moves', () => {
            game.gameState.isGameOver = false;
            game.toggleTiles(1, 1);
            expect(game.gameState.moves).toBe(1);
        });

        test('should detect win state correctly', () => {
            // Set all tiles to same state
            game.gameState.grid = [
                [true, true, true],
                [true, true, true],
                [true, true, true]
            ];
            expect(game.isWinState()).toBe(true);

            // Change one tile
            game.gameState.grid[0][0] = false;
            expect(game.isWinState()).toBe(false);
        });
    });

    describe('Score Management', () => {
        const STORAGE_KEY = 'tomlai:game:v1';

        test('should update best score when winning with better score', () => {
            // Set up initial best score using the new namespaced/versioned shape
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ bestScore: 10 }));

            // Create a new game instance to pick up the stored best score
            game = new TileGame('game');

            // Set up a state that will result in all true values after toggling center tile
            game.gameState.moves = 5;
            game.gameState.grid = [
                [true, false, true],
                [false, false, false],
                [true, false, true]
            ];

            // Clear any previous localStorage calls
            jest.clearAllMocks();

            // Trigger win by toggling center tile (1,1)
            game.toggleTiles(1, 1);

            // Log grid state for debugging
            console.log('Grid state after toggle:', game.gameState.grid);
            console.log('Is win state:', game.isWinState());

            // Verify the best score was updated under the namespaced key
            expect(localStorage.setItem).toHaveBeenCalledWith(
                STORAGE_KEY,
                JSON.stringify({ bestScore: 6 })
            );
            expect(game.gameState.bestScore).toBe(6);
        });

        test('should not update best score when winning with worse score', () => {
            // Set up initial best score
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ bestScore: 5 }));

            // Create a new game instance to pick up the stored best score
            game = new TileGame('game');

            // Set up a state that will result in a win after toggling
            game.gameState.moves = 10;
            game.gameState.grid = [
                [false, true, false],
                [true, false, true],
                [false, true, false]
            ];

            // Clear any previous localStorage calls
            jest.clearAllMocks();

            // Trigger win by toggling center tile (1,1)
            game.toggleTiles(1, 1);

            // Verify the best score was not updated
            expect(localStorage.setItem).not.toHaveBeenCalled();
            expect(game.gameState.bestScore).toBe(5);
        });

        test('should migrate legacy bestScore key into the namespaced shape', () => {
            // Seed only the legacy bare key
            localStorage.setItem('bestScore', '7');

            // Constructing a new game should trigger the one-time migration
            game = new TileGame('game');

            expect(localStorage.getItem('bestScore')).toBeNull();
            expect(localStorage.getItem(STORAGE_KEY)).toBe(
                JSON.stringify({ bestScore: 7 })
            );
            expect(game.gameState.bestScore).toBe(7);
        });
    });

    describe('New Game', () => {
        test('should reset game state when starting new game', () => {
            // Set up some game progress
            game.gameState.moves = 5;
            game.gameState.isGameOver = true;
            game.messageEl.textContent = 'Game Over!';
            
            // Start new game
            game.newGame();
            
            // Verify game state is reset
            expect(game.gameState.moves).toBe(0);
            expect(game.gameState.isGameOver).toBe(false);
            expect(document.getElementById('scoreDisplay').textContent).toBe('0');
            expect(document.getElementById('message').textContent).toBe('');
        });
    });

    describe('Grid Position Calculation', () => {
        test('should return correct grid position for valid clicks', () => {
            // Test with coordinates in the center of the grid
            const pos = game.getGridPosition(150, 150);
            expect(pos).toEqual({
                row: 1,
                col: 1
            });
        });

        test('should return null for clicks outside grid', () => {
            // Test with coordinates way outside the grid
            const pos = game.getGridPosition(1000, 1000);
            expect(pos).toBeNull();
        });
    });
}); 