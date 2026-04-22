// 玩家类
class Player {
    constructor(name, isHuman = true) {
        this.name = name;
        this.isHuman = isHuman;
        this.isCurrentTurn = false;
        
        // 基础属性
        this.maxHealth = 30;
        this.health = 30;
        this.armor = 0;
        this.maxEnergy = 3;
        this.energy = 3;
        
        // 卡牌相关
        this.hand = [];
        this.deck = [];
        this.discardPile = [];
        
        // 状态效果
        this.statusEffects = new Map();
        
        // 加成效果
        this.attackBonus = 0;
        this.healBonus = 0;
        
        // DOM元素
        this.handElement = null;
        this.fieldElement = null;
        this.healthElement = null;
        this.armorElement = null;
    }

    // 初始化玩家
    initialize(deck, handElement, fieldElement) {
        this.deck = deck;
        this.handElement = handElement;
        this.fieldElement = fieldElement;
        
        // 初始化手牌
        for (let i = 0; i < 7; i++) {
            this.drawCard();
        }
        
        this.updateDisplay();
    }

    // 抽牌
    drawCard(count = 1) {
        const drawnCards = [];
        
        for (let i = 0; i < count; i++) {
            if (this.deck.length === 0) {
                // 牌堆空了，重新洗牌
                this.reshuffleDeck();
            }
            
            if (this.deck.length > 0) {
                const card = this.deck.pop();
                this.hand.push(card);
                drawnCards.push(card);
            }
        }
        
        this.updateHandDisplay();
        return drawnCards;
    }

    // 重新洗牌
    reshuffleDeck() {
        if (this.discardPile.length > 0) {
            this.deck = CardUtils.shuffle(this.discardPile);
            this.discardPile = [];
        }
    }

    // 打出卡牌
    playCard(cardIndex, target, gameState) {
        if (cardIndex < 0 || cardIndex >= this.hand.length) {
            return false;
        }
        
        const card = this.hand[cardIndex];
        
        // 检查是否可以打出
        if (!card.canPlay(this, gameState)) {
            return false;
        }
        
        // 消耗能量
        if (this.energy < 1) {
            return false;
        }
        
        // 执行卡牌效果
        const effects = card.play(this, target, gameState);
        
        // 移除手牌
        this.hand.splice(cardIndex, 1);
        this.discardPile.push(card);
        
        // 消耗能量
        this.energy--;
        
        // 添加动画
        card.addAnimation('card-play');
        
        // 更新显示
        this.updateHandDisplay();
        this.updateDisplay();
        
        return effects;
    }

    // 受到伤害
    takeDamage(amount) {
        let actualDamage = amount;
        
        // 护甲吸收伤害
        if (this.armor > 0) {
            const absorbedDamage = Math.min(this.armor, actualDamage);
            this.armor -= absorbedDamage;
            actualDamage -= absorbedDamage;
        }
        
        // 扣除生命值
        this.health = Math.max(0, this.health - actualDamage);
        
        // 更新显示
        this.updateDisplay();
        
        // 检查是否死亡
        if (this.health <= 0) {
            this.onDeath();
        }
        
        return actualDamage;
    }

    // 治疗
    heal(amount) {
        const actualHeal = Math.min(amount, this.maxHealth - this.health);
        this.health += actualHeal;
        
        this.updateDisplay();
        return actualHeal;
    }

    // 添加护甲
    addArmor(amount) {
        this.armor += amount;
        this.updateDisplay();
    }

    // 添加状态效果
    addStatus(statusName, duration) {
        this.statusEffects.set(statusName, duration);
    }

    // 移除状态效果
    removeStatus(statusName) {
        this.statusEffects.delete(statusName);
    }

    // 更新状态效果
    updateStatusEffects() {
        const expiredEffects = [];
        
        for (const [statusName, duration] of this.statusEffects) {
            if (duration <= 1) {
                expiredEffects.push(statusName);
            } else {
                this.statusEffects.set(statusName, duration - 1);
            }
        }
        
        expiredEffects.forEach(statusName => {
            this.removeStatus(statusName);
        });
    }

