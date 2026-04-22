/**
 * Game Engine Service
 * Core game logic and state management
 */
export class GameEngine {
    constructor() {
        this.state = {
            phase: 'waiting', // waiting, playing, paused, gameOver
            round: 1,
            currentPlayer: 'player',
            player: null,
            ai: null,
            deck: [],
            winner: null
        };
        
        this.config = {
            startingHealth: 30,
            startingHandSize: 7,
            maxEnergy: 3,
            aiDifficulty: 'normal'
        };
        
        this.listeners = new Map();
        this.cardManager = null;
        this.aiService = null;
    }

    initialize(cardManager, aiService) {
        this.cardManager = cardManager;
        this.aiService = aiService;
        
        // Create deck
        this.state.deck = this.cardManager.createDeck();
        
        // Initialize players
        this.initializePlayers();
        
        // Start game
        this.startGame();
    }

    initializePlayers() {
        const halfDeck = Math.floor(this.state.deck.length / 2);
        
        this.state.player = {
            id: 'player',
            name: 'Player',
            health: this.config.startingHealth,
            maxHealth: this.config.startingHealth,
            armor: 0,
            energy: this.config.maxEnergy,
            maxEnergy: this.config.maxEnergy,
            hand: [],
            deck: this.state.deck.slice(0, halfDeck),
            discardPile: [],
            isCurrentTurn: true
        };
        
        this.state.ai = {
            id: 'ai',
            name: 'AI',
            health: this.config.startingHealth,
            maxHealth: this.config.startingHealth,
            armor: 0,
            energy: this.config.maxEnergy,
            maxEnergy: this.config.maxEnergy,
            hand: [],
            deck: this.state.deck.slice(halfDeck),
            discardPile: [],
            isCurrentTurn: false
        };
        
        // Draw starting hands
        this.drawCards(this.state.player, this.config.startingHandSize);
        this.drawCards(this.state.ai, this.config.startingHandSize);
    }

    startGame() {
        this.state.phase = 'playing';
        this.state.round = 1;
        this.state.currentPlayer = 'player';
        
        this.emit('gameStart', { state: this.state });
        this.startTurn('player');
    }

    startTurn(playerId) {
        this.state.currentPlayer = playerId;
        const player = this.getPlayer(playerId);
        
        if (player) {
            player.isCurrentTurn = true;
            player.energy = player.maxEnergy;
            
            this.emit('turnStart', { player, state: this.state });
            
            if (playerId === 'ai') {
                this.executeAITurn();
            }
        }
    }

    async executeAITurn() {
        await this.delay(1000); // AI thinking time
        
        const ai = this.state.ai;
        const decisions = this.aiService.makeDecisions(ai, this.state.player);
        
        for (const decision of decisions) {
            if (this.state.phase !== 'playing') break;
            
            await this.delay(500);
            this.executeAction(decision);
        }
        
        if (this.state.phase === 'playing') {
            this.endTurn();
        }
    }

    executeAction(action) {
        switch (action.type) {
            case 'playCard':
                this.playCard(action.playerId, action.cardIndex, action.targetId);
                break;
            case 'drawCard':
                this.drawCard(action.playerId);
                break;
            case 'endTurn':
                this.endTurn();
                break;
        }
    }

    playCard(playerId, cardIndex, targetId) {
        const player = this.getPlayer(playerId);
        const target = this.getPlayer(targetId);
        
        if (!player || !target || cardIndex < 0 || cardIndex >= player.hand.length) {
            return false;
        }
        
        const card = player.hand[cardIndex];
        
        // Check if player can play the card
        if (player.energy < 1 || !this.canPlayCard(card, player)) {
            return false;
        }
        
        // Execute card effect
        const effects = this.executeCardEffect(card, player, target);
        
        // Update game state
        player.hand.splice(cardIndex, 1);
        player.discardPile.push(card);
        player.energy--;
        
        // Emit event
        this.emit('cardPlayed', { 
            player, 
            card, 
            target, 
            effects, 
            state: this.state 
        });
        
        // Check for game over
        this.checkGameOver();
        
        return effects;
    }

