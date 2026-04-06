# CareerPilot - Requirements & Setup Checklist

## 🔧 System Requirements

### Software Prerequisites
- **Node.js** 18+ (with npm)
- **MySQL** 8.0+ (or access to a MySQL database)
- **Git** (for version control)

### Check Your System
```bash
# Check Node.js version
node --version  # Should be 18.x or higher

# Check npm version
npm --version

# Check MySQL
mysql --version  # Should be 8.0 or higher
```

## 🔑 Required API Keys & Credentials

### 1. Google Gemini API Key (REQUIRED)
- **Where to get it**: https://makersuite.google.com/app/apikey
- **Steps**:
  1. Sign in with Google account
  2. Click "Create API Key"
  3. Copy the API key
- **Usage**: Powers all AI agents (Resume Analyzer, Skill Gap, Roadmap, Interview)
- **Cost**: Free tier available with usage limits

### 2. MySQL Database Credentials (REQUIRED)
- **Database Host**: Usually `localhost` for local development
- **Database User**: Your MySQL username (usually `root`)
- **Database Password**: Your MySQL password
- **Database Name**: `careerpilot` (will be created by schema)
- **Database Port**: Usually `3306`

## 📝 Environment Variables Setup

Create a `.env` file in the root directory with:

```env
# Server Configuration
PORT=8000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=careerpilot
DB_PORT=3306

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key_here

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

## 📦 Installation Steps

### Step 1: Install Dependencies
```bash
# Install root dependencies
npm install

# Install client dependencies
cd client && npm install && cd ..
```

Or use the setup script:
```bash
chmod +x setup.sh
./setup.sh
```

### Step 2: Set Up Database
```bash
# Create database and tables
mysql -u root -p < database/schema.sql
```

Or manually:
```bash
mysql -u root -p
CREATE DATABASE careerpilot;
USE careerpilot;
SOURCE database/schema.sql;
```

### Step 3: Configure Environment
```bash
# Create .env file
cp .env.example .env  # If .env.example exists
# Or create .env manually with the variables above
```

### Step 4: Verify Setup
```bash
# Check if database is accessible
mysql -u root -p -e "USE careerpilot; SHOW TABLES;"

# Should show: users, resumes, skills, career_goals, roadmaps, interview_sessions, agent_logs
```

## ✅ Pre-Launch Checklist

Before running the application, ensure:

- [ ] Node.js 18+ installed
- [ ] MySQL 8.0+ installed and running
- [ ] Database `careerpilot` created
- [ ] All tables created (run schema.sql)
- [ ] `.env` file created with all variables
- [ ] Gemini API key obtained and added to `.env`
- [ ] MySQL credentials correct in `.env`
- [ ] All npm packages installed (`npm install` in root and client)
- [ ] Ports 3000 and 8000 available

## 🚀 Running the Application

```bash
# Start both frontend and backend
npm run dev

# Or start separately:
npm run server  # Backend on port 8000
npm run client  # Frontend on port 3000
```

## 🐛 Troubleshooting Common Issues

### Issue: "Cannot find module"
**Solution**: Run `npm install` in both root and `client/` directories

### Issue: "Database connection error"
**Solution**: 
- Check MySQL is running: `mysql -u root -p`
- Verify credentials in `.env`
- Ensure database exists: `SHOW DATABASES;`

### Issue: "GEMINI_API_KEY not found"
**Solution**: 
- Get API key from https://makersuite.google.com/app/apikey
- Add to `.env` file
- Restart server

### Issue: "Port already in use"
**Solution**: 
- Change `PORT` in `.env` (backend)
- Or change port in `client/vite.config.js` (frontend)
- Kill process using the port

### Issue: "CORS error"
**Solution**: 
- Verify `FRONTEND_URL` in `.env` matches your frontend URL
- Check CORS settings in `server/index.js`

## 📊 Optional Requirements (for Production)

### For Deployment:
- **Vercel account** (for frontend) OR **Firebase Hosting**
- **Render account** (for backend) OR **Google Cloud Run**
- **Cloud SQL** (for database) OR managed MySQL service
- **Domain name** (optional)

### For Enhanced Features:
- **Email service** (SendGrid, Mailgun) - for notifications
- **File storage** (AWS S3, Google Cloud Storage) - for resume storage
- **Authentication service** (Auth0, Firebase Auth) - for user auth
- **Monitoring** (Sentry, LogRocket) - for error tracking

## 🎯 Minimum Viable Setup

To get started quickly, you only need:
1. ✅ Node.js installed
2. ✅ MySQL installed and running
3. ✅ Gemini API key
4. ✅ `.env` file configured
5. ✅ Database schema run

Everything else will be installed via `npm install`!

## 📞 Need Help?

- Check `QUICKSTART.md` for step-by-step guide
- Check `README.md` for full documentation
- Check `DEPLOYMENT.md` for production deployment

