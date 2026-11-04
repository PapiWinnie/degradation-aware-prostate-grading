import { useState, useRef } from 'react'
import { ArrowUp } from 'lucide-react'

const API = import.meta.env.VITE_API_URL || 'https://degradation-aware-prostate-grading-production.up.railway.app'

const MODELS = [
  { name: 'MN-Clean', description: 'MobileNetV3 · clean training' },
  { name: 'MN-Deg',   description: 'MobileNetV3 · degraded training' },
  { name: 'SN-Clean', description: 'ShuffleNet · clean training' },
  { name: 'SN-Deg',   description: 'ShuffleNet · degraded training', best: true },
]

const CONDITIONS = [
  { id: 'original',       name: 'Original (lossless)',    reduction: 0 },
  { id: 'jpeg75',         name: 'JPEG Q=75',              reduction: -62 },
  { id: 'res05',          name: 'Res ×0.5',               reduction: -71 },
  { id: 'jpeg25',         name: 'JPEG Q=25',              reduction: -76 },
  { id: 'res025',         name: 'Res ×0.25',              reduction: -79 },
  { id: 'res05_jpeg50',   name: 'Res ×0.5 + JPEG Q=50',  reduction: -82 },
  { id: 'res025_jpeg50',  name: 'Res ×0.25 + JPEG Q=50', reduction: -86 },
  { id: 'res025_jpeg25',  name: 'Res ×0.25 + JPEG Q=25', reduction: -88.1 },
  { id: 'res025_jpeg10',  name: 'Res ×0.25 + JPEG Q=10', reduction: -92 },
]

// full class strings so Tailwind doesn't purge them
const GRADE_BG = {
  NC: 'bg-[#16A34A]',
  G3: 'bg-[#D97706]',
  G4: 'bg-[#EA580C]',
  G5: 'bg-[#DC2626]',
}

