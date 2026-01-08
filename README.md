# 🚀 CareerPilot - AI Career Operating System

<div align="center">

![CareerPilot](https://img.shields.io/badge/CareerPilot-AI%20Career%20OS-blue?style=for-the-badge)
![React](https://img.shields.io/badge/React-18.2.0-61DAFB?style=for-the-badge&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-Express-green?style=for-the-badge&logo=node.js)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql)
![Gemini](https://img.shields.io/badge/Google-Gemini-4285F4?style=for-the-badge&logo=google)

**Transform your career growth into a structured, data-driven journey with AI-powered insights and practice.**

[Features](#-features) • [Quick Start](#-quick-start) • [Architecture](#-architecture) • [API](#-api-endpoints) • [Deployment](#-deployment)

</div>

---

## ✨ Overview

CareerPilot is an AI-powered Career Operating System that helps professionals prepare for interviews, analyze their skills, and build personalized career roadmaps. Built with a modern tech stack and agentic AI architecture, it provides:

- **Resume Intelligence** with ATS scoring
- **Skill Gap Analysis** with personalized recommendations
- **Career Roadmaps** with step-by-step milestones
- **AI Mock Interviews** with rubric-based evaluation
- **Coding Practice** with problems from LeetCode & GeeksforGeeks

## 🎯 Features

### 📄 Resume Intelligence
- AI-powered resume parsing and analysis
- ATS (Applicant Tracking System) compatibility scoring
- Role-specific improvement recommendations
- Skills extraction and categorization

### 🎯 Skill Gap Analysis
- Compares your current skills vs. target role requirements
- Identifies missing critical skills with priority levels
- Provides learning resources and estimated time to acquire skills
- Tracks existing strengths

### 🗺️ Career Roadmaps
- Personalized step-by-step career roadmaps
- Short-term (0-3 months), medium-term (3-6 months), and long-term (6-12+ months) goals
- Actionable milestones with timelines
- Progress tracking

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
- **React 18.2.0** - UI framework
- **Tailwind CSS** - Utility-first CSS framework
- **Vite** - Build tool and dev server
- **Monaco Editor** - Code editor component
- **Lucide React** - Icon library

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **MySQL 8.0+** - Relational database
- **Multer** - File upload handling
- **PDF-Parse** - Resume parsing

### AI & Services
- **Google Gemini 2.0 Flash Lite** - AI engine for all agents
- **Antigravity Orchestrator** - Custom agent orchestration layer
- **Judge0/Piston API** - Code execution service (optional)

- 
### Infrastructure
- **Vercel** - Frontend hosting
- **Render/Cloud Run** - Backend hosting
- **Cloud SQL/PlanetScale** - Database hosting

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **MySQL** 8.0+
- **Google Gemini API Key** ([Get one here](https://makersuite.google.com/app/apikey))

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

1. **Resume Upload** → Resume Analyzer extracts skills and scores ATS
2. **Skill Gap Analysis** → Compares current skills vs. target role
3. **Career Roadmap** → Generates personalized roadmap based on gaps
4. **Mock Interview** → Practices with AI, receives rubric-based feedback
5. **Coding Practice** → Solves problems, gets AI-powered hints

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

### Resume
- `POST /api/resume/analyze` - Analyze uploaded resume
- `GET /api/resume/:userId` - Get user's resume analysis

### Skills
- `POST /api/skills/analyze` - Analyze skill gap
- `GET /api/skills/:userId` - Get user's skill gap analysis

### Roadmap
- `GET /api/roadmap/:userId` - Get user's career roadmap
- `POST /api/roadmap/generate` - Generate new roadmap

### Interview
- `POST /api/interview/start` - Start new interview session
- `POST /api/interview/continue` - Continue interview with answer
- `GET /api/interview/sessions/:userId` - Get interview history

### Practice
- `GET /api/practice/questions` - Get coding questions (with filters)
- `GET /api/practice/questions/:id` - Get specific question
- `POST /api/practice/execute` - Execute code against test cases
- `POST /api/practice/submit` - Submit solution
- `GET /api/practice/progress/:userId` - Get user progress
- `POST /api/practice/hint` - Get AI-powered hint

### User
- `POST /api/user/create` - Create new user
- `POST /api/user/goal` - Set career goal
- `GET /api/user/:userId` - Get user profile

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

CareerPilot features a clean, modern SaaS design inspired by professional career platforms:

- **Clean Light Theme**: White/gray backgrounds with subtle shadows
- **Professional Typography**: Inter font family throughout
- **Responsive Design**: Mobile-first approach with breakpoints
- **Consistent Components**: Reusable card components with hover states
- **Modern Buttons**: Dark gray primary buttons with smooth transitions

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
