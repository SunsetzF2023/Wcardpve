/**
 * Slay the Spire Engine - 杀戮尖塔游戏引擎
 */
export class SlayTheSpireEngine {
    constructor() {
        this.state = {
            phase: 'waiting',
            floor: 1,
            currentPlayer: '玩家',
            player: {
                id: 'player',
                name: '玩家',
                health: 75,
                maxHealth: 75,
                block: 0,
                energy: 3,
                maxEnergy: 3,
                hand: [],
                deck: [],
                discard: [],
                drawPile: []
            },
            enemy: null,
            score: 0,
            turnCount: 0
        };
        
        this.listeners = new Map();
        this.cardManager = null;
    }

    initialize(cardManager) {
        this.cardManager = cardManager;
        this.setupInitialDeck();
        this.emit('initialized', {});
    }

    setupInitialDeck() {
        // 创建初始牌组
        const initialCards = [
            'strike', 'strike', 'strike', 'strike', 'strike',
            'defend', 'defend', 'defend', 'defend', 'defend',
            'bash'
        ];
        
        this.state.player.deck = initialCards.map(cardId => 
            this.cardManager.getCardById(cardId)
        ).filter(card => card);
        
        // 洗牌并准备抽牌堆
        this.shuffleDeck();
        this.prepareDrawPile();
    }

    shuffleDeck() {
        const deck = [...this.state.player.deck];
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        this.state.player.deck = deck;
    }

    prepareDrawPile() {
        // 将弃牌堆的牌洗回抽牌堆
        if (this.state.player.deck.length === 0 && this.state.player.discard.length > 0) {
            this.state.player.deck = [...this.state.player.discard];
            this.state.player.discard = [];
            this.shuffleDeck();
        }
        
        // 准备抽牌堆
        this.state.player.drawPile = [...this.state.player.deck];
        this.state.player.deck = [];
    }

    startGame() {
        this.state.phase = 'playing';
        this.state.currentPlayer = '玩家';
        this.spawnEnemy();
        this.drawInitialHand();
        this.emit('gameStarted', { state: this.state });
    }

    spawnEnemy() {
        const enemyTypes = [
            { name: '爪牙', health: 24, damage: 6, intent: '攻击' },
            { name: '蓝史莱姆', health: 12, damage: 3, intent: '攻击' },
            { name: '红史莱姆', health: 18, damage: 8, intent: '攻击' },
            { name: '小喽啰', health: 30, damage: 10, intent: '攻击' }
        ];
        
        const enemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
        
        this.state.enemy = {
            id: 'enemy',
            name: enemyType.name,
            health: enemyType.health,
            maxHealth: enemyType.health,
            damage: enemyType.damage,
            block: 0,
            intent: enemyType.intent,
            nextAction: 'attack'
        };
        
        this.emit('enemySpawned', { enemy: this.state.enemy });
    }

    drawInitialHand() {
        // 初始抽5张牌
        for (let i = 0; i < 5; i++) {
            this.drawCard();
        }
    }

    drawCard() {
        if (this.state.player.drawPile.length === 0) {
            this.prepareDrawPile();
        }
        
        if (this.state.player.drawPile.length === 0) {
            return false; // 没有牌可抽
        }
        
        const card = this.state.player.drawPile.shift();
        this.state.player.hand.push(card);
        
        this.emit('cardDrawn', { card });
        return true;
    }

    canPlayCard(card, player) {
        if (card.cost > player.energy) {
            return false;
        }
        
        // 检查是否有目标
        if (card.target === 'enemy' && !this.state.enemy) {
            return false;
        }
        
        if (card.target === 'self' && !player) {
            return false;
        }
        
        return true;
    }

    playCard(cardIndex, player, target) {
        const card = this.state.player.hand[cardIndex];
        
        if (!this.canPlayCard(card, player)) {
            return false;
        }
        
        // 消耗能量
        player.energy -= card.cost;
        
        // 执行卡牌效果
        this.executeCardEffect(card, player, target);
        
        // 将牌移到弃牌堆
        this.state.player.hand.splice(cardIndex, 1);
        this.state.player.discard.push(card);
        
        this.emit('cardPlayed', { card, player, target });
        return true;
    }

    executeCardEffect(card, player, target) {
        // 伤害效果
        if (card.damage && target) {
            let actualDamage = card.damage;
            
            // 检查暴击
            if (card.critChance && Math.random() < card.critChance) {
                actualDamage *= 2;
                this.emit('criticalHit', { card, actualDamage });
            }
            
            const damageDealt = Math.max(0, actualDamage - (target.block || 0));
            target.block = Math.max(0, (target.block || 0) - actualDamage);
            target.health = Math.max(0, target.health - damageDealt);
            
            this.emit('damageDealt', { attacker: player.name, target: target.name, damage: damageDealt });
        }
        
        // 格挡效果
        if (card.block) {
            player.block = (player.block || 0) + card.block;
            this.emit('blockApplied', { target: player.name, amount: card.block });
        }
        
        // 治疗效果
        if (card.heal) {
            const actualHeal = Math.min(card.heal, player.maxHealth - player.health);
            player.health += actualHeal;
            this.emit('healingApplied', { target: player.name, amount: actualHeal });
        }
        
        // 能量效果
        if (card.energy) {
            player.energy += card.energy;
            this.emit('energyGained', { target: player.name, amount: card.energy });
        }
        
        // 抽牌效果
        if (card.drawCards) {
            for (let i = 0; i < card.drawCards; i++) {
                this.drawCard();
            }
            this.emit('cardsDrawn', { amount: card.drawCards });
        }
        
        // 特殊效果
        if (card.special) {
            this.executeSpecialEffect(card, player, target);
        }
    }

