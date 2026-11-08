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

// Ids must match CONDITIONS in the backend. 'detail' says in plain words what
// the condition does. File-size change is not stored here because it depends on
// the uploaded patch; it is computed per result.
export const CONDITIONS = [
  { id: 'original',       name: 'Original (lossless)',   detail: 'No degradation. The patch is sent as a lossless PNG.' },
  { id: 'jpeg75',         name: 'JPEG Q=75',             detail: 'JPEG compression at quality 75, full resolution.' },
  { id: 'res05',          name: 'Res ×0.5',              detail: 'Half the width and height, no JPEG.' },
  { id: 'jpeg25',         name: 'JPEG Q=25',             detail: 'JPEG compression at quality 25, full resolution.' },
  { id: 'res025',         name: 'Res ×0.25',             detail: 'A quarter of the width and height, no JPEG.' },
  { id: 'res05_jpeg50',   name: 'Res ×0.5 + JPEG Q=50',  detail: 'Half resolution, then JPEG at quality 50.' },
  { id: 'res025_jpeg50',  name: 'Res ×0.25 + JPEG Q=50', detail: 'Quarter resolution, then JPEG at quality 50.' },
  { id: 'res025_jpeg25',  name: 'Res ×0.25 + JPEG Q=25', detail: 'Quarter resolution, then JPEG at quality 25.' },
  { id: 'res025_jpeg10',  name: 'Res ×0.25 + JPEG Q=10', detail: 'Quarter resolution, then JPEG at quality 10. The models never saw this one in training.' },
]

// Full class strings are written out because Tailwind scans the source for
// them and would drop classes built by string concatenation.
export const GRADE_BG = {
  NC: 'bg-[#16A34A]',
  G3: 'bg-[#D97706]',
  G4: 'bg-[#EA580C]',
  G5: 'bg-[#DC2626]',
}