    // 开始回合
    startTurn() {
        this.isCurrentTurn = true;
        this.energy = this.maxEnergy;
        
        // 更新状态效果
        this.updateStatusEffects();
        
        // 处理持续伤害等效果
        this.processStatusEffects();
        
        this.updateDisplay();
    }

    // 结束回合
    endTurn() {
        this.isCurrentTurn = false;
        this.energy = 0;
        
        // 清除回合结束时的加成
        this.attackBonus = 0;
        this.healBonus = 0;
        
        this.updateDisplay();
    }

    // 处理状态效果
    processStatusEffects() {
        for (const [statusName, duration] of this.statusEffects) {
            switch (statusName) {
                case 'poison':
                    this.takeDamage(2);
                    break;
                case 'burn':
                    this.takeDamage(1);
                    break;
                case 'regenerate':
                    this.heal(1);
                    break;
            }
        }
    }

    // 死亡处理
    onDeath() {
        console.log(`${this.name} has been defeated!`);
    }

    // 更新手牌显示
    updateHandDisplay() {
        if (!this.handElement) return;
        
        this.handElement.innerHTML = '';
        
        this.hand.forEach((card, index) => {
            const cardElement = card.createElement(!this.isHuman);
            
            if (this.isHuman) {
                // 玩家手牌可以点击
                cardElement.addEventListener('click', () => {
                    this.onCardClick(index);
                });
                
                // 检查是否可以打出
                if (card.canPlay(this, window.gameInstance)) {
                    card.setStatus('playable');
                }
            }
            
            this.handElement.appendChild(cardElement);
        });
    }

    // 更新显示
    updateDisplay() {
        this.updateHealthDisplay();
        this.updateEnergyDisplay();
    }

    // 更新生命值显示
    updateHealthDisplay() {
        const healthBar = document.getElementById(this.isHuman ? 'player-health' : 'ai-health');
        const healthText = document.getElementById(this.isHuman ? 'player-hp' : 'ai-hp');
        
        if (healthBar) {
            const healthPercent = (this.health / this.maxHealth) * 100;
            healthBar.style.width = `${healthPercent}%`;
        }
        
        if (healthText) {
            healthText.textContent = `${this.health}/${this.maxHealth}`;
        }
    }

    // 更新能量显示
    updateEnergyDisplay() {
        // 可以在这里添加能量显示逻辑
        console.log(`${this.name} Energy: ${this.energy}/${this.maxEnergy}`);
    }

    // 卡牌点击处理
    onCardClick(cardIndex) {
        if (!this.isCurrentTurn) {
            return;
        }
        
        const card = this.hand[cardIndex];
        if (!card.canPlay(this, window.gameInstance)) {
            return;
        }
        
        // 触发游戏实例的卡牌选择
        if (window.gameInstance) {
            window.gameInstance.onCardSelected(this, cardIndex);
        }
    }

    // 获取可用卡牌
    getPlayableCards(gameState) {
        return this.hand.filter((card, index) => card.canPlay(this, gameState));
    }

    // 检查是否可以行动
    canAct() {
        return this.isCurrentTurn && this.energy > 0 && this.hand.length > 0;
    }

    // 重置玩家状态
    reset() {
        this.health = this.maxHealth;
        this.armor = 0;
        this.energy = this.maxEnergy;
        this.isCurrentTurn = false;
        this.hand = [];
        this.discardPile = [];
        this.statusEffects.clear();
        this.attackBonus = 0;
        this.healBonus = 0;
    }

    // 获取玩家状态信息
    getStatus() {
        return {
            name: this.name,
            health: this.health,
            maxHealth: this.maxHealth,
            armor: this.armor,
            energy: this.energy,
            maxEnergy: this.maxEnergy,
            handSize: this.hand.length,
            deckSize: this.deck.length,
            statusEffects: Array.from(this.statusEffects.entries()),
            canAct: this.canAct()
        };
    }
}
