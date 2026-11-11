import { MODELS } from '../constants'

// Radio-card group. The parent owns the selected model name.
// 'customWeights' is true when an uploaded checkpoint replaces the weights of
// the selected card, so that card only sets the architecture.
export default function ModelSelector({ value, onChange, customWeights = false }) {
  return (
    <div className='border border-[#F0C9DC] p-4 rounded-xl bg-white'>
      <p className='text-sm font-semibold text-[#191C1E] mb-1'>Model</p>
      <p className='text-xs text-[#5A5266] mb-3'>
        The two networks are MobileNet and ShuffleNet. Models marked clean saw only clean images in
        training, and the others also saw compressed and shrunk ones. Not sure? Keep SN-Deg.
      </p>
      <div className='grid grid-cols-2 gap-3'>
        {MODELS.map((m) => {
          const selected = value === m.name
          return (
            <label key={m.name}
              className={`flex justify-between items-start gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                selected ? 'border-[#C0408C] bg-[#FBE3F0]' : 'border-[#F0C9DC] bg-white hover:border-[#C0408C]'
              }`}
            >
              <div className='flex flex-col'>
                <span className='font-mono font-bold text-sm text-[#191C1E]'>{m.name}</span>
                <span className='text-xs text-[#5A5266] mt-0.5'>{m.description}</span>
                {selected && customWeights && (
                  <span className='mt-2 self-start bg-[#C0408C] text-white text-xs rounded-full px-2 py-0.5'>
                    Your weights
                  </span>
                )}
                {m.best && !(selected && customWeights) && (
                  <span className='mt-2 self-start border border-[#16A34A] text-[#16A34A] text-xs rounded-full px-2 py-0.5'>
                    Best in our tests
                  </span>
                )}
              </div>
              <input type='radio' name='model' value={m.name} checked={selected}
                     onChange={() => onChange(m.name)} className='accent-[#C0408C] mt-0.5' />
            </label>
          )
        })}
      </div>
    </div>
  )
}
