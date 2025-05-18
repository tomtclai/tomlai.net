# Tile Puzzle Game Tests

This directory contains the tile puzzle game implementation and its test suite.

## Running Tests

### Prerequisites

- Node.js (v14 or higher)
- npm (comes with Node.js)

### Setup

From the root directory of the project:

```bash
npm install
```

This installs:
- Jest (testing framework)
- Jest JSDOM (browser environment simulation)
- Babel (JavaScript transpiler)

### Test Commands

Run tests once:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## Test Coverage

The test suite (`game.test.js`) covers:

- **Game Initialization**
  - Grid size verification
  - Initial state setup
  - DOM element creation

- **Game Logic**
  - Tile toggling mechanics
  - Adjacent tile updates
  - Move counter incrementation
  - Win condition detection

- **Score Management**
  - Best score updates
  - localStorage persistence
  - Score comparison logic

- **Game Reset**
  - New game state reset
  - UI element updates

- **Grid Calculations**
  - Click-to-grid position conversion
  - Out-of-bounds click handling

## File Structure

```
.
├── game.js         # Game implementation
├── game.test.js    # Test suite
└── README.md       # This file
```

## Adding Tests

1. All tests should be added to `game.test.js`
2. Follow the existing describe/test structure
3. Group related tests using `describe` blocks
4. Use clear, descriptive test names
5. Include setup and teardown in `beforeEach`/`afterEach` when needed

Example:
```javascript
describe('Feature Name', () => {
    test('should do specific thing', () => {
        // Arrange
        const expectedResult = ...;
        
        // Act
        const result = ...;
        
        // Assert
        expect(result).toBe(expectedResult);
    });
});
``` 