    executeCardEffect(card, attacker, defender) {
        const effects = [];
        
        switch (card.type) {
            case 'attack':
                const damage = this.calculateDamage(card, attacker, defender);
                const actualDamage = defender.health - Math.max(0, defender.health - damage);
                defender.health = Math.max(0, defender.health - damage);
                effects.push(`${attacker.name} dealt ${actualDamage} damage to ${defender.name}`);
                break;
                
            case 'heal':
                const healAmount = Math.min(card.power, attacker.maxHealth - attacker.health);
                attacker.health += healAmount;
                effects.push(`${attacker.name} healed ${healAmount} health`);
                break;
                
            case 'defense':
                attacker.armor += card.power;
                effects.push(`${attacker.name} gained ${card.power} armor`);
                break;
                
            case 'special':
                this.executeSpecialEffect(card, attacker, defender, effects);
                break;
        }
        
        return effects;
    }

    calculateDamage(card, attacker, defender) {
        let damage = card.power;
        
        // Apply armor
        if (defender.armor > 0) {
            const blockedDamage = Math.min(defender.armor, damage);
            damage -= blockedDamage;
            defender.armor -= blockedDamage;
        }
        
        return Math.max(0, damage);
    }

    executeSpecialEffect(card, attacker, defender, effects) {
        // Special card effects based on card ID
        switch (card.id) {
            case 'spades_5': // Shadow Step
            case 'hearts_5': // Lucky Charm
            case 'clubs_5': // Forest Summon
                this.drawCards(attacker, 1);
                effects.push(`${attacker.name} drew 1 card`);
                break;
                
            case 'hearts_3': // Group Heal
                const healAmount = card.power;
                attacker.health = Math.min(attacker.maxHealth, attacker.health + healAmount);
                effects.push(`${attacker.name} healed ${healAmount} health`);
                break;
                
            // Add more special effects...
        }
    }

    canPlayCard(card, player) {
        // Basic playability check
        if (card.type === 'heal' && player.health >= player.maxHealth) {
            return false;
        }
        
        return true;
    }

    drawCard(playerId) {
        const player = this.getPlayer(playerId);
        if (!player || player.deck.length === 0) {
            return false;
        }
        
        return this.drawCards(player, 1).length > 0;
    }

    drawCards(player, count) {
        const drawnCards = [];
        
        for (let i = 0; i < count; i++) {
            if (player.deck.length === 0) {
                this.reshuffleDeck(player);
            }
            
            if (player.deck.length > 0) {
                const card = player.deck.pop();
                player.hand.push(card);
                drawnCards.push(card);
            }
        }
        
        if (drawnCards.length > 0) {
            this.emit('cardsDrawn', { player, cards: drawnCards, state: this.state });
        }
        
        return drawnCards;
    }

    reshuffleDeck(player) {
        if (player.discardPile.length > 0) {
            player.deck = this.shuffleArray(player.discardPile);
            player.discardPile = [];
        }
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    endTurn() {
        const currentPlayer = this.getPlayer(this.state.currentPlayer);
        if (currentPlayer) {
            currentPlayer.isCurrentTurn = false;
            currentPlayer.energy = 0;
        }
        
        this.emit('turnEnd', { player: currentPlayer, state: this.state });
        
        // Check for game over
        if (this.checkGameOver()) {
            return;
        }
        
        // Switch turns
        const nextPlayer = this.state.currentPlayer === 'player' ? 'ai' : 'player';
        this.state.round++;
        this.startTurn(nextPlayer);
    }

    checkGameOver() {
        if (this.state.player.health <= 0) {
            this.endGame('ai');
            return true;
        }
        
        if (this.state.ai.health <= 0) {
            this.endGame('player');
            return true;
        }
        
        return false;
    }

    endGame(winnerId) {
        this.state.phase = 'gameOver';
        this.state.winner = winnerId;
        
        this.emit('gameOver', { 
            winner: this.getPlayer(winnerId), 
            state: this.state 
        });
    }

    getPlayer(playerId) {
        return this.state[playerId];
    }

    restart() {
        this.state = {
            phase: 'waiting',
            round: 1,
            currentPlayer: 'player',
            player: null,
            ai: null,
            deck: [],
            winner: null
        };
        
        this.initialize(this.cardManager, this.aiService);
    }

    pause() {
        if (this.state.phase === 'playing') {
            this.state.phase = 'paused';
            this.emit('gamePaused', { state: this.state });
        }
    }

    resume() {
        if (this.state.phase === 'paused') {
            this.state.phase = 'playing';
            this.emit('gameResumed', { state: this.state });
        }
    }

    setConfig(key, value) {
        if (this.config.hasOwnProperty(key)) {
            this.config[key] = value;
            
            if (key === 'aiDifficulty' && this.aiService) {
                this.aiService.setDifficulty(value);
            }
        }
    }

    getGameState() {
        return {
            ...this.state,
            config: { ...this.config }
        };
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
