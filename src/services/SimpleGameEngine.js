/**
 * Simple Game Engine - 火柴人卡牌游戏
 */
export class SimpleGameEngine {
    constructor() {
        this.state = {
            phase: 'waiting',
            round: 1,
            currentPlayer: 'player',
            player: {
                id: 'player',
                name: 'Player',
                health: 300,
                maxHealth: 300,
                armor: 0,
                hand: [],
                field: [], // 场上卡牌
                deck: [],
                maxFieldSize: 2 // 第一回合最多2张
            },
            ai: {
                id: 'ai',
                name: 'AI',
                health: 300,
                maxHealth: 300,
                armor: 0,
                hand: [],
                field: [], // 场上卡牌
                deck: [],
                maxFieldSize: 2
            },
            winner: null
        };
        
        this.listeners = new Map();
        this.cardManager = null;
        this.aiService = null;
    }

    initialize(cardManager, aiService) {
        this.cardManager = cardManager;
        this.aiService = aiService;
        
        // 创建牌组
        this.state.player.deck = this.createDeck();
        this.state.ai.deck = this.createDeck();
        
        // 洗牌
        this.shuffleDeck(this.state.player.deck);
        this.shuffleDeck(this.state.ai.deck);
        
        // 发初始手牌
        this.drawInitialHand(this.state.player);
        this.drawInitialHand(this.state.ai);
        
        // 开始游戏
        this.startGame();
    }

    createDeck() {
        // 创建一副牌（52张）
        const deck = [];
        const suits = ['spades', 'hearts', 'diamonds', 'clubs'];
        const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        
        for (const suit of suits) {
            for (const rank of ranks) {
                const cardData = this.cardManager.getCard(`${suit}_${rank}`);
                if (cardData) {
                    deck.push({ ...cardData });
                }
            }
        }
        
        return deck;
    }

    shuffleDeck(deck) {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
    }

    drawInitialHand(player) {
        for (let i = 0; i < 5; i++) {
            this.drawCard(player);
        }
    }

    drawCard(player) {
        if (player.deck.length === 0) return null;
        
        const card = player.deck.pop();
        player.hand.push(card);
        
        this.emit('cardDrawn', { player, card });
        return card;
    }

    playCard(player, cardIndex, targetPosition = null) {
        if (cardIndex < 0 || cardIndex >= player.hand.length) {
            return false;
        }
        
        const card = player.hand[cardIndex];
        
        // 检查场上有足够空间
        if (player.field.length >= player.maxFieldSize) {
            this.emit('error', { message: '场上已满！' });
            return false;
        }
        
        // 移除手牌，放到场上
        player.hand.splice(cardIndex, 1);
        card.placeOnField(player.field.length);
        player.field.push(card);
        
        // 执行卡牌效果
        this.executeCardEffect(card, player, this.getOpponent(player));
        
        // 检查同花色连携
        this.checkSameSuitBonus(player);
        
        this.emit('cardPlayed', { player, card, position: player.field.length - 1 });
        
        // 检查游戏结束
        this.checkGameOver();
        
        return true;
    }

    executeCardEffect(card, player, opponent) {
        const effect = card.calculateEffect();
        
        switch (card.type) {
            case '兵':
                this.applyDamage(effect, opponent, player);
                break;
            case '防':
                this.applyShield(effect.shield, player);
                break;
            case '盾':
                this.applyShield(effect.shield, player);
                break;
            case '狙':
                this.applyDamage(effect, opponent, player);
                break;
            case '守':
                this.applyDamage(effect.damage, opponent, player);
                this.applyShield(effect.shield, player);
                break;
            case '幽':
                // 隐身效果，这里简化处理
                this.applyDamage(effect.damage, opponent, player);
                break;
            case '护':
                this.applyHealing(effect.healing, player);
                break;
            case '炮':
                this.applyDamage(effect.damage, opponent, player);
                break;
        }
    }

    applyDamage(effect, target, attacker) {
        let actualDamage = effect.actualDamage;
        
        // 检查暴击
        if (effect.critChance && Math.random() < effect.critChance) {
            actualDamage *= 3; // 暴击3倍伤害
            this.emit('criticalHit', { attacker, target, damage: actualDamage });
        }
        
        // 应用护甲
        if (target.armor > 0) {
            const blockedDamage = Math.min(target.armor, actualDamage);
            actualDamage -= blockedDamage;
            target.armor -= blockedDamage;
        }
        
        // 应用伤害
        target.health = Math.max(0, target.health - actualDamage);
        
        this.emit('damageDealt', { attacker, target, damage: actualDamage, blocked: effect.actualDamage - actualDamage });
    }

