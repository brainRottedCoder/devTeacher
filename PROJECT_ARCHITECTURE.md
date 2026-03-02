# Project Architecture Documentation

> **Azmuth** - AI-Powered Developer Learning Platform

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Project Structure](#project-structure)
3. [Module Map](#module-map)
4. [API Routes](#api-routes)
5. [Components](#components)
6. [Libraries](#libraries)
7. [Hooks](#hooks)
8. [Data Flow](#data-flow)
9. [Database Schema](#database-schema)

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (Next.js 14)                          │
├─────────────────────────────────────────────────────────────────────────┤
│  Pages            │  Components        │  Hooks        │  State         │
│  ─────────────    │  ────────────     │  ─────        │  ─────         │
│  - Landing        │  - Header         │  - useAuth    │  - Zustand     │
│  - Dashboard      │  - Footer         │  - useChat    │  - Store       │
│  - Modules        │  - AIChatWidget   │  - useModules │                │
│  - Design Studio │  - CodeEditor     │  - useProgress│                │
│  - Simulation    │  - Quiz           │  - useQuiz    │                │
│  - Interview     │  - Designer       │  - useInterview               │
│  - Labs          │  - Simulation     │  - useAchievements           │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        BACKEND (Next.js API Routes)                      │
├─────────────────────────────────────────────────────────────────────────┤
│  /api/ai/chat           │  AI Chat & Streaming                         │
│  /api/modules           │  Learning Modules CRUD                       │
│  /api/progress          │  User Progress Tracking                      │
│  /api/quizzes           │  Quiz System                                │
│  /api/design/analyze    │  Architecture Design Analysis                │
│  /api/interview/        │  Interview Preparation                       │
│  /api/execute          │  Code Execution (Sandboxed)                 │
│  /api/achievements     │  Gamification System                        │
│  /api/learning-paths   │  Personalized Learning Paths                 │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         EXTERNAL SERVICES                                │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │  Supabase   │  │   MegaLLM   │  │  Judge0 API │  │   Pinecone  │   │
│  │  (Auth+DB)  │  │  (AI Chat)  │  │   (Code)   │  │  (VectorDB) │   │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Layer                | Technology                  | Purpose                      |
| -------------------- | --------------------------- | ---------------------------- |
| **Frontend**         | Next.js 14                  | SSR, Routing, API Routes     |
| **UI Framework**     | React 18                    | Component-based UI           |
| **Styling**          | Tailwind CSS                | Utility-first CSS            |
| **State Management** | Zustand                     | Lightweight global state     |
| **Auth**             | Supabase Auth               | OAuth + Email authentication |
| **Database**         | PostgreSQL (Supabase)       | User data, progress, content |
| **AI**               | MegaLLM (OpenAI-compatible) | Chat, RAG, embeddings        |
| **Code Execution**   | Judge0 API                  | Sandboxed code execution     |
| **Vector DB**        | Pinecone                    | Semantic search, RAG         |

---

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes (Backend)
│   │   ├── ai/           # AI Chat & Streaming
│   │   ├── chat/         # Chat History
│   │   ├── db/           # Database Migrations
│   │   ├── design/       # Architecture Design Analysis
│   │   ├── execute/      # Code Execution
│   │   ├── interview/    # Interview Preparation
│   │   ├── modules/      # Learning Modules
│   │   ├── progress/     # User Progress
│   │   ├── quizzes/      # Quiz System
│   │   ├── achievements/ # Gamification
│   │   └── learning-paths/ # Learning Paths
│   │
│   ├── auth/              # Authentication Pages
│   │   ├── login/        # Login Page
│   │   └── signup/       # Signup Page
│   │
│   ├── dashboard/         # User Dashboard
│   ├── modules/           # Learning Modules Browser
│   ├── design/            # Architecture Design Studio
│   ├── simulate/          # Scalability Simulator
│   ├── interview/         # Interview Prep Hub
│   ├── labs/              # Hands-on Labs
│   ├── code/              # Code Playground
│   ├── community/         # Community Features
│   ├── pricing/           # Pricing Page
│   └── certifications/    # Certifications
│
├── components/            # React Components
│   ├── chat/              # AI Chat Widget
│   ├── code/              # Code Editor
│   ├── designer/          # Architecture Designer
│   ├── simulation/        # Simulation Components
│   ├── providers/         # React Providers
│   ├── Header.tsx         # Navigation Header
│   ├── Footer.tsx         # Footer
│   ├── MainLayout.tsx     # Layout Wrapper
│   └── Quiz.tsx          # Quiz Component
│
├── hooks/                 # Custom React Hooks
│   ├── useAuth.ts         # Authentication
│   ├── useChat.ts         # AI Chat
│   ├── useModules.ts      # Learning Modules
│   ├── useProgress.ts     # Progress Tracking
│   ├── useQuiz.ts         # Quiz Logic
│   ├── useInterview.ts    # Interview Prep
│   ├── useCodeExecution.ts # Code Execution
│   ├── useAchievements.ts # Gamification
│   └── useLearningPath.ts # Learning Paths
│
├── lib/                   # Core Libraries
│   ├── megallm.ts         # AI Client (MegaLLM)
│   ├── rag.ts             # RAG Implementation
│   ├── utils.ts           # Utility Functions
│   ├── supabase/          # Supabase Client
│   ├── designer/          # Architecture Designer
│   │   ├── types.ts       # Designer Types
│   │   ├── analyzer.ts    # Design Analysis
│   │   └── ai-analyzer.ts # AI Design Review
│   ├── interview/         # Interview System
│   │   ├── ai-interviewer.ts # AI Interviewer
│   │   └── voice.ts       # Voice Features
│   └── simulation/        # Simulation Engine
│       ├── engine.ts      # Simulation Logic
│       └── types.ts       # Simulation Types
│
├── store/                 # State Management
│   └── useStore.ts        # Zustand Store
│
└── types/                 # TypeScript Types
    ├── database.types.ts   # Supabase Types
    ├── index.ts           # Common Types
    ├── interview.types.ts # Interview Types
    ├── achievements.types.ts # Achievement Types
    └── learning-path.types.ts # Learning Path Types
```

---

## Module Map

### 1. Learning Modules System

**Purpose**: Structured learning content with lessons, quizzes, and progress
tracking

| File                                                                                                 | Type | Purpose                |
| ---------------------------------------------------------------------------------------------------- | ---- | ---------------------- |
| [`app/modules/page.tsx`](src/app/modules/page.tsx:1)                                                 | Page | Browse all modules     |
| [`app/modules/[id]/page.tsx`](src/app/modules/[id]/page.tsx:1)                                       | Page | Module detail view     |
| [`app/modules/[id]/lessons/[lessonId]/page.tsx`](src/app/modules/[id]/lessons/[lessonId]/page.tsx:1) | Page | Individual lesson      |
| [`app/api/modules/route.ts`](src/app/api/modules/route.ts:1)                                         | API  | GET all modules        |
| [`app/api/modules/[id]/route.ts`](src/app/api/modules/[id]/route.ts:1)                               | API  | GET single module      |
| [`app/api/progress/route.ts`](src/app/api/progress/route.ts:1)                                       | API  | Track lesson progress  |
| [`hooks/useModules.ts`](src/hooks/useModules.ts:1)                                                   | Hook | Fetch & manage modules |
| [`hooks/useProgress.ts`](src/hooks/useProgress.ts:1)                                                 | Hook | Track user progress    |

**Data Flow**:

```
User → Modules Page → API (/api/modules) → Supabase → Response → UI Update
```

---

### 2. AI Chat System

**Purpose**: AI-powered learning assistant with contextual responses

| File                                                                         | Type      | Purpose               |
| ---------------------------------------------------------------------------- | --------- | --------------------- |
| [`components/chat/AIChatWidget.tsx`](src/components/chat/AIChatWidget.tsx:1) | Component | Chat UI widget        |
| [`app/api/ai/chat/route.ts`](src/app/api/ai/chat/route.ts:1)                 | API       | Non-streaming chat    |
| [`app/api/ai/chat/stream/route.ts`](src/app/api/ai/chat/stream/route.ts:1)   | API       | Streaming chat (SSE)  |
| [`app/api/chat/history/route.ts`](src/app/api/chat/history/route.ts:1)       | API       | Chat history storage  |
| [`lib/megallm.ts`](src/lib/megallm.ts:1)                                     | Library   | MegaLLM API client    |
| [`lib/rag.ts`](src/lib/rag.ts:1)                                             | Library   | RAG implementation    |
| [`hooks/useChat.ts`](src/hooks/useChat.ts:1)                                 | Hook      | Chat state management |

**Architecture**:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  User       │────▶│  Frontend   │────▶│  API Route  │
│  Input      │     │  (Stream)   │     │  (Stream)   │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                                │
                   ┌─────────────┐              │
                   │  MegaLLM   │◀─────────────┘
                   │  + RAG     │
                   └──────┬──────┘
                          │
                   ┌──────▼──────┐
                   │  Streaming  │
                   │  Response   │
                   └─────────────┘
```

---

### 3. Architecture Design Studio

**Purpose**: Visual drag-and-drop system design with AI feedback

| File                                                                                         | Type      | Purpose              |
| -------------------------------------------------------------------------------------------- | --------- | -------------------- |
| [`app/design/page.tsx`](src/app/design/page.tsx:1)                                           | Page      | Design canvas        |
| [`components/designer/ArchitectureNode.tsx`](src/components/designer/ArchitectureNode.tsx:1) | Component | Node rendering       |
| [`components/designer/ComponentLibrary.tsx`](src/components/designer/ComponentLibrary.tsx:1) | Component | Draggable components |
| [`components/designer/TemplateSelector.tsx`](src/components/designer/TemplateSelector.tsx:1) | Component | Pre-built templates  |
| [`components/designer/AnalysisPanel.tsx`](src/components/designer/AnalysisPanel.tsx:1)       | Component | AI feedback display  |
| [`lib/designer/types.ts`](src/lib/designer/types.ts:1)                                       | Library   | TypeScript types     |
| [`lib/designer/analyzer.ts`](src/lib/designer/analyzer.ts:1)                                 | Library   | Design validation    |
| [`lib/designer/ai-analyzer.ts`](src/lib/designer/ai-analyzer.ts:1)                           | Library   | AI design critique   |
| [`app/api/design/analyze/route.ts`](src/app/api/design/analyze/route.ts:1)                   | API       | Analyze design       |

**Components Available**:

- 🖥️ **Server** - API servers, compute instances
- 🗄️ **Database** - SQL/NoSQL databases
- ⚡ **Cache** - Redis, Memcached
- 🔄 **Message Queue** - RabbitMQ, Kafka
- 🌐 **Load Balancer** - Nginx, AWS ELB
- 🌩️ **CDN** - CloudFront, Cloudflare
- ☁️ **Cloud Services** - AWS/GCP/Azure

---

### 4. Scalability Simulator

**Purpose**: Interactive simulation of system scaling from 100 to 100M users

| File                                                                                             | Type      | Purpose              |
| ------------------------------------------------------------------------------------------------ | --------- | -------------------- |
| [`app/simulate/page.tsx`](src/app/simulate/page.tsx:1)                                           | Page      | Simulation interface |
| [`components/simulation/SimulationCanvas.tsx`](src/components/simulation/SimulationCanvas.tsx:1) | Component | Visual canvas        |
| [`components/simulation/MetricsPanel.tsx`](src/components/simulation/MetricsPanel.tsx:1)         | Component | Real-time metrics    |
| [`components/simulation/UserLoadSlider.tsx`](src/components/simulation/UserLoadSlider.tsx:1)     | Component | Traffic control      |
| [`lib/simulation/engine.ts`](src/lib/simulation/engine.ts:1)                                     | Library   | Simulation logic     |
| [`lib/simulation/types.ts`](src/lib/simulation/types.ts:1)                                       | Library   | Simulation types     |

**Simulation Metrics**:

- 📊 **Latency** - Response time in ms
- ⚡ **Throughput** - Requests per second
- 💰 **Cost** - Estimated AWS/GCP cost
- 🔴 **Bottlenecks** - Identified issues

---

### 5. Interview Preparation

**Purpose**: Company-specific interview prep with AI mock interviews

| File                                                                                   | Type    | Purpose              |
| -------------------------------------------------------------------------------------- | ------- | -------------------- |
| [`app/interview/page.tsx`](src/app/interview/page.tsx:1)                               | Page    | Interview hub        |
| [`app/interview/session/page.tsx`](src/app/interview/session/page.tsx:1)               | Page    | Active interview     |
| [`app/api/interview/companies/route.ts`](src/app/api/interview/companies/route.ts:1)   | API     | Company data         |
| [`app/api/interview/questions/route.ts`](src/app/api/interview/questions/route.ts:1)   | API     | Interview questions  |
| [`app/api/interview/sessions/route.ts`](src/app/api/interview/sessions/route.ts:1)     | API     | Session management   |
| [`app/api/interview/transcript/route.ts`](src/app/api/interview/transcript/route.ts:1) | API     | Transcript storage   |
| [`lib/interview/ai-interviewer.ts`](src/lib/interview/ai-interviewer.ts:1)             | Library | AI interviewer logic |
| [`lib/interview/voice.ts`](src/lib/interview/voice.ts:1)                               | Library | Voice features       |
| [`hooks/useInterview.ts`](src/hooks/useInterview.ts:1)                                 | Hook    | Interview state      |
| [`hooks/useInterviewSession.ts`](src/hooks/useInterviewSession.ts:1)                   | Hook    | Session management   |

**Interview Types**:

- 🏗️ **System Design** - Architecture & scaling
- 💻 **Coding** - Algorithms & data structures
- 👤 **Behavioral** - STAR method questions

---

### 6. Code Execution

**Purpose**: Sandboxed code execution for hands-on practice

| File                                                                     | Type      | Purpose               |
| ------------------------------------------------------------------------ | --------- | --------------------- |
| [`app/code/page.tsx`](src/app/code/page.tsx:1)                           | Page      | Code playground       |
| [`components/code/CodeEditor.tsx`](src/components/code/CodeEditor.tsx:1) | Component | Monaco editor         |
| [`app/api/execute/route.ts`](src/app/api/execute/route.ts:1)             | API       | Execute code (Judge0) |
| [`hooks/useCodeExecution.ts`](src/hooks/useCodeExecution.ts:1)           | Hook      | Execution state       |

**Supported Languages**:

- JavaScript/TypeScript
- Python
- Java
- C++
- Go
- Rust

---

### 7. Quiz System

**Purpose**: Interactive quizzes for knowledge assessment

| File                                                         | Type      | Purpose    |
| ------------------------------------------------------------ | --------- | ---------- |
| [`components/Quiz.tsx`](src/components/Quiz.tsx:1)           | Component | Quiz UI    |
| [`app/api/quizzes/route.ts`](src/app/api/quizzes/route.ts:1) | API       | Quiz CRUD  |
| [`hooks/useQuiz.ts`](src/hooks/useQuiz.ts:1)                 | Hook      | Quiz logic |

**Quiz Features**:

- Multiple choice
- Code completion
- True/False
- Fill in the blank
- Timed quizzes

---

### 8. Gamification System

**Purpose**: Achievements, badges, and progress tracking

| File                                                                   | Type  | Purpose              |
| ---------------------------------------------------------------------- | ----- | -------------------- |
| [`app/api/achievements/route.ts`](src/app/api/achievements/route.ts:1) | API   | Achievements CRUD    |
| [`hooks/useAchievements.ts`](src/hooks/useAchievements.ts:1)           | Hook  | Achievement tracking |
| [`types/achievements.types.ts`](src/types/achievements.types.ts:1)     | Types | Achievement types    |

---

### 9. Learning Paths

**Purpose**: Personalized learning journeys

| File                                                                       | Type  | Purpose         |
| -------------------------------------------------------------------------- | ----- | --------------- |
| [`app/api/learning-paths/route.ts`](src/app/api/learning-paths/route.ts:1) | API   | Learning paths  |
| [`hooks/useLearningPath.ts`](src/hooks/useLearningPath.ts:1)               | Hook  | Path management |
| [`types/learning-path.types.ts`](src/types/learning-path.types.ts:1)       | Types | Path types      |

---

## API Routes

### Authentication

| Endpoint      | Method | Purpose                             |
| ------------- | ------ | ----------------------------------- |
| `/api/auth/*` | *      | Supabase Auth (handled by Supabase) |

### AI & Chat

| Endpoint              | Method   | Purpose              |
| --------------------- | -------- | -------------------- |
| `/api/ai/chat`        | POST     | Send chat message    |
| `/api/ai/chat/stream` | POST     | Streaming chat (SSE) |
| `/api/chat/history`   | GET/POST | Chat history         |

### Learning

| Endpoint            | Method       | Purpose            |
| ------------------- | ------------ | ------------------ |
| `/api/modules`      | GET          | List all modules   |
| `/api/modules/[id]` | GET          | Get module details |
| `/api/progress`     | GET/POST/PUT | User progress      |
| `/api/quizzes`      | GET/POST     | Quiz management    |

### Design & Simulation

| Endpoint              | Method | Purpose              |
| --------------------- | ------ | -------------------- |
| `/api/design/analyze` | POST   | Analyze architecture |
| `/api/execute`        | POST   | Execute code         |

### Interview

| Endpoint                    | Method   | Purpose         |
| --------------------------- | -------- | --------------- |
| `/api/interview/companies`  | GET      | List companies  |
| `/api/interview/questions`  | GET/POST | Questions       |
| `/api/interview/sessions`   | GET/POST | Sessions        |
| `/api/interview/transcript` | POST     | Save transcript |
| `/api/interview/plans`      | GET/POST | Interview plans |

### Gamification

| Endpoint              | Method   | Purpose        |
| --------------------- | -------- | -------------- |
| `/api/achievements`   | GET/POST | Achievements   |
| `/api/learning-paths` | GET/POST | Learning paths |

---

## Components

### Layout Components

| Component                                           | Purpose                    |
| --------------------------------------------------- | -------------------------- |
| [`MainLayout.tsx`](src/components/MainLayout.tsx:1) | Wrapper with Header/Footer |
| [`Header.tsx`](src/components/Header.tsx:1)         | Navigation & auth state    |
| [`Footer.tsx`](src/components/Footer.tsx:1)         | Links & copyright          |

### Feature Components

| Component                                                    | Purpose                   |
| ------------------------------------------------------------ | ------------------------- |
| [`AIChatWidget.tsx`](src/components/chat/AIChatWidget.tsx:1) | Floating chat widget      |
| [`CodeEditor.tsx`](src/components/code/CodeEditor.tsx:1)     | Monaco editor integration |
| [`Quiz.tsx`](src/components/Quiz.tsx:1)                      | Quiz interface            |

### Designer Components

| Component                                                                | Purpose           |
| ------------------------------------------------------------------------ | ----------------- |
| [`ArchitectureNode.tsx`](src/components/designer/ArchitectureNode.tsx:1) | Node rendering    |
| [`ComponentLibrary.tsx`](src/components/designer/ComponentLibrary.tsx:1) | Draggable items   |
| [`TemplateSelector.tsx`](src/components/designer/TemplateSelector.tsx:1) | Pre-built designs |
| [`AnalysisPanel.tsx`](src/components/designer/AnalysisPanel.tsx:1)       | AI feedback       |

### Simulation Components

| Component                                                                  | Purpose         |
| -------------------------------------------------------------------------- | --------------- |
| [`SimulationCanvas.tsx`](src/components/simulation/SimulationCanvas.tsx:1) | Visual display  |
| [`MetricsPanel.tsx`](src/components/simulation/MetricsPanel.tsx:1)         | Real-time stats |
| [`UserLoadSlider.tsx`](src/components/simulation/UserLoadSlider.tsx:1)     | Traffic control |

---

## Libraries

### Core Libraries

| Library                              | Purpose                        |
| ------------------------------------ | ------------------------------ |
| [`megallm.ts`](src/lib/megallm.ts:1) | AI API client (MegaLLM)        |
| [`rag.ts`](src/lib/rag.ts:1)         | Retrieval Augmented Generation |
| [`utils.ts`](src/lib/utils.ts:1)     | Common utilities               |

### Supabase

| Library                                              | Purpose              |
| ---------------------------------------------------- | -------------------- |
| [`supabase/client.ts`](src/lib/supabase/client.ts:1) | Client-side Supabase |
| [`supabase/server.ts`](src/lib/supabase/server.ts:1) | Server-side Supabase |

### Designer

| Library                                                        | Purpose                |
| -------------------------------------------------------------- | ---------------------- |
| [`designer/types.ts`](src/lib/designer/types.ts:1)             | TypeScript definitions |
| [`designer/analyzer.ts`](src/lib/designer/analyzer.ts:1)       | Design validation      |
| [`designer/ai-analyzer.ts`](src/lib/designer/ai-analyzer.ts:1) | AI critique            |

### Interview

| Library                                                                | Purpose        |
| ---------------------------------------------------------------------- | -------------- |
| [`interview/ai-interviewer.ts`](src/lib/interview/ai-interviewer.ts:1) | AI interviewer |
| [`interview/voice.ts`](src/lib/interview/voice.ts:1)                   | Voice features |

### Simulation

| Library                                                  | Purpose          |
| -------------------------------------------------------- | ---------------- |
| [`simulation/engine.ts`](src/lib/simulation/engine.ts:1) | Core simulation  |
| [`simulation/types.ts`](src/lib/simulation/types.ts:1)   | Type definitions |

---

## Hooks

| Hook                                                        | Purpose                        |
| ----------------------------------------------------------- | ------------------------------ |
| [`useAuth`](src/hooks/useAuth.ts:1)                         | Authentication state & methods |
| [`useChat`](src/hooks/useChat.ts:1)                         | Chat messages & streaming      |
| [`useModules`](src/hooks/useModules.ts:1)                   | Fetch learning modules         |
| [`useProgress`](src/hooks/useProgress.ts:1)                 | Track lesson completion        |
| [`useQuiz`](src/hooks/useQuiz.ts:1)                         | Quiz state & scoring           |
| [`useInterview`](src/hooks/useInterview.ts:1)               | Interview prep                 |
| [`useInterviewSession`](src/hooks/useInterviewSession.ts:1) | Active session                 |
| [`useCodeExecution`](src/hooks/useCodeExecution.ts:1)       | Run code remotely              |
| [`useAchievements`](src/hooks/useAchievements.ts:1)         | Badges & rewards               |
| [`useLearningPath`](src/hooks/useLearningPath.ts:1)         | Personalized paths             |

---

## Data Flow

### User Authentication Flow

```
User → Login Page → Supabase Auth → JWT Token → Store in Cookie → Redirect to Dashboard
```

### Learning Module Flow

```
Dashboard → Modules Page → API (/api/modules) → Supabase Query → Return Modules → Display Grid
         ↓
Click Module → Module Detail → Lessons List → API (/api/modules/[id])
         ↓
Click Lesson → Lesson Page → Content Rendered → Mark Progress → API (/api/progress)
```

### AI Chat Flow

```
User Types Message → useChat Hook → API (/api/ai/chat/stream) 
                  → MegaLLM with RAG Context → Streaming Response → UI Update
```

### Design Analysis Flow

```
User Creates Design → Drag & Drop Components → Save Design State
                  → Click "Analyze" → API (/api/design/analyze)
                  → AI Analysis → Display Feedback in AnalysisPanel
```

### Code Execution Flow

```
User Writes Code → Click "Run" → API (/api/execute)
                → Judge0 API → Execution Result → Display Output
```

---

## Database Schema

### Core Tables

```sql
-- Users (managed by Supabase Auth)
profiles (
  id UUID PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP
)

-- Learning Modules
modules (
  id UUID PRIMARY KEY,
  title TEXT,
  description TEXT,
  icon TEXT,
  order_index INTEGER,
  created_at TIMESTAMP
)

-- Lessons
lessons (
  id UUID PRIMARY KEY,
  module_id UUID REFERENCES modules,
  title TEXT,
  content TEXT,
  order_index INTEGER
)

-- User Progress
user_progress (
  user_id UUID,
  lesson_id UUID,
  completed BOOLEAN,
  completed_at TIMESTAMP,
  PRIMARY KEY (user_id, lesson_id)
)

-- Quiz Questions
quizzes (
  id UUID PRIMARY KEY,
  module_id UUID,
  question TEXT,
  options JSONB,
  correct_answer TEXT,
  explanation TEXT
)

-- Chat History
chat_history (
  id UUID PRIMARY KEY,
  user_id UUID,
  messages JSONB,
  created_at TIMESTAMP
)

-- Interview Sessions
interview_sessions (
  id UUID PRIMARY KEY,
  user_id UUID,
  company TEXT,
  interview_type TEXT,
  transcript JSONB,
  feedback JSONB,
  created_at TIMESTAMP
)

-- Achievements
achievements (
  id UUID PRIMARY KEY,
  user_id UUID,
  badge_id TEXT,
  earned_at TIMESTAMP
)

-- Learning Paths
learning_paths (
  id UUID PRIMARY KEY,
  user_id UUID,
  title TEXT,
  modules JSONB,
  progress JSONB
)
```

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI (MegaLLM - Primary)
MEGALLM_API_KEY=your_megallm_api_key
MEGALLM_BASE_URL=https://ai.megallm.io/v1

# AI (OpenAI - Fallback)
OPENAI_API_KEY=your_openai_api_key

# Code Execution
JUDGE0_API_KEY=your_judge0_api_key
NEXT_PUBLIC_JUDGE0_URL=https://judge0-ce.p.rapidapi.com

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Security

### Authentication

- Supabase Auth handles all user authentication
- JWT tokens stored in HTTP-only cookies
- Row Level Security (RLS) on all tables

### API Security

- Rate limiting on AI endpoints
- Input validation on all endpoints
- Sanitized code execution (Judge0 sandbox)

### Data Protection

- No sensitive data in client-side state
- Environment variables for all secrets
- HTTPS in production

---

## Performance

### Optimizations

- Server-Side Rendering (SSR) for SEO-critical pages
- React Query for server state caching
- Streaming responses for AI chat
- Lazy loading for heavy components
- Image optimization with Next.js Image

### Caching Strategy

- Supabase responses cached via React Query
- Static content cached at edge (Vercel)
- API responses cached where appropriate

---

## Development

### Running Locally

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
# Fill in your API keys

# Run development server
npm run dev
```

### Building

```bash
# Production build
npm run build

# Start production
npm start
```

---

## Future Enhancements

Based on PRD.md phases:

- **Phase 5**: Community features & peer learning
- **Phase 6**: Mobile app (React Native)
- **Phase 7**: Advanced analytics
- **Phase 8**: Enterprise features
- **Phase 9**: Marketplace for user content
- **Phase 10**: Multi-language support

---

_Last Updated: 2026-02-18_ _Project: Azmuth - AI-Powered Developer Learning
Platform_
