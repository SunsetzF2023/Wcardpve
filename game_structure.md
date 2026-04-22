# 文字对战扑克牌游戏 - 项目结构设计

## 项目架构
```
Wcardpve/
├── index.html                 # 主页面
├── README.md                  # 项目说明
├── assets/                    # 静态资源
│   ├── css/                   # 样式文件
│   │   ├── main.css          # 主样式
│   │   └── card.css          # 卡牌样式
│   ├── js/                   # JavaScript文件
│   │   ├── main.js           # 主逻辑
│   │   ├── game.js           # 游戏逻辑
│   │   ├── card.js           # 卡牌逻辑
│   │   ├── player.js         # 玩家逻辑
│   │   └── ai.js             # AI逻辑
│   ├── images/               # 图片资源
│   │   ├── card-back.png     # 卡背
│   │   └── bg-pattern.png    # 背景图案
│   └── data/                 # 游戏数据
│       ├── cards.json        # 卡牌数据
│       └── abilities.json    # 技能数据
└── docs/                      # 文档
    ├── game-rules.md         # 游戏规则
    └── api-reference.md      # API参考
```

## 卡牌设计
- 2副扑克牌 = 104张
- 每张卡牌有自定义文字技能
- 花色和数字保持原样
- 右上角左下角显示原始信息

## 游戏机制
- 两人对战（玩家 vs AI）
- 开局各发7张牌
- 回合制出牌
- 基于扑克牌规则 + 自定义技能
