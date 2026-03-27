/**
 * AI Service
 * Handles AI decision making and strategy
 */
export class AIService {
    constructor() {
        this.difficulty = 'normal';
        this.strategies = {
            easy: this.easyStrategy.bind(this),
            normal: this.normalStrategy.bind(this),
            hard: this.hardStrategy.bind(this)
        };
    }

    setDifficulty(difficulty) {
        this.difficulty = difficulty;
    }

    async makeDecisions(ai, player) {
        const strategy = this.strategies[this.difficulty];
        return await strategy(ai, player);
    }

    async easyStrategy(ai, player) {
        const decisions = [];
        
        // Simple random strategy
        const playableCards = this.getPlayableCards(ai);
        
        if (playableCards.length > 0 && Math.random() > 0.3) {
            // Play a random card
            const card = playableCards[Math.floor(Math.random() * playableCards.length)];
            const cardIndex = ai.hand.findIndex(c => c.id === card.id);
            
            decisions.push({
                type: 'playCard',
                playerId: 'ai',
                cardIndex,
                targetId: 'player'
            });
        }
        
        // Maybe draw a card
        if (Math.random() > 0.5 && ai.deck.length > 0) {
            decisions.push({
                type: 'drawCard',
                playerId: 'ai'
            });
        }
        
        // End turn
        decisions.push({
            type: 'endTurn',
            playerId: 'ai'
        });
        
        return decisions;
    }

    async normalStrategy(ai, player) {
        const decisions = [];
        
        // More strategic play
        const playableCards = this.getPlayableCards(ai);
        const sortedCards = this.sortCardsByPriority(playableCards, ai, player);
        
        // Play cards based on situation
        if (ai.health < 20 && this.hasHealCards(playableCards)) {
            // Prioritize healing when low health
            const healCard = playableCards.find(card => card.type === 'heal');
            const cardIndex = ai.hand.findIndex(c => c.id === healCard.id);
            decisions.push({
                type: 'playCard',
                playerId: 'ai',
                cardIndex,
                targetId: 'ai'
            });
        } else if (sortedCards.length > 0) {
            // Play best card available
            const bestCard = sortedCards[0];
            const cardIndex = ai.hand.findIndex(c => c.id === bestCard.id);
            decisions.push({
                type: 'playCard',
                playerId: 'ai',
                cardIndex,
                targetId: 'player'
            });
        }
        
        // Draw card if hand is small
        if (ai.hand.length < 3 && ai.deck.length > 0) {
            decisions.push({
                type: 'drawCard',
                playerId: 'ai'
            });
        }
        
        // End turn
        decisions.push({
            type: 'endTurn',
            playerId: 'ai'
        });
        
        return decisions;
    }

    async hardStrategy(ai, player) {
        const decisions = [];
        
        // Advanced strategy with combo planning
        const playableCards = this.getPlayableCards(ai);
        const gameState = this.evaluateGameState(ai, player);
        
        // Optimal play based on game state
        const optimalMoves = this.calculateOptimalMoves(playableCards, gameState);
        
        for (const move of optimalMoves) {
            if (ai.energy > 0) {
                decisions.push(move);
            }
        }
        
        // Strategic card draw
        if (this.shouldDrawCard(ai, gameState)) {
            decisions.push({
                type: 'drawCard',
                playerId: 'ai'
            });
        }
        
        // End turn
        decisions.push({
            type: 'endTurn',
            playerId: 'ai'
        });
        
        return decisions;
    }

    getPlayableCards(player) {
        return player.hand.filter(card => this.canPlayCard(card, player));
    }

    canPlayCard(card, player) {
        if (player.energy < 1) return false;
        
        // Additional logic for card playability
        if (card.type === 'heal' && player.health >= player.maxHealth) {
            return false;
        }
        
        return true;
    }

    sortCardsByPriority(cards, ai, player) {
        return cards.sort((a, b) => {
            const scoreA = this.calculateCardScore(a, ai, player);
            const scoreB = this.calculateCardScore(b, ai, player);
            return scoreB - scoreA;
        });
    }

    calculateCardScore(card, ai, player) {
        let score = card.power || 0;
        
        // Adjust score based on game situation
        if (card.type === 'attack') {
            score += (player.health / player.maxHealth) * 3;
        } else if (card.type === 'heal') {
            score += ((player.maxHealth - ai.health) / player.maxHealth) * 5;
        } else if (card.type === 'defense') {
            score += player.health > 15 ? 2 : 4;
        }
        
        // Rarity bonus
        if (card.rarity === 'rare') score += 2;
        if (card.rarity === 'epic') score += 3;
        if (card.rarity === 'legendary') score += 5;
        
        return score;
    }

    hasHealCards(cards) {
        return cards.some(card => card.type === 'heal');
    }

    evaluateGameState(ai, player) {
        return {
            aiHealthRatio: ai.health / ai.maxHealth,
            playerHealthRatio: player.health / player.maxHealth,
            aiHandSize: ai.hand.length,
            playerHandSize: player.hand.length,
            aiDeckSize: ai.deck.length,
            playerDeckSize: player.deck.length,
            turnAdvantage: ai.health > player.health ? 1 : -1
        };
    }

    calculateOptimalMoves(cards, gameState) {
        const moves = [];
        
        // Sort cards by effectiveness
        const sortedCards = this.sortCardsByGameState(cards, gameState);
        
        // Select best moves based on energy
        for (const card of sortedCards) {
            if (moves.length >= 1) break; // Limit moves per turn
            
            moves.push({
                type: 'playCard',
                playerId: 'ai',
                cardIndex: 0, // Will be calculated by game engine
                targetId: card.type === 'heal' ? 'ai' : 'player'
            });
        }
        
        return moves;
    }

    sortCardsByGameState(cards, gameState) {
        return cards.sort((a, b) => {
            let scoreA = this.getGameStateScore(a, gameState);
            let scoreB = this.getGameStateScore(b, gameState);
            return scoreB - scoreA;
        });
    }

    getGameStateScore(card, gameState) {
        let score = card.power || 0;
        
        // Adjust based on game state
        if (card.type === 'attack' && gameState.playerHealthRatio < 0.5) {
            score += 3; // Finish them!
        }
        
        if (card.type === 'heal' && gameState.aiHealthRatio < 0.4) {
            score += 4; // Emergency healing
        }
        
        return score;
    }

    shouldDrawCard(ai, gameState) {
        // Draw if hand is small or need specific answers
        return ai.hand.length < 3 || 
               (gameState.playerHealthRatio > 0.7 && ai.hand.length < 5);
    }
}
