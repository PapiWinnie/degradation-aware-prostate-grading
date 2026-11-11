import { useRef, useEffect } from 'react'
import { GRADE_BG, GRADE_INFO } from '../constants'

// Shown only after a successful inference. 'imageURL' is the local preview of
// the original upload, while the degraded image comes back from the API as base64.
export default function ResultsPanel({ result, imageURL, conditionLabel }) {
  // The panel appears below the Run button, often off screen, so scroll to it
  // as soon as it is shown. Smooth scrolling is skipped for people who ask for less motion.
  const panelRef = useRef(null)
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    panelRef.current.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  }, [])

  // Size change of the transmitted image relative to the uploaded file, computed
  // from this upload rather than a fixed figure. A minus sign means it got smaller.
  const before = result.original_size_kb
  const after  = result.degraded_size_kb
  const change = before > 0 ? Math.round((after / before - 1) * 100) : null
  const changeLabel = change === null ? '' : ` (${change > 0 ? '+' : change < 0 ? '−' : ''}${Math.abs(change)}%)`

  return (
    <div ref={panelRef} className='bg-white mt-6 border border-[#F0C9DC] rounded-xl p-6 scroll-mt-6'>

      {/* The predicted grade is the answer, so it comes first and is named as such.
          The confidence is only how sure the model is about that grade. */}
      <p className='font-mono text-xs font-bold text-[#6B6577] mb-2'>Predicted grade</p>
      <div className='flex gap-4 items-center mb-6'>
        <span className={`${GRADE_BG[result.predicted_grade]} text-white font-mono font-bold text-4xl px-5 py-3 rounded-xl`}>
          {result.predicted_grade}
        </span>
        <div className='flex flex-col'>
          {/* First sentence of the plain-words description, for example "Cancer with Gleason pattern 4" */}
          <span className='font-bold text-xl text-[#191C1E]'>{GRADE_INFO[result.predicted_grade].split('.')[0]}</span>
          <span className='text-sm text-[#5A5266]'>The model is {result.top_confidence}% confident in this grade</span>
          <span className='text-xs text-[#6B6577] mt-1 font-mono'>
            {result.model_used}{result.custom_checkpoint ? ' (custom weights)' : ''} · {conditionLabel}
          </span>
        </div>
      </div>

      {/* Size of the transmitted image against the uploaded file */}
      <p className='font-mono text-xs text-[#6B6577] mb-6'>
        File size · {before} KB to {after} KB{changeLabel} compared with the uploaded file
      </p>

      {/* Probability bars */}
      <div className='flex flex-col gap-3'>
        {result.probabilities.map((g) => (
          <div key={g.label} className='flex items-center gap-3'>
            <span className='font-mono font-bold text-sm w-6 text-[#191C1E]'>{g.label}</span>
            <div className='flex-1 rounded-full h-2.5 bg-[#F9E8F1]'>
              <div className={`h-2.5 rounded-full transition-all ${GRADE_BG[g.label]}`}
                   style={{ width: `${g.confidence}%` }} />
            </div>
            <span className='font-mono text-sm w-10 text-right text-[#6B6577]'>{g.confidence}%</span>
          </div>
        ))}
      </div>

      {/* What the four labels mean, in plain words */}
      <div className='mt-6 text-xs text-[#5A5266]'>
        <p className='font-semibold text-[#191C1E] mb-1'>What the labels mean</p>
        <ul className='flex flex-col gap-1'>
          {Object.entries(GRADE_INFO).map(([label, text]) => (
            <li key={label}><span className='font-mono font-bold text-[#191C1E]'>{label}</span> {text}</li>
          ))}
        </ul>
      </div>

      {/* Before / after images */}
      <div className='flex gap-4 mt-6'>
        <div className='w-1/2'>
          <p className='font-mono text-xs text-[#6B6577] mb-2'>Original · {result.original_size_kb} KB</p>
          <img src={imageURL} className='w-full h-48 object-cover rounded-xl border border-[#F0C9DC]' />
        </div>
        <div className='w-1/2'>
          <p className='font-mono text-xs text-[#6B6577] mb-2'>After transmission · {result.degraded_size_kb} KB</p>
          <img src={`data:image/png;base64,${result.degraded_image_b64}`}
               className='w-full h-48 object-cover rounded-xl border border-[#F0C9DC]' />
        </div>
      </div>
    </div>
  )
}
