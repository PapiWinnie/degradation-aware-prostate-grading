// Horizontal bars for macro F1 scores, which run from 0 to 1. The highest bar is drawn darker.
// labelWidth is a Tailwind width class, so a long label gets more room.
export default function ScoreBars({ rows, labelWidth = 'w-24' }) {
  const best = Math.max(...rows.map((r) => Number(r.f1)))
  return (
    <div className='flex flex-col gap-3'>
      {rows.map((r) => (
        <div key={r.label} className='flex items-center gap-3'>
          <span className={`${labelWidth} shrink-0 font-mono text-sm font-bold text-[#191C1E]`}>{r.label}</span>
          <div aria-hidden='true' className='flex-1 h-3 rounded-full bg-[#FBE3F0]'>
            <div className={`h-3 rounded-full ${Number(r.f1) === best ? 'bg-[#A12F77]' : 'bg-[#C0408C]/60'}`}
              style={{ width: `${Number(r.f1) * 100}%` }} />
          </div>
          <span className='w-16 text-right font-mono text-sm text-[#5A5266]'>{r.f1}</span>
        </div>
      ))}
    </div>
  )
}
