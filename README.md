<p align="center">
  <h1 align="center">Azmuth 🧬</h1>
  <p align="center"><b>The AI-Powered Developer Learning Platform</b></p>
  <p align="center">
    <i>Named after Azmuth — the greatest scientist in the Ben 10 universe, creator of the Omnitrix.</i><br/>
    <i>Just as Azmuth built tools to help others understand alien technology, this platform helps developers master complex system design through interactive simulations and AI-guided experimentation.</i>
  </p>
</p>

---

## 🌐 What is Azmuth?

Azmuth is a **full-stack, production-grade** learning ecosystem that transforms
how developers learn technology — moving from **passive reading to active,
real-time simulation**. Instead of memorizing concepts, developers experience
them live: dragging infrastructure components onto a canvas, watching traffic
flow through architectures, and getting instant AI feedback on their designs.

The project itself is a deep learning resource — its own codebase demonstrates
**microservices architecture, Kubernetes orchestration, real-time WebSockets,
AI/RAG pipelines, Progressive Web App design, and Docker containerization** in a
single, unified repository.

---

## 📋 Table of Contents

- [Features (Deep Dive)](#-features-deep-dive)
  - [Architecture Design Studio](#1--architecture-design-studio)
  - [AI Architecture Generator](#2--ai-architecture-generator)
  - [Scalability Simulator](#3--interactive-scalability-simulator)
  - [AI Learning Assistant (RAG)](#4--ai-learning-assistant-with-rag)
  - [Interview Preparation Hub](#5--interview-preparation-hub)
  - [Code Execution Playground](#6--code-execution-playground)
  - [Learning Modules & Progress](#7--structured-learning-modules--progress-tracking)
  - [Knowledge Graph](#8--knowledge-graph-visualization)
  - [Certifications System](#9--certifications-system)
  - [Community & Collaboration](#10--community--real-time-collaboration)
  - [Gamification & Leaderboard](#11--gamification--leaderboard)
  - [Teams & Organizations (B2B)](#12--teams--organizations-b2b)
  - [Progressive Web App (PWA)](#13--progressive-web-app-pwa)
- [Deep Tech Stack](#-deep-tech-stack)
- [System Architecture](#-system-architecture)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Database Migrations](#-database-migrations)
- [Docker & Microservices](#-docker--microservices)
- [Kubernetes & Infrastructure](#-kubernetes--infrastructure)
- [What You Will Learn](#-what-you-will-learn-from-this-project)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)

---

## ✨ Features (Deep Dive)

### 1. 🏗️ Architecture Design Studio

A **visual, infinite-canvas workspace** where developers drag-and-drop real
infrastructure components and connect them to design full system architectures.

| Capability              | Details                                                                                                                                                 |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Component Library**   | Load Balancers, API Servers, SQL & NoSQL Databases, Redis Cache, Message Queues (Kafka/RabbitMQ), CDNs, Cloud Functions, API Gateways, Monitoring, DNS  |
| **Smart Connections**   | Draw edges between components that represent data flow, API calls, and event streams with animated directional arrows                                   |
| **Pre-built Templates** | One-click templates for architectures like Twitter, Netflix, Uber — instantly rendered on the canvas for study and modification                         |
| **AI Design Critique**  | Click "Analyze" to get an AI-powered review that identifies single points of failure, over-engineering, missing redundancies, and suggests improvements |
| **Share & Export**      | Collaborate on designs via shareable links; export to JSON for backup or version control                                                                |
| **Glassmorphic UI**     | The design studio uses a premium glassmorphism aesthetic with frosted-glass panels, gradient borders, and subtle motion                                 |

**Key Files:** `src/app/design/page.tsx`, `src/components/designer/`,
`src/lib/designer/`

---

### 2. 🤖 AI Architecture Generator

Describe what you want to build in **plain English**, and the AI instantly
generates a complete system architecture on the canvas.

**How it works under the hood:**

1. Your natural language prompt (e.g., _"Design a highly available e-commerce
   platform with caching, message queues, and a CDN"_) is sent to the
   `/api/ai/design/generate` API route.
2. The server constructs a **structured system prompt** containing every valid
   component type, their spatial positioning rules, and connection semantics.
3. The prompt is sent to **MegaLLM** (`openai-gpt-oss-120b`) with
   `response_format: { type: "json_object" }` to guarantee valid JSON.
4. The raw AI response is **validated and enriched**: invalid component types
   are filtered, edges are verified against actual node IDs, and nodes are
   enriched with icons, colors, and categories from a `COMPONENT_CONFIGS`
   dictionary.
5. The validated nodes and edges are injected directly into React Flow via
   `setNodes()` and `setEdges()` — rendering the architecture instantly on the
   canvas.

**Key Files:** `src/app/api/ai/design/generate/route.ts`

---

### 3. 🎮 Interactive Scalability Simulator

Experience system scaling in **real-time**. Watch what happens to response
times, cost, and throughput when traffic scales from 100 to 1,000,000 users.

| Feature                  | Implementation                                                                                                                                                                      |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Traffic Slider**       | An interactive slider adjusts simulated user load, triggering real-time recalculations across the entire architecture                                                               |
| **Animated Data Flow**   | SVG connection lines between components are animated with CSS `stroke-dasharray` + `stroke-dashoffset` keyframes. Animation speed scales dynamically with requests-per-second (RPS) |
| **Live Metrics**         | Latency (ms), Throughput (RPS), Estimated Cloud Cost ($/month), and Bottleneck Probability are calculated in real-time by the simulation engine                                     |
| **Bottleneck Detection** | The engine automatically identifies components that are overloaded at the current traffic level and visually highlights them                                                        |
| **WebSocket Sync**       | The simulation state can be synced across multiple clients in real-time via a dedicated WebSocket server                                                                            |

**Key Files:** `src/app/simulate/page.tsx`, `src/lib/simulation/engine.ts`,
`src/components/simulation/`, `server/websocket.ts`

---

### 4. 🧠 AI Learning Assistant with RAG

A context-aware AI tutor powered by **Retrieval-Augmented Generation (RAG)**
that provides grounded, accurate explanations.

| Layer                  | Details                                                                                                                                                                  |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **LLM Provider**       | MegaLLM (OpenAI-compatible API) with streaming responses via Server-Sent Events (SSE)                                                                                    |
| **RAG Pipeline**       | Curated system design knowledge is embedded into vectors using `pgvector` (Supabase) or Pinecone — similarity search retrieves relevant context before every AI response |
| **Prompt Engineering** | The system uses specialized prompts from `src/lib/prompts.ts` — each tuned for different roles: concept explainer, architecture reviewer, interview coach, code reviewer |
| **Streaming UI**       | Responses stream token-by-token to the floating chat widget, powered by `useChat.ts` which processes the SSE stream and renders incrementally                            |
| **Chat History**       | Conversations are persisted to the database for continuity across sessions                                                                                               |
| **IndexedDB Fallback** | Client-side caching via `src/lib/indexeddb.ts` ensures chat works even when offline or when the database is unreachable                                                  |

**Key Files:** `src/lib/megallm.ts`, `src/lib/rag.ts`, `src/lib/prompts.ts`,
`src/hooks/useChat.ts`, `src/components/chat/AIChatWidget.tsx`

---

### 5. 🎯 Interview Preparation Hub

Company-specific interview preparation with AI-powered mock interviewers.

| Feature                 | Details                                                                                                                                        |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Company Database**    | Curated interview data for FAANG (Meta, Amazon, Apple, Netflix, Google), high-growth startups (Stripe, Airbnb, Uber), and enterprise companies |
| **Interview Types**     | System Design, Coding (algorithms & data structures), and Behavioral (STAR method)                                                             |
| **AI Mock Interviewer** | Real-time AI interviewer that asks follow-up questions, evaluates your answers, and provides structured scoring                                |
| **Voice Interviews**    | Full voice-based interview mode using Web Speech API — speak your answers, get real-time transcription, and receive AI evaluation              |
| **Session Transcripts** | Every interview session is recorded as a full transcript with timestamps, stored in the database for later review                              |
| **Feedback & Scoring**  | Detailed post-interview feedback with scores across multiple dimensions: technical accuracy, communication, problem decomposition              |

**Key Files:** `src/app/interview/`, `src/lib/interview/ai-interviewer.ts`,
`src/lib/interview/voice.ts`, `src/hooks/useInterviewSession.ts`,
`src/hooks/useVoiceInterview.ts`

---

### 6. 💻 Code Execution Playground

Write and run code in the browser with a professional Monaco Editor (the same
editor powering VS Code).

| Feature                 | Details                                                                                                              |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Monaco Editor**       | Full syntax highlighting, IntelliSense, and bracket matching for TypeScript, Python, Java, C++, Go, and Rust         |
| **Sandboxed Execution** | Code is executed securely via the Judge0 API — runs in isolated Docker containers with strict memory and time limits |
| **Output Panel**        | STDOUT, STDERR, execution time, and memory usage displayed inline                                                    |

**Key Files:** `src/app/code/page.tsx`, `src/components/code/CodeEditor.tsx`,
`src/hooks/useCodeExecution.ts`, `src/app/api/execute/route.ts`

---

### 7. 📚 Structured Learning Modules & Progress Tracking

| Feature                         | Details                                                                                                                       |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Module Library**              | Categorized system design courses (beginner → intermediate → advanced) with rich markdown content                             |
| **Lesson System**               | Each module contains ordered lessons with interactive content, code examples, and diagrams                                    |
| **Progress Tracking**           | Per-lesson completion tracked in the database with percentage progress and last-accessed timestamps                           |
| **Quiz System**                 | Interactive quizzes with multiple formats: multiple-choice, code completion, true/false, fill-in-the-blank, timed assessments |
| **Personalized Learning Paths** | AI-recommended learning sequences based on your role (Backend, Frontend, DevOps, SRE), level, and goals                       |

**Key Files:** `src/app/modules/`, `src/components/Quiz.tsx`,
`src/hooks/useModules.ts`, `src/hooks/useProgress.ts`,
`src/hooks/useLearningPath.ts`

---

### 8. 🕸️ Knowledge Graph Visualization

An interactive, visual knowledge graph that maps the relationships between
technologies, concepts, and design patterns.

- Node-based visualization of concept dependencies (e.g., "Load Balancing" →
  "Horizontal Scaling" → "Auto Scaling Groups")
- Powered by `src/lib/knowledge-graph.ts` with a large embedded knowledge base

**Key Files:** `src/app/knowledge-graph/page.tsx`, `src/lib/knowledge-graph.ts`,
`src/hooks/useKnowledgeGraph.ts`

---

### 9. 🏅 Certifications System

| Feature                    | Details                                                                                                       |
| -------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Proctored Exams**        | Timed certification exams with questions stored in the database (migration `014_certification_questions.sql`) |
| **Scoring & Verification** | Pass/fail scoring with certificate generation and a unique verification URL                                   |
| **Multiple Tracks**        | Separate certifications for System Design, Cloud Architecture, DevOps, etc.                                   |

**Key Files:** `src/app/certifications/`, `src/hooks/useCertifications.ts`,
`src/app/api/certifications/`

---

### 10. 👥 Community & Real-Time Collaboration

| Feature                     | Details                                                                                                                           |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **Community Forum**         | Post discussions, share architecture designs, ask questions, and provide peer feedback                                            |
| **Real-Time Collaboration** | Multiple users can simultaneously edit the same architecture design on a shared canvas via WebSockets                             |
| **Commenting & Versioning** | Inline comments on shared designs and full version history (migration `015_collaboration_comments_versions.sql`)                  |
| **WebSocket Server**        | A dedicated Node.js WebSocket server (`server/websocket.ts`) handles real-time sync with Redis Pub/Sub for multi-instance support |

**Key Files:** `src/app/community/`, `src/hooks/useCollaboration.ts`,
`src/hooks/useWebSocket.ts`, `server/websocket.ts`

---

### 11. 🏆 Gamification & Leaderboard

| Feature                | Details                                                                                                    |
| ---------------------- | ---------------------------------------------------------------------------------------------------------- |
| **Achievement Badges** | Unlock badges for milestones: completing modules, passing certifications, streaks, community contributions |
| **XP & Levels**        | Earn experience points for every action; level up as you progress                                          |
| **Global Leaderboard** | Compete with other developers on module completions, quiz scores, and certification passes                 |

**Key Files:** `src/hooks/useAchievements.ts`, `src/hooks/useLeaderboard.ts`,
`src/app/leaderboard/page.tsx`, `src/components/gamification/`

---

### 12. 🏢 Teams & Organizations (B2B)

| Feature                   | Details                                                                |
| ------------------------- | ---------------------------------------------------------------------- |
| **Team Management**       | Create organizations, invite members, assign roles (admin, member)     |
| **Team Analytics**        | Dashboard showing team-wide progress, completion rates, and skill gaps |
| **Shared Learning Paths** | Admins can assign learning paths to entire teams                       |

**Key Files:** `src/app/team/`, `src/hooks/useTeams.ts`, `src/app/api/teams/`

---

### 13. 📱 Progressive Web App (PWA)

Azmuth is a fully installable PWA with offline support.

| Feature                       | Details                                                                                                                     |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **Service Worker**            | Custom `sw.js` that intercepts network requests, caches static assets and Next.js chunks, and serves fallback pages offline |
| **Install Prompt**            | Native "Add to Home Screen" support on mobile and desktop                                                                   |
| **IndexedDB Offline Storage** | Module content, chat history, and user preferences cached locally in IndexedDB for offline access                           |
| **Manifest**                  | Full `manifest.json` with app icons, theme colors, and standalone display mode                                              |

**Key Files:** `public/sw.js`, `public/manifest.json`, `src/lib/indexeddb.ts`,
`src/hooks/useServiceWorker.ts`, `src/components/ServiceWorkerProvider.tsx`

---

## 🔧 Deep Tech Stack

| Layer                | Technology                           | Why It's Used                                                     |
| -------------------- | ------------------------------------ | ----------------------------------------------------------------- |
| **Framework**        | Next.js 14 (App Router)              | Server Components, SSR, file-based routing, API routes, streaming |
| **UI Library**       | React 18                             | Concurrent features, Suspense, Server Components                  |
| **Styling**          | Tailwind CSS + Custom Glassmorphism  | Utility-first CSS with custom design tokens for frosted-glass UI  |
| **State Management** | Zustand                              | Lightweight, no boilerplate, perfect for shared client state      |
| **Data Fetching**    | TanStack Query (React Query) v5      | Server state caching, automatic revalidation, optimistic updates  |
| **Canvas Engine**    | @xyflow/react (React Flow) v12       | Infinite canvas, custom nodes/edges, zooming, panning, minimap    |
| **Code Editor**      | Monaco Editor (@monaco-editor/react) | VS Code-level editing experience in the browser                   |
| **AI/LLM**           | MegaLLM + OpenAI SDK                 | Chat completions, JSON mode, streaming, structured outputs        |
| **RAG**              | pgvector (Supabase) / Pinecone       | Vector embeddings for semantic search and context retrieval       |
| **Auth**             | Supabase Auth                        | Email + OAuth providers, JWT tokens, Row Level Security           |
| **Database**         | PostgreSQL (Supabase)                | Relational data, RLS policies, pgvector extension                 |
| **Real-time**        | WebSocket (ws library)               | Live collaboration, simulation sync, presence                     |
| **Offline Storage**  | IndexedDB                            | Client-side persistence for PWA offline mode                      |
| **Icons**            | Lucide React + React Icons           | Comprehensive, tree-shakable icon libraries                       |
| **Typography**       | Space Grotesk + JetBrains Mono       | Premium display font + monospace for code                         |
| **Language**         | TypeScript 5                         | End-to-end type safety across frontend, backend, and shared types |

---

## 🏛️ System Architecture

```
┌───────────────────────────────────────────────────────────────────────────────────────┐
│                                    CLIENT (Browser)                                    │
│   Next.js 14 (SSR + CSR)  │  React Flow Canvas  │  Monaco Editor  │  Service Worker   │
└──────────────────────────────────────┬────────────────────────────────────────────────┘
                                       │
          ┌────────────────────────────┼──────────────────────────────┐
          ▼                            ▼                              ▼
┌──────────────────┐   ┌───────────────────────────┐   ┌──────────────────────┐
│  Next.js API     │   │   WebSocket Server        │   │   Kong API Gateway   │
│  Routes (20+)    │   │   (Real-time Collab)      │   │   (Microservices)    │
└────────┬─────────┘   └───────────┬───────────────┘   └──────────┬───────────┘
         │                         │                               │
         │              ┌──────────┘                    ┌──────────┴──────────────────┐
         │              │                               │                             │
         ▼              ▼                               ▼                             ▼
┌──────────────┐ ┌──────────────┐          ┌──────────────────┐  ┌──────────────────────┐
│  Supabase    │ │    Redis     │          │  Auth Service    │  │  AI Service          │
│  PostgreSQL  │ │  (Cache +    │          │  Content Service │  │  Simulation Service  │
│  + pgvector  │ │   Pub/Sub)   │          │  Community Svc   │  │  Community Service   │
└──────────────┘ └──────────────┘          └──────────────────┘  └──────────────────────┘
                                                    │
                                        ┌───────────┼───────────────┐
                                        ▼           ▼               ▼
                                 ┌──────────┐ ┌──────────┐  ┌──────────────┐
                                 │ MongoDB  │ │ RabbitMQ │  │ Prometheus + │
                                 │ (Content)│ │ (Queue)  │  │ Grafana      │
                                 └──────────┘ └──────────┘  └──────────────┘
```

### Microservices (Docker Compose)

The project includes a complete **13-service Docker Compose** stack:

| Service                | Port  | Purpose                                                   |
| ---------------------- | ----- | --------------------------------------------------------- |
| **Kong Gateway**       | 8000  | API Gateway with declarative routing to all microservices |
| **Auth Service**       | 3001  | Authentication, JWT, session management                   |
| **Content Service**    | 3002  | Learning modules, lessons, content management             |
| **Simulation Service** | 3003  | Scalability simulation engine with worker threads         |
| **AI Service**         | 3004  | LLM orchestration, RAG, embeddings                        |
| **Community Service**  | 3005  | Forums, discussions, social features                      |
| **WebSocket Server**   | 3006  | Real-time collaboration and simulation sync               |
| **PostgreSQL 15**      | 5432  | Primary relational database                               |
| **MongoDB 6**          | 27017 | Document storage for content and designs                  |
| **Redis 7**            | 6379  | Caching, sessions, rate limiting, Pub/Sub                 |
| **RabbitMQ 3**         | 5672  | Asynchronous message queue between services               |
| **Prometheus**         | 9090  | Metrics collection and alerting                           |
| **Grafana 10**         | 3000  | Monitoring dashboards and visualization                   |

### Kubernetes Manifests

Production-ready Kubernetes config (`infrastructure/kubernetes.yml`):

- Dedicated **Namespace** with ConfigMaps and Secrets
- **Deployments** with replica counts, resource limits, liveness/readiness
  probes
- **Services** for internal communication
- **Ingress** with Nginx, TLS (cert-manager), and rate limiting
- **HorizontalPodAutoscalers** for auto-scaling the AI and Community services
  based on CPU/memory utilization

---

## 📁 Project Structure

```
azmuth/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── api/                      # 20+ API Route Groups
│   │   │   ├── ai/                   # Chat, Streaming, Design Generation
│   │   │   ├── certifications/       # Exam management, verification
│   │   │   ├── cloud-pricing/        # AWS/GCP/Azure cost calculator
│   │   │   ├── collaboration/        # Real-time design sharing
│   │   │   ├── community/            # Posts, comments, reactions
│   │   │   ├── design/               # Architecture analysis
│   │   │   ├── execute/              # Sandboxed code execution
│   │   │   ├── interview/            # Companies, questions, sessions, transcripts
│   │   │   ├── k8s-lab/              # Kubernetes interactive labs
│   │   │   ├── knowledge-graph/      # Concept relationship data
│   │   │   ├── leaderboard/          # Global rankings
│   │   │   ├── learning-paths/       # Personalized learning journeys
│   │   │   ├── modules/              # Course content CRUD
│   │   │   ├── progress/             # Completion tracking
│   │   │   ├── quizzes/              # Quiz management
│   │   │   ├── teams/                # Organization management, analytics
│   │   │   └── user/                 # Profile management
│   │   │
│   │   ├── auth/                     # Login & Signup pages
│   │   ├── certifications/           # Certification exam UI
│   │   ├── code/                     # Code playground page
│   │   ├── community/                # Community forum UI
│   │   ├── dashboard/                # User analytics dashboard
│   │   ├── design/                   # Architecture Design Studio
│   │   ├── interview/                # Interview prep & session UI
│   │   ├── knowledge-graph/          # Visual knowledge graph
│   │   ├── labs/                     # Hands-on lab environments
│   │   ├── leaderboard/              # Leaderboard page
│   │   ├── modules/                  # Learning modules browser
│   │   ├── paths/                    # Learning paths page
│   │   ├── pricing/                  # Pricing tiers page
│   │   ├── simulate/                 # Scalability simulator
│   │   ├── team/                     # Team management page
│   │   └── verify/                   # Certificate verification
│   │
│   ├── components/                   # React Components
│   │   ├── chat/                     # AI Chat Widget
│   │   ├── code/                     # Monaco Code Editor
│   │   ├── designer/                 # Architecture nodes, edges, library, templates, analysis panel
│   │   ├── gamification/             # XP bars, badges, streaks
│   │   ├── simulation/               # Canvas, metrics panel, user load slider
│   │   ├── terminal/                 # In-browser terminal emulator
│   │   └── providers/                # React context providers
│   │
│   ├── hooks/                        # 23 Custom React Hooks
│   ├── lib/                          # Core Libraries
│   │   ├── megallm.ts                # MegaLLM API client
│   │   ├── rag.ts                    # RAG pipeline implementation
│   │   ├── prompts.ts                # System prompt engineering
│   │   ├── cloud-pricing.ts          # Cloud cost calculation engine
│   │   ├── knowledge-graph.ts        # Knowledge graph data & logic
│   │   ├── indexeddb.ts              # IndexedDB offline storage
│   │   ├── designer/                 # Design analyzer, AI analyzer, types
│   │   ├── interview/                # AI interviewer, voice engine
│   │   ├── simulation/               # Simulation engine & types
│   │   ├── k8s/                      # Kubernetes lab simulation
│   │   └── supabase/                 # Supabase client/server configs
│   │
│   ├── store/                        # Zustand global state
│   └── types/                        # TypeScript type definitions
│
├── services/                         # Microservices (Independent Deployments)
│   ├── auth/                         # Authentication microservice
│   ├── content/                      # Content management microservice
│   ├── simulation/                   # Simulation engine microservice
│   ├── ai/                           # AI orchestration microservice
│   ├── community/                    # Community features microservice
│   └── gateway/                      # Kong API Gateway config
│
├── server/                           # WebSocket Server
│   └── websocket.ts                  # Real-time collaboration server
│
├── database/
│   ├── migrations/                   # 16 SQL migration files
│   └── seeds/                        # Database seed data
│
├── infrastructure/
│   ├── kubernetes.yml                # K8s Deployments, Services, HPAs, Ingress
│   ├── prometheus.yml                # Prometheus scrape configs
│   ├── cloudflare-config.json        # Cloudflare CDN & Workers config
│   └── cloudflare-workers/           # Edge computing functions
│
├── scripts/                          # Build & utility scripts
├── docker-compose.yml                # 13-service development stack
├── docker-compose.prod.yml           # Production Docker config
├── Dockerfile                        # Main app container
└── public/
    ├── sw.js                         # Service Worker for PWA
    └── manifest.json                 # PWA manifest
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js 18+** (or Bun for faster installs)
- **A Supabase account** — [supabase.com](https://supabase.com) (free tier
  available)
- **A MegaLLM API key** — [megallm.io](https://megallm.io) (for AI features)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/brainRottedCoder/devTeacher.git
cd devTeacher

# 2. Install dependencies
bun install       # recommended
# or: npm install

# 3. Set up environment variables
cp .env.example .env.local
# Then edit .env.local with your API keys

# 4. Run the development server (Next.js + WebSocket server)
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
MEGALLM_API_KEY=your_megallm_api_key
MEGALLM_BASE_URL=https://ai.megallm.io/v1

# Optional
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=ws://localhost:3006
```

---

## 🗄️ Database Migrations

The `database/migrations/` directory contains **16 sequential SQL files** that
build the complete schema:

| Migration                              | Purpose                                             |
| -------------------------------------- | --------------------------------------------------- |
| `001_initial_schema`                   | Users, modules, lessons, user_progress tables + RLS |
| `002_interview_schema`                 | Interview questions, companies, scoring rubrics     |
| `003_companies_and_interview_sessions` | Company data, session management                    |
| `004_chat_and_achievements`            | Chat history, achievement badges                    |
| `005_pgvector`                         | Vector extension for RAG embeddings                 |
| `007_gamification`                     | XP, levels, streaks, leaderboard                    |
| `008_token_usage`                      | AI token usage tracking and cost monitoring         |
| `009_teams_and_orgs`                   | Organizations, team members, roles                  |
| `010_certifications`                   | Certification exams, results, verification          |
| `011_populate_embeddings`              | Seed embedding data for RAG                         |
| `012_collaboration_sessions`           | Real-time collaboration session state               |
| `013_knowledge_graph`                  | Concept nodes and relationship edges                |
| `014_certification_questions`          | Exam question banks                                 |
| `014_learning_paths_enhancement`       | Enhanced custom learning paths                      |
| `015_collaboration_comments_versions`  | Comment threads and design version history          |

---

## 🐳 Docker & Microservices

### Running the Full Stack

```bash
# Start all 13 services
docker-compose up -d

# View logs
docker-compose logs -f
```

This brings up:

- **PostgreSQL**, **MongoDB**, **Redis**, **RabbitMQ** (data layer)
- **Auth**, **Content**, **Simulation**, **AI**, **Community** services
  (application layer)
- **Kong Gateway** (API routing)
- **WebSocket Server** (real-time)
- **Prometheus + Grafana** (observability)

---

## ☸️ Kubernetes & Infrastructure

The project includes production-ready infrastructure configs:

- **`infrastructure/kubernetes.yml`** — Complete K8s manifests with Deployments
  (2-3 replicas each), Services, Ingress with TLS, and HorizontalPodAutoscalers
- **`infrastructure/prometheus.yml`** — Prometheus scrape configurations for all
  services
- **`infrastructure/cloudflare-config.json`** — Cloudflare CDN, WAF rules, and
  edge caching
- **`infrastructure/cloudflare-workers/`** — Edge computing functions for
  low-latency API responses

---

## 🎓 What You Will Learn From This Project

Building and studying Azmuth teaches you real-world, production-grade
engineering across the entire stack:

### Frontend Engineering

- **Next.js 14 App Router** — Server Components, Server Actions, streaming SSR,
  file-based routing, API Routes
- **React Flow** — Building interactive infinite canvas applications with custom
  nodes and edges
- **State Management** — When to use Zustand (client state) vs. TanStack Query
  (server state) vs. React Context
- **PWA Architecture** — Service Workers, Cache API, IndexedDB, offline-first
  design patterns
- **Premium UI/UX** — Glassmorphism, micro-animations, responsive design, custom
  fonts

### Backend Engineering

- **Microservices Architecture** — Service decomposition, API Gateway pattern
  (Kong), inter-service communication
- **Real-time Systems** — WebSocket server implementation, Redis Pub/Sub,
  presence management
- **AI/LLM Integration** — Prompt engineering, structured JSON outputs, RAG
  pipelines, streaming responses, token cost management
- **Database Design** — Relational schema design, Row-Level Security, vector
  embeddings, 16 incremental migrations

### DevOps & Infrastructure

- **Docker & Docker Compose** — Multi-service containerization, networking,
  volume management
- **Kubernetes** — Deployments, Services, Ingress, HPA auto-scaling, ConfigMaps,
  Secrets, health probes
- **Monitoring** — Prometheus metrics collection, Grafana dashboards
- **Edge Computing** — Cloudflare Workers for global low-latency responses
- **CI/CD** — Production Dockerfiles with multi-stage builds

### System Design Concepts (by using the platform)

- Load Balancing strategies and when to use them
- Database sharding, replication, and caching patterns
- Message queue patterns (RabbitMQ) for async processing
- CDN configuration and cache invalidation
- Horizontal vs. vertical scaling trade-offs
- Cost implications of architecture decisions

---

## 🎯 Roadmap

| Phase                                | Status         | Highlights                                                      |
| ------------------------------------ | -------------- | --------------------------------------------------------------- |
| **Phase 1: Core Foundation**         | ✅ Complete    | Auth, modules, progress tracking, responsive UI, PWA            |
| **Phase 2: AI Integration**          | ✅ Complete    | AI chat, RAG, AI architecture generator, streaming              |
| **Phase 3: Interactive Simulations** | ✅ Complete    | Scalability simulator, design studio, real-time metrics         |
| **Phase 4: Advanced Features**       | 🚀 In Progress | Voice interviews, K8s labs, multi-region simulation, mobile app |

---

## 🤝 Contributing

Contributions are welcome! Whether it's fixing bugs, adding features, improving
documentation, or sharing architecture templates — open a Pull Request and let's
build together.

---

## 🔗 Links

- [Project Architecture Documentation](./PROJECT_ARCHITECTURE.md)
- [GitHub Repository](https://github.com/brainRottedCoder/devTeacher)

---

<p align="center"><i>Built with ❤️ by developers, for developers.</i></p>
