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

// Findings section. Mean macro F1 over the nine conditions on the Zurich test
// set, copied from the notebook outputs.
export const FINDINGS_TABLE = [
  { model: 'MN-Clean', f1: '0.2381' },
  { model: 'MN-Deg',   f1: '0.5047' },
  { model: 'SN-Clean', f1: '0.4301' },
  { model: 'SN-Deg',   f1: '0.5740' },
]

export const RESEARCH_QUESTIONS = [
  {
    q: 'Does degradation-aware training help?',
    a: 'Yes, for both architectures. Mean macro F1 rose by +0.266 for MobileNetV3-Small and +0.144 for ShuffleNetV2, and both intervals excluded zero.',
  },
  {
    q: 'What does it cost on clean images?',
    a: 'No cost was measurable. On clean Zurich patches the change was +0.236 for MobileNetV3-Small and +0.016 for ShuffleNetV2, and the second interval includes zero.',
  },
  {
    q: 'Does the effect depend on the architecture?',
    a: 'Yes. ShuffleNetV2 gained under resolution loss and changed little under JPEG alone. The training recipes also differed, so this conclusion is limited.',
  },
  {
    q: 'What is the relationship between size and performance?',
    a: 'It depends on how the saving is made. SN-Deg kept macro F1 between 0.5333 and 0.6025 for payloads from 534.3 KB down to 1.0 KB, while the clean-trained models were not flat.',
  },
]

// Full class strings are written out because Tailwind scans the source for
// them and would drop classes built by string concatenation.
export const GRADE_BG = {
  NC: 'bg-[#16A34A]',
  G3: 'bg-[#D97706]',
  G4: 'bg-[#EA580C]',
  G5: 'bg-[#DC2626]',
}
