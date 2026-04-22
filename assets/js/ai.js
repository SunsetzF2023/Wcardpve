// AI玩家类
class AIPlayer extends Player {
    constructor(name = "AI对手", difficulty = 'normal') {
        super(name, false);
        this.difficulty = difficulty;
        this.thinkingTime = 1500; // 思考时间（毫秒）
        this.strategy = this.initializeStrategy();
    }

    // 初始化AI策略
    initializeStrategy() {
        const strategies = {
            easy: {
                aggressiveness: 0.3,
                defensiveness: 0.4,
                cardUsage: 0.6,
                targetPriority: 'random'
            },
            normal: {
                aggressiveness: 0.6,
                defensiveness: 0.5,
                cardUsage: 0.8,
                targetPriority: 'weakest'
            },
            hard: {
                aggressiveness: 0.8,
                defensiveness: 0.3,
                cardUsage: 0.9,
                targetPriority: 'strategic'
            }
        };
        
        return strategies[this.difficulty] || strategies.normal;
    }

    // AI开始回合
    async startTurn() {
        super.startTurn();
        
        // 显示AI思考中
        this.showThinking();
        
        // 等待思考时间
        await this.delay(this.thinkingTime);
        
        // 执行AI决策
        await this.makeDecisions();
        
        // 结束回合
        this.endTurn();
    }

    // 显示思考状态
    showThinking() {
        const turnIndicator = document.getElementById('turn-indicator');
        if (turnIndicator) {
            turnIndicator.textContent = 'AI思考中...';
            turnIndicator.style.color = '#ef4444';
        }
    }

    // AI决策主函数
    async makeDecisions() {
        const decisions = [];
        
        // 评估当前局势
        const gameState = this.evaluateGameState();
        
        // 决定出牌顺序
        const playOrder = this.decidePlayOrder(gameState);
        
        // 按顺序出牌
        for (const cardIndex of playOrder) {
            if (this.energy <= 0) break;
            
            const decision = this.makeCardDecision(cardIndex, gameState);
            if (decision) {
                decisions.push(decision);
                await this.executeDecision(decision);
                await this.delay(500); // 每张牌之间的延迟
            }
        }
        
        return decisions;
    }

    // 评估游戏状态
    evaluateGameState() {
        const player = window.gameInstance?.humanPlayer;
        
        return {
            myHealth: this.health,
            myArmor: this.armor,
            myHandSize: this.hand.length,
            enemyHealth: player?.health || 0,
            enemyArmor: player?.armor || 0,
            enemyHandSize: player?.hand.length || 0,
            healthDifference: this.health - (player?.health || 0),
            isWinning: this.health > (player?.health || 0),
            isLosing: this.health < (player?.health || 0) * 0.6,
            canKillEnemy: (player?.health || 0) <= this.getPotentialDamage()
        };
    }

    // 决定出牌顺序
    decidePlayOrder(gameState) {
        const playableCards = this.getPlayableCards(window.gameInstance);
        
        // 根据策略对卡牌排序
        return playableCards
            .map((card, index) => ({
                card,
                index: this.hand.indexOf(card),
                priority: this.calculateCardPriority(card, gameState)
            }))
            .sort((a, b) => b.priority - a.priority)
            .map(item => item.index);
    }

    // 计算卡牌优先级
    calculateCardPriority(card, gameState) {
        let priority = 0;
        
        // 基础优先级
        switch (card.type) {
            case 'attack':
                priority = 10 * this.strategy.aggressiveness;
                break;
            case 'heal':
                priority = 8 * (1 - this.strategy.aggressiveness);
                if (gameState.isLosing) priority += 5;
                break;
            case 'defense':
                priority = 6 * this.strategy.defensiveness;
                if (gameState.myHealth < 15) priority += 3;
                break;
            case 'special':
                priority = 7 * this.strategy.cardUsage;
                break;
        }
        
        // 根据卡牌威力调整
        priority += card.power * 0.5;
        
        // 根据稀有度调整
        const rarityBonus = {
            'common': 0,
            'rare': 1,
            'epic': 2,
            'legendary': 3
        };
        priority += rarityBonus[card.rarity] || 0;
        
        // 特殊情况调整
        if (card.type === 'heal' && this.health >= 25) {
            priority -= 3; // 血量高时治疗优先级降低
        }
        
        if (card.type === 'attack' && gameState.canKillEnemy) {
            priority += 10; // 能击杀敌人时攻击优先级提高
        }
        
        return priority;
    }

