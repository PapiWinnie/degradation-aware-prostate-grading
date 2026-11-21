import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { CONDITIONS } from '../constants'

// A preview of the degradations on a sample patch, with no model. It runs in the
// browser, so nothing is uploaded and the result is instant.

// [resize factor, JPEG quality] for each condition id, the same values as the
// backend and the notebook. null skips that step.
const SETTINGS = {
  clean:               [null,  null],
  jpeg75:              [null,  75],
  jpeg50:              [null,  50],
  jpeg25:              [null,  25],
  res256:              [0.5,   null],
  res128:              [0.25,  null],
  res256_jpeg50:       [0.5,   50],
  res128_jpeg25:       [0.25,  25],
  stress_res64_jpeg25: [0.125, 25],
}

const SAMPLES = [
  { name: 'Non-cancerous', src: '/samples/nc.png' },
  { name: 'Grade 3',       src: '/samples/g3.png' },
  { name: 'Grade 4',       src: '/samples/g4.png' },
  { name: 'Grade 5',       src: '/samples/g5.png' },
]

// Applies a condition in the same order as the notebook: shrink, enlarge back,
// then JPEG encode. Returns the encoded file whose size is shown. For a resize-only
// condition that is the lossless PNG of the shrunken picture, which a receiver can
// enlarge to exactly this picture. The browser's own resampling is close to, but
// not identical with, the bilinear resampling of the notebook and the API.
function draw(source, width, height) {
  const canvas = document.createElement('canvas')
  canvas.width  = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(source, 0, 0, width, height)
  return canvas
}

function encode(canvas, quality) {
  return new Promise((resolve) =>
    canvas.toBlob(resolve, quality ? 'image/jpeg' : 'image/png', quality ? quality / 100 : undefined))
}

function degrade(bitmap, [factor, quality]) {
  if (factor === null) return encode(draw(bitmap, bitmap.width, bitmap.height), quality)
  const small = draw(bitmap, Math.max(1, Math.round(bitmap.width * factor)), Math.max(1, Math.round(bitmap.height * factor)))
  if (quality === null) return encode(small, null)
  return encode(draw(small, bitmap.width, bitmap.height), quality)
}

export default function Playground() {
  const [sample,    setSample]    = useState(SAMPLES[0])
  const [condition, setCondition] = useState('res128')
  const [out,       setOut]       = useState(null)   // { url, kb, baseKb }
  const [failed,    setFailed]    = useState(false)

  useEffect(() => {
    let cancelled = false
    let url
    async function run() {
      setFailed(false)
      try {
        const bitmap = await createImageBitmap(await (await fetch(sample.src)).blob())
        const [base, blob] = await Promise.all([degrade(bitmap, SETTINGS.clean), degrade(bitmap, SETTINGS[condition])])
        if (!base || !blob) throw new Error('The browser could not encode the picture')
        url = URL.createObjectURL(blob)
        if (!cancelled) setOut({ url, kb: blob.size / 1024, baseKb: base.size / 1024 })
      } catch {
        if (!cancelled) { setOut(null); setFailed(true) }
      }
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
      {failed && (
        <p role='alert' className='mt-3 text-sm text-red-600 text-center'>
          We could not build this preview. Check your connection and pick the patch again.
        </p>
      )}

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
