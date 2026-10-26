# PrepWise AI - Intelligent Study Planner & Academic Assistant

[![Next.js](https://img.shields.io/badge/Next.js-16.2.10-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.4-blue?style=flat&logo=react)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.139.2-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.13+-3776AB?style=flat&logo=python)](https://www.python.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%26%20Postgres-3ECF8E?style=flat&logo=supabase)](https://supabase.com/)
[![Groq](https://img.shields.io/badge/Groq%20LPU-openai%2Fgpt--oss--120b-F05A28)](https://groq.com/)

PrepWise AI is a modern full-stack academic planning and intelligent study companion. Designed for university and school students, it uses Groq-accelerated LLM reasoning and Supabase persistence to turn syllabus topics into actionable daily schedules, active-recall quizzes, spaced revision tasks, topic-by-topic progress tracking, and personalized career roadmaps.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Project Directory Structure](#project-directory-structure)
- [Database Schema (Supabase)](#database-schema-supabase)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Installation & Local Setup](#installation--local-setup)
  - [1. Backend Setup](#1-backend-setup)
  - [2. Frontend Setup](#2-frontend-setup)
- [Available API Endpoints](#available-api-endpoints)
- [Build, Lint & Test Commands](#build-lint--test-commands)
- [Screenshots & UI Showcase](#screenshots--ui-showcase)
- [Security & Data Isolation](#security--data-isolation)
- [Limitations & Known Scope](#limitations--known-scope)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

Traditional studying frequently suffers from cognitive overload, unstructured study schedules, and passive reading habits. PrepWise AI addresses these challenges by combining:

1. **Structured Scheduling**: Synthesizing custom, realistic day-wise study routines respecting exam dates and daily study-hour limits.
2. **Active Recall Testing**: Dynamically generating multiple-choice quizzes with detailed rationales across varying difficulty levels.
3. **Continuous Revision Prioritization**: Classifying weak areas using actual quiz accuracy and upcoming exam deadlines.
4. **Unified Multi-Plan Progress**: Tracking topic completion and syllabus coverage across all active subjects simultaneously.
5. **Night / Light Adaptive UI**: Seamless dark mode support across the entire interface with zero hydration flicker.

---

## Key Features

### 1. AI Study Planner (`/planner`, `/plans`)
- Generates a day-by-day study schedule from custom subjects, topics, exam dates, and daily study hours (1–12 hours).
- Enforces strict sanity checks: prevents past-date scheduling, respects daily hour limits, and formats outputs in clean Markdown.
- Enables saving generated plans to the database and browsing or deleting them on demand.

### 2. Comprehensive Analytics Dashboard (`/dashboard`)
- Live KPI cards: Total Saved Plans, Syllabus Progress, Total Quizzes Attempted, Average Score, and Pending Revision Tasks.
- Visual charts powered by Recharts: Weekly Quiz Performance trends and Subject-wise Score comparisons.
- Recent activity feed showing generated plans, quiz submissions, and checklist updates.

### 3. Study Progress Tracker (`/progress`)
- Aggregates syllabus progress across **all** saved study plans.
- Global KPIs: Overall Syllabus Completion %, Completed Topics, In-Progress Topics, and Not Started Topics.
- Multi-plan topic filtering (All, Not Started, In Progress, Completed) with individual topic status toggling (`Not Started` -> `In Progress` -> `Completed`).
- Automatically resolves topic completion from either manual tracking or passing quiz performance (≥ 60% accuracy).

### 4. AI Quiz & Self-Assessment (`/quiz`, `/quiz/history`, `/quiz/weak-topics`)
- Generates 5, 10, or 15 multiple-choice questions tailored to a subject and topic with selectable difficulty (`Easy`, `Medium`, `Hard`).
- Real-time quiz submission engine that evaluates score, stores user responses, and returns instant explanations for every question.
- **Quiz History**: View past attempts with date, subject, topic, difficulty, and score badges; delete past attempts when needed.
- **Weak Topics Analysis**: Flags subjects and topics with quiz scores below 60% as priority focus areas.

### 5. Smart AI Revision Assistant (`/revision`)
- Automatically compiles prioritized revision tasks (`High`, `Medium`, `Low`) based on days remaining until the exam and quiz performance history.
- Dynamic task checklist with persistent completion toggles.
- On-demand Groq AI advice generation tailored to specific revision tasks.

### 6. AI Career Assistant (`/career`, `/career/saved`)
- Analyzes student interests to recommend targeted entry-level roles, required core skills, top 3 certifications, and 3 starter portfolio projects.
- Clean vertical card presentation with save and delete functionality.

### 7. Modern Centralized Theme System & UX
- Global Light / Dark / System Default theme provider (`next-themes`-compatible CSS variable architecture).
- Persistent theme selection with instant synchronization and zero hydration flash.
- Reusable confirmation modals and toast notifications for all critical actions (generate, save, update, delete).

---

## System Architecture

```mermaid
flowchart TD
    subgraph Client ["Frontend (Next.js 16 + Tailwind CSS)"]
        UI["App Router Pages\n(/dashboard, /planner, /quiz, /progress, /revision, /career)"]
        Components["Layout, Sidebar, Navbar, ThemeToggle, ConfirmDialog"]
        AuthContext["Supabase Auth Session / JWT"]
        APIClient["Axios Client (frontend/lib/api.ts)\nBearer Token Interceptor"]
    end

    subgraph Server ["Backend (FastAPI + Python 3.13)"]
        App["FastAPI Server (backend/main.py)"]
        AuthMiddleware["JWT Verification (backend/app/utils/auth.py)"]
        Routers["API Routers\n/planner, /dashboard, /quiz, /revision, /progress, /career"]
        Services["Domain Services\n(groq.py, quiz_service.py, revision_service.py, progress_service.py, career.py)"]
    end

    subgraph External ["External Cloud Services"]
        GroqAPI["Groq LPU API\n(model: openai/gpt-oss-120b)"]
        SupabaseDB["Supabase PostgreSQL & Auth\n(RLS-isolated User Tables)"]
    end

    UI --> Components
    Components --> APIClient
    AuthContext --> APIClient
    APIClient -- HTTP + Bearer Token --> App
    App --> AuthMiddleware
    AuthMiddleware --> Routers
    Routers --> Services
    Services -- Inference Prompt --> GroqAPI
    Services -- Queries / Writes (User Token) --> SupabaseDB
```

---

## Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend Framework** | [Next.js](https://nextjs.org/) 16.2.10 (App Router, Turbopack) |
| **Frontend UI & Styling** | [React](https://react.dev/) 19.2.4, [Tailwind CSS](https://tailwindcss.com/) v4, [Lucide React](https://lucide.dev/) |
| **Data Visualization & Markdown** | [Recharts](https://recharts.org/) 3.10.1, [react-markdown](https://github.com/remarkjs/react-markdown) 10.1.0, remark-gfm |
| **HTTP & API Integration** | [Axios](https://axios-http.com/) 1.18.1 with automated JWT interceptor |
| **Backend Framework** | [FastAPI](https://fastapi.tiangolo.com/) 0.139.2, [Uvicorn](https://www.uvicorn.org/) 0.51.0, [Pydantic](https://docs.pydantic.dev/) v2 |
| **AI / LLM Engine** | [Groq Python SDK](https://github.com/groq/groq-python) 1.5.0 (serving `openai/gpt-oss-120b`) |
| **Database & Authentication** | [Supabase](https://supabase.com/) (PostgreSQL + Supabase GoTrue Auth) |
| **Language Runtimes** | TypeScript 5 (Frontend), Python 3.13+ (Backend) |

---

## Project Directory Structure

```text
prepwise-ai/
├── backend/
│   ├── app/
│   │   ├── api/                     # FastAPI route controllers
│   │   │   ├── career.py            # /career endpoints (recommend, save, delete)
│   │   │   ├── dashboard.py         # /dashboard/stats aggregator
│   │   │   ├── planner.py           # /planner endpoints (generate, save, delete)
│   │   │   ├── progress.py          # /progress multi-plan syllabus tracker
│   │   │   ├── quiz.py              # /quiz generation, submission, weak-topics
│   │   │   └── revision.py          # /revision tasks and AI advice
│   │   ├── database/
│   │   │   └── supabase.py          # Server-side Supabase client initialization
│   │   ├── schemas/                 # Pydantic request/response models
│   │   │   ├── career.py
│   │   │   ├── planner.py
│   │   │   ├── progress.py
│   │   │   ├── quiz.py
│   │   │   └── revision.py
│   │   ├── services/                # Business logic & external AI integrations
│   │   │   ├── career.py            # Groq career recommendations
│   │   │   ├── groq.py              # Groq study plan generator
│   │   │   ├── progress_service.py  # Syllabus calculation & topic resolution
│   │   │   ├── quiz_service.py      # Groq multiple-choice quiz generator
│   │   │   └── revision_service.py  # Priority engine & Groq revision tips
│   │   └── utils/
│   │       └── auth.py              # JWT Bearer token authentication & Supabase client scoping
│   ├── .env.example                 # Template for backend environment variables
│   ├── main.py                      # FastAPI entry point & CORS configuration
│   └── requirements.txt             # Python backend dependencies
├── frontend/
│   ├── app/                         # Next.js App Router pages
│   │   ├── career/                  # Career Assistant (/career, /career/saved)
│   │   ├── dashboard/               # Main student analytics dashboard
│   │   ├── login/                   # Authentication - Login
│   │   ├── planner/                 # Study plan creation
│   │   ├── plans/                   # Saved study plan management
│   │   ├── progress/                # Syllabus progress tracking
│   │   ├── quiz/                    # Quiz generator, history, weak-topics
│   │   ├── register/                # Authentication - User registration
│   │   ├── revision/                # Revision tasks checklist & AI advice
│   │   ├── globals.css              # Tailwind CSS styles and theme variables
│   │   ├── layout.tsx               # Root layout with ThemeProvider and AppLayout
│   │   └── page.tsx                 # Landing / Home page with feedback form
│   ├── components/                  # Reusable UI components
│   │   ├── AppLayout.tsx            # Authenticated app shell with sidebar & header
│   │   ├── ConfirmDialog.tsx        # Action confirmation modal
│   │   ├── HomeFeedbackForm.tsx     # Landing page student feedback form
│   │   ├── Navbar.tsx               # Unauthenticated / landing navigation
│   │   ├── Sidebar.tsx              # Sidebar navigation
│   │   ├── ThemeProvider.tsx        # Centralized theme context provider
│   │   └── ThemeToggle.tsx          # Sun/Moon theme toggle button
│   ├── lib/
│   │   ├── api.ts                   # Axios instance with auth token interceptor
│   │   ├── auth.ts                  # Client auth helper
│   │   └── supabase.ts              # Browser Supabase client
│   ├── services/                    # Frontend API integration services
│   │   ├── career.ts
│   │   ├── dashboard.ts
│   │   ├── planner.ts
│   │   ├── progress.ts
│   │   ├── quiz.ts
│   │   └── revision.ts
│   ├── .env.example                 # Template for frontend environment variables
│   ├── package.json                 # Frontend dependencies & scripts
│   └── tsconfig.json                # TypeScript compiler configuration
├── .gitignore                       # Git exclusions for secrets, venvs, and build outputs
└── README.md                        # Project documentation
```

---

## Database Schema (Supabase)

PrepWise AI uses Supabase (PostgreSQL) with user-level isolation via Row Level Security (RLS) linked to `auth.users.id`. The application utilizes the following 5 tables:

### 1. `study_plans`
Stores student-generated study schedules.
```sql
CREATE TABLE study_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    topics TEXT NOT NULL,
    exam_date DATE NOT NULL,
    study_hours INTEGER NOT NULL,
    generated_plan TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. `study_progress`
Stores per-topic completion statuses for each study plan.
```sql
CREATE TABLE study_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES study_plans(id) ON DELETE CASCADE,
    topic TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Not Started', 'In Progress', 'Completed')),
    completed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, plan_id, topic)
);
```

### 3. `quiz_attempts`
Records submitted quiz scores and performance history.
```sql
CREATE TABLE quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    topic TEXT NOT NULL,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    total_questions INTEGER NOT NULL,
    score INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4. `revision_tasks`
Tracks user checklist state for recommended revision tasks.
```sql
CREATE TABLE revision_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    topic TEXT NOT NULL,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, subject, topic)
);
```

### 5. `career_recommendations`
Stores saved AI career recommendations.
```sql
CREATE TABLE career_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    interest TEXT NOT NULL,
    recommendation TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Prerequisites

Ensure you have the following installed on your development machine:
- **Node.js**: v18.18.0 or newer (Node 20+ recommended)
- **Python**: v3.11+ (Python 3.13 tested)
- **Package Managers**: `npm` (bundled with Node) and `pip`
- **Supabase Account**: A free project at [supabase.com](https://supabase.com)
- **Groq Cloud API Key**: A free API key from [console.groq.com](https://console.groq.com)

---

## Environment Variables

### Backend Configuration (`backend/.env`)
Create a file named `.env` in the `backend/` directory:

```env
# Groq Cloud API Key
GROQ_API_KEY=gsk_your_groq_api_key_here

# Supabase Project Credentials
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your_supabase_anon_or_service_key_here

# Database URL (Optional - for direct PostgreSQL connection)
DATABASE_URL=postgresql://postgres:password@db.your-project-id.supabase.co:5432/postgres
```

### Frontend Configuration (`frontend/.env.local`)
Create a file named `.env.local` in the `frontend/` directory:

```env
# Supabase Client Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_public_key_here

# Backend FastAPI URL (Defaults to http://127.0.0.1:8000 if omitted)
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

---

## Installation & Local Setup

### 1. Backend Setup

1. Open your terminal and navigate to the `backend/` directory:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   - **Windows (PowerShell):**
     ```powershell
     python -m venv .venv
     .venv\Scripts\Activate.ps1
     ```
   - **Linux / macOS:**
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```

3. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

4. Verify your `backend/.env` file is properly configured.

5. Start the FastAPI backend server:
   ```bash
   uvicorn main:app --reload --host 127.0.0.1 --port 8000
   ```
   The backend will be live at `http://127.0.0.1:8000`. Swagger documentation is available at `http://127.0.0.1:8000/docs`.

---

### 2. Frontend Setup

1. In a separate terminal, navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Verify your `frontend/.env.local` configuration.

4. Start the Next.js development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Available API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Healthcheck endpoint (`{"status": "healthy"}`) |
| `POST` | `/planner/generate` | Generates a structured study plan via Groq |
| `POST` | `/planner/save` | Saves a study plan to Supabase |
| `GET` | `/planner/saved` | Retrieves all saved plans for the authenticated user |
| `DELETE` | `/planner/saved/{plan_id}` | Deletes a saved study plan |
| `GET` | `/dashboard/stats` | Aggregated metrics, charts data, and activity feed |
| `GET` | `/progress/plans` | Overall syllabus progress summary across all plans |
| `GET` | `/progress/plans/{plan_id}` | Detailed topic list and progress for a single plan |
| `PATCH` | `/progress/plans/{plan_id}/topics` | Updates topic status (`Not Started`, `In Progress`, `Completed`) |
| `POST` | `/quiz/generate` | Generates multiple-choice quiz questions via Groq |
| `POST` | `/quiz/submit` | Evaluates submitted answers and records the quiz attempt |
| `GET` | `/quiz/history` | Fetches user's quiz attempt history |
| `DELETE` | `/quiz/history/{quiz_id}` | Deletes a quiz attempt record |
| `GET` | `/quiz/weak-topics` | Identifies topics where average quiz score is below 60% |
| `GET` | `/revision/recommendations` | Computes prioritized revision tasks based on exam dates & scores |
| `PATCH` | `/revision/tasks/{subject}/{topic}/toggle` | Toggles revision task completion state |
| `POST` | `/revision/ai-advice` | Generates targeted revision advice via Groq |
| `POST` | `/career/recommend` | Generates career roadmap & recommendations via Groq |
| `POST` | `/career/save` | Saves a career recommendation |
| `GET` | `/career/saved` | Retrieves saved career recommendations |
| `DELETE` | `/career/saved/{id}` | Deletes a saved career recommendation |

---

## Build, Lint & Test Commands

### Frontend Production Build
To create an optimized production build of the Next.js frontend:
```bash
npm --prefix frontend run build
```

### Frontend Linting
To run ESLint on the frontend codebase:
```bash
npm --prefix frontend run lint
```

### Backend Verification
To test backend connectivity and verify dependencies without starting the full server:
```bash
python -c "import fastapi, groq, supabase; print('Dependencies successfully imported')"
```

---

## Screenshots & UI Showcase

| Dashboard & Visualizations | Study Planner |
|:---:|:---:|
| *(Add Dashboard Screenshot Here)* | *(Add Study Planner Screenshot Here)* |

| Study Progress Tracker | AI Quiz & Assessment |
|:---:|:---:|
| *(Add Progress Tracker Screenshot Here)* | *(Add AI Quiz Screenshot Here)* |

| AI Revision Assistant | AI Career Guidance |
|:---:|:---:|
| *(Add Revision Assistant Screenshot Here)* | *(Add Career Assistant Screenshot Here)* |

---

## Security & Data Isolation

- **Zero Secret Exposure**: All API keys (`GROQ_API_KEY`, `SUPABASE_KEY`) are kept on the backend or in local `.env` files that are strictly excluded by `.gitignore`.
- **Row-Level Security & Token Scoping**: All user-specific requests authenticate through Supabase JWT tokens via the `Authorization: Bearer <token>` header. The backend verifies the token and executes database operations scoped strictly to the authenticated `user_id`.
- **CORS Protection**: FastAPI is configured to allow only trusted origin patterns from localhost and client development ports.

---

## Limitations & Known Scope

- **AI Token Limits**: Extremely large syllabi (exceeding hundreds of topics in a single request) may be truncated due to context window limits.
- **Client-Side Feedback Form**: The feedback form on the landing page is designed as a frontend interactive confirmation form and does not persist entries to an external CRM.
- **Offline Mode**: Generating study plans, AI quizzes, and career advice requires an active internet connection to communicate with the Groq API and Supabase.

---

## Roadmap

- [ ] PDF and document export for generated study plans and revision checklists.
- [ ] Push notifications / email reminders for scheduled study sessions.
- [ ] Interactive flashcard generator derived from weak quiz topics.
- [ ] Group study mode and peer progress comparisons.
- [ ] Calendar integration (Google Calendar, iCal export).

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Commit your changes with descriptive messages:
   ```bash
   git commit -m "feat: add your feature description"
   ```
4. Push your branch:
   ```bash
   git push origin feature/your-feature-name
   ```
5. Open a Pull Request detailing your changes.

---

## License

This project is licensed under the [MIT License](LICENSE). Feel free to use, modify, and distribute this software in accordance with the license conditions.

