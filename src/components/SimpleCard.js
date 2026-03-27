/**
 * Simple Card Component - 火柴人风格卡牌
 */
export class SimpleCard {
    constructor(cardData) {
        this.id = cardData.id;
        this.suit = cardData.suit;
        this.rank = cardData.rank;
        this.text = cardData.text;
        this.type = cardData.type; // 兵/防/盾/狙/守/幽/护/炮
        this.baseEffect = cardData.baseEffect;
        this.element = null;
        this.isSelected = false;
        this.isOnField = false;
        this.position = null; // 场上位置
    }

    createElement() {
        const cardElement = document.createElement('div');
        cardElement.className = 'simple-card';
        cardElement.dataset.cardId = this.id;
        
        cardElement.innerHTML = `
            <div class="card-body">
                <div class="card-arms">
                    <div class="arm left-arm"></div>
                    <div class="card-center">
                        <div class="card-suit">${this.getSuitSymbol()}</div>
                        <div class="card-rank">${this.rank}</div>
                        <div class="card-text">${this.text}</div>
                    </div>
                    <div class="arm right-arm"></div>
                </div>
            </div>
        `;

        this.element = cardElement;
        this.setupInteractions();
        return cardElement;
    }

    getSuitSymbol() {
        const suitSymbols = {
            'spades': '♠',
            'hearts': '♥',
            'diamonds': '♦',
            'clubs': '♣'
        };
        return suitSymbols[this.suit] || '?';
    }

    setupInteractions() {
        if (!this.element) return;

        this.element.addEventListener('click', this.handleClick.bind(this));
        this.element.addEventListener('mouseenter', this.handleHover.bind(this, true));
        this.element.addEventListener('mouseleave', this.handleHover.bind(this, false));
    }

    handleClick(event) {
        event.stopPropagation();
        this.emit('cardClick', { card: this, event });
    }

    handleHover(isHovering) {
        if (!this.element) return;
        
        if (isHovering) {
            this.element.style.transform = 'translateY(-8px) scale(1.05)';
        } else {
            this.element.style.transform = '';
        }
    }

    select() {
        this.isSelected = true;
        this.updateState();
    }

    deselect() {
        this.isSelected = false;
        this.updateState();
    }

    placeOnField(position) {
        this.isOnField = true;
        this.position = position;
        this.updateState();
    }

    removeFromField() {
        this.isOnField = false;
        this.position = null;
        this.updateState();
    }

    updateState() {
        if (!this.element) return;

        this.element.classList.remove('selected', 'on-field', 'hand-card');
        
        if (this.isSelected) {
            this.element.classList.add('selected');
        }
        
        if (this.isOnField) {
            this.element.classList.add('on-field');
        } else {
            this.element.classList.add('hand-card');
        }
    }

    calculateEffect() {
        const rankValue = this.getRankValue();
        const suitMultiplier = this.getSuitMultiplier();
        
        return {
            baseDamage: this.baseEffect.damage || 0,
            actualDamage: (this.baseEffect.damage || 0) * rankValue * suitMultiplier,
            healing: (this.baseEffect.healing || 0) * rankValue,
            shield: (this.baseEffect.shield || 0) * rankValue,
            critChance: this.suit === 'hearts' ? rankValue * 0.05 : 0, // 红桃暴击率
            duration: this.baseEffect.duration || 0,
            effect: this.baseEffect.effect
        };
    }

    getRankValue() {
        const rankValues = {
            'A': 1, '2': 2, '3': 3, '4': 4, '5': 5,
            '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
            'J': 11, 'Q': 12, 'K': 13
        };
        return rankValues[this.rank] || 1;
    }

    getSuitMultiplier() {
        const suitMultipliers = {
            'spades': 1.2,    // 黑桃攻击加成
            'hearts': 1.1,    // 红桃暴击加成
            'diamonds': 1.15,  // 方块效果加成
            'clubs': 1.0        // 梅花平衡
        };
        return suitMultipliers[this.suit] || 1.0;
    }

    emit(event, data) {
        if (this.element) {
            const customEvent = new CustomEvent(event, { detail: data });
            this.element.dispatchEvent(customEvent);
        }
    }

    on(event, callback) {
        if (this.element) {
            this.element.addEventListener(event, callback);
        }
    }

    off(event, callback) {
        if (this.element) {
            this.element.removeEventListener(event, callback);
        }
    }

    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.element = null;
    }
}
