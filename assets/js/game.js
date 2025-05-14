export class TileGame {
    constructor(containerId) {
        // Game constants
        this.GRID_SIZE = 3;
        this.CELL_SIZE = 80;
        this.CELL_PADDING = 10;
        this.GRID_PADDING = 30;
        
        // Create container elements
        this.container = document.getElementById(containerId);
        this.container.style.display = 'none'; // Hide initially
        this.container.innerHTML = `
            <div class="game-container">
                <h2>Tile Puzzle</h2>
                <div class="instructions">
                    <p>🎯 Goal: Make all tiles the same color (either all light or all dark)</p>
                    <p>🎮 Click any tile to toggle its color and its adjacent tiles</p>
                    <p>🔄 Adjacent means the tiles directly above, below, left, and right</p>
                    <p>⭐ Try to solve the puzzle in as few moves as possible!</p>
                </div>
                <canvas id="gameCanvas" width="300" height="300"></canvas>
                <div id="message"></div>
                <div class="stats">
                    <div class="score">Moves: <span id="scoreDisplay">0</span></div>
                    <div class="score">Best: <span id="bestScoreDisplay">-</span></div>
                </div>
                <button class="button" id="newGameBtn">New Game</button>
            </div>
        `;

        // Add confetti script
        if (!document.getElementById('confetti-script')) {
            const script = document.createElement('script');
            script.id = 'confetti-script';
            script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js';
            document.head.appendChild(script);
        }

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .game-container {
                background-color: #2a2a2a;
                padding: 2rem;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                text-align: center;
                margin: 2rem 0;
            }
            .game-container h2 {
                color: #ffffff;
                margin-top: 0;
            }
            #gameCanvas {
                background-color: #1a1a1a;
                margin: 20px auto;
                display: block;
                border-radius: 4px;
                cursor: pointer;
            }
            .instructions {
                background-color: #333333;
                padding: 1rem;
                border-radius: 4px;
                margin: 1rem 0;
                text-align: left;
                font-size: 0.9em;
                line-height: 1.4;
            }
            .stats {
                display: flex;
                justify-content: center;
                gap: 2rem;
                margin: 1rem 0;
            }
            .score {
                font-size: 1.2em;
                margin: 1rem 0;
            }
            #message {
                color: #74c0fc;
                font-weight: bold;
                height: 1.5em;
                margin: 1rem 0;
            }
            .button {
                background-color: #74c0fc;
                color: #1a1a1a;
                border: none;
                padding: 0.5rem 1rem;
                border-radius: 4px;
                cursor: pointer;
                font-weight: bold;
                transition: background-color 0.2s ease;
                margin: 0.5rem;
            }
            .button:hover {
                background-color: #4dabf7;
            }
        `;
        document.head.appendChild(style);

        // Get elements
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.messageEl = document.getElementById('message');
        this.scoreDisplay = document.getElementById('scoreDisplay');
        this.bestScoreDisplay = document.getElementById('bestScoreDisplay');
        this.newGameBtn = document.getElementById('newGameBtn');

        // Initialize game state
        this.gameState = {
            grid: Array(this.GRID_SIZE).fill().map(() => Array(this.GRID_SIZE).fill(false)),
            moves: 0,
            isGameOver: false,
            bestScore: parseInt(localStorage.getItem('bestScore')) || 0
        };

        // Set up event listeners
        this.canvas.addEventListener('click', (event) => this.handleClick(event));
        this.newGameBtn.addEventListener('click', () => this.newGame());

        // Initialize the game
        this.initCanvas();
        this.updateBestScore();
    }

    updateBestScore() {
        if (this.gameState.bestScore === 0) {
            this.bestScoreDisplay.textContent = '-';
        } else {
            this.bestScoreDisplay.textContent = this.gameState.bestScore;
        }
    }

    initCanvas() {
        const totalSize = (this.GRID_SIZE * this.CELL_SIZE) + 
                         ((this.GRID_SIZE - 1) * this.CELL_PADDING) + 
                         (this.GRID_PADDING * 2);
        this.canvas.width = totalSize;
        this.canvas.height = totalSize;
        this.drawGrid();
    }

    drawGrid() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        for (let row = 0; row < this.GRID_SIZE; row++) {
            for (let col = 0; col < this.GRID_SIZE; col++) {
                const x = this.GRID_PADDING + (col * (this.CELL_SIZE + this.CELL_PADDING));
                const y = this.GRID_PADDING + (row * (this.CELL_SIZE + this.CELL_PADDING));
                
                // Draw cell background
                this.ctx.fillStyle = this.gameState.grid[row][col] ? '#74c0fc' : '#333333';
                this.ctx.fillRect(x, y, this.CELL_SIZE, this.CELL_SIZE);
                
                // Draw cell border
                this.ctx.strokeStyle = '#4a4a4a';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(x, y, this.CELL_SIZE, this.CELL_SIZE);
            }
        }
    }

    celebrateWin() {
        // Create multiple bursts of confetti
        const count = 200;
        const defaults = {
            origin: { y: 0.7 }
        };

        function fire(particleRatio, opts) {
            confetti({
                ...defaults,
                ...opts,
                particleCount: Math.floor(count * particleRatio),
            });
        }

        fire(0.25, {
            spread: 26,
            startVelocity: 55,
        });

        fire(0.2, {
            spread: 60,
        });

        fire(0.35, {
            spread: 100,
            decay: 0.91,
            scalar: 0.8
        });

        fire(0.1, {
            spread: 120,
            startVelocity: 25,
            decay: 0.92,
            scalar: 1.2
        });

        fire(0.1, {
            spread: 120,
            startVelocity: 45,
        });
    }

    toggleTiles(row, col) {
        if (this.gameState.isGameOver) return;

        // Toggle clicked tile
        this.gameState.grid[row][col] = !this.gameState.grid[row][col];
        
        // Toggle adjacent tiles
        const adjacentTiles = [
            [row-1, col], // up
            [row+1, col], // down
            [row, col-1], // left
            [row, col+1]  // right
        ];

        adjacentTiles.forEach(([r, c]) => {
            if (r >= 0 && r < this.GRID_SIZE && c >= 0 && c < this.GRID_SIZE) {
                this.gameState.grid[r][c] = !this.gameState.grid[r][c];
            }
        });

        // Update moves counter
        this.gameState.moves++;
        this.scoreDisplay.textContent = this.gameState.moves;

        // Check win condition
        if (this.isWinState()) {
            this.gameState.isGameOver = true;
            const currentBestScore = parseInt(localStorage.getItem('bestScore')) || 0;
            const isNewBest = currentBestScore === 0 || this.gameState.moves < currentBestScore;
            
            if (isNewBest) {
                localStorage.setItem('bestScore', this.gameState.moves.toString());
                this.gameState.bestScore = this.gameState.moves;
                this.updateBestScore();
                this.messageEl.textContent = `🎉 New Best Score: ${this.gameState.moves} moves!`;
            } else {
                this.messageEl.textContent = `🎈 You won in ${this.gameState.moves} moves!`;
            }

            // Trigger confetti celebration
            this.celebrateWin();
        }

        // Update display
        this.drawGrid();
    }

    isWinState() {
        const firstTileState = this.gameState.grid[0][0];
        return this.gameState.grid.every(row => 
            row.every(cell => cell === firstTileState)
        );
    }

    getGridPosition(x, y) {
        const rect = this.canvas.getBoundingClientRect();
        const clickX = x - rect.left - this.GRID_PADDING;
        const clickY = y - rect.top - this.GRID_PADDING;
        
        const col = Math.floor(clickX / (this.CELL_SIZE + this.CELL_PADDING));
        const row = Math.floor(clickY / (this.CELL_SIZE + this.CELL_PADDING));
        
        if (col >= 0 && col < this.GRID_SIZE && row >= 0 && row < this.GRID_SIZE &&
            clickX >= 0 && clickY >= 0) {
            return { row, col };
        }
        return null;
    }

    handleClick(event) {
        const pos = this.getGridPosition(event.clientX, event.clientY);
        if (pos) {
            this.toggleTiles(pos.row, pos.col);
        }
    }

    newGame() {
        // Reset game state
        this.gameState.grid = Array(this.GRID_SIZE).fill().map(() => Array(this.GRID_SIZE).fill(false));
        this.gameState.moves = 0;
        this.gameState.isGameOver = false;
        this.scoreDisplay.textContent = '0';
        this.messageEl.textContent = '';
        
        // Make a few random moves to create a solvable puzzle
        // Store original isGameOver check function
        const originalIsGameOver = this.isWinState;
        // Temporarily disable win state checking during puzzle creation
        this.isWinState = () => false;
        
        for (let i = 0; i < 5; i++) {
            const row = Math.floor(Math.random() * this.GRID_SIZE);
            const col = Math.floor(Math.random() * this.GRID_SIZE);
            this.toggleTiles(row, col);
        }
        
        // Restore original isGameOver check
        this.isWinState = originalIsGameOver;
        
        // Reset moves counter after creating puzzle
        this.gameState.moves = 0;
        this.scoreDisplay.textContent = '0';
        this.drawGrid();
    }
}

// Initialize game and set up navigation handling
document.addEventListener('DOMContentLoaded', () => {
    const game = new TileGame('game');
    
    // Handle navigation clicks
    document.addEventListener('click', (event) => {
        // Check if the clicked element is a link to the game
        if (event.target.matches('a[href="/#game"]')) {
            event.preventDefault();
            // Toggle game container visibility
            const gameContainer = document.getElementById('game');
            if (gameContainer.style.display === 'none') {
                gameContainer.style.display = 'block';
                gameContainer.scrollIntoView({ behavior: 'smooth' });
                // Update URL hash without triggering a scroll
                history.pushState(null, '', '#game');
            } else {
                gameContainer.style.display = 'none';
                // Remove hash from URL when hiding game
                history.pushState(null, '', '/');
            }
        }
    });

    // Handle URL-based navigation and back/forward buttons
    window.addEventListener('popstate', () => {
        const gameContainer = document.getElementById('game');
        if (window.location.hash === '#game') {
            gameContainer.style.display = 'block';
            gameContainer.scrollIntoView({ behavior: 'smooth' });
        } else {
            gameContainer.style.display = 'none';
        }
    });

    // Check initial URL hash
    if (window.location.hash === '#game') {
        document.getElementById('game').style.display = 'block';
        document.getElementById('game').scrollIntoView({ behavior: 'smooth' });
    }
}); 