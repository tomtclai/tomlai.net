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

        // Add confetti script
        if (!document.getElementById('confetti-script')) {
            const script = document.createElement('script');
            script.id = 'confetti-script';
            script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js';
            document.head.appendChild(script);
        }

        // Add styles — Direction A: Terminal Journal
        const style = document.createElement('style');
        style.textContent = `
            #game { max-width: 100%; overflow-x: hidden; }
            #game .game-page { padding: clamp(20px, 5vw, 36px) 0 clamp(28px, 6vw, 48px); max-width: 820px; margin: 0 auto; position: relative; }
            #game .game-head { margin-bottom: clamp(20px, 4vw, 32px); position: relative; padding-right: 40px; }
            #game .game-head h1 { font-family: var(--body-font); font-size: clamp(22px, 6vw, 34px); font-weight: 700; letter-spacing: -0.02em; margin: 0 0 16px; color: var(--text-primary); word-break: break-word; }
            #game .game-head .rules { display: flex; flex-direction: column; gap: 4px; font-size: 13px; color: var(--text-muted); }
            #game .game-head .rule { display: flex; gap: 8px; }
            #game .game-head .rule .k { flex-shrink: 0; width: 48px; color: var(--text-dim); text-transform: uppercase; font-size: 10px; letter-spacing: 0.14em; padding-top: 3px; }
            #game .close-button { position: absolute; top: 0; right: 0; background: transparent; border: none; color: var(--text-dim); font-size: 28px; cursor: pointer; line-height: 1; padding: 8px; min-width: 44px; min-height: 44px; transition: color .15s; }
            #game .close-button:hover { color: var(--text-primary); }
            #game .game-grid-wrap { display: flex; flex-direction: column; gap: 20px; padding: clamp(14px, 4vw, 28px); border: 1px solid var(--border-color); background: var(--bg-surface); margin-bottom: 28px; align-items: stretch; }
            @media (min-width: 640px) { #game .game-grid-wrap { display: grid; grid-template-columns: auto 1fr; gap: 40px; align-items: start; } }
            #game .game-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: clamp(4px, 1.5vw, 8px); width: 100%; max-width: min(320px, 100%); aspect-ratio: 1; margin: 0 auto; }
            @media (min-width: 640px) { #game .game-grid { grid-template-columns: repeat(3, 96px); grid-template-rows: repeat(3, 96px); gap: 8px; width: auto; max-width: none; aspect-ratio: auto; margin: 0; } }
            #game .gt { width: 100%; height: 100%; aspect-ratio: 1; border: 1px solid var(--border-color); background: var(--bg-elevated); cursor: pointer; transition: background .12s, transform .1s; padding: 0; }
            @media (min-width: 640px) { #game .gt { width: 96px; height: 96px; aspect-ratio: auto; } }
            #game .gt:hover { border-color: var(--accent-cyan); }
            #game .gt:active { transform: scale(0.96); }
            #game .gt.on { background: var(--accent-cyan); border-color: var(--accent-cyan); }
            #game .game-readout { display: flex; flex-direction: column; gap: 8px; font-size: 13px; font-family: var(--body-font); }
            @media (min-width: 640px) { #game .game-readout { min-width: 200px; } }
            #game .game-readout .ro-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed var(--border-color); gap: 12px; }
            #game .game-readout .ro-row .lbl { color: var(--text-dim); text-transform: uppercase; font-size: 11px; letter-spacing: 0.1em; }
            #game .game-readout .ro-row .val { font-variant-numeric: tabular-nums; color: var(--text-primary); font-weight: 700; text-align: right; word-break: break-word; }
            #game .game-readout .ro-row .val.hi { color: var(--accent-cyan); }
            #game .game-readout .ro-row .val.dim { color: var(--text-muted); font-weight: 400; }
            #game .game-readout hr { border: 0; border-top: 1px solid var(--border-color); margin: 8px 0 4px; }
            #game .btn-mono { background: var(--accent-cyan); color: var(--bg-base); border: none; padding: 12px 14px; min-height: 44px; font-family: var(--body-font); font-size: 13px; font-weight: 700; text-align: left; cursor: pointer; margin-bottom: 2px; transition: opacity .15s; }
            #game .btn-mono:hover { opacity: 0.85; }
            #game #message { color: var(--accent-cyan); font-weight: bold; min-height: 1.5em; margin: 1rem 0; font-family: var(--body-font); }
            @media (prefers-reduced-motion: reduce) {
              #game *, #game *::before, #game *::after { transition-duration: 0.01ms !important; animation-duration: 0.01ms !important; }
            }
        `;
        document.head.appendChild(style);

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
        this.gameState = {
            grid: Array(this.GRID_SIZE).fill().map(() => Array(this.GRID_SIZE).fill(false)),
            moves: 0,
            isGameOver: false,
            bestScore: parseInt(localStorage.getItem('bestScore')) || 0
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
            const currentBestScore = parseInt(localStorage.getItem('bestScore')) || 0;
            const isNewBest = currentBestScore === 0 || this.gameState.moves < currentBestScore;

            if (isNewBest) {
                localStorage.setItem('bestScore', this.gameState.moves.toString());
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

// Initialize game and set up navigation handling
document.addEventListener('DOMContentLoaded', () => {
    const game = new TileGame('game');

    // Handle navigation clicks
    document.addEventListener('click', (event) => {
        const isGameLink = event.target.matches('a[href="/#game"]') ||
                          (event.target.closest('a') && event.target.closest('a').getAttribute('href') === '/#game');

        if (isGameLink) {
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
