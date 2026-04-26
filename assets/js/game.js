const STORAGE_KEY = 'tomlai:game:v1';

function loadStoredState() {
    // One-time migration from the legacy bare 'bestScore' key.
    try {
        const legacy = localStorage.getItem('bestScore');
        const current = localStorage.getItem(STORAGE_KEY);
        if (legacy != null && current == null) {
            const parsed = parseInt(legacy, 10);
            const bestScore = Number.isFinite(parsed) ? parsed : 0;
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ bestScore }));
            if (typeof localStorage.removeItem === 'function') {
                localStorage.removeItem('bestScore');
            }
        }
    } catch (_) {
        // localStorage unavailable — fall through to defaults
    }

    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return { bestScore: 0 };
        const parsed = JSON.parse(raw);
        return { bestScore: Number.isFinite(parsed.bestScore) ? parsed.bestScore : 0 };
    } catch (_) {
        return { bestScore: 0 };
    }
}

function saveStoredState(state) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (_) {
        // ignore
    }
}

export class TileGame {
    constructor(containerId) {
        // Game constants (retained for getGridPosition math / tests)
        this.GRID_SIZE = 3;
        this.CELL_SIZE = 80;
        this.CELL_PADDING = 10;
        this.GRID_PADDING = 30;

        // Create container elements
        this.container = document.getElementById(containerId);
        this.container.style.display = 'none'; // Hide initially
        this.container.innerHTML = `
            <div class="game-page">
                <div class="game-head">
                    <h1>tile puzzle</h1>
                    <div class="rules">
                        <div class="rule"><span class="k">goal</span> make all tiles match</div>
                        <div class="rule"><span class="k">rule</span> click a tile — it and its neighbors flip</div>
                        <div class="rule"><span class="k">tip</span> fewer moves is better</div>
                    </div>
                    <button class="close-button" aria-label="close">×</button>
                </div>

                <div class="game-grid-wrap">
                    <div class="game-grid" id="gameGrid"></div>
                    <div class="game-readout">
                        <div class="ro-row"><span class="lbl">moves</span><span class="val" id="scoreDisplay">00</span></div>
                        <div class="ro-row"><span class="lbl">best</span><span class="val hi" id="bestScoreDisplay">—</span></div>
                        <div class="ro-row"><span class="lbl">status</span><span class="val dim" id="statusDisplay">in progress</span></div>
                        <hr />
                        <button class="btn-mono" id="newGameBtn">New game</button>
                    </div>
                </div>

                <div id="message"></div>

                <canvas id="gameCanvas" style="display:none" width="1" height="1"></canvas>
            </div>
        `;

        // Get elements
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext ? this.canvas.getContext('2d') : null;
        this.messageEl = document.getElementById('message');
        this.scoreDisplay = document.getElementById('scoreDisplay');
        this.bestScoreDisplay = document.getElementById('bestScoreDisplay');
        this.statusDisplay = document.getElementById('statusDisplay');
        this.newGameBtn = document.getElementById('newGameBtn');
        this.gridEl = document.getElementById('gameGrid');
        this.closeBtn = this.container.querySelector('.close-button');

        // Initialize game state
        const stored = loadStoredState();
        this.gameState = {
            grid: Array(this.GRID_SIZE).fill().map(() => Array(this.GRID_SIZE).fill(false)),
            moves: 0,
            isGameOver: false,
            bestScore: stored.bestScore
        };

        // Set up event listeners
        // Delegated click on the DOM grid
        this.gridEl.addEventListener('click', (event) => {
            const btn = event.target.closest('.gt');
            if (!btn || !this.gridEl.contains(btn)) return;
            const row = parseInt(btn.dataset.row, 10);
            const col = parseInt(btn.dataset.col, 10);
            if (!Number.isNaN(row) && !Number.isNaN(col)) {
                this.toggleTiles(row, col);
            }
        });
        this.newGameBtn.addEventListener('click', () => this.newGame());
        this.closeBtn.addEventListener('click', () => {
            this.container.style.display = 'none';
            history.pushState(null, '', '/');
        });

        // Initialize the game
        this.initCanvas();
        this.buildGridButtons();
        this.renderGrid();
        this.updateBestScore();
        this.updateStatus();
    }

