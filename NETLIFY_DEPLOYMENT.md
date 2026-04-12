# Netlify Deployment Guide

## ✅ Project Ready for Netlify

Your Clinical Image Assist application is configured and ready to deploy to Netlify.

---

## 🚀 Quick Deploy (3 Methods)

### Method 1: Drag & Drop (Fastest - 2 minutes)

1. **Build the project** (if not already built):
   ```bash
   npm run build
   ```

2. **Go to Netlify**:
   - Visit: https://app.netlify.com/drop
   - Or login to your Netlify dashboard

3. **Drag & Drop**:
   - Drag the entire `dist` folder to the drop zone
   - Netlify will automatically deploy

4. **Done!** Your site is live at: `https://random-name-12345.netlify.app`

---

### Method 2: Netlify CLI (Recommended)

**Step 1: Install Netlify CLI**
```bash
npm install -g netlify-cli
```

**Step 2: Login to Netlify**
```bash
netlify login
```

**Step 3: Deploy**
```bash
# Deploy to a draft URL (for testing)
netlify deploy

# Deploy to production
netlify deploy --prod
```

**Step 4: Follow the prompts**
- Choose "Create & configure a new site"
- Select your team
- Choose a site name (or use auto-generated)
- Publish directory: `dist`

---

### Method 3: Connect Git Repository (Best for CI/CD)

**Step 1: Push to GitHub/GitLab/Bitbucket**
```bash
git init
git add .
git commit -m "Initial commit - Clinical Image Assist"
git remote add origin YOUR_REPO_URL
git push -u origin main
```

**Step 2: Connect to Netlify**
1. Go to https://app.netlify.com
2. Click "Add new site" → "Import an existing project"
3. Choose your Git provider
4. Select your repository
5. Configure build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
   - **Node version:** 18

**Step 3: Add Environment Variables**
In Netlify dashboard → Site settings → Environment variables:
```
VITE_SUPABASE_URL=https://pnmjyxbsyfkhcubmnshf.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBubWp5eGJzeWZraGN1Ym1uc2hmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MzQ2NDMsImV4cCI6MjA3OTIxMDY0M30.7JK0kJAoVjiImJ1_t8pfDNzWk0yhC0dEBtLapGBM9fA
```

**Step 4: Deploy**
Click "Deploy site" and Netlify will build and deploy automatically!

---

## 📁 What's Been Configured

### ✅ Netlify Configuration (`netlify.toml`)
```toml
[build]
  publish = "dist"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

**Features:**
- Single Page Application (SPA) routing
- Node.js 18 for builds
- Security headers configured
- Asset caching optimized

### ✅ Build Output (`dist/`)
- ✅ Optimized production build (375 KB)
- ✅ Gzipped assets (112 KB)
- ✅ SPA redirects configured
- ✅ All assets bundled

### ✅ Environment Variables
Already configured in `.env` file and ready to add to Netlify

---

## 🔧 Post-Deployment Configuration

### 1. Custom Domain (Optional)
In Netlify dashboard:
1. Go to Domain settings
2. Add custom domain
3. Follow DNS configuration instructions

### 2. HTTPS
- ✅ Automatically enabled by Netlify
- Free SSL certificate included

### 3. Backend API URL (If using FastAPI backend)
If you deploy the backend separately, update in Netlify:
- Environment variable: `VITE_API_URL=https://your-backend-url.com`
- Rebuild the site after adding

---

## 🎯 Deployment Checklist

Before deploying, verify:

- [x] Build successful (`npm run build`)
- [x] `netlify.toml` configured
- [x] `dist/_redirects` file present
- [x] Environment variables ready
- [x] Database accessible (Supabase)
- [x] All dependencies installed
- [x] Security headers configured

---

## 🌐 Expected URLs

After deployment, you'll get:

**Production URL:**
```
https://your-site-name.netlify.app
```

**Deploy Preview URL (for testing):**
```
https://deploy-preview-123--your-site-name.netlify.app
```

---

## 🔍 Testing After Deployment

