/**
 * Slay the Spire Card Manager - 杀戮尖塔卡牌管理
 */
export class SlayTheSpireCardManager {
    constructor() {
        this.cards = [];
    }

    async loadCards() {
        try {
            const response = await fetch('./src/data/slay-the-spire-cards.json');
            const data = await response.json();
            this.cards = data.cards || data;
            console.log(`Loaded ${this.cards.length} Slay the Spire cards`);
            return this.cards;
        } catch (error) {
            console.error('Failed to load Slay the Spire card data:', error);
            this.cards = this.createFallbackCards();
            return this.cards;
        }
    }

    createFallbackCards() {
        return [
            {
                id: 'strike',
                name: '打击',
                type: '攻击',
                cost: 1,
                damage: 6,
                rarity: 'common',
                description: '造成6点伤害',
                target: 'enemy'
            },
            {
                id: 'defend',
                name: '防御',
                type: '技能',
                cost: 1,
                block: 5,
                rarity: 'common',
                description: '获得5点格挡',
                target: 'self'
            },
            {
                id: 'bash',
                name: '重击',
                type: '攻击',
                cost: 2,
                damage: 8,
                special: 'bash',
                rarity: 'uncommon',
                description: '造成8点伤害并施加易伤',
                target: 'enemy'
            },
            {
                id: 'cleave',
                name: '横扫',
                type: '攻击',
                cost: 1,
                damage: 8,
                special: 'cleave',
                rarity: 'uncommon',
                description: '对所有敌人造成8点伤害',
                target: 'enemy'
            },
            {
                id: 'iron_wave',
                name: '铁浪',
                type: '攻击',
                cost: 1,
                damage: 5,
                block: 5,
                special: 'iron_wave',
                rarity: 'uncommon',
                description: '造成5点伤害并获得5点格挡',
                target: 'enemy'
            },
            {
                id: 'anger',
                name: '愤怒',
                type: '攻击',
                cost: 0,
                damage: 6,
                rarity: 'uncommon',
                description: '造成6点伤害。将此牌从抽牌堆中移除。',
                target: 'enemy'
            },
            {
                id: 'body_slam',
                name: '猛击',
                type: '攻击',
                cost: 1,
                damage: 0,
                rarity: 'uncommon',
                description: '造成等同于你格挡值的伤害',
                target: 'enemy',
                special: 'body_slam'
            },
            {
                id: 'clash',
                name: '冲突',
                type: '攻击',
                cost: 0,
                damage: 14,
                rarity: 'uncommon',
                description: '造成14点伤害。不能在你的手牌中有攻击牌时打出',
                target: 'enemy'
            },
            {
                id: 'cold_snap',
                name: '冷 snap',
                type: '技能',
                cost: 1,
                block: 6,
                rarity: 'uncommon',
                description: '获得6点格挡。将一张冻结放入你的手牌',
                target: 'self'
            },
            {
                id: 'defend',
                name: '防御',
                type: '技能',
                cost: 1,
                block: 5,
                rarity: 'common',
                description: '获得5点格挡',
                target: 'self'
            },
            {
                id: 'dual_wield',
                name: '双持',
                type: '技能',
                cost: 1,
                rarity: 'uncommon',
                description: '选择你手牌中的一张攻击牌，复制一张它的副本到你的手牌',
                target: 'self',
                special: 'dual_wield'
            },
            {
                id: 'flame_barrier',
                name: '火焰屏障',
                type: '技能',
                cost: 2,
                block: 12,
                rarity: 'uncommon',
                description: '获得12点格挡。当格挡被攻击消耗时，对攻击者造成4点伤害',
                target: 'self',
                special: 'flame_barrier'
            },
            {
                id: 'ghostly_armor',
                name: '幽灵护甲',
                type: '技能',
                cost: 1,
                block: 8,
                rarity: 'rare',
                description: '获得8点格挡。此牌不会在回合结束时被弃掉',
                target: 'self',
                special: 'ghostly_armor'
            },
            {
                id: 'hemokinesis',
                name: '血液操控',
                type: '技能',
                cost: 1,
                damage: 7,
                rarity: 'rare',
                description: '失去3点生命值。造成7点伤害',
                target: 'enemy',
                special: 'hemokinesis'
            },
            {
                id: 'infernal_blade',
                name: '地狱之刃',
                type: '攻击',
                cost: 2,
                damage: 0,
                rarity: 'rare',
                description: '造成等同于你格挡值的伤害',
                target: 'enemy',
                special: 'infernal_blade'
            },
            {
                id: 'intimidate',
                name: '威吓',
                type: '技能',
                cost: 0,
                rarity: 'uncommon',
                description: '对所有敌人施加3层虚弱',
                target: 'enemy',
                special: 'intimidate'
            },
            {
                id: 'iron_wave',
                name: '铁浪',
                type: '攻击',
                cost: 1,
                damage: 5,
                block: 5,
                rarity: 'uncommon',
                description: '造成5点伤害并获得5点格挡',
                target: 'enemy',
                special: 'iron_wave'
            },
            {
                id: 'limit_break',
                name: '极限突破',
                type: '技能',
                cost: 1,
                rarity: 'rare',
                description: '你的格挡值翻倍',
                target: 'self',
                special: 'limit_break'
            },
            {
                id: 'metallicize',
                name: '金属化',
                type: '能力',
                cost: 1,
                rarity: 'rare',
                description: '每回合开始时获得3点格挡',
                target: 'self',
                special: 'metallicize'
            },
            {
                id: 'pommel_strike',
                name: '柄击',
                type: '攻击',
                cost: 1,
                damage: 4,
                drawCards: 2,
                rarity: 'uncommon',
                description: '造成4点伤害。抽2张牌',
                target: 'enemy'
            },
            {
                id: 'power_through',
                name: '力量突破',
                type: '技能',
                cost: 1,
                block: 3,
                rarity: 'uncommon',
                description: '获得3点格挡。将一张伤痕放入你的抽牌堆',
                target: 'self',
                special: 'power_through'
            },
            {
                id: 'rage',
                name: '愤怒',
                type: '能力',
                cost: 1,
                rarity: 'uncommon',
                description: '每当你受到伤害时，获得1点力量',
                target: 'self',
                special: 'rage'
            },
            {
                id: 'rampage',
                name: '暴走',
                type: '攻击',
                cost: 1,
                damage: 8,
                rarity: 'uncommon',
                description: '造成8点伤害。每次打出此牌，伤害增加5点',
                target: 'enemy',
                special: 'rampage'
            },
            {
                id: 'reaper',
                name: '收割',
                type: '攻击',
                cost: 2,
                damage: 0,
                rarity: 'uncommon',
                description: '对所有敌人造成等同于你最大生命值20%的伤害',
                target: 'enemy',
                special: 'reaper'
            },
            {
                id: 'reckless_charge',
                name: '鲁莽冲锋',
                type: '攻击',
                cost: 1,
                damage: 6,
                rarity: 'uncommon',
                description: '造成6点伤害。将一张眩晕放入你的抽牌堆',
                target: 'enemy',
                special: 'reckless_charge'
            },
            {
                id: 'seeing_red',
                name: '看见红色',
                type: '技能',
                cost: 1,
                energy: 2,
                rarity: 'uncommon',
                description: '获得2点能量',
                target: 'self'
            },
            {
                id: 'sever_soul',
                name: '割裂灵魂',
                type: '攻击',
                cost: 2,
                damage: 16,
                rarity: 'rare',
                description: '造成16点伤害。从你的手牌中移除所有技能牌',
                target: 'enemy',
                special: 'sever_soul'
            },
            {
                id: 'shrug_it_off',
                name: '无所谓',
                type: '技能',
                cost: 1,
                block: 8,
                rarity: 'uncommon',
                description: '获得8点格挡。获得1点力量',
                target: 'self',
                special: 'shrug_it_off'
            },
            {
                id: 'sunder',
                name: '撕裂',
                type: '攻击',
                cost: 2,
                damage: 8,
                rarity: 'uncommon',
                description: '造成8点伤害。获得2点力量',
                target: 'enemy',
                special: 'sunder'
            },
            {
                id: 'sweeping_beam',
                name: '扫射光束',
                type: '攻击',
                cost: 2,
                damage: 7,
                rarity: 'uncommon',
                description: '对所有敌人造成7点伤害',
                target: 'enemy',
                special: 'sweeping_beam'
            },
            {
                id: 'tackle',
                name: '擒抱',
                type: '攻击',
                cost: 1,
                damage: 8,
                rarity: 'uncommon',
                description: '造成8点伤害。获得3点格挡',
                target: 'enemy',
                special: 'tackle'
            },
            {
                id: 'thunder_clap',
                name: '雷鸣',
                type: '攻击',
                cost: 1,
                damage: 4,
                rarity: 'uncommon',
                description: '对所有敌人造成4点伤害',
                target: 'enemy',
                special: 'thunder_clap'
            },
            {
                id: 'twin_strike',
                name: '双重打击',
                type: '攻击',
                cost: 1,
                damage: 5,
                rarity: 'uncommon',
                description: '造成5点伤害两次',
                target: 'enemy',
                special: 'twin_strike'
            },
            {
                id: 'upercut',
                name: '上勾拳',
                type: '攻击',
                cost: 2,
                damage: 13,
                rarity: 'uncommon',
                description: '造成13点伤害。施加1层虚弱',
                target: 'enemy',
                special: 'upercut'
            },
            {
                id: 'war_cry',
                name: '战吼',
                type: '技能',
                cost: 0,
                drawCards: 3,
                rarity: 'uncommon',
                description: '抽3张牌',
                target: 'self'
            },
            {
                id: 'whirlwind',
                name: '旋风斩',
                type: '攻击',
                cost: 'X',
                damage: 5,
                rarity: 'rare',
                description: '造成5点伤害X次',
                target: 'enemy',
                special: 'whirlwind'
            },
            {
                id: 'wound',
                name: '伤痕',
                type: '诅咒',
                cost: 1,
                rarity: 'curse',
                description: '不能被打出',
                target: 'self',
                special: 'wound'
            }
        ];
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

    getCardsByCost(cost) {
        return this.cards.filter(card => card.cost === cost);
    }

    getRandomCards(count, filters = {}) {
        let cards = [...this.cards];
        
        if (filters.type) {
            cards = cards.filter(card => card.type === filters.type);
        }
        
        if (filters.rarity) {
            cards = cards.filter(card => card.rarity === filters.rarity);
        }
        
        if (filters.maxCost !== undefined) {
            cards = cards.filter(card => card.cost <= filters.maxCost);
        }
        
        const result = [];
        for (let i = 0; i < count && cards.length > 0; i++) {
            const index = Math.floor(Math.random() * cards.length);
            result.push(cards[index]);
            cards.splice(index, 1);
        }
        
        return result;
    }

    getCardDescription(card) {
        let description = card.description || '';
        
        // 添加效果描述
        const effects = [];
        
        if (card.damage) {
            effects.push(`伤害 ${card.damage}`);
        }
        
        if (card.block) {
            effects.push(`格挡 ${card.block}`);
        }
        
        if (card.heal) {
            effects.push(`治疗 ${card.heal}`);
        }
        
        if (card.energy) {
            effects.push(`能量 ${card.energy}`);
        }
        
        if (card.drawCards) {
            effects.push(`抽牌 ${card.drawCards}`);
        }
        
        if (effects.length > 0) {
            description += ` (${effects.join(', ')})`;
        }
        
        return description;
    }

    canPlayCard(card, player, gameState) {
        if (card.cost > player.energy) {
            return false;
        }
        
        if (card.target === 'enemy' && !gameState.enemy) {
            return false;
        }
        
        if (card.target === 'self' && !player) {
            return false;
        }
        
        return true;
    }

    getCardColor(card) {
        switch (card.type) {
            case '攻击':
                return '#e53e3e';
            case '技能':
                return '#4299e1';
            case '能力':
                return '#9f7aea';
            case '诅咒':
                return '#718096';
            default:
                return '#4a5568';
        }
    }

    getCardIcon(card) {
        switch (card.type) {
            case '攻击':
                return '⚔️';
            case '技能':
                return '🛡️';
            case '能力':
                return '⭐';
            case '诅咒':
                return '💀';
            default:
                return '🃏';
        }
    }
}
