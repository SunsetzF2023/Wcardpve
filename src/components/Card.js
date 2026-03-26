/**
 * Card Component
 * Individual card component with rendering and interaction logic
 */
export class Card {
    constructor(cardData, isFaceUp = true) {
        this.id = cardData.id;
        this.suit = cardData.suit;
        this.rank = cardData.rank;
        this.value = cardData.value;
        this.text = cardData.text;
        this.type = cardData.type;
        this.power = cardData.power || 0;
        this.rarity = cardData.rarity || 'common';
        this.isFaceUp = isFaceUp;
        this.element = null;
        this.isSelected = false;
        this.isPlayable = false;
    }

    createElement() {
        const cardElement = document.createElement('div');
        cardElement.className = `card ${this.rarity}`;
        cardElement.dataset.cardId = this.id;
        
        if (this.isFaceUp) {
            cardElement.innerHTML = this.getCardContent();
        } else {
            cardElement.classList.add('card-back');
        }

        this.element = cardElement;
        this.setupInteractions();
        return cardElement;
    }

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

    formatCardText() {
        return this.text.replace(/\n/g, '<br>');
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
        if (!this.isFaceUp) return;
        
        if (isHovering) {
            this.element.style.transform = 'translateY(-8px)';
        } else {
            this.element.style.transform = '';
        }
    }

    flip() {
        this.isFaceUp = !this.isFaceUp;
        
        if (this.element) {
            this.element.classList.add('flipping');
            
            setTimeout(() => {
                if (this.isFaceUp) {
                    this.element.classList.remove('card-back');
                    this.element.innerHTML = this.getCardContent();
                } else {
                    this.element.classList.add('card-back');
                    this.element.innerHTML = '';
                }
                
                this.element.classList.remove('flipping');
            }, 300);
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

    setPlayable(playable) {
        this.isPlayable = playable;
        this.updateState();
    }

    updateState() {
        if (!this.element) return;

        // Remove all state classes
        this.element.classList.remove('selected', 'playable', 'disabled');
        
        // Add appropriate state classes
        if (this.isSelected) {
            this.element.classList.add('selected');
        }
        if (this.isPlayable) {
            this.element.classList.add('playable');
        }
    }

    playAnimation(animationType) {
        if (!this.element) return;

        this.element.classList.add(animationType);
        
        setTimeout(() => {
            this.element.classList.remove(animationType);
        }, 1000);
    }

    showDamage(amount, isHeal = false) {
        if (!this.element) return;

        const damageElement = document.createElement('div');
        damageElement.className = `damage-number ${isHeal ? 'heal-number' : ''}`;
        damageElement.textContent = isHeal ? `+${amount}` : `-${amount}`;
        
        this.element.appendChild(damageElement);
        
        setTimeout(() => {
            if (damageElement.parentNode) {
                damageElement.parentNode.removeChild(damageElement);
            }
        }, 1000);
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
        }, this.isFaceUp);
    }

    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.element = null;
    }
}
