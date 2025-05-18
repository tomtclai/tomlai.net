# Tom Lai's Website

Personal website built with Jekyll and GitHub Pages.

## Run Locally

Install Ruby 3.2.2 and Bundler

Install dependencies:
```bash
bundle install
npm install  # For test dependencies
```

Run server:
```bash
bundle exec jekyll serve
```

Visit `http://localhost:4000`

## Testing

The project uses Jest for testing JavaScript components. Tests are located in `assets/js/*.test.js` files.

Run tests:
```bash
npm test
```

Run tests in watch mode (automatically re-run on file changes):
```bash
npm run test:watch
```

### Test Coverage

- Game initialization and DOM elements
- Game logic (tile toggling, win conditions)
- Score management and persistence
- UI interactions (close button, grid clicks)
- Grid position calculations