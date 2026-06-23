# 🚀 CareerPilot - AI Career Operating System

<div align="center">

![CareerPilot](https://img.shields.io/badge/CareerPilot-AI%20Career%20OS-blue?style=for-the-badge)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-Express-green?style=for-the-badge&logo=node.js)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql)
![Gemini](https://img.shields.io/badge/Google-Gemini-4285F4?style=for-the-badge&logo=google)

**Transform your career growth into a structured, data-driven journey with AI-powered insights and practice.**

[What We're Building](#-what-were-building) • [Use Cases](#-use-cases) • [Features](#-features) • [Quick Start](#-quick-start) • [Architecture](#-architecture)

</div>

---

## 🎯 What We're Building

**CareerPilot** is an **AI Career Operating System** — a single platform where job seekers and early-career professionals can go from *“I want a better role”* to *“I know what to learn, how to practice, and how ready I am.”*

Instead of juggling separate tools for resume checks, LeetCode practice, interview prep, and career planning, CareerPilot connects those steps into one guided workflow:

```
Upload Resume → Skill Gap Analysis → Career Roadmap → Mock Interview → Coding Practice
```

Each step feeds the next. Resume analysis extracts skills and ATS signals. Skill gap analysis compares you to a target role. The roadmap turns gaps into milestones you can track. Mock interviews and coding practice help you build confidence before real applications.

### The problem we're solving

| Pain point | How CareerPilot helps |
|------------|----------------------|
| Resumes get rejected by ATS with no clear feedback | ATS scoring, keyword gaps, and role-specific rewrite suggestions |
| Unclear what skills to learn next | Skill gap analysis with priorities and learning direction |
| Career growth feels unstructured | AI-generated roadmaps with short/medium/long-term milestones |
| Interview prep is inconsistent | Adaptive mock interviews with rubric-based scoring |
| Coding practice is disconnected from career goals | Integrated practice with hints, execution, and progress tracking |

### Who it's for

- **Students & new grads** preparing for their first software role
- **Career switchers** mapping skills from one domain to another
- **Working professionals** targeting a promotion or role change (e.g. backend → full-stack, IC → lead)
- **Anyone job hunting** who wants a dashboard view of readiness — not just a resume PDF

---

## 💡 Use Cases

### 1. Resume → Role readiness check
Upload a PDF or text resume, optionally set a target role (e.g. *Backend Software Engineer*), and get:
- **ATS score** and **career readiness** estimate
- Extracted skills, strengths, weaknesses, and missing keywords
- An improved professional summary you can refine

**Outcome:** Know whether your resume is competitive before you apply.

### 2. Skill gap → learning plan
Compare your current skills against a dream role. CareerPilot highlights:
- Critical missing skills with priority
- Existing strengths to lean on
- Match score trends over time (history is saved)

**Outcome:** Focus study time on what actually moves the needle.

### 3. Roadmap → execution
Generate a personalized career roadmap with milestones across:
- **0–3 months** (short-term wins)
- **3–6 months** (skill building)
- **6–12+ months** (long-term growth)

Task progress is stored server-side so you can pick up where you left off.

**Outcome:** Turn vague goals into a plan you can follow week by week.

### 4. Interview & coding practice
- **Mock interviews:** Technical, behavioral, mixed, system design, and leadership modes with adaptive follow-ups and strict rubric scoring (0–10).
- **Coding practice:** LeetCode/GeeksforGeeks-style problems in an in-browser editor with test execution and AI hints.

**Outcome:** Practice under realistic conditions and track improvement over time.

### 5. Dashboard as your career command center
After sign-in, the dashboard surfaces:
- Resume ATS and career readiness scores
- Skill completion and roadmap progress
- Interview stats and streaks
- A **next best action** (e.g. upload resume → run skill gap → start mock interview)

**Outcome:** One place to see where you stand and what to do next.

---

## ✨ Overview

CareerPilot combines a modern web app with an **agentic AI backend**. Specialized agents handle resume analysis, skill gaps, roadmaps, and interviews — orchestrated so outputs from one step inform the next.

**Core capabilities:**
- **Resume Intelligence** with ATS scoring and keyword analysis
- **Skill Gap Analysis** with personalized recommendations
- **Career Roadmaps** with step-by-step milestones
- **AI Mock Interviews** with rubric-based evaluation
- **Coding Practice** with an integrated editor and AI hints

**Built with:** React 19, Node.js/Express, MySQL, and OpenAI/Gemini for AI agents.

---

## 🎯 Features

### 📄 Resume Intelligence
- AI-powered resume parsing and analysis
- ATS (Applicant Tracking System) compatibility scoring
- Role-specific improvement recommendations
- Skills extraction and categorization
- Improved professional summary generation
- Missing keyword detection for target roles
- Project and certification extraction for portfolio planning

### 🎯 Skill Gap Analysis
- Compares your current skills vs. target role requirements
- Identifies missing critical skills with priority levels
- Provides learning resources and estimated time to acquire skills
- Tracks existing strengths
- **Persists analysis history** so you can see trends in your match score over time

### 🗺️ Career Roadmaps
- Personalized step-by-step career roadmaps
- Short-term (0-3 months), medium-term (3-6 months), and long-term (6-12+ months) goals
- Actionable milestones with timelines
- **Server-backed task progress tracking** (persists across sessions and regenerations)

### 💬 AI Mock Interviews
- **5 Interview Types**: Technical, Behavioral, Mixed, System Design, Leadership
- **Adaptive Conversations**: AI adapts questions based on your responses
- **Rubric-Based Evaluation**: Strict scoring system (0-10 scale) with:
  - Relevance (0-3)
  - Conceptual Understanding (0-3)
  - Reasoning & Explanation (0-2)
  - Originality (0-2)
- **Real-time Feedback**: Instant performance analysis with strengths and improvements
- **Interview History**: Track your progress over time
- **Analytics Dashboard**: View average scores, trends, and completion rates

### 💻 Coding Practice
- **Problem Bank**: Questions from LeetCode, GeeksforGeeks, and custom problems
- **Integrated Code Editor**: Monaco Editor with syntax highlighting
- **Multiple Languages**: Python, JavaScript, Java, C++, and more
- **Code Execution**: Run code against test cases with instant feedback
- **AI-Powered Hints**: Get hints and explanations when stuck
- **Progress Tracking**: Track solved problems, accuracy, and attempts

## 🧱 Tech Stack

### Frontend
- **React 19** - UI framework
- **Tailwind CSS** - Utility-first styling
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing with protected routes
- **Monaco Editor** - In-browser code editor
- **Lucide React** - Icon library

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **MySQL 8.0+** - Relational database
- **JWT Auth** - Sign up, login, and protected API routes
- **Multer** - File upload handling
- **PDF-Parse** - Resume text extraction

### AI & Services
- **OpenAI / Google Gemini** - AI engine for all agents (configurable via `AI_PROVIDER`)
- **Antigravity Orchestrator** - Custom agent orchestration and chaining layer
- **Judge0/Piston API** - Code execution service (optional)
### Infrastructure
- **Vercel** - Frontend hosting
- **Render/Cloud Run** - Backend hosting
- **Cloud SQL/PlanetScale** - Database hosting

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **MySQL** 8.0+
- **OpenAI API Key** and/or **Google Gemini API Key** (at least one for full AI analysis; fallback scoring works without keys)

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/anuragthippani1/AI-CAREERPILOT.git
cd "AI CareerPilot"
```

2. **Install dependencies:**
```bash
npm run install-all
```

3. **Set up the database:**
```bash
# Option 1: Using MySQL command line
mysql -u root -p < database/schema.sql

# Option 2: Using the setup script
chmod +x setup_database.sh
./setup_database.sh

# Option 3: Seed sample coding questions (optional)
mysql -u root -p < database/seed_questions.sql
```

4. **Configure environment variables:**
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=careerpilot
DB_PORT=3306

# AI
GEMINI_API_KEY=your_gemini_api_key
AI_PROVIDER=openai
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o-mini

# Server
PORT=8000
FRONTEND_URL=http://localhost:3000

# Optional: Code Execution Service
CODE_EXECUTOR_API_URL=https://your-code-executor-api.com
```

5. **Start the development servers:**
```bash
npm run dev
```

This will start:
- **Backend API** on `http://localhost:8000`
- **Frontend** on `http://localhost:3000`

If `http://localhost:3000` is already in use, Vite may start the frontend on a different port (it will print the exact URL in the terminal).

### Tailwind / PostCSS note

If you see a Vite CSS error about using `tailwindcss` directly as a PostCSS plugin, make sure the client uses `@tailwindcss/postcss` (Tailwind v4+) and then restart the dev server.

### Stopping dev servers

To stop the running dev servers, press `Ctrl+C` in the terminal where `npm run dev` is running.

## 🧠 Architecture

### Agentic Architecture

CareerPilot uses a modular agent architecture where specialized AI agents handle different aspects of career development:

```
┌─────────────────────────────────────────────────┐
│         Antigravity Orchestrator                 │
│  (Context Management & Agent Chaining)            │
└─────────────────────────────────────────────────┘
         │
         ├─── Resume Analyzer Agent
         │    └─── Parses resumes, scores ATS, extracts skills
         │
         ├─── Skill Gap Agent
         │    └─── Compares skills, identifies gaps, recommends learning
         │
         ├─── Career Roadmap Agent
         │    └─── Generates personalized roadmaps with milestones
         │
         ├─── Interview Agent
         │    └─── Conducts adaptive interviews, evaluates with rubric
         │
         └─── Practice Agent
              └─── Provides hints, explanations, and recommendations
```

### Agent Flow

1. **Sign up / Log in** → Secure JWT session for your data
2. **Resume Upload** → Resume Analyzer extracts skills and scores ATS
3. **Skill Gap Analysis** → Compares current skills vs. target role
4. **Career Roadmap** → Generates personalized roadmap based on gaps
5. **Mock Interview** → Practices with AI, receives rubric-based feedback
6. **Coding Practice** → Solves problems, gets AI-powered hints

### Database Schema

Key tables:
- `users` - User accounts and profiles
- `resumes` - Resume data and analysis results
- `skills` - User skills and skill gap analysis
- `career_goals` - Career objectives and target roles
- `roadmaps` - Career roadmaps with milestones
- `interview_sessions` - Interview session data
- `coding_questions` - Coding problem bank
- `user_practice_sessions` - User coding practice history
- `agent_logs` - Agent execution logs for debugging

## 📡 API Endpoints

Most routes require authentication (`Authorization: Bearer <token>`).

### Auth
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Sign in
- `GET /api/auth/me` - Get current user

### Resume
- `POST /api/resume/analyze` - Analyze uploaded resume
- `GET /api/resume` - Get current user's latest resume analysis

### Skills
- `POST /api/skills/analyze` - Analyze skill gap
- `GET /api/skills` - Get user's skills
- `GET /api/skills/gap-analyses` - Skill gap analysis history

### Roadmap
- `GET /api/roadmap` - Get user's career roadmap
- `POST /api/roadmap/generate` - Generate new roadmap
- `GET /api/roadmap/tasks/progress` - Task completion state

### Interview
- `POST /api/interview/start` - Start new interview session
- `POST /api/interview/continue` - Continue interview with answer
- `GET /api/interview/sessions` - Get interview history

### Practice
- `GET /api/practice/questions` - Get coding questions (with filters)
- `GET /api/practice/questions/:id` - Get specific question
- `POST /api/practice/execute` - Execute code against test cases
- `POST /api/practice/submit` - Submit solution
- `GET /api/practice/progress` - Get user progress
- `POST /api/practice/hint` - Get AI-powered hint

### User
- `GET /api/user/me` - Get authenticated user profile
- `PUT /api/user/profile` - Update profile
- `GET /api/user/stats` - XP, level, streaks
- `GET /api/user/achievements` - Unlocked achievements

## 🚀 Deployment

### Frontend (Vercel)

1. **Install Vercel CLI:**
```bash
npm i -g vercel
```

2. **Deploy:**
```bash
cd client
vercel
```

Or connect your GitHub repository to Vercel for automatic deployments.

### Backend (Render/Cloud Run)

1. **Set environment variables** in your hosting platform:
   - Database credentials
   - `GEMINI_API_KEY`
   - `PORT` (default: 8000)
   - `FRONTEND_URL` (your Vercel URL)

2. **Deploy:**
   - **Render**: Connect GitHub repo, select Node.js, set build command: `npm install`
   - **Cloud Run**: Use Dockerfile or deploy directly

### Database (Cloud SQL/PlanetScale)

1. **Create MySQL instance** on your hosting platform
2. **Run schema:**
```bash
mysql -h <host> -u <user> -p < database/schema.sql
```
3. **Update `DB_HOST`** in backend environment variables

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed instructions.

## 🧪 Development

### Project Structure

```
.
├── client/                 # React frontend
│   ├── src/
│   │   ├── pages/         # Page components
│   │   │   ├── LandingPage.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── ResumeUpload.jsx
│   │   │   ├── SkillGap.jsx
│   │   │   ├── CareerRoadmap.jsx
│   │   │   ├── MockInterview.jsx
│   │   │   └── CodingPractice.jsx
│   │   ├── components/    # Reusable components
│   │   │   ├── CodeEditor.jsx
│   │   │   ├── QuestionPanel.jsx
│   │   │   └── TestResults.jsx
│   │   ├── services/      # API services
│   │   └── App.jsx        # Main app
│   └── package.json
├── server/                # Node.js backend
│   ├── agents/           # AI agents
│   │   ├── resumeAnalyzer.js
│   │   ├── skillGap.js
│   │   ├── careerRoadmap.js
│   │   ├── interview.js
│   │   ├── practice.js
│   │   └── orchestrator.js
│   ├── routes/           # API routes
│   ├── config/           # Configuration
│   │   ├── database.js
│   │   └── gemini.js
│   ├── services/         # Business logic
│   │   ├── questionBank.js
│   │   └── codeExecutor.js
│   └── utils/            # Utilities
│       └── logger.js
├── database/             # Database schemas
│   ├── schema.sql
│   └── seed_questions.sql
└── package.json          # Root package.json
```

### Running Tests

```bash
# Backend tests (when implemented)
npm test

# Frontend tests (when implemented)
cd client && npm test
```

### Code Style

- **ESLint** for code linting
- **Prettier** for code formatting
- Follow React and Node.js best practices

## 🎨 UI Design

CareerPilot uses a **premium dark SaaS UI** built for focus and clarity:

- **Layered dark theme** with subtle glass surfaces and depth
- **Responsive layout** from mobile to desktop
- **Dashboard-first experience** with progress rings, stats, and next-action guidance
- **Consistent motion system** with accessible reduced-motion support
- **Reusable component library** (cards, buttons, skeletons, empty states)

## 📊 Interview Evaluation

CareerPilot uses a **strict rubric-based evaluation system** for interview answers:

### Scoring Rubric (0-10 scale)

1. **Relevance (0-3)**: Does the answer directly address the question?
2. **Conceptual Understanding (0-3)**: Is the technical understanding correct?
3. **Reasoning & Explanation (0-2)**: Does the answer explain why/how?
4. **Originality (0-2)**: Is it expressed in the candidate's own words?

### Scoring Rules

- **Repeating/paraphrasing question** → Score ≤ 2
- **Vague or generic answer** → Score ≤ 4
- **Strong, well-reasoned answer** → Score ≥ 7

This ensures fair, accurate, and judge-credible evaluations.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- **Google Gemini** - AI engine powering all agents
- **Antigravity** - Custom agent orchestration layer
- **LeetCode & GeeksforGeeks** - Coding problem sources
- **Vercel** - Frontend hosting
- **Render** - Backend hosting

## 📧 Contact

- **GitHub**: [@anuragthippani1](https://github.com/anuragthippani1)
- **Project**: [AI-CAREERPILOT](https://github.com/anuragthippani1/AI-CAREERPILOT)

---

<div align="center">

**Built with ❤️ by Anurag Thippani**

⭐ Star this repo if you find it helpful!

</div>
