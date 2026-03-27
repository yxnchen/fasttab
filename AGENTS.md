# AGENTS.md

This file contains coding guidelines and build instructions for agentic coding assistants working on this repository.

## Project Overview

FastTab is a Chrome Extension (Manifest V3) for managing AI application shortcuts. Built with Vue 3 Composition API, Vite, and TypeScript.

## Build & Dev Commands

```bash
# Install dependencies
npm install

# Development server (runs Vite dev server)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

**Note**: This project currently has no testing framework or linting configured. When adding tests or linting, add corresponding npm scripts to package.json.

## Code Style Guidelines

### TypeScript & Types

- Use TypeScript with `.ts` and `.vue` files (`<script setup lang="ts">`)
- Type definitions are in `src/types/` (e.g., `group.ts`, `shortcut.ts`)
- Currently uses `any` types in many places - improve strictness when adding new code
- Use interfaces for data models exported from types directory
- Use `Partial<T>` for optional update parameters

### Component Structure

- Use Vue 3 Composition API with `<script setup lang="ts">`
- Place imports first, then component definitions, then logic
- Use `defineProps` with explicit type declarations when possible
- Use `defineEmits` with tuple syntax for event signatures
- Example:
  ```ts
  const emit = defineEmits<{
    close: []
    submit: [data: { name: string; columns: number }]
  }>()
  ```

### Imports

- Named imports from Vue: `import { ref, computed } from 'vue'`
- Local imports with relative paths: `import type { Shortcut } from '../types/shortcut'`
- Composables imported from `src/composables/`
- Type imports with `type` keyword: `import type { Group } from '../types/group'`

### State Management

- Use `ref()` for reactive primitives and `reactive()` for objects
- Use `computed()` for derived state
- Use `provide()` and `inject()` for cross-component state sharing
- Async operations use async/await, return Promises
- Example composable pattern:
  ```ts
  export function useGroups() {
    const groups = ref<{ [key: string]: any }>({})
    const loadGroups = async () => { ... }
    return { groups, loadGroups, ... }
  }
  ```

### Storage & Chrome Extensions

- Chrome extension storage is wrapped in `src/composables/useStorage.ts`
- All storage operations are async and return Promises
- Use `chrome.storage.local.get()` and `chrome.storage.local.set()`
- Storage key is `'fasttab_data'`

### CSS & Styling

- Plain CSS with scoped styles in `<style scoped>` blocks
- CSS custom properties defined in `src/styles/variables.css`
- Use CSS variables for colors, spacing, shadows: `var(--bg-color)`, `var(--primary-color)`
- Key variables: `--bg-color`, `--card-bg`, `--text-color`, `--primary-color`, `--danger-color`, `--shadow`
- No CSS framework - use Flexbox and Grid for layouts
- Transitions: `transition: all 0.2s ease` for smooth interactions

### File Naming

- Components: PascalCase (e.g., `ShortcutGroup.vue`, `AddShortcut.vue`)
- Composables: camelCase with `use` prefix (e.g., `useGroups.ts`, `useFavicon.ts`, `useStorage.ts`)
- Types: lowercased singular nouns (e.g., `group.ts`, `shortcut.ts`)
- CSS files: lowercases (e.g., `variables.css`)

### Error Handling

- Try-catch blocks for operations that may fail
- Use `console.error()` for error logging
- graceful fallbacks where possible (e.g., fallback favicon on image error)
- Example:
  ```ts
  try {
    await navigator.clipboard.writeText(url)
  } catch (err) {
    console.error('Failed to copy:', err)
    // Fallback logic
  }
  ```

### Event Handlers

- Prefix with `handle` for standard handlers (e.g., `handleEdit`, `handleDelete`)
- Use `@click.stop` to prevent event bubbling when needed
- Emit events with descriptive names matching the action

### Naming Conventions

- Functions: camelCase with descriptive verbs (`getFaviconUrl`, `validateUrl`)
- Variables: camelCase (`groupList`, `showCreateGroup`)
- Constants: UPPER_SNAKE_CASE (`STORAGE_KEY`, `DEFAULT_DATA`)
- Component props: lowercase names in kebab-case in templates, camelCase in script
- CSS classes: kebab-case (`shortcut-item`, `group-header`)

### Comments

- Use Chinese comments (existing codebase convention in App.vue)
- Keep comments minimal - code should be self-documenting
- Only add comments explaining complex business logic

## Project Structure

```
src/
├── components/       # Vue components
├── composables/      # Reusable composition functions
├── types/           # TypeScript interfaces
└── styles/          # Global CSS variables
```

## Chrome Extension Notes

- Manifest V3 compatible
- Build outputs to `dist/` directory
- Load unpacked in Chrome via `chrome://extensions -> Load unpacked`
- Extension entry point is `index.html`
- Manifest configuration in `manifest.json`
