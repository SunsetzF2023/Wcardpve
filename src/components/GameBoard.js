/**
 * GameBoard Component
 * Main game board component that manages the overall game layout
 */
export class GameBoard {
    constructor(container) {
        this.container = container;
        this.components = new Map();
        this.gameState = null;
        this.init();
    }

    init() {
        this.createBoardStructure();
        this.setupEventListeners();
    }

    createBoardStructure() {
        this.container.innerHTML = `
            <div class="game-board">
                <header class="game-header">
                    <h1>⚔️ Card Battle Arena ⚔️</h1>
                    <div class="game-info">
                        <span id="turn-indicator">Your Turn</span>
                        <span id="round-count">Round 1</span>
                    </div>
                </header>

                <section class="opponent-area" id="opponent-area">
                    <div class="player-info">
                        <h3>🤖 AI Opponent</h3>
                        <div class="health-bar">
                            <div class="health-fill" id="ai-health" style="width: 100%"></div>
                            <span class="health-text">HP: <span id="ai-hp">30</span>/30</span>
                        </div>
                    </div>
                    <div class="hand-area" id="ai-hand"></div>
                </section>

                <section class="battlefield">
                    <div class="player-field" id="ai-field">
                        <h4>AI Battlefield</h4>
                        <div class="cards-container" id="ai-cards"></div>
                    </div>
                    
                    <div class="vs-indicator">VS</div>
                    
                    <div class="player-field" id="player-field">
                        <h4>Your Battlefield</h4>
                        <div class="cards-container" id="player-cards"></div>
                    </div>
                </section>

                <section class="player-area" id="player-area">
                    <div class="hand-area" id="player-hand"></div>
                    <div class="player-info">
                        <h3>👤 Player</h3>
                        <div class="health-bar">
                            <div class="health-fill" id="player-health" style="width: 100%"></div>
                            <span class="health-text">HP: <span id="player-hp">30</span>/30</span>
                        </div>
                    </div>
                </section>

                <section class="control-panel" id="control-panel">
                    <button id="draw-card-btn" class="game-btn">Draw Card</button>
                    <button id="end-turn-btn" class="game-btn">End Turn</button>
                    <button id="restart-btn" class="game-btn">Restart</button>
                    <div class="deck-info">
                        Deck: <span id="deck-count">90</span> cards
                    </div>
                </section>

                <section class="game-log">
                    <h4>Battle Log</h4>
                    <div id="log-content" class="log-content"></div>
                </section>
            </div>
        `;
    }

    setupEventListeners() {
        // Event delegation for better performance
        this.container.addEventListener('click', this.handleClick.bind(this));
        this.container.addEventListener('keydown', this.handleKeydown.bind(this));
    }

    handleClick(event) {
        const target = event.target;
        const action = target.dataset.action;
        
        if (action) {
            this.emit('action', { type: action, target });
        }
    }

    handleKeydown(event) {
        const keyMap = {
            ' ': 'endTurn',
            'd': 'drawCard',
            'r': 'restart',
            'Escape': 'pause'
        };

        const action = keyMap[event.key];
        if (action) {
            event.preventDefault();
            this.emit('action', { type: action });
        }
    }

    updateGameState(gameState) {
        this.gameState = gameState;
        this.render();
    }

    render() {
        if (!this.gameState) return;

        this.updateTurnIndicator();
        this.updateHealthBars();
        this.updateDeckCount();
        this.updateRoundCount();
    }

    updateTurnIndicator() {
        const indicator = document.getElementById('turn-indicator');
        if (indicator && this.gameState.currentPlayer) {
            const isPlayerTurn = this.gameState.currentPlayer === 'player';
            indicator.textContent = isPlayerTurn ? 'Your Turn' : 'AI Turn';
            indicator.style.color = isPlayerTurn ? '#4ade80' : '#ef4444';
        }
    }

    updateHealthBars() {
        if (this.gameState.player) {
            this.updateHealthBar('player', this.gameState.player);
        }
        if (this.gameState.ai) {
            this.updateHealthBar('ai', this.gameState.ai);
        }
    }

    updateHealthBar(prefix, player) {
        const healthBar = document.getElementById(`${prefix}-health`);
        const healthText = document.getElementById(`${prefix}-hp`);
        
        if (healthBar && healthText) {
            const healthPercent = (player.health / player.maxHealth) * 100;
            healthBar.style.width = `${healthPercent}%`;
            healthText.textContent = `${player.health}/${player.maxHealth}`;
        }
    }

    updateDeckCount() {
        const deckCount = document.getElementById('deck-count');
        if (deckCount && this.gameState.deckSize !== undefined) {
            deckCount.textContent = this.gameState.deckSize;
        }
    }

    updateRoundCount() {
        const roundCount = document.getElementById('round-count');
        if (roundCount && this.gameState.round) {
            roundCount.textContent = `Round ${this.gameState.round}`;
        }
    }

    addLogEntry(message, type = 'system') {
        const logContent = document.getElementById('log-content');
        if (!logContent) return;

        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${type}`;
        logEntry.textContent = message;
        
        logContent.appendChild(logEntry);
        logContent.scrollTop = logContent.scrollHeight;

        // Limit log entries
        while (logContent.children.length > 50) {
            logContent.removeChild(logContent.firstChild);
        }
    }

    showGameOver(winner) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>${winner === 'player' ? '🎉 Victory!' : '😔 Defeat'}</h2>
                <p>${winner === 'player' ? 'Congratulations! You defeated the AI!' : 'The AI won this time. Try again!'}</p>
                <button class="game-btn" data-action="restart">Play Again</button>
            </div>
        `;
        
        this.container.appendChild(modal);
    }

    hideGameOver() {
        const modal = this.container.querySelector('.modal');
        if (modal) {
            modal.remove();
        }
    }

    emit(event, data) {
        const customEvent = new CustomEvent(event, { detail: data });
        this.container.dispatchEvent(customEvent);
    }

    on(event, callback) {
        this.container.addEventListener(event, callback);
    }

    off(event, callback) {
        this.container.removeEventListener(event, callback);
    }

    destroy() {
        this.container.innerHTML = '';
        this.components.clear();
    }
}
