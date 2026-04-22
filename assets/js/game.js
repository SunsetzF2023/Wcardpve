// 游戏主类
class Game {
    constructor() {
        this.humanPlayer = null;
        this.aiPlayer = null;
        this.currentPlayer = null;
        this.opponent = null;
        this.round = 1;
        this.gameState = 'playing'; // playing, paused, gameOver
        this.winner = null;
        this.selectedCard = null;
        this.deck = [];
        
        // 游戏配置
        this.config = {
            startingHealth: 30,
            startingHandSize: 7,
            maxEnergy: 3,
            aiDifficulty: 'normal'
        };
        
        // DOM元素
        this.elements = {};
        this.initializeElements();
        
        // 初始化游戏
        this.initialize();
    }

    // 初始化DOM元素
    initializeElements() {
        this.elements = {
            playerHand: document.getElementById('player-hand'),
            aiHand: document.getElementById('ai-hand'),
            playerField: document.getElementById('player-cards'),
            aiField: document.getElementById('ai-cards'),
            turnIndicator: document.getElementById('turn-indicator'),
            roundCount: document.getElementById('round-count'),
            deckCount: document.getElementById('deck-count'),
            drawCardBtn: document.getElementById('draw-card-btn'),
            endTurnBtn: document.getElementById('end-turn-btn'),
            restartBtn: document.getElementById('restart-btn'),
            logContent: document.getElementById('log-content'),
            gameOverModal: document.getElementById('game-over-modal'),
            gameResult: document.getElementById('game-result'),
            gameMessage: document.getElementById('game-message'),
            playAgainBtn: document.getElementById('play-again-btn')
        };
        
        // 绑定事件
        this.bindEvents();
    }

    // 绑定事件
    bindEvents() {
        this.elements.drawCardBtn?.addEventListener('click', () => this.onDrawCard());
        this.elements.endTurnBtn?.addEventListener('click', () => this.onEndTurn());
        this.elements.restartBtn?.addEventListener('click', () => this.restart());
        this.elements.playAgainBtn?.addEventListener('click', () => {
            this.elements.gameOverModal.classList.add('hidden');
            this.restart();
        });
    }

    // 初始化游戏
    initialize() {
        // 创建牌堆
        this.deck = CardUtils.createDeck();
        
        // 创建玩家
        this.humanPlayer = new Player('玩家', true);
        this.aiPlayer = new AIPlayer('AI对手', this.config.aiDifficulty);
        
        // 设置全局引用
        window.gameInstance = this;
        
        // 初始化玩家
        this.humanPlayer.initialize(
            this.deck.slice(0, Math.floor(this.deck.length / 2)),
            this.elements.playerHand,
            this.elements.playerField
        );
        
        this.aiPlayer.initialize(
            this.deck.slice(Math.floor(this.deck.length / 2)),
            this.elements.aiHand,
            this.elements.aiField
        );
        
        // 设置当前玩家
        this.currentPlayer = this.humanPlayer;
        this.opponent = this.aiPlayer;
        
        // 开始游戏
        this.startGame();
    }

    // 开始游戏
    startGame() {
        this.gameState = 'playing';
        this.round = 1;
        
        // 玩家先手
        this.startTurn(this.humanPlayer);
        
        // 更新显示
        this.updateDisplay();
        
        // 记录日志
        this.addLog('游戏开始！玩家先手', 'system');
    }

    // 开始回合
    startTurn(player) {
        this.currentPlayer = player;
        this.opponent = player === this.humanPlayer ? this.aiPlayer : this.humanPlayer;
        
        player.startTurn();
        
        // 更新显示
        this.updateTurnDisplay();
        
        // 如果是AI回合，自动执行
        if (player instanceof AIPlayer) {
            this.executeAITurn();
        }
    }

    // 执行AI回合
    async executeAITurn() {
        await this.aiPlayer.startTurn();
        
        // AI回合结束后，切换到玩家回合
        if (this.gameState === 'playing') {
            this.startTurn(this.humanPlayer);
        }
    }

    // 结束回合
    endTurn() {
        if (this.currentPlayer !== this.humanPlayer) {
            return;
        }
        
        this.currentPlayer.endTurn();
        
        // 检查游戏是否结束
        if (this.checkGameOver()) {
            return;
        }
        
        // 切换到AI回合
        this.startTurn(this.aiPlayer);
    }

    // 卡牌选择处理
    onCardSelected(player, cardIndex) {
        if (player !== this.currentPlayer || this.gameState !== 'playing') {
            return;
        }
        
        const card = player.hand[cardIndex];
        
        // 尝试打出卡牌
        const effects = player.playCard(cardIndex, this.opponent, this);
        
        if (effects && effects.length > 0) {
            // 记录日志
            effects.forEach(effect => {
                this.addLog(`👤 ${effect}`, 'player-action');
            });
            
            // 检查游戏是否结束
            this.checkGameOver();
        }
    }

    // 抽牌处理
    onDrawCard() {
        if (this.currentPlayer !== this.humanPlayer || this.gameState !== 'playing') {
            return;
        }
        
        const drawnCards = this.humanPlayer.drawCard(1);
        
        if (drawnCards.length > 0) {
            this.addLog(`玩家抽了 1 张牌`, 'player-action');
            this.updateDisplay();
        }
    }

