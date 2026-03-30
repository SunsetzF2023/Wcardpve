/**
 * Tower Card Manager - 塔防卡牌管理
 */
export class TowerCardManager {
    constructor() {
        this.cards = [];
        this.availableCards = [];
    }

    async loadCards() {
        try {
            const response = await fetch('./src/data/tower-cards.json');
            const data = await response.json();
            this.cards = data.cards || data;
            this.availableCards = this.cards.filter(card => card.cost <= 200); // 初始可用卡牌
            console.log(`Loaded ${this.cards.length} tower cards`);
            return this.cards;
        } catch (error) {
            console.error('Failed to load tower card data:', error);
            this.cards = this.createFallbackCards();
            this.availableCards = this.cards;
            return this.cards;
        }
    }

    createFallbackCards() {
        return [
            {
                id: 'basic_tower',
                type: '兵',
                cost: 50,
                baseEffect: {
                    damage: 10,
                    range: 150,
                    fireRate: 1000
                },
                rarity: 'common',
                description: '基础攻击塔，每秒造成10点伤害'
            },
            {
                id: 'freeze_tower',
                type: '冰',
                cost: 75,
                baseEffect: {
                    damage: 5,
                    range: 120,
                    fireRate: 1500,
                    slow: 0.5
                },
                rarity: 'rare',
                description: '冰冻塔，减速敌人并造成5点伤害'
            },
            {
                id: 'cannon_tower',
                type: '炮',
                cost: 100,
                baseEffect: {
                    damage: 25,
                    range: 100,
                    fireRate: 2000,
                    aoe: true
                },
                rarity: 'rare',
                description: '火炮塔，范围攻击造成25点伤害'
            },
            {
                id: 'laser_tower',
                type: '光',
                cost: 150,
                baseEffect: {
                    damage: 15,
                    range: 200,
                    fireRate: 500,
                    piercing: true
                },
                rarity: 'epic',
                description: '激光塔，穿透攻击造成15点伤害'
            },
            {
                id: 'tesla_tower',
                type: '电',
                cost: 200,
                baseEffect: {
                    damage: 8,
                    range: 100,
                    fireRate: 300,
                    chain: 3
                },
                rarity: 'epic',
                description: '特斯拉塔，链式攻击最多3个目标'
            }
        ];
    }

    getAvailableCards() {
        return this.availableCards;
    }

    getCardById(id) {
        return this.cards.find(card => card.id === id);
    }

    getCardsByType(type) {
        return this.cards.filter(card => card.type === type);
    }

    getCardsByRarity(rarity) {
        return this.cards.filter(card => card.rarity === rarity);
    }

    updateAvailableCards(maxCost) {
        this.availableCards = this.cards.filter(card => card.cost <= maxCost);
    }

    getTowerStats(card, level = 1) {
        const baseStats = { ...card.baseEffect };
        
        // 根据等级提升属性
        const multiplier = 1 + (level - 1) * 0.2;
        
        return {
            damage: Math.floor(baseStats.damage * multiplier),
            range: baseStats.range,
            fireRate: Math.max(200, baseStats.fireRate - (level - 1) * 100),
            slow: baseStats.slow,
            aoe: baseStats.aoe,
            piercing: baseStats.piercing,
            chain: baseStats.chain
        };
    }

    getUpgradeCost(card, currentLevel) {
        return Math.floor(card.cost * 0.5 * currentLevel);
    }

    canAfford(card, gold) {
        return gold >= card.cost;
    }

    getTowerDescription(card) {
        const stats = this.getTowerStats(card);
        return `${card.description}\n伤害: ${stats.damage}\n范围: ${stats.range}\n攻速: ${(1000/stats.fireRate).toFixed(1)}/秒`;
    }
}
