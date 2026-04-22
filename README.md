# Card Battle Arena - Strategic Card Game

A modern, component-based strategic card battle game built with vanilla JavaScript ES6+ modules.

## 🎮 Game Features

- **Component-Based Architecture**: Modular design with separate components for each game element
- **Strategic Gameplay**: Turn-based combat with custom card abilities
- **AI Opponent**: Intelligent AI with multiple difficulty levels
- **Modern UI**: Responsive design with smooth animations
- **Progressive Web App**: PWA capabilities with offline support
- **GitHub Pages Ready**: Optimized for static deployment

## 🏗️ Architecture

This project uses a modern, modular architecture:

```
src/
├── components/          # UI Components
│   ├── GameBoard.js     # Main game board
│   ├── Card.js          # Individual card component
│   ├── PlayerHand.js    # Player hand display
│   └── BattleField.js   # Battle field area
├── services/           # Business Logic
│   ├── GameEngine.js   # Core game engine
│   ├── CardManager.js  # Card management
│   └── AIService.js    # AI logic
├── utils/              # Utilities
│   ├── StorageManager.js
│   └── DOMUtils.js
└── styles/             # CSS
    ├── base.css
    └── components.css
```

## 🚀 Quick Start

### Play Online
Visit the GitHub Pages site to play immediately.

### Local Development
```bash
# Clone the repository
git clone https://github.com/SunsetzF2023/Wcardpve.git
cd Wcardpve

# Use any static server
npx serve .
# or
python -m http.server 8000
```

### Development with Live Reload
```bash
# Install live-server
npm install -g live-server

# Start development server
live-server --port=8000
```

## 🎯 How to Play

### Basic Rules
- Each player starts with 30 health and 7 cards
- Players take turns playing cards that cost 1 energy
- Reduce opponent's health to 0 to win

### Card Types
- **Attack Cards**: Deal damage to opponents
- **Defense Cards**: Provide armor protection
- **Heal Cards**: Restore health points
- **Special Cards**: Unique effects and abilities

### Controls
- **Mouse**: Click cards to play, buttons for actions
- **Keyboard**: 
  - `Space` - End turn
  - `D` - Draw card
  - `R` - Restart game
  - `ESC` - Pause/Resume

## 🔧 Customization

### Adding New Cards
Edit `src/data/cards.json`:

```json
{
  "id": "custom_card",
  "suit": "spades",
  "rank": "A",
  "text": "Custom ability description",
  "type": "attack",
  "power": 3,
  "rarity": "rare"
}
```

### Modifying AI Difficulty
```javascript
// In GameEngine.js
gameEngine.setConfig('aiDifficulty', 'hard'); // easy, normal, hard
```

### Component Customization
Each component is self-contained and can be modified independently:

```javascript
// Example: Modify GameBoard
import { GameBoard } from './src/components/GameBoard.js';

const board = new GameBoard(container);
board.on('action', handleAction);
```

## 🛠️ Technical Stack

- **Frontend**: Vanilla JavaScript ES6+ (no frameworks)
- **Styling**: Modern CSS with animations
- **Build**: No build tools required (direct browser execution)
- **Deployment**: GitHub Pages (static hosting)
- **Storage**: LocalStorage for game saves

## 📱 Browser Support

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes to the relevant components
4. Test thoroughly
5. Submit a pull request

### Code Standards
- Use ES6+ modules
- Follow existing naming conventions
- Add JSDoc comments for functions
- Test across browsers

## 🐛 Debugging

Open browser console and use the global debug object:

```javascript
// Access game instances
window.gameApp.gameEngine
window.gameApp.gameBoard

// Get game state
window.gameApp.gameEngine.getGameState()

// Modify settings
window.gameApp.gameEngine.setConfig('aiDifficulty', 'hard')
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Modern JavaScript patterns and best practices
- Component-based architecture inspiration
- GitHub Pages for hosting

---

**Enjoy the strategic card battles!** ⚔️✨
