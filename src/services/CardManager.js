/**
 * Card Manager Service
 * Handles card data loading and deck management
 */
export class CardManager {
    constructor() {
        this.cards = [];
        this.deck = [];
        this.isLoaded = false;
    }

    async loadCards() {
        try {
            const response = await fetch('./assets/data/cards.json');
            const data = await response.json();
            this.cards = data.cards || data;
            this.isLoaded = true;
            console.log(`Loaded ${this.cards.length} cards`);
            return this.cards;
        } catch (error) {
            console.error('Failed to load card data:', error);
            // Fallback to embedded card data
            this.cards = this.createFallbackCards();
            this.isLoaded = true;
            return this.cards;
        }
    }

    createDeck(count = 2) {
        // Create multiple decks
        const allCards = [];
        for (let i = 0; i < count; i++) {
            allCards.push(...this.cards.map(card => ({ ...card, id: `${card.id}_deck${i}` })));
        }
        
        // Shuffle the deck
        this.deck = this.shuffleArray(allCards);
        return this.deck;
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    createFallbackCards() {
        // Fallback card data if JSON loading fails
        return [
            {
                id: 'spades_ace',
                suit: 'spades',
                rank: 'A',
                value: 1,
                text: 'Shadow Strike\nDeal 5 damage to target',
                type: 'attack',
                power: 5,
                rarity: 'common'
            },
            {
                id: 'hearts_ace',
                suit: 'hearts',
                rank: 'A',
                value: 1,
                text: 'Divine Healing\nRestore 4 health',
                type: 'heal',
                power: 4,
                rarity: 'common'
            },
            // Add more fallback cards as needed...
        ];
    }

    getCardById(id) {
        return this.cards.find(card => card.id === id);
    }

    getCardsByType(type) {
        return this.cards.filter(card => card.type === type);
    }

    getCardsBySuit(suit) {
        return this.cards.filter(card => card.suit === suit);
    }
}
