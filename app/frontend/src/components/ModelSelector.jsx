import { MODELS } from '../constants'

export default function ModelSelector({ value, onChange }) {
  return (
    <div className='w-1/2 border border-[#C3C6D7] p-4 rounded-xl bg-white'>
      <p className='font-mono text-xs text-[#737686] mb-3'>MODEL</p>
      <div className='grid grid-cols-2 gap-3'>
        {MODELS.map((m) => (
          <label key={m.name} onClick={() => onChange(m.name)}
            className={`flex flex-col p-3 rounded-lg border cursor-pointer transition-colors ${
              value === m.name ? 'border-[#004AC6] bg-blue-50' : 'border-[#C3C6D7] bg-white hover:border-[#004AC6]'
            }`}
          >
            <div className='flex justify-between items-start'>
              <div className='flex flex-col'>
                <span className='font-mono font-bold text-sm text-[#191C1E]'>{m.name}</span>
                <span className='text-xs text-[#737686] mt-0.5'>{m.description}</span>
                {m.best && (
                  <span className='mt-2 self-start border border-[#16A34A] text-[#16A34A] text-xs rounded-full px-2 py-0.5'>
                    Best F1
                  </span>
                )}
              </div>
              <input type='radio' name='model' value={m.name} checked={value === m.name}
                     onChange={() => onChange(m.name)} className='accent-[#004AC6] mt-0.5' />
            </div>
          </label>
        ))}
      </div>
    </div>
  )
}
