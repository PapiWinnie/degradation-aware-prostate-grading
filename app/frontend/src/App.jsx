import { useState } from 'react'
import { API, CONDITIONS, GRADE_BG } from './constants'
import Header from './components/Header'
import FileDropZone from './components/FileDropZone'
import ModelSelector from './components/ModelSelector'
import ConditionSelector from './components/ConditionSelector'

export default function App() {
  const [model,      setModel]      = useState('SN-Deg')
  const [condition,  setCondition]  = useState('original')
  const [imageFile,  setImageFile]  = useState(null)
  const [imageURL,   setImageURL]   = useState(null)   // local preview
  const [ckptFile,   setCkptFile]   = useState(null)
  const [result,     setResult]     = useState(null)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState(null)

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
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(typeof body.detail === 'string' ? body.detail : 'Inference failed')
      }
      setResult(await res.json())
    } catch (e) {
      // fetch rejects with a TypeError when the backend is unreachable
      setError(e instanceof TypeError ? 'Cannot reach the server. Is the backend running?' : e.message)
    } finally {
      setLoading(false)
    }
  }

  const conditionLabel = CONDITIONS.find(c => c.id === condition)?.name

  return (
    <body className='bg-[#F8F9FB]'>
      <div className='bg-[#F8F9FB] min-h-screen px-20 py-12 max-w-[900px] mx-auto'>

        <Header />

        <FileDropZone accept='image/png,image/jpeg' file={imageFile} onFile={pickImage}
          placeholder='Drop tissue patch here or click to browse'
          hint='PNG · JPG · 768 × 768 px recommended' />

        <FileDropZone variant='compact' accept='.pt,.pth' file={ckptFile} onFile={setCkptFile}
          placeholder='Upload custom model checkpoint (.pt)' />

        <div className='flex gap-4 mt-6'>
          <ModelSelector value={model} onChange={setModel} />
          <ConditionSelector value={condition} onChange={setCondition} />
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