    // 做出单张卡牌决策
    makeCardDecision(cardIndex, gameState) {
        const card = this.hand[cardIndex];
        
        if (!card || !card.canPlay(this, window.gameInstance)) {
            return null;
        }
        
        const target = this.selectTarget(card, gameState);
        
        return {
            type: 'playCard',
            cardIndex,
            target,
            card
        };
    }

    // 选择目标
    selectTarget(card, gameState) {
        const player = window.gameInstance?.humanPlayer;
        
        if (!player) return null;
        
        switch (this.strategy.targetPriority) {
            case 'weakest':
                return player;
            case 'strategic':
                return this.selectStrategicTarget(card, gameState);
            case 'random':
            default:
                return player;
        }
    }

    // 策略性目标选择
    selectStrategicTarget(card, gameState) {
        const player = window.gameInstance?.humanPlayer;
        
        if (card.type === 'attack') {
            // 优先攻击低血量目标
            return player;
        }
        
        if (card.type === 'heal') {
            // AI只会治疗自己
            return this;
        }
        
        return player;
    }

    // 执行决策
    async executeDecision(decision) {
        if (decision.type === 'playCard') {
            const effects = this.playCard(
                decision.cardIndex,
                decision.target,
                window.gameInstance
            );
            
            if (effects) {
                this.logAction(effects);
            }
        }
    }

    // 记录AI行动
    logAction(effects) {
        const logContent = document.getElementById('log-content');
        if (logContent && effects.length > 0) {
            effects.forEach(effect => {
                const logEntry = document.createElement('div');
                logEntry.className = 'log-entry ai-action';
                logEntry.textContent = `🤖 ${effect}`;
                logContent.appendChild(logEntry);
            });
            
            // 滚动到底部
            logContent.scrollTop = logContent.scrollHeight;
        }
    }

    // 计算潜在伤害
    getPotentialDamage() {
        return this.hand
            .filter(card => card.type === 'attack')
            .reduce((total, card) => total + card.power, 0);
    }

    // 延迟函数
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // 设置难度
    setDifficulty(difficulty) {
        this.difficulty = difficulty;
        this.strategy = this.initializeStrategy();
        
        // 根据难度调整思考时间
        const thinkingTimes = {
            easy: 2000,
            normal: 1500,
            hard: 800
        };
        this.thinkingTime = thinkingTimes[difficulty] || 1500;
    }

    // 获取AI状态信息
    getAIStatus() {
        return {
            ...this.getStatus(),
            difficulty: this.difficulty,
            strategy: this.strategy,
            thinkingTime: this.thinkingTime
        };
    }

    // 重写抽牌方法，添加AI特有逻辑
    drawCard(count = 1) {
        const drawnCards = super.drawCard(count);
        
        // AI抽牌时可能显示提示
        if (this.isCurrentTurn && drawnCards.length > 0) {
            this.showDrawNotification(drawedCards.length);
        }
        
        return drawnCards;
    }

    // 显示抽牌提示
    showDrawNotification(count) {
        const logContent = document.getElementById('log-content');
        if (logContent) {
            const logEntry = document.createElement('div');
            logEntry.className = 'log-entry ai-action';
            logEntry.textContent = `🤖 AI抽了 ${count} 张牌`;
            logContent.appendChild(logEntry);
            logContent.scrollTop = logContent.scrollHeight;
        }
    }

    // 预测下一步行动（用于UI显示）
    predictNextAction() {
        const gameState = this.evaluateGameState();
        const playableCards = this.getPlayableCards(window.gameInstance);
        
        if (playableCards.length === 0) {
            return { action: 'endTurn', reason: 'No playable cards' };
        }
        
        const bestCard = playableCards
            .map(card => ({
                card,
                priority: this.calculateCardPriority(card, gameState)
            }))
            .sort((a, b) => b.priority - a.priority)[0];
        
        return {
            action: 'playCard',
            card: bestCard.card,
            priority: bestCard.priority,
            reason: `Best priority: ${bestCard.priority.toFixed(1)}`
        };
    }
}
