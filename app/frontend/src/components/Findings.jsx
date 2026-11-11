import { FINDINGS_TABLE, RESEARCH_QUESTIONS } from '../constants'

// Short summary of the study: method, headline result and the four research questions.
export default function Findings() {
  return (
    <section>
      <h2 className='text-lg font-bold text-[#191C1E] mb-3'>Findings</h2>

      <h3 className='text-sm font-semibold text-[#191C1E] mb-1'>Method</h3>
      <p className='text-sm text-[#5b5e66]'>
        Two small image classifiers, MobileNetV3-Small and ShuffleNetV2-x1.0, were each trained twice
        on the public SICAPv2 prostate dataset: once on clean images and once with compressed and
        shrunk images mixed in. All four models were then tested on 3,055 images from 818 tissue
        cores of a separate Zurich collection, under nine combinations of compression and shrinking.
      </p>

      <h3 className='text-sm font-semibold text-[#191C1E] mt-6 mb-2'>Average score across the nine conditions (macro F1, higher is better)</h3>
      <table className='text-sm border border-[#C3C6D7] bg-white rounded-lg'>
        <tbody>
          {FINDINGS_TABLE.map((r) => (
            <tr key={r.model} className='border-b border-[#C3C6D7] last:border-b-0'>
              <td className='px-4 py-2 font-mono font-bold text-[#191C1E]'>{r.model}</td>
              <td className='px-4 py-2 font-mono text-[#5b5e66]'>{r.f1}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 className='text-sm font-semibold text-[#191C1E] mt-6 mb-2'>Research questions</h3>
      <div className='flex flex-col gap-4 text-sm'>
        {RESEARCH_QUESTIONS.map((r) => (
          <div key={r.q}>
            <p className='font-semibold text-[#191C1E]'>{r.q}</p>
            <p className='text-[#5b5e66]'>{r.a}</p>
          </div>
        ))}
      </div>

      <p className='text-xs text-[#737686] mt-6'>
        Each model was trained only once, the compression is simulated, and the test images come from
        one collection. These are research findings, not evidence of clinical performance.
      </p>
    </section>
  )
}
