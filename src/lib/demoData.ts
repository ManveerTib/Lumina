import { Analysis } from '../types/analysis';

export const DEMO_PREDICTIONS: Record<string, number> = {
  Atelectasis: 72.4,
  Cardiomegaly: 8.1,
  Effusion: 45.2,
  Infiltration: 61.8,
  Mass: 12.3,
  Nodule: 28.9,
  Pneumonia: 15.6,
  Pneumothorax: 3.2,
  Consolidation: 38.7,
  Edema: 9.4,
  Emphysema: 5.1,
  Fibrosis: 7.8,
  Pleural_Thickening: 22.1,
  Hernia: 1.9,
};

export const DEMO_ANALYSIS: Analysis = {
  id: 'demo-001',
  image_name: 'chest_xray_sample.png',
  prediction_class: 'Atelectasis',
  confidence_score: 72.4,
  predictions_json: DEMO_PREDICTIONS,
  status: 'completed',
  clinical_report: `FINDINGS:
The AI analysis identifies atelectasis as the primary finding with 72.4% confidence. There is also notable infiltration (61.8%) and effusion (45.2%) detected.

IMPRESSION:
The chest radiograph demonstrates findings consistent with atelectasis, particularly in the lower lung zones. Concurrent infiltration patterns suggest possible underlying inflammatory or infectious process.

RECOMMENDATIONS:
1. Clinical correlation with patient symptoms and history
2. Consider follow-up chest radiograph in 4-6 weeks
3. Pulmonary function tests may be indicated
4. Radiologist review recommended before clinical decisions

DISCLAIMER: This report is AI-generated and must be verified by a qualified radiologist before any clinical use.`,
  created_at: new Date().toISOString(),
};

export const PATHOLOGY_INFO: Record<string, { description: string; severity: 'low' | 'medium' | 'high' }> = {
  Atelectasis: { description: 'Partial or complete collapse of lung tissue', severity: 'medium' },
  Cardiomegaly: { description: 'Enlargement of the heart', severity: 'medium' },
  Effusion: { description: 'Abnormal accumulation of fluid around lungs', severity: 'medium' },
  Infiltration: { description: 'Substance denser than air in the lungs', severity: 'medium' },
  Mass: { description: 'Abnormal growth or tumor in the chest', severity: 'high' },
  Nodule: { description: 'Small rounded growth in the lung', severity: 'medium' },
  Pneumonia: { description: 'Infection causing lung inflammation', severity: 'high' },
  Pneumothorax: { description: 'Air in the space around the lungs', severity: 'high' },
  Consolidation: { description: 'Lung tissue filled with liquid instead of air', severity: 'medium' },
  Edema: { description: 'Excess fluid in the lungs', severity: 'high' },
  Emphysema: { description: 'Damage to the air sacs in the lungs', severity: 'medium' },
  Fibrosis: { description: 'Scarring of lung tissue', severity: 'medium' },
  Pleural_Thickening: { description: 'Thickening of the lining around the lungs', severity: 'low' },
  Hernia: { description: 'Organ protrusion through chest wall', severity: 'medium' },
};
