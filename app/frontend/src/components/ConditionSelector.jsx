import { CONDITIONS } from '../constants'

// The dropdown and the list edit the same value. The list lets users see all
// conditions at once. The size change is not shown here because it depends on
// the uploaded patch; the results panel reports it after a run.
export default function ConditionSelector({ value, onChange }) {
  return (
    <div className='w-1/2 border border-[#C3C6D7] p-4 rounded-xl bg-white flex flex-col gap-3'>
      <p className='font-mono text-xs text-[#737686]'>TRANSFER CONDITION</p>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className='w-full border border-[#004AC6] px-3 py-2.5 rounded-lg text-sm font-mono text-[#191C1E] cursor-pointer outline-none'
      >
        {CONDITIONS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <ul className='flex flex-col rounded-xl overflow-hidden border border-[#C3C6D7]'>
        {CONDITIONS.map((c, i) => (
          <li key={c.id} onClick={() => onChange(c.id)}
            className={`flex justify-between px-3 py-2 text-xs font-mono border-b border-[#C3C6D7] last:border-b-0 cursor-pointer transition-colors ${
              value === c.id ? 'bg-blue-50' : 'bg-white hover:bg-[#F8F9FB]'
            }`}
          >
            <span className={i === 0 ? 'text-[#004AC6] font-semibold' : 'text-[#5b5e66]'}>{c.name}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
