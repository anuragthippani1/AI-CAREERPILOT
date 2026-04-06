# CareerPilot Quick Start Guide

## 🚀 5-Minute Setup

### Step 1: Install Dependencies

```bash
# Run the setup script
./setup.sh

# Or manually:
npm install
cd client && npm install && cd ..
```

### Step 2: Database Setup

```bash
# Create MySQL database
mysql -u root -p < database/schema.sql

# Or manually:
mysql -u root -p
CREATE DATABASE careerpilot;
USE careerpilot;
SOURCE database/schema.sql;
```

### Step 3: Configure Environment

```bash
# Copy and edit .env file
cp .env.example .env

# Edit .env with:
# - Database credentials
# - Google Gemini API key (get from https://makersuite.google.com/app/apikey)
```

### Step 4: Start Development Servers

```bash
npm run dev
```

This starts:
- **Backend**: http://localhost:8000
- **Frontend**: http://localhost:3000

## 🎯 First Use Flow

1. **Landing Page** → Click "Get Started"
2. **Dashboard** → Upload Resume
3. **Resume Analysis** → View ATS score and insights
4. **Skill Gap** → Set target role and analyze gaps (analysis is now saved and trends are visible)
5. **Roadmap** → Generate personalized career roadmap (task completion is persisted server-side)
6. **Interview** → Practice with AI mock interviews

## 🔑 Getting Gemini API Key

1. Visit: https://makersuite.google.com/app/apikey
2. Sign in with Google account
3. Create new API key
4. Copy and paste into `.env` as `GEMINI_API_KEY`

## 🐛 Troubleshooting

### Database Connection Error
- Check MySQL is running: `mysql -u root -p`
- Verify credentials in `.env`
- Ensure database exists: `SHOW DATABASES;`

### Port Already in Use
- Change `PORT` in `.env` (backend)
- Change port in `client/vite.config.js` (frontend)

### Gemini API Errors
- Verify API key is correct
- Check API quota/limits
- Ensure internet connection

### File Upload Issues
- Check `uploads/` directory exists
- Verify file size < 10MB
- Ensure file type is PDF, TXT, or DOC

## 📚 Next Steps

- Read full [README.md](./README.md)
- Explore agent architecture
- Customize for your use case
- Deploy to production

