# CareerPilot Deployment Guide

## 🚀 Deployment Options

### Option 1: Vercel (Frontend) + Render (Backend) + Cloud SQL (Database)

#### Frontend on Vercel

1. **Install Vercel CLI**
```bash
npm i -g vercel
```

2. **Deploy Frontend**
```bash
cd client
vercel
```

3. **Set Environment Variables in Vercel Dashboard**
- `VITE_API_URL`: Your backend API URL (e.g., `https://your-backend.onrender.com/api`)

#### Backend on Render

1. **Create New Web Service**
   - Connect your GitHub repository
   - Root Directory: `/` (root)
   - Build Command: `npm install`
   - Start Command: `node server/index.js`

2. **Set Environment Variables**
   - `PORT`: 8000
   - `NODE_ENV`: production
   - `DB_HOST`: Your Cloud SQL IP
   - `DB_USER`: Database user
   - `DB_PASSWORD`: Database password
   - `DB_NAME`: careerpilot
   - `DB_PORT`: 3306
   - `GEMINI_API_KEY`: Your Gemini API key
   - `FRONTEND_URL`: Your Vercel frontend URL

#### Database on Cloud SQL (Google Cloud)

1. **Create MySQL Instance**
   - Go to Google Cloud Console
   - Create Cloud SQL MySQL instance
   - Note the public IP address

2. **Run Schema**
```bash
mysql -h <CLOUD_SQL_IP> -u <USER> -p < database/schema.sql
```

3. **Configure Authorized Networks**
   - Add Render's IP ranges to authorized networks

### Option 2: Firebase Hosting (Frontend) + Cloud Run (Backend) + Cloud SQL

#### Frontend on Firebase Hosting

1. **Install Firebase CLI**
```bash
npm i -g firebase-tools
```

2. **Initialize Firebase**
```bash
cd client
firebase init hosting
```

3. **Build and Deploy**
```bash
npm run build
firebase deploy
```

#### Backend on Cloud Run

1. **Build Docker Image**
```bash
docker build -t careerpilot-backend .
```

2. **Push to Google Container Registry**
```bash
gcloud builds submit --tag gcr.io/YOUR_PROJECT/careerpilot-backend
```

3. **Deploy to Cloud Run**
```bash
gcloud run deploy careerpilot-backend \
  --image gcr.io/YOUR_PROJECT/careerpilot-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

4. **Set Environment Variables in Cloud Run**
   - Same as Render configuration

### Option 3: Full Docker Deployment

1. **Build Image**
```bash
docker build -t careerpilot .
```

2. **Run Container**
```bash
docker run -p 8000:8000 \
  -e DB_HOST=your-db-host \
  -e DB_USER=your-db-user \
  -e DB_PASSWORD=your-db-password \
  -e GEMINI_API_KEY=your-key \
  careerpilot
```

## 🔒 Security Checklist

- [ ] Use environment variables for all secrets
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS properly
- [ ] Set up database connection encryption
- [ ] Implement rate limiting
- [ ] Add authentication (if needed)
- [ ] Secure file uploads
- [ ] Enable database backups

## 📊 Monitoring

### Recommended Tools
- **Application Monitoring**: Sentry, LogRocket
- **Uptime Monitoring**: UptimeRobot, Pingdom
- **Database Monitoring**: Cloud SQL Insights
- **API Analytics**: Postman, Insomnia

## 🔄 CI/CD Pipeline

### GitHub Actions Example

```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## 🐛 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Update `FRONTEND_URL` in backend `.env`
   - Check CORS configuration in `server/index.js`

2. **Database Connection Timeout**
   - Verify Cloud SQL authorized networks
   - Check firewall rules
   - Ensure IP whitelisting

3. **File Upload Issues**
   - Use cloud storage (S3, GCS) for production
   - Update multer configuration for cloud storage

4. **Environment Variables Not Loading**
   - Verify `.env` file exists
   - Check variable names match exactly
   - Restart server after changes

## 📝 Post-Deployment

1. Test all endpoints
2. Verify database connections
3. Check file uploads
4. Monitor error logs
5. Set up alerts
6. Configure backups

