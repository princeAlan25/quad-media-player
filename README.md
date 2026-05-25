# Quad-MediaPlayer

> A universal media hub for **audio, video, images, and an AI agent** — one app, four ways to consume your content. 

<p>
  <img alt="React" src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white">
  <img alt="Vite" src="https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white">
  <img alt="TailwindCSS" src="https://img.shields.io/badge/Tailwind-4-38BDF8?logo=tailwindcss&logoColor=white">
  <img alt="Express" src="https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white">
  <img alt="License" src="https://img.shields.io/badge/license-MIT-green">
</p>

---

## Live Demos

| Version | Stack | Link |
| --- | --- | --- |
| **Modern (React + AI)** | React 19, Vite, TypeScript, TailwindCSS, Express backend | [quad-media-player.vercel.app](https://quad-media-player.vercel.app/) |
| **Legacy (Vanilla)** | HTML, CSS, plain JavaScript | [quad-media-player.netlify.app](https://quad-media-player.netlify.app/) |

<a href="https://quad-media-player.vercel.app/">
  <kbd>
    <img src="assets/app screenshoot.png" alt="Quad-MediaPlayer modern UI" width="640">
  </kbd>
</a>

---

## Features

- **Audio Player** — playlist, progress bar, volume, repeat modes, now-playing display.
- **Video Player** — custom controls, responsive layout, metadata display.
- **Image Gallery** — upload, browse, and view local image collections.
- **AI Agent** — chat assistant that can search your local media library (RAG), query Jamendo for music, and search YouTube for videos via a backend MCP integration.
- **Gesture Control** — hand-tracking via MediaPipe + TensorFlow.js for touchless interaction.
- **Feature-Sliced Design (FSD)** — a clean, scalable frontend architecture.

---

## Repository Structure

This is a monorepo with two packages plus a legacy single-file branch:

```
quad-media-player/
├── agentic-gallery/      # Modern frontend (React 19 + Vite + TS)
│   ├── src/
│   │   ├── app/          # App shell, routing, global layout
│   │   ├── pages/        # audio, video, image, agent
│   │   ├── widgets/      # Composed UI blocks (audio-player, video-player, …)
│   │   ├── features/     # User-facing capabilities (e.g. useAudioPlayer)
│   │   ├── entities/     # Domain models (media library)
│   │   └── shared/       # Types, API client, styles, utilities
│   └── Dockerfile
├── backend/              # Express 5 + TypeScript API
│   └── src/
│       ├── presentation/ # HTTP routers (AI, media)
│       ├── application/  # Service layer (AiService, MediaLibraryService)
│       ├── domain/       # Catalog, search, types
│       ├── infrastructure/ # Persistence, paths, config
│       ├── mcp/          # MCP client + tool descriptions
│       └── middleware/   # API key auth, rate limiting
└── assets/               # Screenshots, marketing images
```

The legacy vanilla version lives on a separate branch and is deployed independently to Netlify.

---

## Quick Start

### Prerequisites

- **Node.js** 20.10 LTS or later
- **npm** 10.x or later
- Git

### 1. Clone

```bash
git clone https://github.com/princeAlan25/quad-media-player.git
cd quad-media-player
```

### 2. Frontend

```bash
cd agentic-gallery
cp .env.example .env       # adjust if your backend runs elsewhere
npm install
npm run dev                # http://localhost:5173
```

### 3. Backend (optional — required for the AI Agent page)

```bash
cd backend
cp .env.example .env       # set ALLOWED_ORIGINS, PORT, etc.
npm install
npm run dev                # http://localhost:7000
```

The frontend works standalone for audio, video, and image pages. The **Agent** page requires the backend to be running.

---

## Environment Variables

### Frontend ([agentic-gallery/.env.example](agentic-gallery/.env.example))

| Variable | Purpose | Default |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Base URL for the Express API | `http://localhost:4000` |
| `VITE_BACKEND_URL`  | Backend host for media + AI routes | `http://localhost:7000` |

### Backend ([backend/.env.example](backend/.env.example))

| Variable | Purpose | Default |
| --- | --- | --- |
| `NODE_ENV` | `development` or `production` | `development` |
| `PORT` | Server port | `7000` |
| `ALLOWED_ORIGINS` | Comma-separated CORS allowlist | `http://localhost:3000,http://localhost:5173` |
| `API_KEY` | Optional API key for protected endpoints | — |
| `RATE_LIMIT_MAX_REQUESTS` | Per-window request cap | `100` |

> Never commit `.env` files — they are gitignored.

---

## Available Scripts

### Frontend (`agentic-gallery/`)

| Script | What it does |
| --- | --- |
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Type-check (`tsc -b`) then build for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint across the project |

### Backend (`backend/`)

| Script | What it does |
| --- | --- |
| `npm run dev` | Start Express with `nodemon` (TS hot reload) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled server (`dist/server.js`) |

---

## Architecture Notes

The frontend follows **[Feature-Sliced Design](https://feature-sliced.design/)**:

```
shared  →  entities  →  features  →  widgets  →  pages  →  app
```

Lower layers never import from higher layers. This keeps domain logic decoupled from UI and makes refactors safe.

The backend uses a layered architecture (`presentation → application → domain → infrastructure`) and exposes:

- `/api/media/*` — local media catalog, search, document fetch
- `/api/ai/*` — chat completion and RAG-powered media queries via MCP

---

## Evolution

This repo uses a multi-branch strategy:

1. **Legacy (vanilla JS)** — original zero-dependency proof of concept, deployed to Netlify.
2. **Modern (React + AI)** — current `main`, deployed to Vercel, adds backend, gesture control, and AI agent.

The legacy branch is preserved as a reference for the original media-handling logic.

---

## Contributing

1. Fork the repo and create a branch off `main`.
2. Make your changes — follow existing FSD layering on the frontend.
3. Run `npm run lint` (frontend) before pushing.
4. Open a PR with a clear description of the change. 

---

## License

[MIT](LICENSE) © 2026 princeAlan25
