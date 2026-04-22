// 主入口文件
document.addEventListener('DOMContentLoaded', function() {
    // 检查是否加载了卡牌数据
    if (!window.CardsData) {
        console.error('卡牌数据未加载');
        return;
    }
    
    // 创建游戏实例
    let game = null;
    
    // 初始化游戏
    function initializeGame() {
        try {
            game = new Game();
            console.log('游戏初始化成功');
            
            // 添加键盘快捷键
            setupKeyboardShortcuts();
            
            // 添加触摸支持
            setupTouchSupport();
            
            // 设置自动保存
            setupAutoSave();
            
        } catch (error) {
            console.error('游戏初始化失败:', error);
            showError('游戏初始化失败，请刷新页面重试');
        }
    }
    
    // 设置键盘快捷键
    function setupKeyboardShortcuts() {
        document.addEventListener('keydown', function(event) {
            if (!game || game.gameState !== 'playing') return;
            
            switch (event.key) {
                case ' ':
                    event.preventDefault();
                    if (game.currentPlayer === game.humanPlayer) {
                        game.onEndTurn();
                    }
                    break;
                case 'd':
                case 'D':
                    if (game.currentPlayer === game.humanPlayer) {
                        game.onDrawCard();
                    }
                    break;
                case 'r':
                case 'R':
                    if (confirm('确定要重新开始游戏吗？')) {
                        game.restart();
                    }
                    break;
                case 'Escape':
                    if (game.gameState === 'playing') {
                        game.pause();
                    } else if (game.gameState === 'paused') {
                        game.resume();
                    }
                    break;
            }
        });
    }
    
    // 设置触摸支持
    function setupTouchSupport() {
        let touchStartX = 0;
        let touchStartY = 0;
        
        document.addEventListener('touchstart', function(event) {
            touchStartX = event.touches[0].clientX;
            touchStartY = event.touches[0].clientY;
        });
        
        document.addEventListener('touchend', function(event) {
            if (!game || game.gameState !== 'playing') return;
            
            const touchEndX = event.changedTouches[0].clientX;
            const touchEndY = event.changedTouches[0].clientY;
            
            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;
            
            // 检测滑动手势
            if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
                // 水平滑动
                if (deltaX > 0) {
                    // 向右滑动 - 抽牌
                    if (game.currentPlayer === game.humanPlayer) {
                        game.onDrawCard();
                    }
                } else {
                    // 向左滑动 - 结束回合
                    if (game.currentPlayer === game.humanPlayer) {
                        game.onEndTurn();
                    }
                }
            }
        });
    }
    
    // 设置自动保存
    function setupAutoSave() {
        // 每30秒自动保存游戏状态
        setInterval(function() {
            if (game && game.gameState === 'playing') {
                saveGameState();
            }
        }, 30000);
        
        // 页面关闭前保存
        window.addEventListener('beforeunload', function() {
            if (game && game.gameState === 'playing') {
                saveGameState();
            }
        });
    }
    
    // 保存游戏状态
    function saveGameState() {
        try {
            const gameState = {
                timestamp: Date.now(),
                playerStatus: game.humanPlayer.getStatus(),
                aiStatus: game.aiPlayer.getStatus(),
                round: game.round,
                currentPlayer: game.currentPlayer === game.humanPlayer ? 'player' : 'ai'
            };
            
            localStorage.setItem('wcardpve_save', JSON.stringify(gameState));
            console.log('游戏状态已保存');
        } catch (error) {
            console.error('保存游戏状态失败:', error);
        }
    }
    
    // 加载游戏状态
    function loadGameState() {
        try {
            const savedGame = localStorage.getItem('wcardpve_save');
            if (!savedGame) return false;
            
            const gameState = JSON.parse(savedGame);
            
            // 检查保存时间（超过24小时的保存不加载）
            const saveTime = gameState.timestamp || 0;
            const currentTime = Date.now();
            const maxAge = 24 * 60 * 60 * 1000; // 24小时
            
            if (currentTime - saveTime > maxAge) {
                localStorage.removeItem('wcardpve_save');
                return false;
            }
            
            // 询问用户是否要恢复游戏
            const shouldRestore = confirm(
                `发现上次的游戏存档（${new Date(saveTime).toLocaleString()}），\n是否要恢复游戏？`
            );
            
            if (shouldRestore) {
                restoreGameState(gameState);
                return true;
            } else {
                localStorage.removeItem('wcardpve_save');
                return false;
            }
            
        } catch (error) {
            console.error('加载游戏状态失败:', error);
            localStorage.removeItem('wcardpve_save');
            return false;
        }
    }
    
    // 恢复游戏状态
    function restoreGameState(gameState) {
        // 这里可以实现游戏状态恢复逻辑
        // 由于当前游戏架构的限制，这里只是示例
        console.log('恢复游戏状态:', gameState);
        
        // 可以在这里实现更复杂的状态恢复逻辑
        // 比如恢复玩家生命值、手牌、回合数等
    }
    
    // 显示错误信息
    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #ef4444;
            color: white;
            padding: 20px;
            border-radius: 8px;
            font-size: 16px;
            z-index: 10000;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
        `;
        errorDiv.textContent = message;
        
        document.body.appendChild(errorDiv);
        
        setTimeout(function() {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }
    
    // 显示提示信息
    function showTip(message) {
        const tipDiv = document.createElement('div');
        tipDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4ade80;
            color: white;
            padding: 15px;
            border-radius: 8px;
            font-size: 14px;
            z-index: 10000;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            max-width: 300px;
        `;
        tipDiv.textContent = message;
        
        document.body.appendChild(tipDiv);
        
        setTimeout(function() {
            if (tipDiv.parentNode) {
                tipDiv.parentNode.removeChild(tipDiv);
            }
        }, 3000);
    }
    
    // 添加全局函数供调试使用
    window.debugGame = {
        getGame: function() { return game; },
        getGameState: function() { return game ? game.getGameState() : null; },
        getStats: function() { return game ? game.getStats() : null; },
        setDifficulty: function(difficulty) { 
            if (game) game.setConfig('aiDifficulty', difficulty); 
        },
        clearSave: function() { localStorage.removeItem('wcardpve_save'); }
    };
    
    // 添加游戏帮助信息
    function showHelp() {
        const helpText = `
游戏快捷键：
空格键 - 结束回合
D键 - 抽牌
R键 - 重新开始
ESC键 - 暂停/恢复

触摸操作：
向右滑动 - 抽牌
向左滑动 - 结束回合

游戏规则：
• 每回合开始时获得3点能量
• 使用卡牌需要消耗1点能量
• 将对手生命值降至0获胜
• 注意合理使用攻击、防御和治疗卡牌
        `;
        
        alert(helpText);
    }
    
    // 添加帮助按钮
    function addHelpButton() {
        const helpBtn = document.createElement('button');
        helpBtn.textContent = '?';
        helpBtn.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: #3b82f6;
            color: white;
            border: none;
            font-size: 20px;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            z-index: 1000;
        `;
        
        helpBtn.addEventListener('click', showHelp);
        document.body.appendChild(helpBtn);
    }
    
    // 初始化
    function init() {
        // 尝试加载保存的游戏
        const restored = loadGameState();
        
        if (!restored) {
            // 没有恢复游戏，直接初始化新游戏
            initializeGame();
        }
        
        // 添加帮助按钮
        addHelpButton();
        
        // 显示欢迎信息
        setTimeout(function() {
            showTip('欢迎来到文字对战扑克牌！点击右下角的？查看帮助');
        }, 1000);
    }
    
    // 启动游戏
    init();
    
    // 性能监控
    if (window.performance && window.performance.memory) {
        setInterval(function() {
            const memory = window.performance.memory;
            if (memory.usedJSHeapSize > 50 * 1024 * 1024) { // 50MB
                console.warn('内存使用较高:', {
                    used: Math.round(memory.usedJSHeapSize / 1024 / 1024) + 'MB',
                    total: Math.round(memory.totalJSHeapSize / 1024 / 1024) + 'MB'
                });
            }
        }, 10000);
    }
});