export default function App() {
  const [model,      setModel]      = useState('SN-Deg')
  const [condition,  setCondition]  = useState('original')
  const [imageFile,  setImageFile]  = useState(null)
  const [imageURL,   setImageURL]   = useState(null)   // local preview
  const [ckptFile,   setCkptFile]   = useState(null)
  const [result,     setResult]     = useState(null)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState(null)

  const imgRef  = useRef(null)
  const ckptRef = useRef(null)

  function pickImage(file) {
    if (!file) return
    setImageFile(file)
    setImageURL(URL.createObjectURL(file))
    setResult(null)
    setError(null)
  }

  async function runInference() {
    if (!imageFile) { setError('Upload a tissue patch first.'); return }
    setLoading(true); setError(null); setResult(null)

    const form = new FormData()
    form.append('image',        imageFile)
    form.append('model_name',   model)
    form.append('condition_id', condition)
    if (ckptFile) form.append('checkpoint', ckptFile)

    try {
      const res = await fetch(`${API}/infer`, { method: 'POST', body: form })
      if (!res.ok) throw new Error((await res.json()).detail || 'Inference failed')
      setResult(await res.json())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const conditionLabel = CONDITIONS.find(c => c.id === condition)?.name

  return (
    <body className='bg-[#F8F9FB]'>
      <div className='bg-[#F8F9FB] min-h-screen px-20 py-12 max-w-[900px] mx-auto'>

        {/* Header */}
        <div className='flex flex-col items-start mb-8'>
          <h1 className='font-mono font-bold text-2xl tracking-tight text-[#191C1E]'>COMPRESSPATH</h1>
          <p className='font-mono text-sm text-[#737686]'>Telepathology Degradation Benchmark</p>
        </div>

        {/* Upload zone */}
        <div
          onClick={() => imgRef.current.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); pickImage(e.dataTransfer.files[0]) }}
          className='border-2 border-dashed border-[#C3C6D7] flex flex-col gap-2 items-center justify-center p-14 bg-white rounded-2xl hover:border-[#004AC6] hover:bg-blue-50 cursor-pointer transition-colors'
        >
          <div className='border border-[#C3C6D7] p-3 rounded-full'>
            <ArrowUp className='text-[#004AC6]' size={20} />
          </div>
          <p className='text-sm text-[#191C1E]'>
            {imageFile ? imageFile.name : 'Drop tissue patch here or click to browse'}
          </p>
          <p className='text-xs text-[#737686]'>PNG · JPG · 768 × 768 px recommended</p>
        </div>
        <input ref={imgRef} type='file' accept='image/png,image/jpeg' className='hidden'
               onChange={(e) => pickImage(e.target.files[0])} />

        {/* Custom checkpoint */}
        <div
          onClick={() => ckptRef.current.click()}
          className='flex justify-between items-center bg-white mt-3 px-4 py-3 rounded-xl border border-[#C3C6D7] hover:border-[#004AC6] transition-colors cursor-pointer'
        >
          <span className='text-sm text-[#5b5e66]'>
            {ckptFile ? ckptFile.name : 'Upload custom model checkpoint (.pt)'}
          </span>
          <span className='text-[#004AC6] font-mono font-bold text-xs'>Browse</span>
        </div>
        <input ref={ckptRef} type='file' accept='.pt,.pth' className='hidden'
              onChange={(e) => setCkptFile(e.target.files[0])} />

        {/* Config row */}
        <div className='flex gap-4 mt-6'>

          {/* Model selector */}
          <div className='w-1/2 border border-[#C3C6D7] p-4 rounded-xl bg-white'>
            <p className='font-mono text-xs text-[#737686] mb-3'>MODEL</p>
            <div className='grid grid-cols-2 gap-3'>
              {MODELS.map((m) => (
                <label key={m.name} onClick={() => setModel(m.name)}
                  className={`flex flex-col p-3 rounded-lg border cursor-pointer transition-colors ${
                    model === m.name ? 'border-[#004AC6] bg-blue-50' : 'border-[#C3C6D7] bg-white hover:border-[#004AC6]'
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
                    <input type='radio' name='model' value={m.name} checked={model === m.name}
                          onChange={() => setModel(m.name)} className='accent-[#004AC6] mt-0.5' />
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Transfer condition */}
          <div className='w-1/2 border border-[#C3C6D7] p-4 rounded-xl bg-white flex flex-col gap-3'>
            <p className='font-mono text-xs text-[#737686]'>TRANSFER CONDITION</p>
            <select value={condition} onChange={(e) => setCondition(e.target.value)}
              className='w-full border border-[#004AC6] px-3 py-2.5 rounded-lg text-sm font-mono text-[#191C1E] cursor-pointer outline-none'
            >
              {CONDITIONS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <ul className='flex flex-col rounded-xl overflow-hidden border border-[#C3C6D7]'>
              {CONDITIONS.map((c, i) => (
                <li key={c.id} onClick={() => setCondition(c.id)}
                  className={`flex justify-between px-3 py-2 text-xs font-mono border-b border-[#C3C6D7] last:border-b-0 cursor-pointer transition-colors ${
                    condition === c.id ? 'bg-blue-50' : 'bg-white hover:bg-[#F8F9FB]'
                  }`}
                >
                  <span className={i === 0 ? 'text-[#004AC6] font-semibold' : 'text-[#5b5e66]'}>{c.name}</span>
                  <span className='text-[#737686]'>{c.reduction}%</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Run button */}
        <button onClick={runInference} disabled={loading || !imageFile}
          className='w-full bg-[#004AC6] hover:bg-[#2563eb] disabled:opacity-40 disabled:cursor-not-allowed transition-colors py-4 rounded-xl text-white font-mono font-bold mt-6'
        >
          {loading ? 'Running…' : 'Run inference'}
        </button>

        {error && <p className='mt-4 text-sm text-red-600 font-mono'>{error}</p>}

        {/* Results shown only after a successful inference */}
        {result && (
          <div className='bg-white mt-6 border border-[#C3C6D7] rounded-xl p-6'>

            {/* Grade badge */}
            <div className='flex gap-4 items-center mb-6'>
              <span className={`${GRADE_BG[result.predicted_grade]} text-white font-mono font-bold text-4xl px-5 py-3 rounded-xl`}>
                {result.predicted_grade}
              </span>
              <div className='flex flex-col'>
                <span className='font-bold text-xl text-[#191C1E]'>{result.top_confidence}% confidence</span>
                <span className='text-xs text-[#737686] mt-1 font-mono'>
                  Predicted Gleason grade · {result.model_used} · {conditionLabel}
                </span>
              </div>
            </div>

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
        )}

      </div>
    </body>
  )
}