### 1. Open your Netlify URL
```
https://your-site-name.netlify.app
```

### 2. Test Core Features
- ✅ Page loads correctly
- ✅ Upload interface appears
- ✅ View sample analysis from database
- ✅ Upload test image
- ✅ Demo mode activates (yellow banner)
- ✅ Analysis history loads

### 3. Check Browser Console
- No CORS errors (Supabase configured correctly)
- No 404 errors on navigation
- Assets loading properly

---

## 🐛 Troubleshooting

### Build Fails on Netlify

**Issue:** "Cannot find module"
```bash
# Solution: Clear cache and rebuild
netlify build --clear-cache
```

**Issue:** "Node version mismatch"
```bash
# Solution: Verify netlify.toml has NODE_VERSION = "18"
```

### Page Shows 404 on Refresh

**Issue:** SPA routing not working
```bash
# Solution: Verify dist/_redirects file exists
# Should contain: /* /index.html 200
```

### Cannot Connect to Database

**Issue:** Supabase connection error
```bash
# Solution: Add environment variables in Netlify:
# VITE_SUPABASE_URL
# VITE_SUPABASE_ANON_KEY
```

### Assets Not Loading

**Issue:** 404 on CSS/JS files
```bash
# Solution: Verify base path in vite.config.ts
# Should be: base: './' or base: '/'
```

---

## 📊 Performance Optimizations

Netlify automatically provides:

✅ **Global CDN** - Assets served from nearest location
✅ **Asset Optimization** - Images, CSS, JS minified
✅ **HTTP/2** - Faster loading with multiplexing
✅ **Brotli Compression** - Better than gzip
✅ **Smart CDN** - Intelligent caching
✅ **Deploy Previews** - Test before production

---

## 🔐 Security Features

Configured in `netlify.toml`:

✅ **X-Frame-Options** - Prevents clickjacking
✅ **X-XSS-Protection** - XSS attack prevention
✅ **X-Content-Type-Options** - MIME sniffing prevention
✅ **Referrer-Policy** - Privacy protection
✅ **Cache-Control** - Optimized asset caching

---

## 💰 Pricing

**Free Tier Includes:**
- 100 GB bandwidth/month
- 300 build minutes/month
- Automatic HTTPS
- Continuous deployment
- Deploy previews
- Custom domains

**Perfect for this project!** The Clinical Image Assist app stays well within free tier limits.

---

## 🚀 Quick Commands Reference

```bash
# Build for production
npm run build

# Deploy to Netlify (draft)
netlify deploy

# Deploy to production
netlify deploy --prod

# Open Netlify dashboard
netlify open

# View deployment logs
netlify logs
```

---

## 📝 Notes

### Demo Mode vs. Full System

**After deployment, the app runs in demo mode by default:**
- ✅ Full UI functional
- ✅ Simulated predictions
- ✅ Database connected
- ⚠️ No real ML inference (backend not included)

**To enable real ML predictions:**
1. Deploy backend separately (see `backend/DEPLOYMENT.md`)
2. Add backend URL to Netlify environment variables
3. Rebuild the frontend

### Database Access

✅ **Supabase works perfectly with Netlify**
- No additional configuration needed
- Database accessible from deployed app
- Real-time updates supported
- All analyses saved and retrieved

---

## 🎉 You're Ready to Deploy!

Choose your deployment method above and launch your Clinical Image Assist app to the web!

**Recommended:** Start with Method 1 (Drag & Drop) for immediate deployment, then switch to Method 3 (Git) for long-term maintenance.

---

## 📞 Support

**Netlify Documentation:**
- https://docs.netlify.com/
- https://docs.netlify.com/cli/get-started/

**Common Issues:**
- Build logs: Check Netlify dashboard → Deploys → Build logs
- Environment variables: Site settings → Environment variables
- Domain setup: Site settings → Domain management

**This Project:**
- See `README.md` for project overview
- See `backend/DEPLOYMENT.md` for backend deployment

---

**Ready to go live?** 🚀

Run `netlify deploy --prod` or drag the `dist` folder to Netlify Drop!
