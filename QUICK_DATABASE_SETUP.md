# Quick MySQL Database Setup Guide

## 🎯 Goal

Create the `careerpilot` database with all required tables.

---

## Step 1: Check if MySQL is Installed

### On macOS:

```bash
# Check if MySQL is installed
which mysql

# Or check if it's running
brew services list | grep mysql
```

### If MySQL is NOT installed:

**Option A: Install via Homebrew (Recommended)**

```bash
# Install MySQL
brew install mysql

# Start MySQL service
brew services start mysql

# Set root password (optional, but recommended)
mysql_secure_installation
```

**Option B: Download MySQL Installer**

- Go to: https://dev.mysql.com/downloads/mysql/
- Download MySQL Community Server for macOS
- Install and set root password during installation

---

## Step 2: Create the Database

### Method 1: Using SQL File (Easiest)

```bash
# Navigate to project directory (if not already there)
cd "/Users/anuragthippani/Documents/programs/AI CareerPilot"

# Run the schema file
mysql -u root -p < database/schema.sql
```

**What this does:**

- Prompts for MySQL root password
- Creates `careerpilot` database
- Creates all 7 tables automatically

### Method 2: Manual SQL Commands

```bash
# Open MySQL
mysql -u root -p
```

Then run these commands:

```sql
-- Create database
CREATE DATABASE IF NOT EXISTS careerpilot;

-- Use the database
USE careerpilot;

-- Run the schema (if you're in MySQL prompt)
SOURCE database/schema.sql;

-- Or copy-paste the entire schema.sql content

-- Verify tables were created
SHOW TABLES;

-- Should show:
-- users
-- resumes
-- skills
-- career_goals
-- roadmaps
-- interview_sessions
-- agent_logs

-- Exit MySQL
EXIT;
```

### Method 3: Using MySQL Workbench (GUI)

1. Open MySQL Workbench
2. Connect to your MySQL server
3. Click "File" → "Open SQL Script"
4. Select `database/schema.sql`
5. Click the "Execute" button (lightning bolt icon)
6. Verify tables in the left sidebar

---

## Step 3: Verify Setup

```bash
# Check if database exists
mysql -u root -p -e "SHOW DATABASES LIKE 'careerpilot';"

# Check if tables exist
mysql -u root -p -e "USE careerpilot; SHOW TABLES;"
```

**Expected output:**

```
+----------------------+
| Tables_in_careerpilot|
+----------------------+
| agent_logs          |
| career_goals        |
| interview_sessions  |
| resumes             |
| roadmaps            |
| skills              |
| users               |
+----------------------+
7 rows in set
```

---

## Step 4: Update .env File

After database is created, update your `.env` file:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_root_password_here
DB_NAME=careerpilot
DB_PORT=3306
```

**Important:** Replace `your_mysql_root_password_here` with your actual MySQL root password.

If you don't have a password set, leave it empty:

```env
DB_PASSWORD=
```

---

## Step 5: Test Connection

Restart your backend server:

```bash
# Stop current server (Ctrl+C or kill process)
# Then restart:
npm run dev
```

**Check backend console for:**

- ✅ `✅ Database connected successfully` = SUCCESS!
- ❌ `❌ Database connection error: ...` = Check password/credentials

---

## 🐛 Troubleshooting

### Problem: "mysql: command not found"

**Solution:**

- MySQL is not installed or not in PATH
- Install MySQL (see Step 1)
- Or use full path: `/usr/local/mysql/bin/mysql -u root -p`

### Problem: "Access denied for user 'root'"

**Solution:**

- Wrong password
- Try: `mysql -u root` (no password)
- Or reset password: https://dev.mysql.com/doc/refman/8.0/en/resetting-permissions.html

### Problem: "Can't connect to MySQL server"

**Solution:**

- MySQL service not running
- Start it: `brew services start mysql` (macOS)
- Or: `sudo systemctl start mysql` (Linux)

### Problem: "Database 'careerpilot' already exists"

**Solution:**

- Database already created (that's fine!)
- Just verify tables: `mysql -u root -p -e "USE careerpilot; SHOW TABLES;"`

### Problem: "Table already exists"

**Solution:**

- Tables already created (that's fine!)
- Or drop and recreate:
  ```sql
  DROP DATABASE careerpilot;
  CREATE DATABASE careerpilot;
  USE careerpilot;
  SOURCE database/schema.sql;
  ```

---

## ✅ Quick Checklist

- [ ] MySQL is installed
- [ ] MySQL service is running
- [ ] Database `careerpilot` created
- [ ] All 7 tables created
- [ ] `.env` file updated with password
- [ ] Backend shows "✅ Database connected successfully"

---

## 🎉 After Setup

Once database is set up:

1. **Test the application:**

   - Open: http://localhost:3000
   - Click "Get Started"
   - Upload a resume
   - Should work end-to-end!

2. **Verify data persistence:**
   - Upload resume
   - Check database: `mysql -u root -p -e "USE careerpilot; SELECT * FROM resumes;"`
   - Should see your resume data

---

## 📝 Common Commands Reference

```bash
# Start MySQL service
brew services start mysql

# Stop MySQL service
brew services stop mysql

# Check MySQL status
brew services list | grep mysql

# Connect to MySQL
mysql -u root -p

# Show all databases
mysql -u root -p -e "SHOW DATABASES;"

# Show tables in careerpilot
mysql -u root -p -e "USE careerpilot; SHOW TABLES;"

# View resume data
mysql -u root -p -e "USE careerpilot; SELECT * FROM resumes;"
```

---

## 🆘 Still Having Issues?

1. **Check MySQL is running:**

   ```bash
   ps aux | grep mysql
   ```

2. **Check MySQL port:**

   ```bash
   lsof -i :3306
   ```

3. **View MySQL error logs:**

   ```bash
   tail -f /usr/local/var/mysql/*.err
   # Or
   tail -f /opt/homebrew/var/mysql/*.err
   ```

4. **Test connection manually:**
   ```bash
   mysql -u root -p -e "SELECT 1;"
   ```

If this works, MySQL is fine. The issue is likely with the database creation or `.env` configuration.







