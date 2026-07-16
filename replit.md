# HeroForge — RPG Self-Improvement Tracker

## Overview
A Korean-language RPG-style self-improvement web app. Users track real-life goals (study, exercise, etc.) as quests and earn XP, levels, and stat points — gamifying personal growth.

## Stack
- **React 18** + **Zustand** + **Framer Motion** — all loaded via CDN (esm.sh / unpkg)
- **Tailwind CSS v4** — loaded via CDN
- **Babel Standalone** — compiles JSX in the browser at runtime
- **canvas-confetti** — level-up celebration effects
- **Pure frontend / no backend** — all data stored in browser `localStorage`

## Entry Points
- `index.html` — the app shell; loads Tailwind, Babel, fonts, and `app.jsx`
- `app.jsx` — all React components and Zustand store in one file

## How to Run
Served as a static site:
```
npx serve -s . -p 5000
```
The workflow "Start app" handles this automatically.

## User Preferences
- Keep the existing file structure and Korean UI text.
