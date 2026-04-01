/**
 * Slay the Spire Engine - 杀戮尖塔游戏引擎
 */
export class SlayTheSpireEngine {
    constructor() {
        this.state = {
            phase: 'waiting',
            floor: 1,
            currentPlayer: '玩家',
            player: {
                id: 'player',
                name: '玩家',
                health: 75,
                maxHealth: 75,
                block: 0,
                energy: 3,
                maxEnergy: 3,
                hand: [],
                deck: [],
                discard: [],
                drawPile: []
            },
            enemy: null,
            score: 0,
            turnCount: 0
        };
        
        this.listeners = new Map();
        this.cardManager = null;
    }

    initialize(cardManager) {
        this.cardManager = cardManager;
        this.setupInitialDeck();
        this.emit('initialized', {});
    }

    setupInitialDeck() {
        // 创建初始牌组
        const initialCards = [
            'strike', 'strike', 'strike', 'strike',
            'defend', 'defend', 'defend', 'defend', 'defend',
            'bash'
        ];
        
        this.state.player.deck = initialCards.map(cardId => 
            this.cardManager.getCardById(cardId)
        ).filter(card => card);
        
        // 洗牌并准备抽牌堆
        this.shuffleDeck();
        this.prepareDrawPile();
        
        // 初始化被动能力
        this.state.player.passiveAbilities = [];
    }

    shuffleDeck() {
        const deck = [...this.state.player.deck];
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        this.state.player.deck = deck;
    }

    prepareDrawPile() {
        // 将弃牌堆的牌洗回抽牌堆
        if (this.state.player.deck.length === 0 && this.state.player.discard.length > 0) {
            this.state.player.deck = [...this.state.player.discard];
            this.state.player.discard = [];
            this.shuffleDeck();
        }
        
        // 准备抽牌堆
        this.state.player.drawPile = [...this.state.player.deck];
        this.state.player.deck = [];
    }

    startGame() {
        this.state.phase = 'playing';
        this.state.currentPlayer = '玩家';
        this.spawnEnemy();
        this.drawInitialHand();
        this.emit('gameStarted', { state: this.state });
    }

    spawnEnemy() {
        // 根据楼层生成不同强度的敌人
        const enemyTypes = [
            { 
                name: '爪牙', 
                health: 24 + (this.state.floor - 1) * 8, 
                damage: 6 + Math.floor((this.state.floor - 1) * 1.5), 
                intent: '攻击' 
            },
            { 
                name: '蓝史莱姆', 
                health: 12 + (this.state.floor - 1) * 4, 
                damage: 3 + Math.floor((this.state.floor - 1) * 0.8), 
                intent: '攻击' 
            },
            { 
                name: '红史莱姆', 
                health: 18 + (this.state.floor - 1) * 6, 
                damage: 8 + Math.floor((this.state.floor - 1) * 1.2), 
                intent: '攻击' 
            },
            { 
                name: '小喽啰', 
                health: 30 + (this.state.floor - 1) * 10, 
                damage: 10 + Math.floor((this.state.floor - 1) * 2), 
                intent: '攻击' 
            },
            // 高楼层新增强敌
            ...(this.state.floor >= 3 ? [{
                name: '精英守卫', 
                health: 40 + (this.state.floor - 3) * 12, 
                damage: 12 + Math.floor((this.state.floor - 3) * 2.5), 
                intent: '攻击' 
            }] : []),
            ...(this.state.floor >= 5 ? [{
                name: '暗影刺客', 
                health: 35 + (this.state.floor - 5) * 8, 
                damage: 15 + Math.floor((this.state.floor - 5) * 3), 
                intent: '攻击' 
            }] : []),
            ...(this.state.floor >= 7 ? [{
                name: '熔岩巨兽', 
                health: 60 + (this.state.floor - 7) * 15, 
                damage: 18 + Math.floor((this.state.floor - 7) * 3.5), 
                intent: '攻击' 
            }] : []),
            ...(this.state.floor >= 9 ? [{
                name: '深渊领主', 
                health: 80 + (this.state.floor - 9) * 20, 
                damage: 25 + Math.floor((this.state.floor - 9) * 5), 
                intent: '攻击' 
            }] : [])
        ];

        const availableEnemies = enemyTypes.filter(enemy => 
            this.state.floor >= 1 || (!enemy.name.includes('精英') && !enemy.name.includes('刺客') && !enemy.name.includes('巨兽') && !enemy.name.includes('领主'))
        );
        
        const enemyType = availableEnemies[Math.floor(Math.random() * availableEnemies.length)];

        this.state.enemy = {
            id: 'enemy',
            name: enemyType.name,
            health: enemyType.health,
            maxHealth: enemyType.health,
            damage: enemyType.damage,
            block: 0,
            intent: enemyType.intent,
            nextAction: 'attack'
        };

        this.emit('enemySpawned', { enemy: this.state.enemy });
    }

    drawInitialHand() {
        // 初始手牌4张
        for (let i = 0; i < 4; i++) {
            this.drawCard();
        }
    }

    drawCard() {
        if (this.state.player.drawPile.length === 0) {
            this.prepareDrawPile();
        }
        
        if (this.state.player.drawPile.length === 0) {
            return;
        }
        
        // 检查手牌上限（最多10张）
        if (this.state.player.hand.length >= 10) {
            this.emit('handFull', {});
            return;
        }
        
        const card = this.state.player.drawPile.pop();
        this.state.player.hand.push(card);
        
        this.emit('cardDrawn', { card });
        this.emit('gameStateChanged', {});
    }

