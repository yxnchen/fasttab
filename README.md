# FastTab - Chrome Extension

A fast, clean new tab page for quick access to AI applications.

## Features

- **Minimal Design**: Pure color background, no search bar or unnecessary components
- **Quick Access**: Display 20-30 shortcuts on a single page
- **Auto Favicon**: Automatically fetch favicon using Google Favicon API
- **Group Management**: Organize shortcuts into groups with vertical layout
- **Resizable Groups**: Drag edges to adjust group layout
- **Fast Loading**: Lightweight Vue 3 + Vite stack for instant page loads

## Tech Stack

- Vue 3 (Composition API)
- Vite
- Chrome Extension Manifest V3
- Plain CSS for styling

## Development

Install dependencies:
```bash
npm install
```

Run development server:
```bash
npm run dev
```

Build for production:
```bash
npm run build
```

## Usage

1. Load the unpacked extension in Chrome (chrome://extensions -> Load unpacked)
2. The first time you open a new tab, it will initialize with sample AI applications
3. Create groups and add shortcuts as needed
4. Drag the right edge of any group to resize

## License

MIT
