import { CONDITIONS } from '../constants'

// One dropdown and a plain-words line about the chosen condition. The size
// change depends on the uploaded patch, so the results panel reports it.
export default function ConditionSelector({ value, onChange }) {
  const current = CONDITIONS.find((c) => c.id === value)
  return (
    <div className='border border-[#C3C6D7] p-4 rounded-xl bg-white flex flex-col gap-3'>
      <label htmlFor='condition' className='text-sm font-semibold text-[#191C1E]'>Transfer condition</label>
      <select id='condition' value={value} onChange={(e) => onChange(e.target.value)}
        className='w-full border border-[#004AC6] px-3 py-2.5 rounded-lg text-sm font-mono text-[#191C1E] cursor-pointer bg-white'
      >
        {CONDITIONS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <p className='text-xs text-[#5b5e66]'>{current.detail}</p>
    </div>
  )
}
