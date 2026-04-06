# 🚀 Quick Deployment Guide

## Frontend → Vercel (5 minutes)

1. **Go to [vercel.com](https://vercel.com)** and sign in with GitHub
2. **Click "New Project"**
3. **Import repository**: `anuragthippani1/AI-CAREERPILOT`
4. **Configure**:
   - Framework: **Vite**
   - Root Directory: **`client`**
   - Build Command: **`npm run build`**
   - Output Directory: **`dist`**
5. **Add Environment Variable**:
   - Key: `VITE_API_URL`
   - Value: `https://your-backend-url.onrender.com/api` (add after backend is deployed)
6. **Click "Deploy"**

✅ Frontend will be live at: `https://your-app.vercel.app`

---

## Backend → Render.com (10 minutes)

1. **Go to [render.com](https://render.com)** and sign in with GitHub
2. **Click "New +" → "Web Service"**
3. **Connect repository**: `anuragthippani1/AI-CAREERPILOT`
4. **Configure**:
   - Name: `careerpilot-backend`
   - Environment: **Node**
   - Build Command: **`npm install`**
   - Start Command: **`node server/index.js`**
   - Plan: **Free** (or Starter for better performance)
5. **Add Environment Variables**:
   ```
   NODE_ENV=production
   PORT=8000
   DB_HOST=your-database-host
   DB_USER=your-database-user
   DB_PASSWORD=your-database-password
   DB_NAME=careerpilot
   DB_PORT=3306
   GEMINI_API_KEY=your_gemini_api_key_here
   FRONTEND_URL=https://your-app.vercel.app
   ```
6. **Click "Create Web Service"**

✅ Backend will be live at: `https://careerpilot-backend.onrender.com`

---

## Database Setup

### Option 1: Render PostgreSQL (Free)
1. Create PostgreSQL database on Render
2. Note connection string
3. Update backend env vars

### Option 2: Cloud SQL MySQL
1. Create MySQL instance
2. Run: `mysql -h HOST -u USER -p < database/schema.sql`
3. Update backend env vars

### Option 3: PlanetScale (Free MySQL)
1. Create database at [planetscale.com](https://planetscale.com)
2. Run schema migration
3. Update connection string

---

## Update Frontend API URL

After backend is deployed:
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Update `VITE_API_URL` to: `https://careerpilot-backend.onrender.com/api`
3. Redeploy frontend

---

## Test Deployment

Visit your Vercel URL and test:
- ✅ Landing page loads
- ✅ Dashboard shows
- ✅ Resume upload works
- ✅ Mock interview works

---

## Troubleshooting

**Frontend can't connect to backend?**
- Check `VITE_API_URL` in Vercel
- Verify backend is running (check Render logs)
- Check CORS settings in backend

**Database errors?**
- Verify database credentials
- Check database is accessible
- Ensure schema is migrated

**Need help?** Check full guide: `DEPLOYMENT_GUIDE.md`








