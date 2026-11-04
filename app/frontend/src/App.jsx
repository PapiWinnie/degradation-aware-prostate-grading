import { useState } from 'react'
import { API, CONDITIONS } from './constants'
import Header from './components/Header'
import FileDropZone from './components/FileDropZone'
import ModelSelector from './components/ModelSelector'
import ConditionSelector from './components/ConditionSelector'
import ResultsPanel from './components/ResultsPanel'

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

        {result && <ResultsPanel result={result} imageURL={imageURL} conditionLabel={conditionLabel} />}

      </div>
    </body>
  )
}