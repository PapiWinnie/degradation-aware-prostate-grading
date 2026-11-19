import ScoreBars from '../components/ScoreBars'
import { FINDINGS_TABLE, RESEARCH_QUESTIONS, RESOLUTION_BARS } from '../constants'

// The study at a glance: what was tested, the headline finding, the score of each model, and the four research questions.
const FACTS = [['4', 'models'], ['9', 'conditions'], ['3,055', 'test patches'], ['818', 'tissue cores']]

export default function Findings() {
  return (
    <section className='flex flex-col gap-10'>

      <div className='max-w-2xl'>
        <h2 className='text-lg font-bold text-[#191C1E] mb-3'>Findings</h2>
        <p className='text-sm text-[#5A5266]'>
          MobileNetV3-Small and ShuffleNetV2-x1.0 were each trained twice on the public SICAPv2 prostate dataset:
          once on clean images and once with compressed and shrunk images mixed in. All four models were then tested
          on a separate Zurich collection, under nine combinations of compression and shrinking.
        </p>
      </div>

      <div className='grid grid-cols-2 sm:grid-cols-4 gap-4'>
        {FACTS.map(([number, label]) => (
          <div key={label} className='bg-white border border-[#F0C9DC] rounded-2xl p-5'>
            <p className='font-mono text-2xl font-bold text-[#A12F77]'>{number}</p>
            <p className='text-sm text-[#5A5266]'>{label}</p>
          </div>
        ))}
      </div>

      <div className='bg-[#FBE3F0] rounded-2xl p-6 max-w-3xl w-full mx-auto'>
        <h3 className='text-lg font-bold text-[#191C1E]'>The main finding: shrinking does the real damage</h3>
        <p className='mt-2 mb-4 text-sm text-[#5A5266]'>
          For every model trained on clean images, losing resolution hurt far more than JPEG compression. Clean-trained
          ShuffleNet still scored 0.57 under heavy compression but only 0.33 when shrunk to a quarter. Training with
          degraded images in the mix prevented most of the loss. Score is macro F1, from 0 to 1, higher is better.
        </p>
        <ScoreBars rows={RESOLUTION_BARS} labelWidth='w-52' />
      </div>

      <div className='bg-white border border-[#F0C9DC] rounded-2xl p-6 max-w-3xl w-full mx-auto'>
        <h3 className='text-sm font-semibold text-[#191C1E]'>Average score across the nine conditions</h3>
        <p className='text-xs text-[#6B6577] mb-4'>
          Macro F1 averages the score of the four tissue types, so the rare G5 counts as much as the common ones.
        </p>
        <ScoreBars rows={FINDINGS_TABLE.map((r) => ({ label: r.model, f1: r.f1 }))} />
      </div>

      <div>
        <h3 className='text-sm font-semibold text-[#191C1E] mb-3'>Research questions</h3>
        <div className='grid gap-4 sm:grid-cols-2'>
          {RESEARCH_QUESTIONS.map((r) => (
            <div key={r.q} className='bg-white border border-[#F0C9DC] rounded-2xl p-5'>
              <p className='font-semibold text-[#191C1E]'>{r.q}</p>
              <p className='mt-2 text-sm text-[#5A5266]'>{r.a}</p>
            </div>
          ))}
        </div>
      </div>

      <p className='text-xs text-[#6B6577] max-w-2xl'>
        Each model was trained only once, the compression is simulated, and the test images come from one
        collection. These are research findings, not evidence of clinical performance.
      </p>

    </section>
  )
}
