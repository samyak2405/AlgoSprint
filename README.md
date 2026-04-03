# AlgoSprint - Master DSA Fast

A decision-driven, interactive revision website for **Data Structures**, **Algorithms**, **Problem-Solving Patterns**, and **Math for DSA/interviews**.

Built with React + Vite and designed for quick, high-impact revision with Java snippets, guided variant trees, and interactive visualizations.

## Highlights

- Decision-tree based learning flow for DSA/Algorithms/Patterns/Maths
- Rich topic cards with:
  - when-to-use guidance
  - complexity tradeoffs
  - Java code snippets (syntax-highlighted)
  - curated Easy/Medium/Hard practice ladders
- Deep-dive variant trees for:
  - Binary Search
  - Sliding Window
  - Two Pointers
  - BFS/DFS Graph patterns
  - DP variations by state design
- Interactive modules (examples):
  - DP walkthroughs
  - PriorityQueue/Heap visualizer with animation and operation trace
- Light/Dark theme support
- Keyboard/navigation UX improvements

## Tech Stack

- **Frontend:** React 18, Vite 5
- **Language:** JavaScript (JSX)
- **Styling:** Custom CSS
- **Deployment:** GitHub Pages (via GitHub Actions workflow)
- **Containerized local run:** Docker + Docker Compose

## Project Structure

```text
.
├── App.jsx
├── index.html
├── src/
│   ├── components/
│   ├── hooks/
│   ├── utils/
│   ├── data/
│   └── constants/
├── docker-compose.yml
├── Dockerfile
├── vite.config.js
└── .github/workflows/deploy.yml
```

## Run Locally with Docker (Recommended)

All `npm` activity runs inside Docker.

### Start

```bash
docker compose up --build -d
```

Open:

- [http://localhost:5173](http://localhost:5173)

### Stop

```bash
docker compose down
```

## Optional Non-Docker Run

If you want a direct local run:

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Build output is generated in `dist/`.

## Deployment (GitHub Pages)

This repository includes a workflow at `.github/workflows/deploy.yml` that:

1. Installs dependencies
2. Builds the app
3. Deploys `dist/` to GitHub Pages

### One-time setup

- In GitHub repo settings: **Settings -> Pages -> Source -> GitHub Actions**

### Important base-path note

In `vite.config.js`, ensure:

```js
base: "/<repo-name>/"
```

It must match your GitHub repository name exactly for project pages.

## Security and Git Hygiene

- Sensitive files and local state are excluded using `.gitignore`
- Environment files (`.env`, `.env.*`) and key/cert files are ignored
- Build artifacts, logs, editor files, and local tooling state are ignored

## Dependency Note

If `axios` is added, use:

```bash
npm install axios@1.14.0
```

or in Docker:

```bash
docker compose exec dsa-revision-web npm install axios@1.14.0
```

## License

This project is currently unlicensed for public reuse by default. Add a `LICENSE` file if you want to open-source it explicitly.
