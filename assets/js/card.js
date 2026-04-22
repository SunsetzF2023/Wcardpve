// 卡牌类
class Card {
    constructor(cardData) {
        this.id = cardData.id;
        this.suit = cardData.suit;
        this.rank = cardData.rank;
        this.value = cardData.value;
        this.text = cardData.text;
        this.type = cardData.type; // attack, defense, heal, special
        this.power = cardData.power || 0;
        this.rarity = cardData.rarity || 'common';
        this.element = null;
        this.isFaceUp = true;
    }

    // 创建卡牌DOM元素
    createElement(isBack = false) {
        const cardDiv = document.createElement('div');
        cardDiv.className = `card ${this.rarity}`;
        cardDiv.dataset.cardId = this.id;

        if (isBack) {
            cardDiv.classList.add('card-back');
        } else {
            cardDiv.innerHTML = this.getCardContent();
        }

        this.element = cardDiv;
        return cardDiv;
    }

    // 获取卡牌内容HTML
    getCardContent() {
        const suitSymbols = {
            'spades': '♠',
            'hearts': '♥',
            'diamonds': '♦',
            'clubs': '♣'
        };

        const suitSymbol = suitSymbols[this.suit];
        
        return `
            <div class="card-corner top-left">
                <span class="card-suit ${this.suit}">${suitSymbol}</span>
                <span class="card-rank">${this.rank}</span>
            </div>
            <div class="card-content">
                <div class="card-text">${this.formatCardText()}</div>
            </div>
            <div class="card-corner bottom-right">
                <span class="card-suit ${this.suit}">${suitSymbol}</span>
                <span class="card-rank">${this.rank}</span>
            </div>
        `;
    }

    // 格式化卡牌文本
    formatCardText() {
        return this.text.replace(/\n/g, '<br>');
    }

    // 翻转卡牌
    flip() {
        this.isFaceUp = !this.isFaceUp;
        if (this.element) {
            if (this.isFaceUp) {
                this.element.classList.remove('card-back');
                this.element.innerHTML = this.getCardContent();
            } else {
                this.element.classList.add('card-back');
                this.element.innerHTML = '';
            }
        }
    }

    // 设置卡牌状态
    setStatus(status) {
        if (this.element) {
            // 移除所有状态类
            this.element.classList.remove('selected', 'playable', 'disabled');
            
            // 添加新状态类
            if (status) {
                this.element.classList.add(status);
            }
        }
    }

    // 添加动画效果
    addAnimation(animationClass) {
        if (this.element) {
            this.element.classList.add(animationClass);
            setTimeout(() => {
                this.element.classList.remove(animationClass);
            }, 1000);
        }
    }

    // 显示伤害数字
    showDamage(damage, isHeal = false) {
        if (!this.element) return;

        const damageDiv = document.createElement('div');
        damageDiv.className = `damage-number ${isHeal ? 'heal-number' : ''}`;
        damageDiv.textContent = isHeal ? `+${damage}` : `-${damage}`;
        
        this.element.appendChild(damageDiv);
        
        setTimeout(() => {
            if (damageDiv.parentNode) {
                damageDiv.parentNode.removeChild(damageDiv);
            }
        }, 1000);
    }

    // 检查是否可以打出
    canPlay(player, gameState) {
        // 基础检查：玩家回合，有足够能量等
        if (!player.isCurrentTurn) return false;
        
        // 根据卡牌类型检查具体条件
        switch (this.type) {
            case 'attack':
                return true; // 攻击牌通常可以打出
            case 'heal':
                return player.health < player.maxHealth; // 只有受伤时才能治疗
            case 'defense':
                return true; // 防御牌通常可以打出
            case 'special':
                return true; // 特殊牌需要具体检查
            default:
                return false;
        }
    }

