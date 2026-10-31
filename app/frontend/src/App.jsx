import { useState } from 'react'
import { ArrowUp } from 'lucide-react'

const model_list = [
  { name: 'MN-Clean', description: 'MobileNetV3 · clean training' },
  { name: 'MN-Deg',   description: 'MobileNetV3 · degraded training' },
  { name: 'SN-Clean', description: 'ShuffleNet · clean training' },
  { name: 'SN-Deg',   description: 'ShuffleNet · degraded training', best: true },
]

const degradation_conditions = [
  { id: 'original',       name: 'Original (lossless)',       reduction: 0 },
  { id: 'jpeg75',         name: 'JPEG Q=75',                 reduction: -62 },
  { id: 'res05',          name: 'Res ×0.5',                  reduction: -71 },
  { id: 'jpeg25',         name: 'JPEG Q=25',                 reduction: -76 },
  { id: 'res025',         name: 'Res ×0.25',                 reduction: -79 },
  { id: 'res05_jpeg50',   name: 'Res ×0.5 + JPEG Q=50',     reduction: -82 },
  { id: 'res025_jpeg50',  name: 'Res ×0.25 + JPEG Q=50',    reduction: -86 },
  { id: 'res025_jpeg25',  name: 'Res ×0.25 + JPEG Q=25',    reduction: -88.1 },
  { id: 'res025_jpeg10',  name: 'Res ×0.25 + JPEG Q=10',    reduction: -92 },
]

const gleason_confidence = [
  { name: 'NC', confidence: 2.1,  color: '#16A34A' },
  { name: 'G3', confidence: 7.9,  color: '#D97706' },
  { name: 'G4', confidence: 88.4, color: '#EA580C' },
  { name: 'G5', confidence: 1.6,  color: '#DC2626' },
]