    updateBestScore() {
        if (this.gameState.bestScore === 0) {
            this.bestScoreDisplay.textContent = '—';
        } else {
            this.bestScoreDisplay.textContent = this.gameState.bestScore;
        }
    }

    updateStatus() {
        if (!this.statusDisplay) return;
        if (this.gameState.isGameOver) {
            this.statusDisplay.textContent = 'solved!';
            this.statusDisplay.classList.remove('dim');
            this.statusDisplay.classList.add('hi');
        } else {
            this.statusDisplay.textContent = 'in progress';
            this.statusDisplay.classList.add('dim');
            this.statusDisplay.classList.remove('hi');
        }
    }

    initCanvas() {
        // Retained so getGridPosition math matches the legacy canvas coordinate space.
        const totalSize = (this.GRID_SIZE * this.CELL_SIZE) +
                         ((this.GRID_SIZE - 1) * this.CELL_PADDING) +
                         (this.GRID_PADDING * 2);
        if (this.canvas) {
            this.canvas.width = totalSize;
            this.canvas.height = totalSize;
        }
    }

    buildGridButtons() {
        if (!this.gridEl) return;
        this.gridEl.innerHTML = '';
        for (let row = 0; row < this.GRID_SIZE; row++) {
            for (let col = 0; col < this.GRID_SIZE; col++) {
                const btn = document.createElement('button');
                btn.className = 'gt';
                btn.type = 'button';
                btn.dataset.row = String(row);
                btn.dataset.col = String(col);
                btn.setAttribute('aria-label', `tile ${row},${col}`);
                this.gridEl.appendChild(btn);
            }
        }
    }

    renderGrid() {
        if (!this.gridEl) return;
        const buttons = this.gridEl.querySelectorAll('.gt');
        buttons.forEach((btn) => {
            const row = parseInt(btn.dataset.row, 10);
            const col = parseInt(btn.dataset.col, 10);
            const on = !!this.gameState.grid[row][col];
            btn.classList.toggle('on', on);
            btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
    }

    // Alias preserved for callers/tests that reference drawGrid().
    drawGrid() {
        this.renderGrid();
    }

    celebrateWin() {
        if (typeof confetti !== 'function') return;
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

        fire(0.25, { spread: 26, startVelocity: 55 });
        fire(0.2, { spread: 60 });
        fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
        fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
        fire(0.1, { spread: 120, startVelocity: 45 });
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
            const stored = loadStoredState();
            const currentBestScore = stored.bestScore;
            const isNewBest = currentBestScore === 0 || this.gameState.moves < currentBestScore;

            if (isNewBest) {
                saveStoredState({ bestScore: this.gameState.moves });
                this.gameState.bestScore = this.gameState.moves;
                this.updateBestScore();
                this.messageEl.textContent = `New best score: ${this.gameState.moves} moves!`;
            } else {
                this.messageEl.textContent = `You won in ${this.gameState.moves} moves!`;
            }

            this.updateStatus();
            // Trigger confetti celebration
            this.celebrateWin();
        }

        // Update display
        this.renderGrid();
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

    show() {
        this.container.style.display = 'block';
        this.container.scrollIntoView({ behavior: 'smooth' });
    }

    hide() {
        this.container.style.display = 'none';
    }

    newGame() {
        // Reset game state
        this.gameState.grid = Array(this.GRID_SIZE).fill().map(() => Array(this.GRID_SIZE).fill(false));
        this.gameState.moves = 0;
        this.gameState.isGameOver = false;
        this.scoreDisplay.textContent = '0';
        this.messageEl.textContent = '';
        this.updateStatus();

        // Make a few random moves to create a solvable puzzle
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
        this.renderGrid();
    }
}