    canPlayCard(card, player) {
        if (card.cost > player.energy) {
            return false;
        }
        
        // 检查是否有目标
        if (card.target === 'enemy' && !this.state.enemy) {
            return false;
        }
        
        if (card.target === 'self' && !player) {
            return false;
        }
        
        return true;
    }

    playCard(cardIndex, player, target) {
        const card = this.state.player.hand[cardIndex];
        
        if (!this.canPlayCard(card, player)) {
            return false;
        }
        
        // 消耗能量
        player.energy -= card.cost;
        
        // 执行卡牌效果
        this.executeCardEffect(card, player, target);
        
        // 将牌移到弃牌堆
        this.state.player.hand.splice(cardIndex, 1);
        this.state.player.discard.push(card);
        
        this.emit('cardPlayed', { card, player, target });
        return true;
    }

    executeCardEffect(card, player, target) {
        // 伤害效果
        if (card.damage && target) {
            let actualDamage = card.damage;
            
            // 检查暴击
            if (card.critChance && Math.random() < card.critChance) {
                actualDamage *= 2;
                this.emit('criticalHit', { card, actualDamage });
            }
            
            const damageDealt = Math.max(0, actualDamage - (target.block || 0));
            target.block = Math.max(0, (target.block || 0) - actualDamage);
            target.health = Math.max(0, target.health - damageDealt);
            
            this.emit('damageDealt', { attacker: player.name, target: target.name, damage: damageDealt });
        }
        
        // 格挡效果
        if (card.block) {
            player.block = (player.block || 0) + card.block;
            this.emit('blockApplied', { target: player.name, amount: card.block });
        }
        
        // 治疗效果
        if (card.heal) {
            const actualHeal = Math.min(card.heal, player.maxHealth - player.health);
            player.health += actualHeal;
            this.emit('healingApplied', { target: player.name, amount: actualHeal });
        }
        
        // 能量效果
        if (card.energy) {
            player.energy += card.energy;
            this.emit('energyGained', { target: player.name, amount: card.energy });
        }
        
        // 抽牌效果
        if (card.drawCards) {
            for (let i = 0; i < card.drawCards; i++) {
                this.drawCard();
            }
            this.emit('cardsDrawn', { amount: card.drawCards });
        }
        
        // 被动能力效果
        if (card.passive) {
            this.addPassiveAbility(player, card);
            this.emit('passiveAbilityAdded', { card, player });
        }
        
        // 特殊效果
        if (card.special) {
            this.executeSpecialEffect(card, player, target);
        }
    }

    addPassiveAbility(player, card) {
        // 添加被动能力到玩家
        if (!player.passiveAbilities) {
            player.passiveAbilities = [];
        }
        
        // 检查是否已存在相同的能力
        const existingAbility = player.passiveAbilities.find(ability => ability.id === card.id);
        if (existingAbility) {
            // 如果已存在，升级效果
            this.upgradePassiveAbility(player, card);
        } else {
            // 添加新的被动能力
            player.passiveAbilities.push({
                id: card.id,
                name: card.name,
                effect: card,
                stacks: 1
            });
        }
    }

    upgradePassiveAbility(player, card) {
        const ability = player.passiveAbilities.find(ability => ability.id === card.id);
        if (ability) {
            ability.stacks++;
            this.emit('passiveAbilityUpgraded', { card, stacks: ability.stacks });
        }
    }

