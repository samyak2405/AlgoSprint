<div align="center">

# AlgoSprint

### The All-in-One Technical Interview Preparation Suite

[![React](https://img.shields.io/badge/React_18/19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite_5-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com)
[![Tailwind](https://img.shields.io/badge/Tailwind_v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

**Master DSA · Design Patterns · System Design — all in one place.**

[DSA Revision](#-dsarevision--dsa--algorithms-hub) · [LLD Design](#-llddesign--low-level-design) · [System Design](#-systemdesign--system-design-simulator) · [Quick Start](#-quick-start) · [Docker Deploy](#-docker-deployment)

</div>

---

## What is AlgoSprint?

AlgoSprint is a **monorepo of three focused, interactive web applications** built to replace passive reading with active, high-retention interview prep. Each app targets a distinct interview domain:

| App | Domain | Tech | Port |
|-----|--------|------|------|
| [DSARevision](#-dsarevision--dsa--algorithms-hub) | Data Structures & Algorithms | React 18 + Vite | `5173` (dev) / `4173` (prod) |
| [LLDDesign](#-llddesign--low-level-design) | Low Level Design & Design Patterns | React 18 + Vite | `3002` (dev) / `4002` (prod) |
| [SystemDesign](#-systemdesign--system-design-simulator) | System Design Simulator | Next.js 16 + TypeScript | `3000` |

---

## DSARevision — DSA & Algorithms Hub

A decision-driven revision tool for Data Structures, Algorithms, Problem-Solving Patterns, and Math. Built for fast, high-impact study sessions with Java code snippets and live visualizations.

### Highlights

- **Decision-tree learning flow** — guides you to the right data structure or algorithm for any problem
- **Rich topic cards** with when-to-use hints, complexity trade-offs, Java snippets, and curated practice ladders
- **Deep-dive variant trees** for Binary Search, Sliding Window, Two Pointers, BFS/DFS, and DP variations
- **Interactive visualizers** — step through operations on real data structures with animations and operation traces

### Interactive Visualizers

| Visualizer | Description |
|-----------|-------------|
| `ArrayVisualizer` | Push, pop, insert, remove, access with animated state |
| `BSTVisualizer` | Insert, delete, search with tree re-rendering |
| `LinkedListVisualizer` | Node insertion/deletion animations |
| `StackVisualizer` / `QueueVisualizer` / `DequeVisualizer` | LIFO/FIFO operations |
| `PriorityQueueVisualizer` | Min/max heap with operation trace |
| `HashMapVisualizer` | Collision handling, probing visualization |
| `GraphAlgorithmVisualizer` | BFS, DFS, shortest path on live graphs |
| `SortingVisualizer` | Bubble, merge, quick, heap sort with step replay |
| `BSTVisualizer` / `RedBlackTreeVisualizer` | Balanced tree rotations |
| `SegmentTreeVisualizer` / `FenwickTreeVisualizer` | Range query operations |
| `TrieVisualizer` | Prefix insert/search visualization |
| `UnionFindVisualizer` | Union by rank + path compression |
| `SparseTableVisualizer` / `TwoHeapsVisualizer` | Advanced structures |

### Sections

- **DSA** — Arrays, Linked Lists, Stacks, Queues, Trees, Graphs, Heaps, HashMaps, and more
- **Algorithms** — Sorting, Searching, Graph Traversals, Shortest Paths, Dynamic Programming
- **Patterns** — Sliding Window, Two Pointers, Binary Search, BFS/DFS, DP state patterns
- **Math for DSA** — Number theory, combinatorics, probability for competitive/interview problems

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + Vite 5 |
| Language | JavaScript (JSX) |
| Styling | Custom CSS (light/dark themes) |
| Containerization | Docker + Docker Compose |

---

## LLDDesign — Low Level Design

A structured reference and practice tool for Object-Oriented design interviews covering all 23 GoF design patterns, SOLID principles, and real LLD interview problems.

### Sections

| # | Section | Description |
|---|---------|-------------|
| 01 | **Design Patterns** | All 23 GoF patterns — Creational, Structural, Behavioral — with intent, trade-offs, and Java implementations |
| 02 | **SOLID Principles** | 5 OO design principles with before/after code comparisons |
| 03 | **How to Approach LLD** | 8-step framework for cracking any LLD interview with pattern decision cheatsheet |
| 04 | **Quick Revision Guide** | 23 patterns distilled into scannable cards with priority labels (Important / Good to Have / Rarely Used) |
| 05 | **LLD Problems** | Common interview problems — Parking Lot, Library System, ATM — with class diagrams and Java implementations |

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + Vite 5 |
| Routing | React Router DOM v6 |
| Language | JavaScript (JSX) |
| Styling | Custom CSS |

---

## SystemDesign — System Design Simulator

The most complete open-source system design interview simulator. Build real architectures on a drag-and-drop canvas, simulate production traffic, and get scored like an interviewer would.

### Core Features

#### 30 Infrastructure Components
Every building block for any system design — Load Balancers, CDN, Databases (SQL/NoSQL), Cache/Redis, Message Queues, Service Mesh, Circuit Breakers, and more — each with verified production benchmarks.

#### Traffic Simulation Engine
- **Kahn's topological sort** for correct fan-in QPS accumulation
- Per-node metrics: QPS, utilization %, latency, status
- Bottleneck detection with cascading failure visualization
- Cycle detection with warnings
- Configurable load: 1K to 500K requests/sec

#### 5-Category Scoring System

| Category | What It Checks |
|----------|---------------|
| **Scalability** | Load balancing, horizontal scaling, caching, async processing |
| **Availability** | No SPOFs, replica redundancy, monitoring, overload protection |
| **Latency** | CDN usage, cache-before-DB patterns, minimal hop count |
| **Cost Efficiency** | Right-sized components, polyglot persistence, no waste |
| **Trade-offs** | Read/write separation, defense in depth, architecture breadth |

Score verdicts: `Needs Work` (<31) · `Decent` (<51) · `Good` (<71) · `Excellent` (<86) · `Architect Level` (86+)

#### Interview Practice Mode
6-phase structured interview simulation — Requirements → Estimation → API Design → Data Model → High-Level Design → Deep Dive — with a color-coded timer.

#### 35 Design Problems

<details>
<summary><strong>Click to expand all 35 problems</strong></summary>

| Difficulty | Problems |
|-----------|---------|
| **Easy** | URL Shortener, Rate Limiter, Parking Lot |
| **Medium** | Notification System, Typeahead, Distributed Cache, Instagram, Spotify, Tinder, Reddit, Yelp, Online Code Editor, CI/CD Pipeline |
| **Hard** | Twitter, Chat System, Uber, YouTube, Payment System, Ticket Booking, Google Docs, Dropbox, E-Commerce, Slack, Monitoring, Netflix, Zoom, DoorDash, Airbnb, WhatsApp, Google Search, TikTok, Distributed Message Queue, Digital Wallet, Google Maps |

</details>

#### Additional Features
- **Edge Labels & Protocol Types** — HTTP, gRPC, WebSocket, pub/sub, TCP with sync/async tagging
- **Concept Library** — When to use, when NOT to use, key trade-offs, interview tips, real-world examples
- **14 Pre-built Trade-off Cards** — SQL vs NoSQL, Sync vs Async, Monolith vs Microservices, and more
- **4-Tier Learning Path** — Structured progression from Foundations → Intermediate → Advanced → Expert
- **Save/Load Designs** — Persist and reload named designs via localStorage
- **Export as PNG** — Screenshot your canvas

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Enter` | Run simulation |
| `Ctrl+Shift+S` | Score design |
| `Ctrl+S` | Save design |
| `Ctrl+O` | Load design |
| `Ctrl+E` | Export as PNG |
| `Delete` | Remove selected node |
| `Escape` | Deselect |

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | React 19 + TypeScript |
| Canvas | @xyflow/react (ReactFlow v12) |
| State | Zustand v5 (persisted localStorage) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Animation | Framer Motion |
| Icons | Lucide React |
| Export | html-to-image |

---

## Quick Start

### Prerequisites

- **Node.js** v18+ and **npm** v9+
- **Docker** + **Docker Compose** (for containerized deployment)

### Run All Apps Together (Recommended)

```bash
git clone <your-repo-url>
cd RevisionGuide
npm install
npm run dev
```

This starts all three apps concurrently with color-coded output:

| App | URL |
|-----|-----|
| DSARevision | http://localhost:5173 |
| LLDDesign | http://localhost:3002 |
| SystemDesign | http://localhost:3000 |

### Run Individual Apps

```bash
# DSA Revision Hub only
npm run dev:hub

# LLD Design only
npm run dev:lld

# System Design only
npm run dev:sd
```

### Install Dependencies Per App

```bash
# Root (concurrently runner)
npm install

# Each sub-app
cd DSARevision && npm install
cd LLDDesign && npm install
cd SystemDesign && npm install
```

---

## Docker Deployment

The cleanest way to run AlgoSprint in production. All three services are orchestrated with a single `docker-compose.yml`.

### Start All Services

```bash
docker compose up --build -d
```

| Service | URL |
|---------|-----|
| DSARevision (Hub) | http://localhost:4173 |
| SystemDesign | http://localhost:3000 |
| LLDDesign | http://localhost:4002 |

### Stop All Services

```bash
docker compose down
```

### Rebuild a Single Service

```bash
docker compose up --build -d hub         # DSARevision
docker compose up --build -d system-design  # SystemDesign
docker compose up --build -d lld         # LLDDesign
```

### View Logs

```bash
docker compose logs -f             # All services
docker compose logs -f hub         # DSARevision only
docker compose logs -f system-design
docker compose logs -f lld
```

### Docker Architecture

```
docker-compose.yml
├── hub          → DSARevision (Vite preview, port 4173)
│                  depends on: system-design, lld
├── system-design → SystemDesign (Next.js, port 3000)
└── lld          → LLDDesign (Vite preview, port 4002)
```

Each service has its own `Dockerfile` in its subdirectory.

---

## Project Structure

```
RevisionGuide/
├── DSARevision/                  # DSA & Algorithms Hub (React + Vite)
│   ├── src/
│   │   ├── components/           # 30+ interactive visualizer components
│   │   ├── data/                 # DSA topic definitions and problem sets
│   │   ├── hooks/                # Custom React hooks
│   │   └── utils/                # Helpers and constants
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── vite.config.js
│
├── LLDDesign/                    # Low Level Design (React + Vite)
│   ├── src/
│   │   ├── pages/                # Home, Patterns, SOLID, Approach, Problems
│   │   ├── components/           # ClassDiagram, Navbar
│   │   └── data/                 # patterns.js, solid.js
│   ├── Dockerfile
│   └── vite.config.js
│
├── SystemDesign/                 # System Design Simulator (Next.js)
│   ├── src/
│   │   ├── app/                  # Next.js App Router
│   │   ├── components/
│   │   │   ├── canvas/           # ReactFlow canvas and nodes
│   │   │   ├── panel/            # Properties, simulation, scoring panels
│   │   │   ├── sidebar/          # Component palette, problems, learning path
│   │   │   ├── interview/        # Interview mode phases and timer
│   │   │   └── dialogs/          # Save/Load design dialogs
│   │   ├── data/                 # 30 components, 35 problems, concept library
│   │   ├── engine/               # Traffic simulation (Kahn's algorithm)
│   │   ├── scoring/              # 5-category scoring engine
│   │   ├── store/                # Zustand stores (canvas, simulation, interview)
│   │   └── types/                # TypeScript interfaces
│   ├── Dockerfile
│   └── next.config.ts
│
├── docker-compose.yml            # Root orchestration
├── package.json                  # Root scripts (concurrently)
└── README.md
```

---

## Production Build

Build all apps for production:

```bash
# DSARevision
npm run build:hub

# LLDDesign
npm run build:lld

# SystemDesign
npm run build:sd
```

Build outputs:
- `DSARevision/dist/` — static files for DSA Hub
- `LLDDesign/dist/` — static files for LLD app
- `SystemDesign/.next/` — Next.js server output

---

## Security & Git Hygiene

- Sensitive files (`.env`, keys, certs) are excluded via `.gitignore`
- Build artifacts (`dist/`, `.next/`) are not committed
- Editor files and OS metadata are ignored

---

## License

This project is currently unlicensed. Add a `LICENSE` file to open-source it explicitly.

---

<div align="center">

**AlgoSprint** — because passive reading doesn't get you offers.

</div>
