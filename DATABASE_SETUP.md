# Database Setup Instructions

## ✅ Gemini API: Already Configured!

Your Gemini API key is set up and working.

## 🗄️ MySQL Database Setup

### Option 1: If MySQL is installed

Run this command:
```bash
mysql -u root -p < database/schema.sql
```

Or use the setup script:
```bash
./setup_database.sh
```

### Option 2: Manual Setup

1. Open MySQL:
   ```bash
   mysql -u root -p
   ```

2. Create database:
   ```sql
   CREATE DATABASE careerpilot;
   USE careerpilot;
   SOURCE database/schema.sql;
   SHOW TABLES;
   EXIT;
   ```

3. Verify tables created:
   ```bash
   mysql -u root -p -e "USE careerpilot; SHOW TABLES;"
   ```

   Should show:
   - users
   - resumes
   - skills
   - career_goals
   - roadmaps
   - interview_sessions
   - agent_logs

### Option 3: If MySQL is not installed

**macOS:**
```bash
brew install mysql
brew services start mysql
```

**Linux:**
```bash
sudo apt-get install mysql-server
sudo systemctl start mysql
```

**Windows:**
- Download MySQL Installer from: https://dev.mysql.com/downloads/installer/

### After Database Setup

1. Update `.env` with your MySQL password (if you have one):
   ```env
   DB_PASSWORD=your_mysql_password
   ```

2. Restart backend (if needed):
   ```bash
   # Kill existing process
   pkill -f "node server/index.js"
   
   # Start fresh
   npm run dev
   ```

3. Check connection:
   - Backend console should show: "✅ Database connected successfully"
   - If you see "❌ Database connection error", check your password

## 🎯 Quick Test

Once database is set up, test the full flow:

1. Open: http://localhost:3000
2. Click "Get Started"
3. Upload a resume
4. Should see AI analysis (Gemini working!)
5. Data should save to database

## ✅ Final Status

After database setup:
- ✅ Gemini API: Configured
- ✅ MySQL Database: Connected
- ✅ Backend: Running
- ✅ Frontend: Running

**You're ready for demo! 🎉**