    // 执行卡牌效果
    play(player, target, gameState) {
        const effects = [];

        switch (this.type) {
            case 'attack':
                const damage = this.calculateDamage(player, target);
                target.takeDamage(damage);
                effects.push(`${player.name} 对 ${target.name} 造成了 ${damage} 点伤害`);
                
                // 特殊效果
                if (this.id.includes('spades_6')) {
                    // 毒刃效果
                    target.addStatus('poison', 2);
                    effects.push(`${target.name} 中毒了`);
                }
                break;

            case 'heal':
                const healAmount = this.power;
                player.heal(healAmount);
                effects.push(`${player.name} 恢复了 ${healAmount} 点生命`);
                break;

            case 'defense':
                const armor = this.power;
                player.addArmor(armor);
                effects.push(`${player.name} 获得了 ${armor} 点护甲`);
                break;

            case 'special':
                this.executeSpecialEffect(player, target, gameState, effects);
                break;
        }

        return effects;
    }

    // 计算伤害
    calculateDamage(attacker, defender) {
        let damage = this.power;
        
        // 考虑攻击者的攻击力加成
        if (attacker.attackBonus) {
            damage += attacker.attackBonus;
        }
        
        // 考虑防御者的护甲
        if (defender.armor > 0) {
            const actualDamage = Math.max(0, damage - defender.armor);
            defender.armor = Math.max(0, defender.armor - damage);
            damage = actualDamage;
        }
        
        return damage;
    }

    // 执行特殊效果
    executeSpecialEffect(player, target, gameState, effects) {
        switch (this.id) {
            case 'spades_5': // 暗影步
            case 'hearts_5': // 幸运符
            case 'clubs_5': // 森林召唤
                player.drawCard(1);
                effects.push(`${player.name} 抽了 1 张牌`);
                break;

            case 'spades_10': // 旋风斩
                // 对所有敌人造成伤害
                const allEnemies = gameState.getEnemies(player);
                allEnemies.forEach(enemy => {
                    enemy.takeDamage(this.power);
                    effects.push(`${player.name} 对 ${enemy.name} 造成了 ${this.power} 点伤害`);
                });
                break;

            case 'hearts_3': // 群体治疗
                const allAllies = gameState.getAllies(player);
                allAllies.forEach(ally => {
                    ally.heal(this.power);
                    effects.push(`${ally.name} 恢复了 ${this.power} 点生命`);
                });
                break;

            case 'diamonds_5': // 赌博
                const isHeal = Math.random() > 0.5;
                if (isHeal) {
                    player.heal(5);
                    effects.push(`${player.name} 恢复了 5 点生命`);
                } else {
                    target.takeDamage(5);
                    effects.push(`${player.name} 对 ${target.name} 造成了 5 点伤害`);
                }
                break;

            // 添加更多特殊效果...
        }
    }

    // 获取卡牌描述
    getDescription() {
        return `${this.getCardName()}: ${this.text}`;
    }

    // 获取卡牌名称
    getCardName() {
        const suitNames = {
            'spades': '黑桃',
            'hearts': '红桃',
            'diamonds': '方块',
            'clubs': '梅花'
        };
        
        return `${suitNames[this.suit]}${this.rank}`;
    }

    // 克隆卡牌
    clone() {
        return new Card({
            id: this.id,
            suit: this.suit,
            rank: this.rank,
            value: this.value,
            text: this.text,
            type: this.type,
            power: this.power,
            rarity: this.rarity
        });
    }
}

// 卡牌工具函数
const CardUtils = {
    // 创建一副牌
    createDeck() {
        const deck = [];
        const cardData = window.CardsData.cards;
        
        // 创建两副牌
        for (let i = 0; i < 2; i++) {
            cardData.forEach(data => {
                deck.push(new Card(data));
            });
        }
        
        return this.shuffle(deck);
    },

    // 洗牌
    shuffle(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    },

    // 根据ID查找卡牌
    findCardById(cardId, deck) {
        return deck.find(card => card.id === cardId);
    },

    // 获取花色颜色
    getSuitColor(suit) {
        return (suit === 'hearts' || suit === 'diamonds') ? 'red' : 'black';
    },

    // 获取稀有度权重
    getRarityWeight(rarity) {
        const weights = {
            'common': 1,
            'rare': 0.7,
            'epic': 0.4,
            'legendary': 0.1
        };
        return weights[rarity] || 1;
    }
};