    applyPassiveAbilities(player) {
        // 每回合开始时应用所有被动能力
        if (!player.passiveAbilities) return;
        
        player.passiveAbilities.forEach(ability => {
            const card = ability.effect;
            
            switch (card.special) {
                case 'perma_defend':
                    player.block = (player.block || 0) + (card.block * ability.stacks);
                    this.emit('passiveBlockApplied', { amount: card.block * ability.stacks });
                    break;
                case 'perma_strike':
                    if (this.state.enemy) {
                        const damage = card.damage * ability.stacks;
                        const actualDamage = Math.max(0, damage - (this.state.enemy.block || 0));
                        this.state.enemy.block = Math.max(0, (this.state.enemy.block || 0) - damage);
                        this.state.enemy.health = Math.max(0, this.state.enemy.health - actualDamage);
                        this.emit('passiveDamageDealt', { damage: actualDamage });
                    }
                    break;
                case 'perma_heal':
                    const healAmount = card.heal * ability.stacks;
                    const actualHeal = Math.min(healAmount, player.maxHealth - player.health);
                    player.health += actualHeal;
                    this.emit('passiveHealingApplied', { amount: actualHeal });
                    break;
                case 'perma_energy':
                    player.maxEnergy = 3 + (card.energy * ability.stacks);
                    this.emit('passiveEnergyGained', { amount: card.energy * ability.stacks });
                    break;
                case 'perma_draw':
                    for (let i = 0; i < (card.drawCards * ability.stacks); i++) {
                        this.drawCard();
                    }
                    this.emit('passiveCardsDrawn', { amount: card.drawCards * ability.stacks });
                    break;
                case 'perma_burn':
                    if (this.state.enemy) {
                        if (!this.state.enemy.burnStacks) {
                            this.state.enemy.burnStacks = 0;
                        }
                        this.state.enemy.burnStacks += (card.burn * ability.stacks);
                        this.emit('passiveBurnApplied', { stacks: this.state.enemy.burnStacks });
                    }
                    break;
                case 'divine_burn':
                    // 与神同燃：玩家和所有敌人都获得燃烧
                    if (!player.burnStacks) {
                        player.burnStacks = 0;
                    }
                    player.burnStacks += (card.burn * ability.stacks);
                    if (this.state.enemy) {
                        if (!this.state.enemy.burnStacks) {
                            this.state.enemy.burnStacks = 0;
                        }
                        this.state.enemy.burnStacks += (card.burn * ability.stacks);
                    }
                    this.emit('divineBurnApplied', { playerStacks: player.burnStacks, enemyStacks: this.state.enemy?.burnStacks });
                    break;
                case 'phoenix_rebirth':
                    // 灰烬中的永生：所有敌人获得燃烧+吸血
                    if (this.state.enemy) {
                        if (!this.state.enemy.burnStacks) {
                            this.state.enemy.burnStacks = 0;
                        }
                        this.state.enemy.burnStacks += (card.burn * ability.stacks);
                        if (!this.state.enemy.lifesteal) {
                            this.state.enemy.lifesteal = 0;
                        }
                        this.state.enemy.lifesteal += (card.lifesteal * ability.stacks);
                        this.emit('phoenixRebirthApplied', { burnStacks: this.state.enemy.burnStacks, lifesteal: this.state.enemy.lifesteal });
                    }
                    break;
                case 'eternal_winter':
                    // 永恒寒冬：每回合对所有敌人施加冰冻
                    if (this.state.enemy) {
                        if (!this.state.enemy.freezeStacks) {
                            this.state.enemy.freezeStacks = 0;
                        }
                        this.state.enemy.freezeStacks += (card.freeze * ability.stacks);
                        this.emit('eternalWinterApplied', { freezeStacks: this.state.enemy.freezeStacks });
                    }
                    break;
                case 'venom_spread':
                    // 毒液扩散：每回合对所有敌人施加中毒
                    if (this.state.enemy) {
                        if (!this.state.enemy.poisonStacks) {
                            this.state.enemy.poisonStacks = 0;
                        }
                        this.state.enemy.poisonStacks += (card.poison * ability.stacks);
                        this.emit('venomSpreadApplied', { poisonStacks: this.state.enemy.poisonStacks });
                    }
                    break;
                case 'thunder_storm':
                    // 雷霆风暴：每回合对所有敌人施加雷电
                    if (this.state.enemy) {
                        if (!this.state.enemy.lightningStacks) {
                            this.state.enemy.lightningStacks = 0;
                        }
                        this.state.enemy.lightningStacks += (card.lightning * ability.stacks);
                        this.emit('thunderStormApplied', { lightningStacks: this.state.enemy.lightningStacks });
                    }
                    break;
                case 'void_embrace':
                    // 虚空拥抱：每回合对所有敌人施加暗影
                    if (this.state.enemy) {
                        if (!this.state.enemy.shadowStacks) {
                            this.state.enemy.shadowStacks = 0;
                        }
                        this.state.enemy.shadowStacks += (card.shadow * ability.stacks);
                        this.emit('voidEmbraceApplied', { shadowStacks: this.state.enemy.shadowStacks });
                    }
                    break;
                case 'blood_cascade':
                    // 血色瀑布：每回合对所有敌人施加流血
                    if (this.state.enemy) {
                        if (!this.state.enemy.bleedStacks) {
                            this.state.enemy.bleedStacks = 0;
                        }
                        this.state.enemy.bleedStacks += (card.bleed * ability.stacks);
                        this.emit('bloodCascadeApplied', { bleedStacks: this.state.enemy.bleedStacks });
                    }
                    break;
                case 'fragility_aura':
                    // 脆弱光环：每回合对所有敌人施加虚弱
                    if (this.state.enemy) {
                        if (!this.state.enemy.weakStacks) {
                            this.state.enemy.weakStacks = 0;
                        }
                        this.state.enemy.weakStacks += (card.weak * ability.stacks);
                        this.emit('fragilityAuraApplied', { weakStacks: this.state.enemy.weakStacks });
                    }
                    break;
                case 'exposure_field':
                    // 暴露领域：每回合对所有敌人施加易伤
                    if (this.state.enemy) {
                        if (!this.state.enemy.vulnerableStacks) {
                            this.state.enemy.vulnerableStacks = 0;
                        }
                        this.state.enemy.vulnerableStacks += (card.vulnerable * ability.stacks);
                        this.emit('exposureFieldApplied', { vulnerableStacks: this.state.enemy.vulnerableStacks });
                    }
                    break;
                case 'mute_field':
                    // 静默领域：每回合对所有敌人施加沉默
                    if (this.state.enemy) {
                        if (!this.state.enemy.silenceStacks) {
                            this.state.enemy.silenceStacks = 0;
                        }
                        this.state.enemy.silenceStacks += (card.silence * ability.stacks);
                        this.emit('muteFieldApplied', { silenceStacks: this.state.enemy.silenceStacks });
                    }
                    break;
                case 'chaos_storm':
                    // 混乱风暴：每回合对所有敌人施加混乱
                    if (this.state.enemy) {
                        if (!this.state.enemy.confusionStacks) {
                            this.state.enemy.confusionStacks = 0;
                        }
                        this.state.enemy.confusionStacks += (card.confusion * ability.stacks);
                        this.emit('chaosStormApplied', { confusionStacks: this.state.enemy.confusionStacks });
                    }
                    break;
                case 'terror_aura':
                    // 恐怖光环：每回合对所有敌人施加恐惧
                    if (this.state.enemy) {
                        if (!this.state.enemy.fearStacks) {
                            this.state.enemy.fearStacks = 0;
                        }
                        this.state.enemy.fearStacks += (card.fear * ability.stacks);
                        this.emit('terrorAuraApplied', { fearStacks: this.state.enemy.fearStacks });
                    }
                    break;
                case 'chain_field':
                    // 锁链领域：每回合对所有敌人施加束缚
                    if (this.state.enemy) {
                        if (!this.state.enemy.bindStacks) {
                            this.state.enemy.bindStacks = 0;
                        }
                        this.state.enemy.bindStacks += (card.bind * ability.stacks);
                        this.emit('chainFieldApplied', { bindStacks: this.state.enemy.bindStacks });
                    }
                    break;
                case 'rot_field':
                    // 腐败领域：每回合对所有敌人施加腐朽
                    if (this.state.enemy) {
                        if (!this.state.enemy.decayStacks) {
                            this.state.enemy.decayStacks = 0;
                        }
                        this.state.enemy.decayStacks += (card.decay * ability.stacks);
                        this.emit('rotFieldApplied', { decayStacks: this.state.enemy.decayStacks });
                    }
                    break;
                case 'temporal_distortion':
                    // 时空扭曲：每回合对所有敌人施加时间
                    if (this.state.enemy) {
                        if (!this.state.enemy.timeStacks) {
                            this.state.enemy.timeStacks = 0;
                        }
                        this.state.enemy.timeStacks += (card.time * ability.stacks);
                        this.emit('temporalDistortionApplied', { timeStacks: this.state.enemy.timeStacks });
                    }
                    break;
                case 'spirit_drain':
                    // 灵魂汲取：每回合对所有敌人施加灵魂
                    if (this.state.enemy) {
                        if (!this.state.enemy.soulStacks) {
                            this.state.enemy.soulStacks = 0;
                        }
                        this.state.enemy.soulStacks += (card.soul * ability.stacks);
                        this.emit('spiritDrainApplied', { soulStacks: this.state.enemy.soulStacks });
                    }
                    break;
                case 'dream_eater':
                    // 噬梦者：每回合对所有敌人施加噩梦
                    if (this.state.enemy) {
                        if (!this.state.enemy.nightmareStacks) {
                            this.state.enemy.nightmareStacks = 0;
                        }
                        this.state.enemy.nightmareStacks += (card.nightmare * ability.stacks);
                        this.emit('dreamEaterApplied', { nightmareStacks: this.state.enemy.nightmareStacks });
                    }
                    break;
                case 'holy_fire':
                    // 圣火：每回合对所有敌人施加圣火（无视护盾的燃烧）
                    if (this.state.enemy) {
                        if (!this.state.enemy.holyStacks) {
                            this.state.enemy.holyStacks = 0;
                        }
                        this.state.enemy.holyStacks += (card.holy * ability.stacks);
                        if (!this.state.enemy.burnStacks) {
                            this.state.enemy.burnStacks = 0;
                        }
                        this.state.enemy.burnStacks += (card.burn * ability.stacks);
                        this.emit('holyFireApplied', { holyStacks: this.state.enemy.holyStacks, burnStacks: this.state.enemy.burnStacks });
                    }
                    break;
                case 'divine_flame':
                    // 神炎：每回合对所有敌人施加神炎（无视护盾的燃烧+治疗）
                    if (this.state.enemy) {
                        if (!this.state.enemy.holyStacks) {
                            this.state.enemy.holyStacks = 0;
                        }
                        this.state.enemy.holyStacks += (card.holy * ability.stacks);
                        if (!this.state.enemy.burnStacks) {
                            this.state.enemy.burnStacks = 0;
                        }
                        this.state.enemy.burnStacks += (card.burn * ability.stacks);
                        this.emit('divineFlameApplied', { holyStacks: this.state.enemy.holyStacks, burnStacks: this.state.enemy.burnStacks });
                    }
                    break;
                case 'acid_rain':
                    // 酸雨：每回合对所有敌人施加酸蚀
                    if (this.state.enemy) {
                        if (!this.state.enemy.acidStacks) {
                            this.state.enemy.acidStacks = 0;
                        }
                        this.state.enemy.acidStacks += (card.acid * ability.stacks);
                        this.emit('acidRainApplied', { acidStacks: this.state.enemy.acidStacks });
                    }
                    break;
                case 'corruption_storm':
                    // 腐蚀风暴：每回合对所有敌人施加酸蚀
                    if (this.state.enemy) {
                        if (!this.state.enemy.acidStacks) {
                            this.state.enemy.acidStacks = 0;
                        }
                        this.state.enemy.acidStacks += (card.acid * ability.stacks);
                        this.emit('corruptionStormApplied', { acidStacks: this.state.enemy.acidStacks });
                    }
                    break;
                case 'mind_control':
                    // 心灵控制：每回合对所有敌人施加心灵
                    if (this.state.enemy) {
                        if (!this.state.enemy.psychicStacks) {
                            this.state.enemy.psychicStacks = 0;
                        }
                        this.state.enemy.psychicStacks += (card.psychic * ability.stacks);
                        this.emit('mindControlApplied', { psychicStacks: this.state.enemy.psychicStacks });
                    }
                    break;
                case 'madness_field':
                    // 疯狂领域：每回合对所有敌人施加心灵
                    if (this.state.enemy) {
                        if (!this.state.enemy.psychicStacks) {
                            this.state.enemy.psychicStacks = 0;
                        }
                        this.state.enemy.psychicStacks += (card.psychic * ability.stacks);
                        this.emit('madnessFieldApplied', { psychicStacks: this.state.enemy.psychicStacks });
                    }
                    break;
                case 'divine_punishment':
                    // 神罚：每回合对所有敌人施加神圣
                    if (this.state.enemy) {
                        if (!this.state.enemy.holyStacks) {
                            this.state.enemy.holyStacks = 0;
                        }
                        this.state.enemy.holyStacks += (card.holy * ability.stacks);
                        this.emit('divinePunishmentApplied', { holyStacks: this.state.enemy.holyStacks });
                    }
                    break;
                case 'judgment_day':
                    // 审判之日：每回合对所有敌人施加神圣
                    if (this.state.enemy) {
                        if (!this.state.enemy.holyStacks) {
                            this.state.enemy.holyStacks = 0;
                        }
                        this.state.enemy.holyStacks += (card.holy * ability.stacks);
                        this.emit('judgmentDayApplied', { holyStacks: this.state.enemy.holyStacks });
                    }
                    break;
                case 'abyss_field':
                    // 深渊领域：每回合对所有敌人施加黑暗
                    if (this.state.enemy) {
                        if (!this.state.enemy.darkStacks) {
                            this.state.enemy.darkStacks = 0;
                        }
                        this.state.enemy.darkStacks += (card.dark * ability.stacks);
                        this.emit('abyssFieldApplied', { darkStacks: this.state.enemy.darkStacks });
                    }
                    break;
                case 'void_consumption':
                    // 虚空吞噬：每回合对所有敌人施加黑暗
                    if (this.state.enemy) {
                        if (!this.state.enemy.darkStacks) {
                            this.state.enemy.darkStacks = 0;
                        }
                        this.state.enemy.darkStacks += (card.dark * ability.stacks);
                        this.emit('voidConsumptionApplied', { darkStacks: this.state.enemy.darkStacks });
                    }
                    break;
                case 'perma_vulnerable':
                    if (this.state.enemy) {
                        if (!this.state.enemy.vulnerable) {
                            this.state.enemy.vulnerable = 0;
                        }
                        this.state.enemy.vulnerable += (card.vulnerable * ability.stacks);
                        this.emit('passiveVulnerableApplied', { stacks: this.state.enemy.vulnerable });
                    }
                    break;
                case 'perma_weak':
                    if (this.state.enemy) {
                        if (!this.state.enemy.weak) {
                            this.state.enemy.weak = 0;
                        }
                        this.state.enemy.weak += (card.weak * ability.stacks);
                        this.emit('passiveWeakApplied', { stacks: this.state.enemy.weak });
                    }
                    break;
                case 'perma_crit':
                    if (!player.critChance) {
                        player.critChance = 0;
                    }
                    player.critChance += (card.critChance * ability.stacks);
                    this.emit('passiveCritApplied', { chance: player.critChance });
                    break;
                case 'perma_dodge':
                    if (!player.dodgeChance) {
                        player.dodgeChance = 0;
                    }
                    player.dodgeChance += (card.dodge * ability.stacks);
                    this.emit('passiveDodgeApplied', { chance: player.dodgeChance });
                    break;
                case 'perma_lifesteal':
                    if (!player.lifesteal) {
                        player.lifesteal = 0;
                    }
                    player.lifesteal += (card.lifesteal * ability.stacks);
                    this.emit('passiveLifestealApplied', { amount: player.lifesteal });
                    break;
                case 'perma_thorns':
                    if (!player.thorns) {
                        player.thorns = 0;
                    }
                    player.thorns += (card.thorns * ability.stacks);
                    this.emit('passiveThornsApplied', { amount: player.thorns });
                    break;
                case 'perma_shield':
                    if (!player.shield) {
                        player.shield = 0;
                    }
                    player.shield += (card.shield * ability.stacks);
                    this.emit('passiveShieldApplied', { amount: player.shield });
                    break;
                case 'perma_rage':
                    if (!player.strength) {
                        player.strength = 0;
                    }
                    player.strength += (card.rage * ability.stacks);
                    this.emit('passiveStrengthApplied', { amount: player.strength });
                    break;
                case 'perma_wisdom':
                    // 智慧效果：所有卡牌消耗-1
                    this.emit('passiveWisdomApplied', { costReduction: ability.stacks });
                    break;
                case 'perma_immortal':
                    if (player.health < player.maxHealth * 0.2) {
                        const healAmount = player.maxHealth * 0.5 - player.health;
                        player.health += healAmount;
                        this.emit('passiveImmortalTriggered', { amount: healAmount });
                    }
                    break;
            }
        });
    }

