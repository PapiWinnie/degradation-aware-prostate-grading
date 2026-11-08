import { GRADE_BG } from '../constants'

// Shown only after a successful inference. 'imageURL' is the local preview of
// the original upload, while the degraded image comes back from the API as base64.
export default function ResultsPanel({ result, imageURL, conditionLabel }) {
  // Size change of the transmitted image relative to the uploaded file, computed
  // from this upload rather than a fixed figure. A minus sign means it got smaller.
  const before = result.original_size_kb
  const after  = result.degraded_size_kb
  const change = before > 0 ? Math.round((after / before - 1) * 100) : null
  const changeLabel = change === null ? '' : ` (${change > 0 ? '+' : change < 0 ? '−' : ''}${Math.abs(change)}%)`

  return (
    <div className='bg-white mt-6 border border-[#C3C6D7] rounded-xl p-6'>

      {/* Grade badge */}
      <div className='flex gap-4 items-center mb-6'>
        <span className={`${GRADE_BG[result.predicted_grade]} text-white font-mono font-bold text-4xl px-5 py-3 rounded-xl`}>
          {result.predicted_grade}
        </span>
        <div className='flex flex-col'>
          <span className='font-bold text-xl text-[#191C1E]'>{result.top_confidence}% confidence</span>
          <span className='text-xs text-[#737686] mt-1 font-mono'>
            Predicted Gleason grade · {result.model_used}{result.custom_checkpoint ? ' (custom weights)' : ''} · {conditionLabel}
          </span>
        </div>
      </div>

      {/* Size of the transmitted image against the uploaded file */}
      <p className='font-mono text-xs text-[#737686] mb-6'>
        File size · {before} KB to {after} KB{changeLabel} compared with the uploaded file
      </p>

      {/* Probability bars */}
      <div className='flex flex-col gap-3'>
        {result.probabilities.map((g) => (
          <div key={g.label} className='flex items-center gap-3'>
            <span className='font-mono font-bold text-sm w-6 text-[#191C1E]'>{g.label}</span>
            <div className='flex-1 rounded-full h-2.5 bg-[#F2F4F6]'>
              <div className={`h-2.5 rounded-full transition-all ${GRADE_BG[g.label]}`}
                   style={{ width: `${g.confidence}%` }} />
            </div>
            <span className='font-mono text-sm w-10 text-right text-[#737686]'>{g.confidence}%</span>
          </div>
        ))}
      </div>

      {/* Before / after images */}
      <div className='flex gap-4 mt-6'>
        <div className='w-1/2'>
          <p className='font-mono text-xs text-[#737686] mb-2'>Original · {result.original_size_kb} KB</p>
          <img src={imageURL} className='w-full h-48 object-cover rounded-xl border border-[#C3C6D7]' />
        </div>
        <div className='w-1/2'>
          <p className='font-mono text-xs text-[#737686] mb-2'>After transmission · {result.degraded_size_kb} KB</p>
          <img src={`data:image/png;base64,${result.degraded_image_b64}`}
               className='w-full h-48 object-cover rounded-xl border border-[#C3C6D7]' />
        </div>
      </div>
    </div>
  )
}
