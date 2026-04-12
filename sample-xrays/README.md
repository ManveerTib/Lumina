# Sample Chest X-Ray Images

To test the Clinical Image Assist system, you need chest X-ray images.

## Where to Get Sample Images

### Option 1: Public Medical Datasets (Recommended)

Download sample X-ray images from these public sources:

1. **NIH Chest X-Ray Dataset**
   - Website: https://www.kaggle.com/datasets/nih-chest-xrays/data
   - Contains 112,120 X-ray images with disease labels
   - Free to download after Kaggle account creation

2. **Sample Images from NIH**
   - Direct link: https://nihcc.app.box.com/v/ChestXray-NIHCC
   - Download a few sample images for testing

3. **COVID-19 Chest X-Ray Dataset**
   - GitHub: https://github.com/ieee8023/covid-chestxray-dataset
   - Contains various chest X-ray images

### Option 2: Use Demo Images

For testing purposes, you can use these sample chest X-ray images:

1. Search Google Images: "chest x-ray pneumonia" or "normal chest x-ray"
2. Download 2-3 sample images (ensure they are for educational/research use)
3. Save them in this folder

### Option 3: Generate Synthetic Data

For pure UI testing without actual medical analysis:
1. Use any grayscale medical-looking images
2. The system will process them (though results won't be medically accurate)

## Image Requirements

- **Format**: JPG, PNG, or DICOM
- **Size**: Any size (will be resized to 224x224 for model)
- **Type**: Frontal chest X-rays work best
- **Quality**: Clear, good contrast images

## Sample Image Names

Save your test images as:
- `xray_normal.jpg` - Normal chest X-ray
- `xray_pneumonia.jpg` - Pneumonia case
- `xray_mass.jpg` - Mass detection case
- `xray_effusion.jpg` - Pleural effusion case

## Testing Instructions

1. Place sample X-ray images in this folder
2. Launch the frontend: `npm run dev`
3. Launch the backend: `cd backend && python app.py`
4. Open http://localhost:5173
5. Upload an X-ray image
6. Click "Analyze X-Ray Image"
7. View results, confidence scores, and Grad-CAM heatmap

## Important Notes

⚠️ **For Educational Use Only**
- These images are for testing the ML pipeline
- Not for actual medical diagnosis
- Always respect image licensing and privacy
- Do not use real patient data without proper authorization

## Example Test Cases

After downloading images, test these scenarios:

1. **Normal X-Ray**: Should show low probabilities for all pathologies
2. **Pneumonia**: Should detect high confidence for Pneumonia class
3. **Multiple Conditions**: Some X-rays may show multiple findings
4. **Image Quality**: Test with different resolutions and qualities

## Data Privacy

- Never upload real patient data without proper authorization
- Use only de-identified, publicly available datasets
- Ensure compliance with HIPAA and local regulations
- This is a demonstration system, not for clinical use