    executeSpecialEffect(card, player, target) {
        switch (card.special) {
            case 'bash':
                // Bash: 伤害+易伤
                if (target) {
                    target.vulnerable = true;
                    this.emit('vulnerableApplied', { target: target.name });
                }
                break;
            case 'cleave':
                // Cleave: 范围伤害
                this.emit('cleaveDamage', { damage: card.damage });
                break;
            case 'iron_wave':
                // Iron Wave: 伤害+格挡
                if (target) {
                    const damageDealt = Math.max(0, card.damage - (target.block || 0));
                    target.block = Math.max(0, (target.block || 0) - card.damage);
                    target.health = Math.max(0, target.health - damageDealt);
                    player.block = (player.block || 0) + card.block;
                    this.emit('damageDealt', { attacker: player.name, target: target.name, damage: damageDealt });
                    this.emit('blockApplied', { target: player.name, amount: card.block });
                }
                break;
        }
    }

    endTurn() {
        if (this.state.currentPlayer !== '玩家') {
            return;
        }
        
        this.emit('turnEnded', { player: '玩家' });
        
        // 处理所有状态效果
        this.processStatusEffects();
        
        // 清空格挡
        this.state.player.block = 0;
        
        // 将手牌移到弃牌堆
        this.state.player.discard.push(...this.state.player.hand);
        this.state.player.hand = [];
        
        // 切换到敌人回合
        this.state.currentPlayer = '敌人';
        this.executeEnemyTurn();
    }

