# Clinical Image Assist

AI-powered chest X-ray analysis system for assisting radiologists with multi-class pathology detection, explainable AI visualizations, and automated clinical reporting.

## Overview

This project demonstrates a complete ML pipeline for medical image analysis:

- **Frontend**: React.js with TypeScript and Tailwind CSS
- **Backend**: FastAPI with PyTorch deep learning
- **Database**: Supabase for storing analysis results
- **ML Model**: CheXNet-based DenseNet121 for 14 pathology classifications
- **Explainability**: Grad-CAM heatmap visualizations
- **AI Reports**: Optional Azure OpenAI integration for clinical summaries

## Features

### Core Capabilities

- Upload and analyze chest X-ray images
- Multi-label classification for 14 pathology types
- Real-time inference with confidence scores
- Grad-CAM visualization showing model attention
- AI-generated clinical reports (with Azure OpenAI)
- Analysis history and result tracking
- Responsive, production-ready UI

### Detected Conditions

1. Atelectasis
2. Cardiomegaly
3. Effusion
4. Infiltration
5. Mass
6. Nodule
7. Pneumonia
8. Pneumothorax
9. Consolidation
10. Edema
11. Emphysema
12. Fibrosis
13. Pleural Thickening
14. Hernia

## Architecture

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│   React UI      │─────▶│  FastAPI Backend │─────▶│  PyTorch Model  │
│  (TypeScript)   │      │   (Python 3.10)  │      │   (DenseNet121) │
└─────────────────┘      └──────────────────┘      └─────────────────┘
        │                         │
        │                         │
        ▼                         ▼
┌─────────────────┐      ┌──────────────────┐
│    Supabase     │      │  Azure OpenAI    │
│   (Database)    │      │  (Optional LLM)  │
└─────────────────┘      └──────────────────┘
```

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.10+
- Supabase account
- Azure OpenAI account (optional)

### Frontend Setup

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Add your Supabase credentials to .env

# Run development server
npm run dev
```

### Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Add Supabase and Azure credentials

# Run server
python app.py
```

The backend runs on `http://localhost:8000`

## Configuration

### Environment Variables

**Frontend (.env)**:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:8000
```

**Backend (backend/.env)**:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: For AI clinical reports
AZURE_OPENAI_ENDPOINT=your_azure_endpoint
AZURE_OPENAI_KEY=your_azure_key
```

## Database Schema

The system uses two main tables:

### xray_analyses
Stores X-ray analysis results with predictions, confidence scores, heatmaps, and clinical reports.

### analysis_metadata
Tracks processing metadata including model version, processing time, and image dimensions.

Database migrations are automatically applied via Supabase.

## ML Model Details

### Architecture
- **Base**: DenseNet-121 pretrained on ImageNet
- **Task**: Multi-label classification
- **Input**: 224x224 RGB images
- **Output**: 14 sigmoid probabilities

### Training

To train your own model:

1. Download dataset (NIH Chest X-Ray14, CheXpert, MIMIC-CXR)
2. Prepare data in required format
3. Run training script:

```bash
cd backend
python train_model.py
```

See `backend/train_model.py` for complete training pipeline.

### Performance Metrics
- **Evaluation**: ROC-AUC per class
- **Target**: >0.80 AUC across all classes
- **Inference**: ~1-2s CPU, <200ms GPU

## Grad-CAM Visualization

The system generates Grad-CAM heatmaps showing which regions the model focused on:

- Red/yellow areas: High attention
- Blue/green areas: Lower attention
- Overlaid on original X-ray for context

## API Documentation

### POST /api/predict

Analyze X-ray image.

**Request**:
```bash
curl -X POST http://localhost:8000/api/predict \
  -F "file=@xray.jpg" \
  -F "analysis_id=uuid-here"
```

**Response**:
```json
{
  "success": true,
  "analysis_id": "uuid",
  "prediction": {
    "class": "Pneumonia",
    "confidence": 87.5,
    "all_predictions": {...}
  },
  "processing_time_ms": 1234
}
```

## Deployment

See `backend/DEPLOYMENT.md` for complete deployment guides:

- Docker Compose
- Azure Container Apps
- Azure Static Web Apps + Functions
- GPU optimization
- CI/CD pipelines

## Development

### Project Structure

```
├── src/
│   ├── components/       # React components
│   ├── lib/             # Supabase client
│   ├── types/           # TypeScript types
│   └── App.tsx          # Main application
├── backend/
│   ├── app.py           # FastAPI server
│   ├── train_model.py   # Training script
│   └── requirements.txt # Python dependencies
└── supabase/
    └── migrations/      # Database migrations
```

### Testing

```bash
# Frontend
npm run lint
npm run typecheck

# Backend
cd backend
python -m pytest tests/
```

## Security & Ethics

⚠️ **Important Disclaimers**:

- **Not FDA Approved**: This is a demonstration project
- **Not for Clinical Use**: Always verify with qualified radiologists
- **Research Only**: For educational and research purposes
- **No Warranties**: Provided as-is without guarantees

### Production Considerations

For production deployment:

1. Implement proper authentication and authorization
2. Ensure HIPAA compliance for PHI data
3. Add audit logging and monitoring
4. Implement rate limiting and security headers
5. Get necessary regulatory approvals
6. Conduct clinical validation studies
7. Implement proper error handling and fallbacks

## Performance Optimization

- Use GPU for faster inference
- Implement model caching
- Enable CDN for frontend assets
- Configure auto-scaling
- Optimize image preprocessing
- Use model quantization for edge deployment

## Contributing

This is a demonstration project. For production use:

1. Conduct thorough testing and validation
2. Ensure regulatory compliance
3. Implement security best practices
4. Add comprehensive monitoring
5. Document all changes and decisions

## Dataset Sources

Recommended public datasets:

- **NIH Chest X-Ray14**: 112,120 frontal-view X-rays
- **CheXpert**: 224,316 chest radiographs
- **MIMIC-CXR**: 377,110 images (requires credentialing)
- **RSNA Pneumonia**: Kaggle competition dataset

Always verify licensing and ethical approval for dataset usage.

## Technologies Used

### Frontend
- React 18
- TypeScript
- Tailwind CSS
- Vite
- Lucide React (icons)
- Axios

### Backend
- FastAPI
- PyTorch
- TorchVision
- OpenCV
- Pillow
- Supabase Client
- Azure OpenAI SDK

### Infrastructure
- Supabase (PostgreSQL)
- Azure OpenAI
- Docker
- Azure Container Apps

## Roadmap

Future enhancements:

- [ ] Support for CT and MRI scans
- [ ] Multi-model ensemble predictions
- [ ] Real-time collaboration tools
- [ ] DICOM file format support
- [ ] Integration with PACS systems
- [ ] Mobile app version
- [ ] Offline inference capability
- [ ] Advanced report templating

## License

MIT License - For educational and research purposes only.

## Acknowledgments

- CheXNet paper and architecture
- NIH Chest X-Ray14 dataset
- PyTorch and FastAPI communities
- Open-source medical imaging projects

## Support

For questions or issues:
1. Check documentation in `backend/README.md`
2. Review deployment guide in `backend/DEPLOYMENT.md`
3. Consult troubleshooting sections

## Citation

If you use this project in research, please cite:

```bibtex
@software{clinical_image_assist,
  title = {Clinical Image Assist: AI-Powered Chest X-Ray Analysis},
  year = {2024},
  author = {Your Name},
  note = {Demonstration project for educational purposes}
}
```

---

**Remember**: This system is for demonstration and research only. Always consult qualified healthcare professionals for medical diagnosis and treatment decisions.