    applyShield(amount, player) {
        player.armor += amount;
        this.emit('shieldApplied', { player, amount });
    }

    applyHealing(amount, player) {
        const actualHealing = Math.min(amount, player.maxHealth - player.health);
        player.health += actualHealing;
        this.emit('healingApplied', { player, amount: actualHealing });
    }

    checkSameSuitBonus(player) {
        const suitCounts = {};
        
        // 统计场上各花色数量
        for (const card of player.field) {
            suitCounts[card.suit] = (suitCounts[card.suit] || 0) + 1;
        }
        
        // 检查连携效果
        for (const [suit, count] of Object.entries(suitCounts)) {
            if (count >= 2) {
                this.applySuitBonus(player, suit, count);
            }
        }
    }

    applySuitBonus(player, suit, count) {
        let bonus = '';
        
        switch (suit) {
            case 'spades':
                bonus = `黑桃连携：所有黑桃牌伤害+${count}`;
                break;
            case 'hearts':
                bonus = `红桃连携：治疗效果+${count * 10}%`;
                break;
            case 'diamonds':
                bonus = `方块连携：护甲效果+${count}`;
                break;
            case 'clubs':
                bonus = `梅花连携：下回合抽${count}张牌`;
                break;
        }
        
        this.emit('suitBonus', { player, suit, count, bonus });
    }

    getOpponent(player) {
        return player.id === 'player' ? this.state.ai : this.state.player;
    }

    endTurn() {
        const currentPlayer = this.state[this.state.currentPlayer];
        const nextPlayer = this.state.currentPlayer === 'player' ? 'ai' : 'player';
        
        // 更新场上最大容量
        this.updateMaxFieldSize();
        
        this.emit('turnEnd', { player: currentPlayer });
        
        // 切换玩家
        this.state.currentPlayer = nextPlayer;
        this.emit('turnStart', { player: this.state[nextPlayer] });
        
        // AI回合
        if (nextPlayer === 'ai') {
            setTimeout(() => this.executeAITurn(), 1500);
        }
    }

    updateMaxFieldSize() {
        const round = this.state.round;
        
        // 根据回合数更新场上最大容量
        if (round <= 1) {
            this.state.player.maxFieldSize = 2;
            this.state.ai.maxFieldSize = 2;
        } else if (round <= 2) {
            this.state.player.maxFieldSize = 3;
            this.state.ai.maxFieldSize = 3;
        } else if (round <= 3) {
            this.state.player.maxFieldSize = 4;
            this.state.ai.maxFieldSize = 4;
        } else {
            this.state.player.maxFieldSize = 8;
            this.state.ai.maxFieldSize = 8;
        }
    }

    async executeAITurn() {
        const ai = this.state.ai;
        const decisions = this.aiService.makeSimpleDecisions(ai, this.state.player);
        
        for (const decision of decisions) {
            await this.delay(800);
            
            switch (decision.type) {
                case 'playCard':
                    this.playCard(ai, decision.cardIndex);
                    break;
                case 'drawCard':
                    this.drawCard(ai);
                    break;
                case 'endTurn':
                    this.endTurn();
                    break;
            }
        }
    }

    checkGameOver() {
        if (this.state.player.health <= 0) {
            this.state.winner = this.state.ai;
            this.state.phase = 'gameOver';
            this.emit('gameOver', { winner: this.state.ai });
        } else if (this.state.ai.health <= 0) {
            this.state.winner = this.state.player;
            this.state.phase = 'gameOver';
            this.emit('gameOver', { winner: this.state.player });
        }
    }

    startGame() {
        this.state.phase = 'playing';
        this.state.round = 1;
        this.state.currentPlayer = 'player';
        this.emit('gameStart', { state: this.state });
        this.emit('turnStart', { player: this.state.player });
    }

    restart() {
        this.state = {
            phase: 'waiting',
            round: 1,
            currentPlayer: 'player',
            player: {
                id: 'player',
                name: 'Player',
                health: 300,
                maxHealth: 300,
                armor: 0,
                hand: [],
                field: [],
                deck: [],
                maxFieldSize: 2
            },
            ai: {
                id: 'ai',
                name: 'AI',
                health: 300,
                maxHealth: 300,
                armor: 0,
                hand: [],
                field: [],
                deck: [],
                maxFieldSize: 2
            },
            winner: null
        };
        
        this.initialize(this.cardManager, this.aiService);
    }

    getGameState() {
        return { ...this.state };
    }

    emit(event, data) {
        const listeners = this.listeners.get(event) || [];
        listeners.forEach(callback => callback(data));
    }

    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    off(event, callback) {
        const listeners = this.listeners.get(event);
        if (listeners) {
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
