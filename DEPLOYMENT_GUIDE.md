# 🚀 CareerPilot Deployment Guide

This guide will help you deploy CareerPilot to production.

## Deployment Architecture

- **Frontend**: Vercel (React/Vite)
- **Backend**: Render.com or Google Cloud Run (Node.js/Express)
- **Database**: Cloud SQL (MySQL) or Render PostgreSQL (can be adapted)

## Prerequisites

1. GitHub repository: `https://github.com/anuragthippani1/AI-CAREERPILOT.git`
2. Vercel account (free tier available)
3. Render.com account (free tier available) OR Google Cloud account
4. Google Gemini API key
5. MySQL database (Cloud SQL or managed MySQL)

---

## Step 1: Deploy Frontend to Vercel

### Option A: Deploy via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository: `anuragthippani1/AI-CAREERPILOT`
4. Configure:

   - **Framework Preset**: Vite
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

5. Add Environment Variable:

   - **Key**: `VITE_API_URL`
   - **Value**: `https://your-backend-url.onrender.com/api` (update after backend deployment)

6. Click "Deploy"

### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
cd client
vercel --prod
```

---

## Step 2: Deploy Backend to Render.com

### Setup Render Service

1. Go to [render.com](https://render.com) and sign in
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:

   - **Name**: `careerpilot-backend`
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server/index.js`
   - **Plan**: Free (or paid for better performance)

5. Add Environment Variables:

   ```
   NODE_ENV=production
   PORT=8000
   DB_HOST=your-db-host
   DB_USER=your-db-user
   DB_PASSWORD=your-db-password
   DB_NAME=careerpilot
   DB_PORT=3306
   GEMINI_API_KEY=your_gemini_api_key
   FRONTEND_URL=https://your-vercel-app.vercel.app
   ```

6. Click "Create Web Service"

### Alternative: Deploy to Google Cloud Run

```bash
# Build Docker image
docker build -t gcr.io/YOUR_PROJECT_ID/careerpilot .

# Push to Google Container Registry
docker push gcr.io/YOUR_PROJECT_ID/careerpilot

# Deploy to Cloud Run
gcloud run deploy careerpilot \
  --image gcr.io/YOUR_PROJECT_ID/careerpilot \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

---

## Step 3: Setup Database

### Option A: Cloud SQL (Google Cloud)

1. Create Cloud SQL MySQL instance
2. Create database: `careerpilot`
3. Run schema: `mysql -h YOUR_HOST -u USER -p < database/schema.sql`
4. Update backend environment variables with Cloud SQL connection details

### Option B: Render PostgreSQL (Adapt Schema)

1. Create PostgreSQL database on Render
2. Adapt MySQL schema to PostgreSQL
3. Update backend to use PostgreSQL (change `mysql2` to `pg`)

### Option C: Managed MySQL (PlanetScale, Railway, etc.)

1. Create MySQL database
2. Run schema migration
3. Update connection string in backend

---

## Step 4: Update Environment Variables

### Frontend (Vercel)

- `VITE_API_URL`: Your backend URL (e.g., `https://careerpilot-backend.onrender.com/api`)

### Backend (Render/Cloud Run)

- `DB_HOST`: Database host
- `DB_USER`: Database user
- `DB_PASSWORD`: Database password
- `DB_NAME`: `careerpilot`
- `GEMINI_API_KEY`: Your Gemini API key
- `FRONTEND_URL`: Your Vercel frontend URL

---

## Step 5: Update CORS Settings

Make sure your backend allows your frontend domain:

```javascript
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "https://your-app.vercel.app",
    credentials: true,
  })
);
```

---

## Step 6: Test Deployment

1. Visit your Vercel frontend URL
2. Test all features:
   - Resume upload
   - Skill gap analysis
   - Career roadmap
   - Mock interview

---

## Troubleshooting

### Frontend can't connect to backend

- Check `VITE_API_URL` environment variable
- Verify CORS settings in backend
- Check backend logs on Render/Cloud Run

### Database connection errors

- Verify database credentials
- Check database is accessible from backend
- Ensure firewall rules allow connections

### API quota errors

- Check Gemini API key is valid
- Verify API quota limits
- Consider upgrading API plan

---

## Quick Deploy Commands

```bash
# Frontend (Vercel)
cd client && vercel --prod

# Backend (Render - use dashboard)
# Or Docker:
docker build -t careerpilot .
docker run -p 8000:8000 --env-file .env careerpilot
```

---

## Production Checklist

- [ ] Frontend deployed to Vercel
- [ ] Backend deployed to Render/Cloud Run
- [ ] Database set up and migrated
- [ ] Environment variables configured
- [ ] CORS settings updated
- [ ] API keys added
- [ ] Domain configured (optional)
- [ ] SSL certificates active (automatic on Vercel/Render)
- [ ] Monitoring set up (optional)

---

## Support

For issues, check:

- Vercel logs: Dashboard → Your Project → Deployments → Logs
- Render logs: Dashboard → Your Service → Logs
- Backend logs: Check server console output







