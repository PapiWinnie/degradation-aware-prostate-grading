import { Link } from 'react-router-dom'
import ScoreBars from '../components/ScoreBars'
import Playground from '../components/Playground'
import { RESOLUTION_BARS } from '../constants'

// The home page: who the tool is for, the problem, how to use it, and the headline finding.
const AUDIENCE = [
  ['Built for', [
    'Researchers and developers who build telepathology pipelines and want to know what compression and shrinking do to a model.',
    'Labs that plan to run a compact classifier behind a compressed or downsampled network connection.',
  ]],
  ['Not for', [
    'Diagnosis or patient care. The grade is an experimental output, not a diagnosis.',
    'Use as an assisted-grading product. This is a test bench.',
  ]],
]

const STEPS = [
  ['Upload', 'A tissue patch', 'PNG or JPG, up to 10 MB.'],
  ['Choose', 'A model and a transfer condition', 'Four trained models, or your own weights, and nine levels of compression and shrinking.'],
  ['Compare', 'What survives', 'The predicted grade, the class probabilities and how much smaller the file became.'],
]

export default function Home() {
  return (
    <section className='flex flex-col gap-14 pt-4 pb-8'>

      <div className='max-w-3xl'>
        <p className='font-mono text-sm font-bold text-[#A12F77]'>A TEST BENCH FOR TELEPATHOLOGY RESEARCHERS AND DEVELOPERS</p>
        <h2 className='mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-[#191C1E] leading-tight'>
          Does a prostate classifier still work after the image is squeezed?
        </h2>
        <p className='mt-4 text-base text-[#5A5266]'>
          Slides sent over slow networks get compressed and shrunk on the way. CompressPath shows what this does to
          small Gleason-grading models, so the problem can be seen before anyone builds a workflow on top of them.
        </p>
        <div className='mt-6 flex flex-wrap items-center gap-4'>
          <Link to='/tool'
            className='bg-[#C0408C] hover:bg-[#A12F77] transition-colors px-6 py-3 rounded-xl text-white font-mono font-bold'>
            Open the tool
          </Link>
          <Link to='/findings' className='py-2 text-sm font-semibold text-[#A12F77] hover:underline'>
            Read the findings
          </Link>
        </div>
      </div>

      <div className='grid gap-4 sm:grid-cols-2'>
        {AUDIENCE.map(([title, items]) => (
          <div key={title} className={`rounded-2xl p-5 ${title === 'Built for' ? 'bg-white border border-[#F0C9DC]' : 'bg-[#FBE3F0]'}`}>
            <p className='font-mono text-sm font-bold text-[#A12F77]'>{title}</p>
            <ul className='mt-2 flex flex-col gap-2 text-sm text-[#5A5266] list-disc pl-5'>
              {items.map((i) => <li key={i}>{i}</li>)}
            </ul>
          </div>
        ))}
      </div>

      <div className='max-w-3xl'>
        <h3 className='text-lg font-bold text-[#191C1E]'>Why it matters</h3>
        <p className='mt-2 text-sm text-[#5A5266]'>
          Rwanda has about 14 practicing pathologists, roughly 1.1 per million people. The long-term hope is
          AI-assisted grading, but a model trained on clean images can fail quietly on damaged ones. This project
          checks that early.
        </p>
      </div>

      <div>
        <h3 className='text-lg font-bold text-[#191C1E] mb-3'>How it works</h3>
        <div className='grid gap-4 sm:grid-cols-3'>
          {STEPS.map(([label, title, body]) => (
            <div key={label} className='bg-white border border-[#F0C9DC] rounded-2xl p-5'>
              <p className='font-mono text-sm font-bold text-[#A12F77]'>{label}</p>
              <p className='mt-2 font-semibold text-[#191C1E]'>{title}</p>
              <p className='mt-1 text-sm text-[#5A5266]'>{body}</p>
            </div>
          ))}
        </div>
      </div>

      <Playground />

      <div className='bg-white border border-[#F0C9DC] rounded-2xl p-6 max-w-3xl w-full mx-auto'>
        <h3 className='text-lg font-bold text-[#191C1E]'>What we found: shrinking does the real damage</h3>
        <p className='mt-2 text-sm text-[#5A5266] mb-4'>
          For every model trained on clean images, losing resolution hurt far more than JPEG compression. Training with
          degraded images in the mix prevented most of the loss, and ShuffleNet trained this way held up best. Score is
          macro F1, from 0 to 1, higher is better.
        </p>
        <ScoreBars rows={RESOLUTION_BARS} labelWidth='w-52' />
        <Link to='/findings' className='mt-3 inline-block py-2 text-sm font-semibold text-[#A12F77] hover:underline'>
          See all findings
        </Link>
      </div>

      <p className='text-xs text-[#6B6577] max-w-3xl'>
        Your image is processed in memory and is not stored by the server. There is no account and no history. The
        compression and shrinking are simulated, not real network transmission, and nothing was tested on Rwandan
        data.
      </p>

    </section>
  )
}
