import { useRef, useEffect } from 'react'
import { GRADE_BG, GRADE_INFO } from '../constants'

const card = 'bg-white border border-[#F0C9DC] rounded-2xl p-5'
const label = 'font-mono text-xs font-bold text-[#6B6577] mb-2'

// Shown only after a successful inference. 'imageURL' is the local preview of
// the original upload, while the degraded image comes back from the API as base64.
// Three blocks answer the three questions in order: which grade, how sure, how
// much smaller. Everything else is secondary.
export default function ResultsPanel({ result, imageURL, conditionLabel }) {
  // On a phone the panel appears below the Run button, off screen, so scroll to it
  // as soon as it is shown. Smooth scrolling is skipped for people who ask for less motion.
  const panelRef = useRef(null)
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    panelRef.current.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  }, [])

  const grade = result.predicted_grade

  // The description starts with the plain name, for example "Cancer with Gleason pattern 4".
  const [gradeName, ...gradeRest] = GRADE_INFO[grade].split('. ')

  // Size change of the transmitted image relative to the uploaded file, computed
  // from this upload rather than a fixed figure.
  const before = result.original_size_kb
  const after  = result.degraded_size_kb
  const change = before > 0 ? Math.round((after / before - 1) * 100) : 0
  const sizeText = change < 0 ? `${Math.abs(change)}% smaller` : change > 0 ? `${change}% larger` : 'No change'
  const widest = Math.max(before, after)
  const sizes = [['Uploaded', before], ['Sent', after]]

  return (
    <div ref={panelRef} className='flex flex-col gap-4 scroll-mt-6'>

      <p className='font-mono text-xs text-[#6B6577]'>
        {result.model_used}{result.custom_checkpoint ? ' (custom weights)' : ''} · {conditionLabel}
      </p>

      {/* 1. The grade is the answer */}
      <div className={card}>
        <p className={label}>Predicted grade</p>
        <div className='flex items-center gap-4'>
          <span className={`${GRADE_BG[grade]} text-white font-mono font-bold text-5xl px-6 py-4 rounded-2xl`}>{grade}</span>
          <div>
            <p className='font-bold text-xl text-[#191C1E]'>{gradeName}</p>
            <p className='text-sm text-[#5A5266] mt-1'>{gradeRest.join('. ')}</p>
          </div>
        </div>
      </div>

      {/* 2. How sure the model is about that grade */}
      <div className={card}>
        <p className={label}>Confidence in this grade</p>
        <p className='font-mono font-bold text-3xl text-[#191C1E]'>{result.top_confidence}%</p>
        <div className='h-3 rounded-full bg-[#F9E8F1] mt-3'>
          <div className={`h-3 rounded-full ${GRADE_BG[grade]}`} style={{ width: `${result.top_confidence}%` }} />
        </div>
        <p className='text-xs text-[#5A5266] mt-2'>How sure the model is about the grade above. It is not the grade itself.</p>
      </div>

      {/* 3. What the degradation did to the file */}
      <div className={card}>
        <p className={label}>File size after transmission</p>
        <p className='font-mono font-bold text-3xl text-[#191C1E]'>{sizeText}</p>
        <p className='text-sm text-[#5A5266] mt-1'>{before} KB to {after} KB</p>
        <div className='flex flex-col gap-2 mt-3'>
          {sizes.map(([name, kb]) => (
            <div key={name} className='flex items-center gap-3'>
              <span className='font-mono text-xs w-16 text-[#6B6577]'>{name}</span>
              <div className='flex-1 h-3 rounded-full bg-[#F9E8F1]'>
                {/* a minimum width keeps very small files visible */}
                <div className='h-3 rounded-full bg-[#C0408C]' style={{ width: `${Math.max(2, (kb / widest) * 100)}%` }} />
              </div>
              <span className='font-mono text-xs w-16 text-right text-[#6B6577]'>{kb} KB</span>
            </div>
          ))}
        </div>
      </div>

      {/* Secondary detail, closed so it does not compete with the three blocks above */}
      <details className={card}>
        <summary className='cursor-pointer font-mono text-xs font-bold text-[#6B6577]'>
          All four grades and what they mean
        </summary>
        <div className='flex flex-col gap-3 mt-4'>
          {result.probabilities.map((g) => (
            <div key={g.label} className='flex items-center gap-3'>
              <span className='font-mono font-bold text-sm w-6 text-[#191C1E]'>{g.label}</span>
              <div className='flex-1 rounded-full h-2.5 bg-[#F9E8F1]'>
                <div className={`h-2.5 rounded-full ${GRADE_BG[g.label]}`} style={{ width: `${g.confidence}%` }} />
              </div>
              <span className='font-mono text-sm w-12 text-right text-[#6B6577]'>{g.confidence}%</span>
            </div>
          ))}
        </div>
        <ul className='flex flex-col gap-1 mt-4 text-xs text-[#5A5266]'>
          {Object.entries(GRADE_INFO).map(([name, text]) => (
            <li key={name}><span className='font-mono font-bold text-[#191C1E]'>{name}</span> {text}</li>
          ))}
        </ul>
      </details>

      {/* Before and after images */}
      <div className={`${card} flex gap-4`}>
        <div className='w-1/2'>
          <p className={label}>Original</p>
          <img src={imageURL} alt='Original patch' className='w-full h-40 object-cover rounded-xl border border-[#F0C9DC]' />
        </div>
        <div className='w-1/2'>
          <p className={label}>After transmission</p>
          <img src={`data:image/png;base64,${result.degraded_image_b64}`} alt='Patch after transmission'
               className='w-full h-40 object-cover rounded-xl border border-[#F0C9DC]' />
        </div>
      </div>
    </div>
  )
}