    processStatusEffects() {
        // 处理玩家的状态效果
        this.processPlayerStatusEffects();
        
        // 处理敌人的状态效果
        this.processEnemyStatusEffects();
    }

    processPlayerStatusEffects() {
        const player = this.state.player;
        
        // 燃烧效果
        if (player.burnStacks && player.burnStacks > 0) {
            const burnDamage = Math.max(0, player.burnStacks - (player.block || 0));
            player.block = Math.max(0, (player.block || 0) - player.burnStacks);
            player.health = Math.max(0, player.health - burnDamage);
            player.burnStacks = Math.max(0, player.burnStacks - 1);
            this.emit('burnDamage', { target: '玩家', damage: burnDamage, remainingStacks: player.burnStacks });
        }
        
        // 中毒效果
        if (player.poisonStacks && player.poisonStacks > 0) {
            const poisonDamage = player.poisonStacks;
            player.health = Math.max(0, player.health - poisonDamage);
            player.poisonStacks = Math.max(0, player.poisonStacks - 1);
            this.emit('poisonDamage', { target: '玩家', damage: poisonDamage, remainingStacks: player.poisonStacks });
        }
        
        // 雷电效果
        if (player.lightningStacks && player.lightningStacks > 0) {
            const lightningDamage = player.lightningStacks;
            player.health = Math.max(0, player.health - lightningDamage);
            player.lightningStacks = Math.max(0, player.lightningStacks - 1);
            this.emit('lightningDamage', { target: '玩家', damage: lightningDamage, remainingStacks: player.lightningStacks });
        }
        
        // 暗影效果
        if (player.shadowStacks && player.shadowStacks > 0) {
            const shadowDamage = player.shadowStacks;
            player.health = Math.max(0, player.health - shadowDamage);
            player.shadowStacks = Math.max(0, player.shadowStacks - 1);
            this.emit('shadowDamage', { target: '玩家', damage: shadowDamage, remainingStacks: player.shadowStacks });
        }
        
        // 流血效果
        if (player.bleedStacks && player.bleedStacks > 0) {
            const bleedDamage = player.bleedStacks;
            player.health = Math.max(0, player.health - bleedDamage);
            player.bleedStacks = Math.max(0, player.bleedStacks - 1);
            this.emit('bleedDamage', { target: '玩家', damage: bleedDamage, remainingStacks: player.bleedStacks });
        }
        
        // 灵魂效果
        if (player.soulStacks && player.soulStacks > 0) {
            const soulDamage = player.soulStacks;
            player.health = Math.max(0, player.health - soulDamage);
            player.soulStacks = Math.max(0, player.soulStacks - 1);
            this.emit('soulDamage', { target: '玩家', damage: soulDamage, remainingStacks: player.soulStacks });
        }
        
        // 噩梦效果
        if (player.nightmareStacks && player.nightmareStacks > 0) {
            const nightmareDamage = player.nightmareStacks * 2;
            player.health = Math.max(0, player.health - nightmareDamage);
            player.nightmareStacks = Math.max(0, player.nightmareStacks - 1);
            this.emit('nightmareDamage', { target: '玩家', damage: nightmareDamage, remainingStacks: player.nightmareStacks });
        }
        
        // 腐朽效果
        if (player.decayStacks && player.decayStacks > 0) {
            const maxHpReduction = Math.floor(player.maxHealth * 0.1 * player.decayStacks);
            player.maxHealth = Math.max(1, player.maxHealth - maxHpReduction);
            player.health = Math.min(player.health, player.maxHealth);
            player.decayStacks = Math.max(0, player.decayStacks - 1);
            this.emit('decayEffect', { target: '玩家', maxHpReduction, remainingStacks: player.decayStacks });
        }
    }

