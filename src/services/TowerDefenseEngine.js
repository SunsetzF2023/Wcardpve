/**
 * Tower Defense Engine - 塔防游戏引擎
 */
export class TowerDefenseEngine {
    constructor() {
        this.state = {
            phase: 'waiting',
            wave: 1,
            maxWaves: 10,
            health: 100,
            gold: 200,
            score: 0,
            towers: [],
            enemies: [],
            projectiles: [],
            slots: Array(12).fill(null), // 12个塔位
            isPaused: false,
            isGameOver: false
        };
        
        this.listeners = new Map();
        this.cardManager = null;
        this.gameLoop = null;
        this.enemySpawnTimer = null;
    }

    initialize(cardManager) {
        this.cardManager = cardManager;
        this.setupGameLoop();
        this.emit('initialized', {});
    }

    startGame() {
        this.state.phase = 'playing';
        this.state.wave = 1;
        this.startWave();
        this.emit('gameStarted', { state: this.state });
    }

    startWave() {
        this.emit('waveStarted', { wave: this.state.wave });
        
        // 根据波次生成敌人
        const enemyCount = 3 + this.state.wave * 2;
        const spawnDelay = Math.max(1000, 3000 - this.state.wave * 200);
        
        let spawnedEnemies = 0;
        this.enemySpawnTimer = setInterval(() => {
            if (spawnedEnemies < enemyCount) {
                this.spawnEnemy();
                spawnedEnemies++;
            } else {
                clearInterval(this.enemySpawnTimer);
            }
        }, spawnDelay);
    }

    spawnEnemy() {
        const enemy = {
            id: Date.now() + Math.random(),
            x: -30,
            y: 150 + Math.random() * 200,
            health: 50 + this.state.wave * 10,
            maxHealth: 50 + this.state.wave * 10,
            speed: 1 + this.state.wave * 0.1,
            damage: 10 + this.state.wave * 2,
            isBoss: this.state.wave % 5 === 0, // 每5波一个Boss
            pathIndex: 0,
            lastMoveTime: Date.now()
        };

        if (enemy.isBoss) {
            enemy.health *= 3;
            enemy.maxHealth *= 3;
            enemy.damage *= 2;
        }

        this.state.enemies.push(enemy);
        this.emit('enemySpawned', { enemy });
    }

    placeTower(slotIndex, card) {
        if (this.state.gold < card.cost) {
            this.emit('insufficientGold', { required: card.cost, current: this.state.gold });
            return false;
        }

        if (this.state.slots[slotIndex] !== null) {
            this.emit('slotOccupied', { slotIndex });
            return false;
        }

        const tower = {
            id: Date.now(),
            slotIndex,
            card,
            level: 1,
            lastShotTime: 0,
            x: this.getSlotPosition(slotIndex).x,
            y: this.getSlotPosition(slotIndex).y,
            damage: card.baseEffect.damage || 10,
            range: 150,
            fireRate: 1000 // 毫秒
        };

        this.state.slots[slotIndex] = tower;
        this.state.towers.push(tower);
        this.state.gold -= card.cost;

        this.emit('towerPlaced', { slotIndex, card, tower });
        return true;
    }

    getSlotPosition(slotIndex) {
        const positions = [
            { x: 150, y: 100 }, { x: 300, y: 100 }, { x: 450, y: 100 },
            { x: 150, y: 200 }, { x: 300, y: 200 }, { x: 450, y: 200 },
            { x: 150, y: 300 }, { x: 300, y: 300 }, { x: 450, y: 300 },
            { x: 225, y: 150 }, { x: 375, y: 150 }, { x: 225, y: 250 }, { x: 375, y: 250 }
        ];
        return positions[slotIndex] || { x: 0, y: 0 };
    }

    setupGameLoop() {
        const gameLoop = () => {
            if (this.state.isPaused || this.state.isGameOver) return;

            this.updateEnemies();
            this.updateTowers();
            this.updateProjectiles();
            this.checkWaveComplete();
            this.checkGameOver();
        };

        this.gameLoop = setInterval(gameLoop, 1000 / 60); // 60 FPS
    }

    updateEnemies() {
        const currentTime = Date.now();
        const deltaTime = currentTime - (this.lastUpdateTime || currentTime);
        this.lastUpdateTime = currentTime;

        this.state.enemies = this.state.enemies.filter(enemy => {
            // 沿路径移动
            this.moveEnemyAlongPath(enemy, deltaTime);
            
            // 检查是否到达终点
            if (enemy.x >= 600) {
                this.state.health -= enemy.damage;
                this.emit('enemyReachedEnd', { enemy });
                return false;
            }
            
            // 检查是否死亡
            if (enemy.health <= 0) {
                this.state.gold += enemy.isBoss ? 50 : 10;
                this.state.score += enemy.isBoss ? 100 : 10;
                this.emit('enemyKilled', { enemyId: enemy.id, gold: enemy.isBoss ? 50 : 10 });
                return false;
            }
            
            return true;
        });
    }

