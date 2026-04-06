# Minimum Demo Implementation Guide

## 🎯 ONE END-TO-END FLOW

**Resume Upload → AI Analysis → Skill Gap → Roadmap Summary**

---

## ✅ WHAT'S ALREADY BUILT

### Backend (100% Complete)
- ✅ Express server with all routes
- ✅ 4 AI agents (Resume, Skill Gap, Roadmap, Interview)
- ✅ Agent orchestrator
- ✅ File upload handling
- ✅ Database schema

### Frontend (100% Complete)
- ✅ All 6 pages with UI
- ✅ API service layer
- ✅ Navigation and routing

### What's Missing
- ⚠️ Database setup (10 min)
- ⚠️ Gemini API key (5 min)
- ⚠️ Testing the flow (15 min)

---

## 🚀 30-MINUTE SETUP

### Step 1: Database (10 min)
```bash
# Create database
mysql -u root -p
CREATE DATABASE careerpilot;
USE careerpilot;
SOURCE database/schema.sql;
EXIT;

# Verify
mysql -u root -p -e "USE careerpilot; SHOW TABLES;"
# Should show: users, resumes, skills, career_goals, roadmaps, interview_sessions, agent_logs
```

### Step 2: API Key (5 min)
1. Go to: https://makersuite.google.com/app/apikey
2. Create API key
3. Add to `.env`:
```env
GEMINI_API_KEY=your_key_here
DB_PASSWORD=your_mysql_password
```

### Step 3: Test (15 min)
```bash
# Restart server
npm run dev

# Test in browser:
# 1. http://localhost:3000
# 2. Click "Get Started"
# 3. Upload resume
# 4. Enter target role
# 5. View results
```

---

## 📋 API ENDPOINTS (ALREADY IMPLEMENTED)

### Flow 1: Resume Analysis
```
POST /api/resume/analyze
Content-Type: multipart/form-data
Body: {
  resume: File,
  userId: 1,
  targetRole: "Senior Software Engineer"
}

Response:
{
  "success": true,
  "data": {
    "resumeId": 1,
    "analysis": {
      "atsScore": 75,
      "skills": ["JavaScript", "React"],
      "strengths": [...],
      "improvements": [...]
    }
  }
}
```

### Flow 2: Skill Gap (Auto-triggered after resume)
```
POST /api/skills/analyze
Body: {
  userId: 1,
  resumeAnalysis: {...}
}

Response:
{
  "success": true,
  "data": {
    "currentMatchPercentage": 65,
    "missingCritical": [
      {
        "skill": "AWS",
        "priority": 9,
        "learningResources": [...]
      }
    ]
  }
}
```

### Flow 3: Roadmap (Auto-triggered after skill gap)
```
POST /api/roadmap/generate
Body: {
  userId: 1,
  skillGap: {...}
}

Response:
{
  "success": true,
  "data": {
    "roadmap": {
      "shortTerm": [...],
      "mediumTerm": [...],
      "longTerm": [...]
    }
  }
}
```

---

## 🎨 UI FLOW (ALREADY IMPLEMENTED)

### Screen 1: Landing → Dashboard
- User clicks "Get Started"
- Navigates to `/dashboard`
- Shows empty state (no resume yet)

### Screen 2: Dashboard → Resume Upload
- User clicks "Resume Analysis"
- Navigates to `/resume`
- Upload form appears

### Screen 3: Resume Upload → Analysis
- User uploads file + enters target role
- Clicks "Analyze Resume"
- Loading state shows
- Results display:
  - ATS Score (big number)
  - Skills extracted (list)
  - Strengths (list)
  - Improvements (list)
- Auto-navigates to `/skills` after 2 seconds

### Screen 4: Skill Gap Analysis
- Auto-loads (or user enters target role)
- Shows:
  - Match percentage
  - Missing critical skills
  - Learning resources
- Button: "Generate Career Roadmap"

### Screen 5: Career Roadmap
- Auto-generates or loads
- Shows:
  - Short-term milestones (0-3 months)
  - Medium-term milestones (3-6 months)
  - Long-term milestones (6-12 months)
  - Action items per milestone

---

## 🔧 WHAT TO FIX IF BROKEN

### Problem: "Database connection error"
**Solution**:
```bash
# Check MySQL is running
mysql -u root -p

# Verify database exists
SHOW DATABASES;

# Re-run schema
mysql -u root -p careerpilot < database/schema.sql
```

### Problem: "GEMINI_API_KEY not found"
**Solution**:
```bash
# Check .env file exists
cat .env

# Add key if missing
echo "GEMINI_API_KEY=your_key" >> .env

# Restart server
```

### Problem: "File upload fails"
**Solution**:
```bash
# Ensure uploads directory exists
mkdir -p uploads

# Check permissions
chmod 755 uploads
```

### Problem: "Agent returns error"
**Solution**:
- Check server console for error messages
- Verify Gemini API key is valid
- Check internet connection
- Verify API quota not exceeded

---

## 🎯 DEMO CHECKLIST

Before demo:
- [ ] Database created and tables exist
- [ ] Gemini API key in `.env`
- [ ] Backend running on port 8000
- [ ] Frontend running on port 3000
- [ ] Test resume file ready (PDF or TXT)
- [ ] Test flow: Upload → Analyze → View results

During demo:
- [ ] Show landing page
- [ ] Upload resume
- [ ] Show AI analysis (ATS score, skills)
- [ ] Show skill gap analysis
- [ ] Show generated roadmap
- [ ] Explain agent architecture (if time)

---

## 📊 EXPECTED RESPONSE TIMES

- Resume upload: 2-5 seconds
- Gemini analysis: 3-8 seconds
- Skill gap: 3-8 seconds
- Roadmap: 5-10 seconds

**Total flow time**: ~15-30 seconds

---

## 🎉 SUCCESS INDICATORS

✅ **Working Demo**:
- Resume uploads successfully
- Real AI analysis appears (not hardcoded)
- Skills are extracted from resume
- Skill gap shows real missing skills
- Roadmap has personalized milestones
- Data persists (refresh page, data still there)

❌ **Not Working**:
- Hardcoded responses
- No database persistence
- API errors in console
- Empty results

---

## 🚨 CRITICAL PATH

**Minimum to show judges**:
1. Upload resume → Real AI analysis
2. Set target role → Real skill gap
3. Generate roadmap → Real milestones

**Everything else is bonus** (interview, advanced features, etc.)

---

## 💡 HACKATHON TIPS

1. **Have a backup**: If Gemini API fails, have sample JSON responses ready
2. **Show agent logs**: Display `agent_logs` table to prove agentic architecture
3. **Explain the flow**: "4 specialized agents orchestrated together"
4. **Highlight AI**: "Real AI, not hardcoded responses"
5. **Show persistence**: Refresh page, data still there

---

## 📝 FINAL CHECK

Run this before demo:
```bash
# 1. Check database
mysql -u root -p -e "USE careerpilot; SELECT COUNT(*) FROM users;"

# 2. Check API
curl http://localhost:8000/api/health

# 3. Check frontend
curl http://localhost:3000

# 4. Test upload (if possible)
# Upload a test resume through UI
```

**If all 4 work → You're ready for demo! 🎉**