    processEnemyStatusEffects() {
        if (!this.state.enemy) return;
        
        const enemy = this.state.enemy;
        
        // 燃烧效果（护盾可以抵挡）
        if (enemy.burnStacks && enemy.burnStacks > 0) {
            const burnDamage = Math.max(0, enemy.burnStacks - (enemy.block || 0));
            enemy.block = Math.max(0, (enemy.block || 0) - enemy.burnStacks);
            enemy.health = Math.max(0, enemy.health - burnDamage);
            enemy.burnStacks = Math.max(0, enemy.burnStacks - 1);
            this.emit('burnDamage', { target: '敌人', damage: burnDamage, remainingStacks: enemy.burnStacks });
        }
        
        // 冰冻效果
        if (enemy.freezeStacks && enemy.freezeStacks > 0) {
            enemy.freezeStacks = Math.max(0, enemy.freezeStacks - 1);
            this.emit('freezeEffect', { target: '敌人', remainingStacks: enemy.freezeStacks });
        }
        
        // 中毒效果
        if (enemy.poisonStacks && enemy.poisonStacks > 0) {
            const poisonDamage = enemy.poisonStacks;
            enemy.health = Math.max(0, enemy.health - poisonDamage);
            enemy.poisonStacks = Math.max(0, enemy.poisonStacks - 1);
            this.emit('poisonDamage', { target: '敌人', damage: poisonDamage, remainingStacks: enemy.poisonStacks });
        }
        
        // 雷电效果
        if (enemy.lightningStacks && enemy.lightningStacks > 0) {
            const lightningDamage = enemy.lightningStacks;
            enemy.health = Math.max(0, enemy.health - lightningDamage);
            enemy.lightningStacks = Math.max(0, enemy.lightningStacks - 1);
            this.emit('lightningDamage', { target: '敌人', damage: lightningDamage, remainingStacks: enemy.lightningStacks });
        }
        
        // 暗影效果
        if (enemy.shadowStacks && enemy.shadowStacks > 0) {
            const shadowDamage = enemy.shadowStacks;
            enemy.health = Math.max(0, enemy.health - shadowDamage);
            enemy.shadowStacks = Math.max(0, enemy.shadowStacks - 1);
            this.emit('shadowDamage', { target: '敌人', damage: shadowDamage, remainingStacks: enemy.shadowStacks });
        }
        
        // 流血效果
        if (enemy.bleedStacks && enemy.bleedStacks > 0) {
            const bleedDamage = enemy.bleedStacks;
            enemy.health = Math.max(0, enemy.health - bleedDamage);
            enemy.bleedStacks = Math.max(0, enemy.bleedStacks - 1);
            this.emit('bleedDamage', { target: '敌人', damage: bleedDamage, remainingStacks: enemy.bleedStacks });
        }
        
        // 虚弱效果
        if (enemy.weakStacks && enemy.weakStacks > 0) {
            enemy.weakStacks = Math.max(0, enemy.weakStacks - 1);
            this.emit('weakEffect', { target: '敌人', remainingStacks: enemy.weakStacks });
        }
        
        // 易伤效果
        if (enemy.vulnerableStacks && enemy.vulnerableStacks > 0) {
            enemy.vulnerableStacks = Math.max(0, enemy.vulnerableStacks - 1);
            this.emit('vulnerableEffect', { target: '敌人', remainingStacks: enemy.vulnerableStacks });
        }
        
        // 沉默效果
        if (enemy.silenceStacks && enemy.silenceStacks > 0) {
            enemy.silenceStacks = Math.max(0, enemy.silenceStacks - 1);
            this.emit('silenceEffect', { target: '敌人', remainingStacks: enemy.silenceStacks });
        }
        
        // 混乱效果
        if (enemy.confusionStacks && enemy.confusionStacks > 0) {
            enemy.confusionStacks = Math.max(0, enemy.confusionStacks - 1);
            this.emit('confusionEffect', { target: '敌人', remainingStacks: enemy.confusionStacks });
        }
        
        // 恐惧效果
        if (enemy.fearStacks && enemy.fearStacks > 0) {
            enemy.fearStacks = Math.max(0, enemy.fearStacks - 1);
            this.emit('fearEffect', { target: '敌人', remainingStacks: enemy.fearStacks });
        }
        
        // 束缚效果
        if (enemy.bindStacks && enemy.bindStacks > 0) {
            enemy.bindStacks = Math.max(0, enemy.bindStacks - 1);
            this.emit('bindEffect', { target: '敌人', remainingStacks: enemy.bindStacks });
        }
        
        // 腐朽效果
        if (enemy.decayStacks && enemy.decayStacks > 0) {
            const maxHpReduction = Math.floor(enemy.maxHealth * 0.1 * enemy.decayStacks);
            enemy.maxHealth = Math.max(1, enemy.maxHealth - maxHpReduction);
            enemy.health = Math.min(enemy.health, enemy.maxHealth);
            enemy.decayStacks = Math.max(0, enemy.decayStacks - 1);
            this.emit('decayEffect', { target: '敌人', maxHpReduction, remainingStacks: enemy.decayStacks });
        }
        
        // 时间效果
        if (enemy.timeStacks && enemy.timeStacks > 0) {
            enemy.timeStacks = Math.max(0, enemy.timeStacks - 1);
            this.emit('timeEffect', { target: '敌人', remainingStacks: enemy.timeStacks });
        }
        
        // 灵魂效果
        if (enemy.soulStacks && enemy.soulStacks > 0) {
            const soulDamage = enemy.soulStacks;
            enemy.health = Math.max(0, enemy.health - soulDamage);
            enemy.soulStacks = Math.max(0, enemy.soulStacks - 1);
            this.emit('soulDamage', { target: '敌人', damage: soulDamage, remainingStacks: enemy.soulStacks });
        }
        
        // 噩梦效果
        if (enemy.nightmareStacks && enemy.nightmareStacks > 0) {
            const nightmareDamage = enemy.nightmareStacks * 2;
            enemy.health = Math.max(0, enemy.health - nightmareDamage);
            enemy.nightmareStacks = Math.max(0, enemy.nightmareStacks - 1);
            this.emit('nightmareDamage', { target: '敌人', damage: nightmareDamage, remainingStacks: enemy.nightmareStacks });
        }
        
        // 神圣效果
        if (enemy.holyStacks && enemy.holyStacks > 0) {
            enemy.holyStacks = Math.max(0, enemy.holyStacks - 1);
            this.emit('holyEffect', { target: '敌人', remainingStacks: enemy.holyStacks });
        }
        
        // 酸蚀效果
        if (enemy.acidStacks && enemy.acidStacks > 0) {
            enemy.acidStacks = Math.max(0, enemy.acidStacks - 1);
            this.emit('acidEffect', { target: '敌人', remainingStacks: enemy.acidStacks });
        }
        
        // 心灵效果
        if (enemy.psychicStacks && enemy.psychicStacks > 0) {
            enemy.psychicStacks = Math.max(0, enemy.psychicStacks - 1);
            this.emit('psychicEffect', { target: '敌人', remainingStacks: enemy.psychicStacks });
        }
        
        // 黑暗效果
        if (enemy.darkStacks && enemy.darkStacks > 0) {
            const darkDamage = enemy.darkStacks;
            enemy.health = Math.max(0, enemy.health - darkDamage);
            enemy.darkStacks = Math.max(0, enemy.darkStacks - 1);
            this.emit('darkDamage', { target: '敌人', damage: darkDamage, remainingStacks: enemy.darkStacks });
        }
    }

