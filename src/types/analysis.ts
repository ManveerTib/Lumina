export interface Prediction {
  class: string;
  confidence: number;
  all_predictions: Record<string, number>;
}

export interface Analysis {
  id: string;
  image_name: string;
  image_url?: string;
  prediction_class?: string;
  confidence_score?: number;
  predictions_json?: Record<string, number>;
  heatmap_url?: string;
  clinical_report?: string;
  status: 'pending' | 'completed' | 'failed';
  error_message?: string;
  created_at: string;
  updated_at?: string;
}

export type Tool = 'oncoscan' | 'pdt' | 'dosimetry';

export interface PDTParams {
  wavelength: number;
  concentration: number;
  fluenceRate: number;
  oxygenSaturation: number;
  tumorDepth: number;
  duration: number;
  tissueType: 'soft' | 'muscle' | 'fat';
}

export interface PDTResult {
  singletOxygenDose: number;
  penetrationDepth: number;
  adequacy: 'adequate' | 'subtherapeutic' | 'excessive';
  treatmentVolume: number;
  oxygenDepletion: number;
  recommendation: string;
  depthProfile: { depth: number; fluence: number; dose: number }[];
}

export interface DosimetryParams {
  tumorType: string;
  tumorDepth: number;
  tumorSize: number;
  oxygenSaturation: number;
  psConcentration: number;
  bodyLocation: string;
  deliveryMethod: 'external' | 'interstitial' | 'endoscopic';
  wavelength: number;
}

export interface DosimetryResult {
  adequacy: 'adequate' | 'subtherapeutic' | 'borderline';
  predictedDose: number;
  adequacyScore: number;
  primaryLimitingFactor: string;
  recommendations: string[];
  parameterAdjustments: { parameter: string; current: string; suggested: string; impact: string }[];
  riskLevel: 'low' | 'moderate' | 'high';
}
