import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { CONDITIONS } from '../constants'

// A preview of the degradations on a sample patch, with no model. It runs in the
// browser, so nothing is uploaded and the result is instant.

// [resize factor, JPEG quality] for each condition id, the same values as the
// backend. null skips that step.
const SETTINGS = {
  original:      [null, null],
  jpeg75:        [null, 75],
  res05:         [0.5,  null],
  jpeg25:        [null, 25],
  res025:        [0.25, null],
  res05_jpeg50:  [0.5,  50],
  res025_jpeg50: [0.25, 50],
  res025_jpeg25: [0.25, 25],
  res025_jpeg10: [0.25, 10],
}

const SAMPLES = [
  { name: 'Non-cancerous', src: '/samples/nc.png' },
  { name: 'Grade 3',       src: '/samples/g3.png' },
  { name: 'Grade 4',       src: '/samples/g4.png' },
  { name: 'Grade 5',       src: '/samples/g5.png' },
]

// Shrinks and/or JPEG-encodes the picture and returns the encoded file. Its size
// is the data that would cross the network.
function degrade(bitmap, [factor, quality]) {
  const canvas = document.createElement('canvas')
  canvas.width  = Math.max(1, Math.round(bitmap.width  * (factor ?? 1)))
  canvas.height = Math.max(1, Math.round(bitmap.height * (factor ?? 1)))
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  return new Promise((resolve) =>
    canvas.toBlob(resolve, quality ? 'image/jpeg' : 'image/png', quality ? quality / 100 : undefined))
}

export default function Playground() {
  const [sample,    setSample]    = useState(SAMPLES[0])
  const [condition, setCondition] = useState('res025')
  const [out,       setOut]       = useState(null)   // { url, kb, baseKb }

  useEffect(() => {
    let cancelled = false
    let url
    async function run() {
      const bitmap = await createImageBitmap(await (await fetch(sample.src)).blob())
      const [base, blob] = await Promise.all([degrade(bitmap, SETTINGS.original), degrade(bitmap, SETTINGS[condition])])
      url = URL.createObjectURL(blob)
      if (!cancelled) setOut({ url, kb: blob.size / 1024, baseKb: base.size / 1024 })
    }
    run()
    return () => { cancelled = true; if (url) URL.revokeObjectURL(url) }
  }, [sample, condition])

  const current = CONDITIONS.find((c) => c.id === condition)
  const saving = out ? ((1 - out.kb / out.baseKb) * 100).toFixed(1) : 0

  return (
    <div className='bg-white border border-[#F0C9DC] rounded-2xl p-6'>
      <h3 className='text-lg font-bold text-[#191C1E]'>Try the degradations</h3>
      <p className='mt-2 text-sm text-[#5A5266]'>
        Pick a sample patch and a condition to see what a slow connection does to the picture. This preview runs in
        your browser, so nothing is uploaded and no model is involved.
      </p>

      <div className='mt-4 flex flex-wrap justify-center gap-2'>
        {SAMPLES.map((s) => (
          <button key={s.name} type='button' aria-pressed={s === sample} onClick={() => setSample(s)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border ${s === sample ? 'bg-[#A12F77] border-[#A12F77] text-white' : 'bg-white border-[#F0C9DC] text-[#191C1E]'}`}>
            {s.name}
          </button>
        ))}
      </div>

      <div className='mt-3 flex flex-wrap gap-2'>
        {CONDITIONS.map((c) => (
          <button key={c.id} type='button' aria-pressed={c.id === condition} onClick={() => setCondition(c.id)}
            className={`px-3 py-2 rounded-lg text-xs font-mono border ${c.id === condition ? 'bg-[#A12F77] border-[#A12F77] text-white' : 'bg-white border-[#F0C9DC] text-[#191C1E]'}`}>
            {c.name}
          </button>
        ))}
      </div>
      <p className='mt-2 text-xs text-[#5A5266]'>{current.detail}</p>

      <div className='mt-4 grid grid-cols-2 gap-4 max-w-xl mx-auto'>
        <figure>
          <img src={sample.src} alt={`${sample.name} tissue patch, original`} className='w-full aspect-square rounded-lg bg-[#FBE3F0]' />
          <figcaption className='mt-1 text-xs font-mono text-[#6B6577]'>Original{out && `: ${out.baseKb.toFixed(0)} KB`}</figcaption>
        </figure>
        <figure>
          {out
            ? <img src={out.url} alt={`The same patch after ${current.name}`} className='w-full aspect-square rounded-lg' />
            : <div className='w-full aspect-square rounded-lg bg-[#FBE3F0]' />}
          <figcaption aria-live='polite' className='mt-1 text-xs font-mono text-[#6B6577]'>
            {current.name}{out && `: ${out.kb.toFixed(1)} KB, ${saving}% smaller`}
          </figcaption>
        </figure>
      </div>

      <div className='mt-5 flex justify-center'>
        <Link to='/tool'
          className='bg-[#C0408C] hover:bg-[#A12F77] transition-colors px-6 py-3 rounded-xl text-white font-mono font-bold'>
          See how a model handles your own patch
        </Link>
      </div>
      <p className='mt-4 text-xs text-[#6B6577]'>
        Sample patches from the SICAPv2 dataset (CC BY 4.0). Your browser's own encoder makes this preview, so sizes
        differ slightly from the tool.
      </p>
    </div>
  )
}
