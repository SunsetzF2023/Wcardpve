/**
 * Storage Manager Utility
 * Handles local storage and game persistence
 */
export class StorageManager {
    constructor() {
        this.storageKey = 'cardBattleArena_save';
        this.settingsKey = 'cardBattleArena_settings';
        this.maxSaveSlots = 5;
    }

    saveGame(gameState, slot = 0) {
        try {
            const saveData = {
                slot,
                timestamp: Date.now(),
                version: '1.0.0',
                gameState: this.sanitizeGameState(gameState)
            };
            
            const saves = this.getAllSaves();
            saves[slot] = saveData;
            
            localStorage.setItem(this.storageKey, JSON.stringify(saves));
            console.log(`Game saved to slot ${slot}`);
            return true;
        } catch (error) {
            console.error('Failed to save game:', error);
            return false;
        }
    }

    loadGame(slot = 0) {
        try {
            const saves = this.getAllSaves();
            const saveData = saves[slot];
            
            if (!saveData) {
                console.log(`No save found in slot ${slot}`);
                return null;
            }
            
            console.log(`Game loaded from slot ${slot}`);
            return this.restoreGameState(saveData.gameState);
        } catch (error) {
            console.error('Failed to load game:', error);
            return null;
        }
    }

    getAllSaves() {
        try {
            const savesData = localStorage.getItem(this.storageKey);
            return savesData ? JSON.parse(savesData) : {};
        } catch (error) {
            console.error('Failed to load saves:', error);
            return {};
        }
    }

    deleteSave(slot = 0) {
        try {
            const saves = this.getAllSaves();
            delete saves[slot];
            localStorage.setItem(this.storageKey, JSON.stringify(saves));
            console.log(`Save slot ${slot} deleted`);
            return true;
        } catch (error) {
            console.error('Failed to delete save:', error);
            return false;
        }
    }

    clearAllSaves() {
        try {
            localStorage.removeItem(this.storageKey);
            console.log('All saves cleared');
            return true;
        } catch (error) {
            console.error('Failed to clear saves:', error);
            return false;
        }
    }

    saveSettings(settings) {
        try {
            localStorage.setItem(this.settingsKey, JSON.stringify(settings));
            return true;
        } catch (error) {
            console.error('Failed to save settings:', error);
            return false;
        }
    }

    loadSettings() {
        try {
            const settingsData = localStorage.getItem(this.settingsKey);
            return settingsData ? JSON.parse(settingsData) : this.getDefaultSettings();
        } catch (error) {
            console.error('Failed to load settings:', error);
            return this.getDefaultSettings();
        }
    }

    getDefaultSettings() {
        return {
            soundEnabled: true,
            musicEnabled: true,
            soundVolume: 0.7,
            musicVolume: 0.5,
            animationSpeed: 'normal',
            aiDifficulty: 'normal',
            autoSave: true,
            theme: 'dark'
        };
    }

    sanitizeGameState(gameState) {
        // Remove circular references and non-serializable data
        return {
            phase: gameState.phase,
            round: gameState.round,
            currentPlayer: gameState.currentPlayer,
            player: this.sanitizePlayer(gameState.player),
            ai: this.sanitizePlayer(gameState.ai),
            deckSize: gameState.deck ? gameState.deck.length : 0,
            winner: gameState.winner
        };
    }

    sanitizePlayer(player) {
        if (!player) return null;
        
        return {
            id: player.id,
            name: player.name,
            health: player.health,
            maxHealth: player.maxHealth,
            armor: player.armor,
            energy: player.energy,
            maxEnergy: player.maxEnergy,
            hand: player.hand ? player.hand.map(card => this.sanitizeCard(card)) : [],
            deck: player.deck ? player.deck.map(card => this.sanitizeCard(card)) : [],
            discardPile: player.discardPile ? player.discardPile.map(card => this.sanitizeCard(card)) : []
        };
    }

    sanitizeCard(card) {
        if (!card) return null;
        
        return {
            id: card.id,
            suit: card.suit,
            rank: card.rank,
            value: card.value,
            text: card.text,
            type: card.type,
            power: card.power,
            rarity: card.rarity
        };
    }

    restoreGameState(sanitizedState) {
        // Restore game state from sanitized version
        return {
            ...sanitizedState,
            // Reconstruct any missing properties as needed
        };
    }

    getSaveInfo(slot = 0) {
        const saves = this.getAllSaves();
        const saveData = saves[slot];
        
        if (!saveData) return null;
        
        return {
            slot,
            timestamp: saveData.timestamp,
            date: new Date(saveData.timestamp).toLocaleString(),
            version: saveData.version,
            round: saveData.gameState.round,
            playerHealth: saveData.gameState.player?.health || 0,
            aiHealth: saveData.gameState.ai?.health || 0
        };
    }

    exportSave(slot = 0) {
        const saveData = this.getAllSaves()[slot];
        if (!saveData) return null;
        
        return JSON.stringify(saveData, null, 2);
    }

    importSave(saveDataString, slot = 0) {
        try {
            const saveData = JSON.parse(saveDataString);
            const saves = this.getAllSaves();
            saves[slot] = saveData;
            localStorage.setItem(this.storageKey, JSON.stringify(saves));
            console.log(`Save imported to slot ${slot}`);
            return true;
        } catch (error) {
            console.error('Failed to import save:', error);
            return false;
        }
    }

    getStorageUsage() {
        try {
            const savesData = localStorage.getItem(this.storageKey) || '{}';
            const settingsData = localStorage.getItem(this.settingsKey) || '{}';
            
            const totalSize = new Blob([savesData, settingsData]).size;
            const maxSize = 5 * 1024 * 1024; // 5MB typical localStorage limit
            
            return {
                used: totalSize,
                max: maxSize,
                percentage: (totalSize / maxSize) * 100,
                available: maxSize - totalSize
            };
        } catch (error) {
            console.error('Failed to check storage usage:', error);
            return { used: 0, max: 0, percentage: 0, available: 0 };
        }
    }
}