    executeEnemyTurn() {
        if (!this.state.enemy || this.state.enemy.health <= 0) {
            this.endEnemyTurn();
            return;
        }
        
        this.emit('enemyTurn', { action: this.state.enemy.intent });
        
        // 执行敌人行动
        switch (this.state.enemy.nextAction) {
            case 'attack':
                const damageDealt = Math.max(0, this.state.enemy.damage - (this.state.player.block || 0));
                this.state.player.block = Math.max(0, (this.state.player.block || 0) - this.state.enemy.damage);
                this.state.player.health = Math.max(0, this.state.player.health - damageDealt);
                this.emit('damageDealt', { attacker: '敌人', target: '玩家', damage: damageDealt });
                break;
            case 'defend':
                this.state.enemy.block = (this.state.enemy.block || 0) + 5;
                this.emit('blockApplied', { target: '敌人', amount: 5 });
                break;
        }
        
        this.endEnemyTurn();
    }

    endEnemyTurn() {
        // 清空敌人格挡
        if (this.state.enemy) {
            this.state.enemy.block = 0;
        }
        
        // 检查游戏结束
        if (this.state.player.health <= 0) {
            this.endGame(false);
            return;
        }
        
        if (this.state.enemy && this.state.enemy.health <= 0) {
            this.enemyDefeated();
            return;
        }
        
        // 切换到玩家回合
        this.state.currentPlayer = '玩家';
        this.state.turnCount++;
        
        // 恢复能量
        this.state.player.energy = this.state.player.maxEnergy;
        
        // 应用被动能力
        this.applyPassiveAbilities(this.state.player);
        
        // 抽3张牌
        for (let i = 0; i < 3; i++) {
            this.drawCard();
        }
        
        // 设置敌人意图
        this.setEnemyIntent();
        
        this.emit('turnStarted', { player: '玩家' });
    }