function App() {
  const [selectedModel, setSelectedModel] = useState('SN-Deg')
  const [selectedCondition, setSelectedCondition] = useState('original')

  return (
    <div className='bg-[#F8F9FB] min-h-screen px-20 py-12 max-w-[900px] mx-auto'>

      {/* Header */}
      <div className='flex flex-col items-start mb-8'>
        <h1 className='font-mono font-bold text-2xl tracking-tight text-[#191C1E]'>COMPRESSPATH</h1>
        <p className='font-mono text-sm text-[#737686]'>Telepathology Degradation Benchmark</p>
      </div>

      {/* Upload zone */}
      <div className='border-2 border-dashed border-[#C3C6D7] flex flex-col gap-2 items-center justify-center p-14 bg-white rounded-2xl hover:border-[#004AC6] hover:bg-blue-50 cursor-pointer transition-colors'>
        <div className='border border-[#C3C6D7] p-3 rounded-full'>
          <ArrowUp className='text-[#004AC6]' size={20} />
        </div>
        <p className='text-sm text-[#191C1E]'>Drop tissue patch here or click to browse</p>
        <p className='text-xs text-[#737686]'>PNG · JPG · 768 × 768 px recommended</p>
      </div>

      {/* Custom checkpoint */}
      <div className='flex justify-between items-center bg-white mt-3 px-4 py-3 rounded-xl border border-[#C3C6D7] hover:border-[#004AC6] transition-colors cursor-pointer'>
        <label className='text-sm text-[#5b5e66] cursor-pointer'>Upload custom model checkpoint (.pt) — optional</label>
        <span className='text-[#004AC6] font-mono font-bold text-xs'>Browse</span>
      </div>

      {/* Config row */}
      <div className='flex gap-4 mt-6'>

        {/* Model selector */}
        <div className='w-1/2 border border-[#C3C6D7] p-4 rounded-xl bg-white'>
          <p className='font-mono text-xs text-[#737686] mb-3'>MODEL</p>
          <div className='grid grid-cols-2 gap-3'>
            {model_list.map((model) => (
              <label
                key={model.name}
                onClick={() => setSelectedModel(model.name)}
                className={`flex flex-col p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedModel === model.name
                    ? 'border-[#004AC6] bg-blue-50'
                    : 'border-[#C3C6D7] bg-white hover:border-[#004AC6]'
                }`}
              >
                <div className='flex justify-between items-start'>
                  <div className='flex flex-col'>
                    <span className='font-mono font-bold text-sm text-[#191C1E]'>{model.name}</span>
                    <span className='text-xs text-[#737686] mt-0.5'>{model.description}</span>
                    {model.best && (
                      <span className='mt-2 self-start border border-[#16A34A] text-[#16A34A] text-xs rounded-full px-2 py-0.5'>
                        Best F1
                      </span>
                    )}
                  </div>
                  <input
                    type='radio'
                    name='model'
                    value={model.name}
                    checked={selectedModel === model.name}
                    onChange={() => setSelectedModel(model.name)}
                    className='accent-[#004AC6] mt-0.5'
                  />
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Transfer condition */}
        <div className='w-1/2 border border-[#C3C6D7] p-4 rounded-xl bg-white flex flex-col gap-3'>
          <p className='font-mono text-xs text-[#737686]'>TRANSFER CONDITION</p>
          <select
            value={selectedCondition}
            onChange={(e) => setSelectedCondition(e.target.value)}
            className='w-full border border-[#004AC6] px-3 py-2.5 rounded-lg text-sm font-mono text-[#191C1E] cursor-pointer outline-none'
          >
            {degradation_conditions.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <ul className='flex flex-col rounded-xl overflow-hidden border border-[#C3C6D7]'>
            {degradation_conditions.map((d, i) => (
              <li
                key={d.id}
                className={`flex justify-between px-3 py-2 text-xs font-mono border-b border-[#C3C6D7] last:border-b-0 transition-colors ${
                  selectedCondition === d.id ? 'bg-blue-50' : 'bg-white hover:bg-[#F8F9FB]'
                }`}
                onClick={() => setSelectedCondition(d.id)}
              >
                <span className={`${i === 0 ? 'text-[#004AC6] font-semibold' : 'text-[#5b5e66]'}`}>{d.name}</span>
                <span className='text-[#737686]'>{d.reduction}%</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Run button */}
      <button className='w-full bg-[#004AC6] hover:bg-[#2563eb] transition-colors py-4 rounded-xl text-white font-mono font-bold mt-6'>
        Run inference
      </button>

      {/* Results */}
      <div className='bg-white mt-6 border border-[#C3C6D7] rounded-xl p-6'>

        {/* Grade badge + confidence */}
        <div className='flex gap-4 items-center mb-6'>
          <span className='bg-[#EA580C] text-white font-mono font-bold text-4xl px-5 py-3 rounded-xl'>G4</span>
          <div className='flex flex-col'>
            <span className='font-bold text-xl text-[#191C1E]'>88.4% confidence</span>
            <span className='text-xs text-[#737686] mt-1 font-mono'>
              Predicted Gleason grade · MN-Clean · Res ×0.25 + JPEG Q=25
            </span>
          </div>
        </div>

        {/* Probability bars */}
        <div className='flex flex-col gap-3'>
          {gleason_confidence.map((g) => (
            <div key={g.name} className='flex items-center gap-3'>
              <span className='font-mono font-bold text-sm w-6'
                    style={{ color: 'var(--color-on-surface)' }}>{g.name}</span>
              <div className='flex-1 rounded-full h-2.5'
                  style={{ backgroundColor: 'var(--color-surface-low)' }}>
                <div
                  className='h-2.5 rounded-full transition-all'
                  style={{ width: `${g.confidence}%`, backgroundColor: g.color }}
                />
              </div>
              <span className='font-mono text-sm w-10 text-right'
                    style={{ color: 'var(--color-outline)' }}>{g.confidence}%</span>
            </div>
          ))}
        </div>

        {/* Before / after images */}
        <div className='flex gap-4 mt-6'>
          <div className='w-1/2'>
            <p className='font-mono text-xs text-[#737686] mb-2'>Original · 768 KB</p>
            <div className='bg-[#F2F4F6] h-48 rounded-xl border border-[#C3C6D7]' />
          </div>
          <div className='w-1/2'>
            <p className='font-mono text-xs text-[#737686] mb-2'>After transmission · 91 KB</p>
            <div className='bg-[#F2F4F6] h-48 rounded-xl border border-[#C3C6D7]' />
          </div>
        </div>
        <p className='font-mono text-xs text-[#737686] mt-3 text-center'>
          SSIM: 0.841 · PSNR: 28.7 dB · 88.1% bandwidth reduction
        </p>
      </div>

      {/* Footer */}
      <p className='font-mono text-xs text-[#737686] text-center mt-8'>
        Research prototype · Not a clinical diagnostic tool · SICAPv2 dataset CC BY 4.0
      </p>
    </div>
  )
}

export default App