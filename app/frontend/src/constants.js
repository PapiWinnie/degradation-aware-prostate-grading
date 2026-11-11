// Backend address. VITE_API_URL overrides the deployed default for local development.
export const API = import.meta.env.VITE_API_URL || 'https://degradation-aware-prostate-grading-production.up.railway.app'

// Must match the keys of MODEL_REGISTRY in the backend. 'best' marks the winner
// of the experiments and shows the badge in the selector.
export const MODELS = [
  { name: 'MN-Clean', description: 'MobileNet, trained on clean images only' },
  { name: 'MN-Deg',   description: 'MobileNet, also trained on compressed and shrunk images' },
  { name: 'SN-Clean', description: 'ShuffleNet, trained on clean images only' },
  { name: 'SN-Deg',   description: 'ShuffleNet, also trained on compressed and shrunk images', best: true },
]

// Ids must match CONDITIONS in the backend. 'detail' says in plain words what
// the condition does. File-size change is not stored here because it depends on
// the uploaded patch; it is computed per result.
export const CONDITIONS = [
  { id: 'original',       name: 'Original (lossless)',   detail: 'The picture is sent exactly as it is, with no quality lost.' },
  { id: 'jpeg75',         name: 'JPEG Q=75',             detail: 'Lightly compressed. The picture looks almost the same, but the file is smaller.' },
  { id: 'res05',          name: 'Res ×0.5',              detail: 'Shrunk to half its width and height.' },
  { id: 'jpeg25',         name: 'JPEG Q=25',             detail: 'Heavily compressed. The file is small, but the picture looks blocky and blurred.' },
  { id: 'res025',         name: 'Res ×0.25',             detail: 'Shrunk to a quarter of its width and height, so fine detail is lost.' },
  { id: 'res05_jpeg50',   name: 'Res ×0.5 + JPEG Q=50',  detail: 'Shrunk to half size, then compressed.' },
  { id: 'res025_jpeg50',  name: 'Res ×0.25 + JPEG Q=50', detail: 'Shrunk to a quarter size, then compressed.' },
  { id: 'res025_jpeg25',  name: 'Res ×0.25 + JPEG Q=25', detail: 'Shrunk to a quarter size, then heavily compressed.' },
  { id: 'res025_jpeg10',  name: 'Res ×0.25 + JPEG Q=10', detail: 'Shrunk to a quarter size, then very heavily compressed. The models never saw this setting during training.' },
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
    a: 'Yes, for both networks. The average score across the nine conditions rose by +0.266 for MobileNet and +0.144 for ShuffleNet, and the gain was clear and not just noise from which tissue cores were tested.',
  },
  {
    q: 'What does it cost on clean images?',
    a: 'No cost was measurable. On clean test patches the score changed by +0.236 for MobileNet and +0.016 for ShuffleNet, and the ShuffleNet change could be noise.',
  },
  {
    q: 'Does the effect depend on the architecture?',
    a: 'Yes. ShuffleNet gained mostly when images were shrunk and changed little when they were only compressed. The two networks were also trained with different settings, so this conclusion is limited.',
  },
  {
    q: 'What is the relationship between size and performance?',
    a: 'It depends on how the file is made smaller. SN-Deg kept its score between 0.5333 and 0.6025 for files from 534.3 KB down to 1.0 KB, while the models trained on clean images only did not hold steady.',
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