    setEnemyIntent() {
        if (!this.state.enemy) return;
        
        // 简单的AI：70%概率攻击，30%概率防御
        this.state.enemy.nextAction = Math.random() < 0.7 ? 'attack' : 'defend';
        this.state.enemy.intent = this.state.enemy.nextAction === 'attack' 
            ? `准备攻击 ${this.state.enemy.damage}` 
            : '准备防御';
    }

    enemyDefeated() {
        this.state.score += 100;
        this.emit('enemyDefeated', { enemy: this.state.enemy });
        
        // 检查是否进入下一层
        this.state.floor++;
        
        if (this.state.floor > 10) {
            this.endGame(true);
            return;
        }
        
        // 恢复一些生命值
        const healAmount = Math.floor(this.state.player.maxHealth * 0.3);
        this.state.player.health = Math.min(this.state.player.maxHealth, this.state.player.health + healAmount);
        this.emit('healingApplied', { target: '玩家', amount: healAmount });
        
        // 每层完成获得新卡牌
        this.rewardCardForFloor();
        
        // 重置抽牌堆
        this.state.player.discard.push(...this.state.player.hand);
        this.state.player.hand = [];
        this.prepareDrawPile();
        this.drawInitialHand();
        
        // 生成下一关的敌人
        this.spawnEnemy();
        
        this.emit('floorChanged', { floor: this.state.floor });
    }

    rewardCardForFloor() {
        // 根据楼层奖励不同类型的卡牌
        const cardRewards = this.getCardRewardsForFloor(this.state.floor);
        const selectedReward = cardRewards[Math.floor(Math.random() * cardRewards.length)];
        
        if (selectedReward) {
            // 将奖励卡牌加入牌组
            this.state.player.deck.push(selectedReward);
            this.emit('cardReward', { card: selectedReward, floor: this.state.floor });
        }
    }

    getCardRewardsForFloor(floor) {
        // 根据楼层返回不同的卡牌奖励池
        const rewardPools = {
            1: ['defend', 'strike', 'bash', 'cleave', 'iron_wave'],
            2: ['defend', 'strike', 'cold_snap', 'dual_wield', 'flame_barrier'],
            3: ['defend', 'strike', 'ghostly_armor', 'hemokinesis', 'infernal_blade'],
            4: ['defend', 'strike', 'intimidate', 'limit_break', 'metallicize'],
            5: ['defend', 'strike', 'pommel_strike', 'power_through', 'rage'],
            6: ['defend', 'strike', 'rampage', 'reaper', 'reckless_charge'],
            7: ['defend', 'strike', 'seeing_red', 'sever_soul', 'shrug_it_off'],
            8: ['defend', 'strike', 'sunder', 'sweeping_beam', 'tackle'],
            9: ['defend', 'strike', 'thunder_clap', 'twin_strike', 'upercut'],
            10: ['defend', 'strike', 'war_cry', 'whirlwind', 'immolate']
        };
        
        const pool = rewardPools[Math.min(floor, 10)] || rewardPools[10];
        return pool.map(cardId => this.cardManager.getCardById(cardId)).filter(card => card);
    }

    endGame(victory) {
        this.state.phase = 'gameOver';
        this.emit('gameOver', { winner: victory ? '玩家' : '敌人', score: this.state.score, floor: this.state.floor });
    }

    getGameState() {
        return { ...this.state };
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
}
