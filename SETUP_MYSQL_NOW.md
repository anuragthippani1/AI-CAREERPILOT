# MySQL Setup - Step by Step

## 🎯 Current Status
MySQL is not installed or not in your PATH.

---

## Option 1: Install MySQL via Homebrew (Recommended for macOS)

### Step 1: Install MySQL
```bash
brew install mysql
```

### Step 2: Start MySQL Service
```bash
brew services start mysql
```

### Step 3: Set Root Password (Optional but Recommended)
```bash
mysql_secure_installation
```
Follow the prompts to set a password.

### Step 4: Create CareerPilot Database
```bash
cd "/Users/anuragthippani/Documents/programs/AI CareerPilot"
mysql -u root -p < database/schema.sql
```
Enter your MySQL root password when prompted.

### Step 5: Update .env File
Edit `.env` and add your MySQL password:
```env
DB_PASSWORD=your_mysql_password_here
```

---

## Option 2: Install MySQL via Official Installer

1. **Download MySQL:**
   - Go to: https://dev.mysql.com/downloads/mysql/
   - Download "MySQL Community Server" for macOS
   - Choose the DMG Archive version

2. **Install MySQL:**
   - Open the downloaded DMG file
   - Run the installer
   - **Important:** Remember the root password you set during installation!

3. **Add MySQL to PATH:**
   ```bash
   # Add to ~/.zshrc or ~/.bash_profile
   export PATH="/usr/local/mysql/bin:$PATH"
   
   # Then reload:
   source ~/.zshrc
   ```

4. **Create Database:**
   ```bash
   cd "/Users/anuragthippani/Documents/programs/AI CareerPilot"
   mysql -u root -p < database/schema.sql
   ```

5. **Update .env:**
   ```env
   DB_PASSWORD=the_password_you_set_during_installation
   ```

---

## Option 3: Use MySQL Without Installation (Docker)

If you have Docker installed:

```bash
# Start MySQL in Docker
docker run --name careerpilot-mysql \
  -e MYSQL_ROOT_PASSWORD=rootpassword \
  -e MYSQL_DATABASE=careerpilot \
  -p 3306:3306 \
  -d mysql:8.0

# Wait a few seconds for MySQL to start
sleep 5

# Create tables
docker exec -i careerpilot-mysql mysql -uroot -prootpassword < database/schema.sql
```

Then update `.env`:
```env
DB_PASSWORD=rootpassword
```

---

## Quick Setup Script (After MySQL is Installed)

Once MySQL is installed, run this:

```bash
# Make sure you're in the project directory
cd "/Users/anuragthippani/Documents/programs/AI CareerPilot"

# Create database (will prompt for password)
mysql -u root -p < database/schema.sql

# Or if no password:
mysql -u root < database/schema.sql
```

---

## Verify Installation

After installing MySQL, verify it works:

```bash
# Test MySQL connection
mysql -u root -p -e "SELECT VERSION();"

# Should show MySQL version number
```

---

## After Database is Created

1. **Verify tables:**
   ```bash
   mysql -u root -p -e "USE careerpilot; SHOW TABLES;"
   ```

   Should show 7 tables:
   - users
   - resumes
   - skills
   - career_goals
   - roadmaps
   - interview_sessions
   - agent_logs

2. **Update .env file:**
   ```env
   DB_PASSWORD=your_mysql_password
   ```

3. **Restart backend:**
   ```bash
   # Kill existing process
   pkill -f "node server/index.js"
   
   # Start fresh
   npm run dev
   ```

4. **Check backend console:**
   - Should see: `✅ Database connected successfully`
   - If you see error, check password in `.env`

---

## 🎯 Recommended: Use Homebrew (Easiest)

```bash
# 1. Install MySQL
brew install mysql

# 2. Start MySQL
brew services start mysql

# 3. Create database
cd "/Users/anuragthippani/Documents/programs/AI CareerPilot"
mysql -u root -p < database/schema.sql
# (Enter password when prompted, or just press Enter if no password)

# 4. Update .env
# Edit .env and set DB_PASSWORD=your_password (or leave empty if no password)

# 5. Restart backend
npm run dev
```

---

## ✅ Success Indicators

After setup, you should see:
- ✅ MySQL service running
- ✅ Database `careerpilot` exists
- ✅ 7 tables created
- ✅ Backend shows "✅ Database connected successfully"
- ✅ No errors in backend console

---

## 🆘 Need Help?

If you encounter issues:
1. Check MySQL is running: `brew services list | grep mysql`
2. Check MySQL logs: `tail -f /usr/local/var/mysql/*.err`
3. Test connection: `mysql -u root -p -e "SELECT 1;"`








