// Backend address. VITE_API_URL overrides the deployed default for local development.
export const API = import.meta.env.VITE_API_URL || 'https://degradation-aware-prostate-grading-production.up.railway.app'

// Must match the keys of MODEL_REGISTRY in the backend. 'best' marks the winner
// of the experiments and shows the badge in the selector.
export const MODELS = [
  { name: 'MN-Clean', description: 'MobileNetV3 · clean training' },
  { name: 'MN-Deg',   description: 'MobileNetV3 · degraded training' },
  { name: 'SN-Clean', description: 'ShuffleNet · clean training' },
  { name: 'SN-Deg',   description: 'ShuffleNet · degraded training', best: true },
]

// Ids must match CONDITIONS in the backend. 'reduction' is the measured change
// in file size compared with the lossless original, shown next to each option.
export const CONDITIONS = [
  { id: 'original',       name: 'Original (lossless)',    reduction: 0 },
  { id: 'jpeg75',         name: 'JPEG Q=75',              reduction: -62 },
  { id: 'res05',          name: 'Res ×0.5',               reduction: -71 },
  { id: 'jpeg25',         name: 'JPEG Q=25',              reduction: -76 },
  { id: 'res025',         name: 'Res ×0.25',              reduction: -79 },
  { id: 'res05_jpeg50',   name: 'Res ×0.5 + JPEG Q=50',  reduction: -82 },
  { id: 'res025_jpeg50',  name: 'Res ×0.25 + JPEG Q=50', reduction: -86 },
  { id: 'res025_jpeg25',  name: 'Res ×0.25 + JPEG Q=25', reduction: -88.1 },
  { id: 'res025_jpeg10',  name: 'Res ×0.25 + JPEG Q=10', reduction: -92 },
]

// Full class strings are written out because Tailwind scans the source for
// them and would drop classes built by string concatenation.
export const GRADE_BG = {
  NC: 'bg-[#16A34A]',
  G3: 'bg-[#D97706]',
  G4: 'bg-[#EA580C]',
  G5: 'bg-[#DC2626]',
}