    // 结束回合处理
    onEndTurn() {
        if (this.currentPlayer !== this.humanPlayer || this.gameState !== 'playing') {
            return;
        }
        
        this.addLog(`玩家结束了回合`, 'player-action');
        this.endTurn();
    }

    // 检查游戏是否结束
    checkGameOver() {
        if (this.humanPlayer.health <= 0) {
            this.endGame(this.aiPlayer);
            return true;
        }
        
        if (this.aiPlayer.health <= 0) {
            this.endGame(this.humanPlayer);
            return true;
        }
        
        return false;
    }

    // 结束游戏
    endGame(winner) {
        this.gameState = 'gameOver';
        this.winner = winner;
        
        // 显示结果
        this.showGameOver(winner);
        
        // 记录日志
        this.addLog(`游戏结束！${winner.name} 获胜！`, 'system');
    }

    // 显示游戏结束界面
    showGameOver(winner) {
        if (!this.elements.gameOverModal) return;
        
        const isPlayerWin = winner === this.humanPlayer;
        
        this.elements.gameResult.textContent = isPlayerWin ? '🎉 胜利！' : '😔 失败';
        this.elements.gameMessage.textContent = isPlayerWin 
            ? '恭喜你击败了AI对手！' 
            : 'AI对手获得了胜利，再接再厉！';
        
        this.elements.gameOverModal.classList.remove('hidden');
    }

    // 重新开始游戏
    restart() {
        // 重置玩家
        this.humanPlayer.reset();
        this.aiPlayer.reset();
        
        // 重置游戏状态
        this.round = 1;
        this.gameState = 'playing';
        this.winner = null;
        this.selectedCard = null;
        
        // 清空日志
        if (this.elements.logContent) {
            this.elements.logContent.innerHTML = '';
        }
        
        // 重新初始化
        this.initialize();
    }

    // 更新显示
    updateDisplay() {
        this.updateTurnDisplay();
        this.updateDeckDisplay();
        this.updateButtonStates();
    }

    // 更新回合显示
    updateTurnDisplay() {
        if (this.elements.turnIndicator) {
            const isPlayerTurn = this.currentPlayer === this.humanPlayer;
            this.elements.turnIndicator.textContent = isPlayerTurn ? '你的回合' : 'AI回合';
            this.elements.turnIndicator.style.color = isPlayerTurn ? '#4ade80' : '#ef4444';
        }
        
        if (this.elements.roundCount) {
            this.elements.roundCount.textContent = `第 ${this.round} 回合`;
        }
    }

    // 更新牌堆显示
    updateDeckDisplay() {
        if (this.elements.deckCount) {
            const totalCards = this.humanPlayer.deck.length + this.aiPlayer.deck.length;
            this.elements.deckCount.textContent = totalCards;
        }
    }

    // 更新按钮状态
    updateButtonStates() {
        const isPlayerTurn = this.currentPlayer === this.humanPlayer;
        const canDraw = isPlayerTurn && this.humanPlayer.deck.length > 0;
        
        if (this.elements.drawCardBtn) {
            this.elements.drawCardBtn.disabled = !canDraw;
        }
        
        if (this.elements.endTurnBtn) {
            this.elements.endTurnBtn.disabled = !isPlayerTurn;
        }
    }

    // 添加日志
    addLog(message, type = 'system') {
        if (!this.elements.logContent) return;
        
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${type}`;
        logEntry.textContent = message;
        
        this.elements.logContent.appendChild(logEntry);
        
        // 滚动到底部
        this.elements.logContent.scrollTop = this.elements.logContent.scrollHeight;
        
        // 限制日志数量
        const maxLogs = 50;
        while (this.elements.logContent.children.length > maxLogs) {
            this.elements.logContent.removeChild(this.elements.logContent.firstChild);
        }
    }

    // 获取敌人
    getEnemies(player) {
        return player === this.humanPlayer ? [this.aiPlayer] : [this.humanPlayer];
    }

    // 获取盟友
    getAllies(player) {
        return player === this.humanPlayer ? [this.humanPlayer] : [this.aiPlayer];
    }

    // 获取游戏状态
    getGameState() {
        return {
            state: this.gameState,
            round: this.round,
            currentPlayer: this.currentPlayer?.name,
            playerStatus: this.humanPlayer.getStatus(),
            aiStatus: this.aiPlayer.getStatus(),
            winner: this.winner?.name
        };
    }

    // 设置游戏配置
    setConfig(key, value) {
        if (this.config.hasOwnProperty(key)) {
            this.config[key] = value;
            
            // 如果设置AI难度，更新AI
            if (key === 'aiDifficulty' && this.aiPlayer) {
                this.aiPlayer.setDifficulty(value);
            }
        }
    }

    // 暂停游戏
    pause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            this.addLog('游戏已暂停', 'system');
        }
    }

    // 恢复游戏
    resume() {
        if (this.gameState === 'paused') {
            this.gameState = 'playing';
            this.addLog('游戏已恢复', 'system');
        }
    }

    // 获取游戏统计
    getStats() {
        return {
            totalRounds: this.round,
            playerCardsPlayed: this.humanPlayer.discardPile.length,
            aiCardsPlayed: this.aiPlayer.discardPile.length,
            playerDamageDealt: this.config.startingHealth - this.aiPlayer.health,
            aiDamageDealt: this.config.startingHealth - this.humanPlayer.health,
            gameDuration: Date.now() - (this.startTime || Date.now())
        };
    }
}