    moveEnemyAlongPath(enemy, deltaTime) {
        const speed = enemy.speed * deltaTime / 1000;
        enemy.x += speed;
        
        // 简单的路径移动逻辑
        const pathPoints = [
            { x: 100, y: 150 },
            { x: 100, y: 250 },
            { x: 200, y: 250 },
            { x: 200, y: 350 },
            { x: 300, y: 350 },
            { x: 300, y: 250 },
            { x: 400, y: 250 },
            { x: 400, y: 150 },
            { x: 500, y: 150 },
            { x: 500, y: 250 },
            { x: 600, y: 250 },
            { x: 600, y: 150 }
        ];

        // 根据x坐标计算y坐标
        for (let i = 0; i < pathPoints.length - 1; i++) {
            if (enemy.x >= pathPoints[i].x && enemy.x <= pathPoints[i + 1].x) {
                const progress = (enemy.x - pathPoints[i].x) / (pathPoints[i + 1].x - pathPoints[i].x);
                enemy.y = pathPoints[i].y + (pathPoints[i + 1].y - pathPoints[i].y) * progress;
                break;
            }
        }
    }

    updateTowers() {
        const currentTime = Date.now();
        
        this.state.towers.forEach(tower => {
            // 寻找范围内的敌人
            const enemiesInRange = this.state.enemies.filter(enemy => {
                const distance = Math.sqrt(
                    Math.pow(enemy.x - tower.x, 2) + 
                    Math.pow(enemy.y - tower.y, 2)
                );
                return distance <= tower.range;
            });

            if (enemiesInRange.length > 0) {
                // 攻击最近的敌人
                const target = enemiesInRange[0]; // 简化：攻击第一个
                
                if (currentTime - tower.lastShotTime >= tower.fireRate) {
                    this.shootProjectile(tower, target);
                    tower.lastShotTime = currentTime;
                }
            }
        });
    }

    shootProjectile(tower, target) {
        const projectile = {
            id: Date.now() + Math.random(),
            x: tower.x,
            y: tower.y,
            targetX: target.x,
            targetY: target.y,
            damage: tower.damage * tower.level,
            speed: 5,
            towerId: tower.id,
            targetId: target.id
        };

        this.state.projectiles.push(projectile);
        this.emit('projectileFired', { projectile, tower, target });
    }

    updateProjectiles() {
        this.state.projectiles = this.state.projectiles.filter(projectile => {
            // 移动投射物
            const dx = projectile.targetX - projectile.x;
            const dy = projectile.targetY - projectile.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < projectile.speed) {
                // 命中目标
                this.hitTarget(projectile);
                return false;
            }
            
            // 向目标移动
            projectile.x += (dx / distance) * projectile.speed;
            projectile.y += (dy / distance) * projectile.speed;
            
            return true;
        });
    }

    hitTarget(projectile) {
        const enemy = this.state.enemies.find(e => e.id === projectile.targetId);
        if (enemy) {
            enemy.health -= projectile.damage;
            this.emit('damageDealt', { 
                x: enemy.x, 
                y: enemy.y, 
                damage: projectile.damage,
                enemy 
            });
        }
    }

    checkWaveComplete() {
        if (this.state.enemies.length === 0 && !this.enemySpawnTimer) {
            this.state.wave++;
            
            if (this.state.wave > this.state.maxWaves) {
                this.endGame(true); // 胜利
            } else {
                // 波次奖励
                this.state.gold += 50 + this.state.wave * 10;
                this.emit('waveComplete', { wave: this.state.wave - 1, bonus: 50 + this.state.wave * 10 });
                
                // 延迟开始下一波
                setTimeout(() => this.startWave(), 3000);
            }
        }
    }

    checkGameOver() {
        if (this.state.health <= 0) {
            this.endGame(false); // 失败
        }
    }

    endGame(victory) {
        this.state.isGameOver = true;
        this.state.phase = 'gameOver';
        
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
        }
        if (this.enemySpawnTimer) {
            clearInterval(this.enemySpawnTimer);
        }
        
        this.emit('gameOver', { victory, score: this.state.score, wave: this.state.wave });
    }

    pauseGame() {
        this.state.isPaused = true;
        this.emit('gamePaused', {});
    }

    resumeGame() {
        this.state.isPaused = false;
        this.emit('gameResumed', {});
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