    executeSpecialEffect(card, player, target) {
        switch (card.special) {
            case 'bash':
                // Bash: 伤害+易伤
                if (target) {
                    target.vulnerable = true;
                    this.emit('vulnerableApplied', { target: target.name });
                }
                break;
            case 'cleave':
                // Cleave: 范围伤害
                this.emit('cleaveDamage', { damage: card.damage });
                break;
            case 'iron_wave':
                // Iron Wave: 伤害+格挡
                if (target) {
                    const damageDealt = Math.max(0, card.damage - (target.block || 0));
                    target.block = Math.max(0, (target.block || 0) - card.damage);
                    target.health = Math.max(0, target.health - damageDealt);
                    player.block = (player.block || 0) + card.block;
                    this.emit('damageDealt', { attacker: player.name, target: target.name, damage: damageDealt });
                    this.emit('blockApplied', { target: player.name, amount: card.block });
                }
                break;
        }
    }

    endTurn() {
        if (this.state.currentPlayer !== '玩家') {
            return;
        }
        
        this.emit('turnEnded', { player: '玩家' });
        
        // 清空格挡
        this.state.player.block = 0;
        
        // 将手牌移到弃牌堆
        this.state.player.discard.push(...this.state.player.hand);
        this.state.player.hand = [];
        
        // 切换到敌人回合
        this.state.currentPlayer = '敌人';
        this.executeEnemyTurn();
    }

    executeEnemyTurn() {
        if (!this.state.enemy || this.state.enemy.health <= 0) {
            this.endEnemyTurn();
            return;
        }
        
        this.emit('enemyTurn', { action: this.state.enemy.intent });
        
        // 执行敌人行动
        switch (this.state.enemy.nextAction) {
            case 'attack':
                const damageDealt = Math.max(0, this.state.enemy.damage - (this.state.player.block || 0));
                this.state.player.block = Math.max(0, (this.state.player.block || 0) - this.state.enemy.damage);
                this.state.player.health = Math.max(0, this.state.player.health - damageDealt);
                this.emit('damageDealt', { attacker: '敌人', target: '玩家', damage: damageDealt });
                break;
            case 'defend':
                this.state.enemy.block = (this.state.enemy.block || 0) + 5;
                this.emit('blockApplied', { target: '敌人', amount: 5 });
                break;
        }
        
        this.endEnemyTurn();
    }

    endEnemyTurn() {
        // 清空敌人格挡
        if (this.state.enemy) {
            this.state.enemy.block = 0;
        }
        
        // 检查游戏结束
        if (this.state.player.health <= 0) {
            this.endGame(false);
            return;
        }
        
        if (this.state.enemy && this.state.enemy.health <= 0) {
            this.enemyDefeated();
            return;
        }
        
        // 切换到玩家回合
        this.state.currentPlayer = '玩家';
        this.state.turnCount++;
        
        // 恢复能量
        this.state.player.energy = this.state.player.maxEnergy;
        
        // 抽5张牌
        for (let i = 0; i < 5; i++) {
            this.drawCard();
        }
        
        // 设置敌人意图
        this.setEnemyIntent();
        
        this.emit('turnStarted', { player: '玩家' });
    }

    setEnemyIntent() {
        if (!this.state.enemy) return;
        
        // 简单的AI：70%概率攻击，30%概率防御
        this.state.enemy.nextAction = Math.random() < 0.7 ? 'attack' : 'defend';
        this.state.enemy.intent = this.state.enemy.nextAction === 'attack' 
            ? `准备攻击 ${this.state.enemy.damage}` 
            : '准备防御';
    }

    enemyDefeated() {
        this.state.score += 100;
        this.emit('enemyDefeated', { enemy: this.state.enemy });
        
        // 检查是否进入下一层
        this.state.floor++;
        
        if (this.state.floor > 10) {
            this.endGame(true);
            return;
        }
        
        // 生成新敌人
        this.spawnEnemy();
        
        // 恢复一些生命值
        const healAmount = Math.floor(this.state.player.maxHealth * 0.3);
        this.state.player.health = Math.min(this.state.player.maxHealth, this.state.player.health + healAmount);
        this.emit('healingApplied', { target: '玩家', amount: healAmount });
        
        // 重置抽牌堆
        this.state.player.discard.push(...this.state.player.hand);
        this.state.player.hand = [];
        this.prepareDrawPile();
        this.drawInitialHand();
        
        this.emit('floorChanged', { floor: this.state.floor });
    }

    endGame(victory) {
        this.state.phase = 'gameOver';
        this.emit('gameOver', { winner: victory ? '玩家' : '敌人', score: this.state.score, floor: this.state.floor });
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
}
