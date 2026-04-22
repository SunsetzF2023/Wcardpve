# Modern Architecture Design

## Component-Based Structure

```
Wcardpve/
├── src/
│   ├── components/
│   │   ├── GameBoard.js
│   │   ├── PlayerHand.js
│   │   ├── Card.js
│   │   ├── BattleField.js
│   │   └── GameControls.js
│   ├── services/
│   │   ├── GameEngine.js
│   │   ├── CardManager.js
│   │   ├── PlayerManager.js
│   │   └── AIService.js
│   ├── utils/
│   │   ├── DOMUtils.js
│   │   ├── AnimationUtils.js
│   │   └── StorageUtils.js
│   ├── data/
│   │   ├── cards.json
│   │   └── gameConfig.json
│   └── styles/
│       ├── components/
│       ├── base.css
│       └── themes/
├── public/
│   └── index.html (minimal)
├── docs/
│   └── README.md (English)
└── tests/
    └── unit/
```

## Build Tools Integration
- Vite for development and building
- ESLint for code quality
- Prettier for formatting
- GitHub Pages for deployment

## Modular Benefits
- Each component is independent
- Easy to test and debug
- Scalable architecture
- Clear separation of concerns
