# Quick Start Guide - Clinical Image Assist

Get the application running in 5 minutes!

## Option 1: Frontend Only (Demo Mode) - FASTEST

### Step 1: Launch the Frontend
```bash
npm run dev
```

The app will start at `http://localhost:5173`

### Step 2: Upload an X-Ray Image
1. Open `http://localhost:5173` in your browser
2. Upload any chest X-ray image (or any image for testing)
3. Click "Analyze X-Ray Image"
4. The system will use **demo mode** with simulated predictions

**Note**: Without the backend, you'll see a "Demo Mode Active" banner and get simulated results. This is perfect for UI demonstration!

---

## Option 2: Full System (Real ML Model) - RECOMMENDED

For actual ML inference, you need both frontend and backend running.

### Step 1: Start the Backend

Open a **new terminal** and run:

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies (one-time setup)
pip install -r requirements.txt

# Start the server
python app.py
```

Backend will run on `http://localhost:8000`

**First time?** Installation takes 5-10 minutes (PyTorch is large).

### Step 2: Start the Frontend

In a **separate terminal**:

```bash
npm run dev
```

Frontend runs on `http://localhost:5173`

### Step 3: Test the System

1. Open `http://localhost:5173`
2. Upload a chest X-ray image
3. Click "Analyze X-Ray Image"
4. View real ML predictions with:
   - Confidence scores
   - All 14 pathology probabilities
   - Grad-CAM heatmap
   - AI-generated clinical report (if Azure OpenAI configured)

---

## Getting Sample X-Ray Images

### Public Datasets (Free)

1. **NIH Chest X-Ray Dataset**
   - Kaggle: https://www.kaggle.com/datasets/nih-chest-xrays/data
   - Download sample images

2. **COVID-19 X-Ray Dataset**
   - GitHub: https://github.com/ieee8023/covid-chestxray-dataset

3. **Google Images**
   - Search: "chest x-ray pneumonia sample"
   - Download for educational use

### Save Images
Place sample images in `sample-xrays/` folder.

---

## Troubleshooting

### Frontend Issues

**Port 5173 already in use:**
```bash
# Kill the process
lsof -ti:5173 | xargs kill -9
# Or change port in vite.config.ts
```

**Supabase connection error:**
- Check `.env` file has correct credentials
- Verify database tables exist

### Backend Issues

**Python/pip not found:**
```bash
# Install Python 3.10+
# macOS: brew install python@3.10
# Ubuntu: sudo apt install python3.10 python3-pip
```

**Module not found errors:**
```bash
pip install -r requirements.txt
```

**Port 8000 in use:**
```bash
# Change port in backend/app.py
# Line: uvicorn.run(app, host="0.0.0.0", port=8001)
```

**CORS errors:**
- Ensure backend is running
- Check `VITE_API_URL` in frontend `.env`

---

## What Each Component Does

### Frontend (React + TypeScript)
- Beautiful UI for image upload
- Real-time result visualization
- Analysis history tracking
- Responsive design

### Backend (FastAPI + PyTorch)
- CheXNet DenseNet121 model
- 14-class pathology detection
- Grad-CAM explainability
- Clinical report generation

### Database (Supabase)
- Stores all analysis results
- Tracks metadata and history
- Real-time updates

---

## Next Steps

### 1. Add Azure OpenAI (Optional)
For AI-generated clinical reports:

```bash
# Add to backend/.env
AZURE_OPENAI_ENDPOINT=your_endpoint
AZURE_OPENAI_KEY=your_key
```

### 2. Train Custom Model
See `backend/train_model.py` for training on your own dataset.

### 3. Deploy to Production
See `backend/DEPLOYMENT.md` for Azure deployment guide.

---

## System Requirements

### Minimum
- Node.js 18+
- Python 3.10+
- 4GB RAM
- 2GB disk space

### Recommended (for ML inference)
- Python 3.10+
- 8GB+ RAM
- GPU (NVIDIA with CUDA)
- 10GB disk space

---

## Quick Commands Reference

```bash
# Frontend
npm install          # Install dependencies
npm run dev          # Start dev server
npm run build        # Build for production
npm run lint         # Check code quality

# Backend
cd backend
python3 -m venv venv              # Create virtual env
source venv/bin/activate          # Activate (Linux/Mac)
venv\Scripts\activate             # Activate (Windows)
pip install -r requirements.txt   # Install deps
python app.py                     # Run server

# Database
# Check tables at: https://supabase.com/dashboard
```

---

## Support

**Documentation:**
- Full README: `README.md`
- Backend guide: `backend/README.md`
- Deployment: `backend/DEPLOYMENT.md`

**Common Issues:**
- Demo mode activating? Backend not running
- No predictions? Check backend logs
- Image not uploading? Check file format (JPG/PNG)

---

## Security Warning

⚠️ **For demonstration and research only**
- Not FDA approved
- Not for clinical diagnosis
- Always verify with qualified radiologists
- Use only de-identified data

---

**Ready to go?** Run `npm run dev` and start analyzing! 🚀
