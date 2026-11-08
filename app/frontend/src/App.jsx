import { useState } from 'react'
import { API, CONDITIONS } from './constants'
import Header from './components/Header'
import FileDropZone from './components/FileDropZone'
import ModelSelector from './components/ModelSelector'
import ConditionSelector from './components/ConditionSelector'
import ResultsPanel from './components/ResultsPanel'

// Holds all the state and the one network call. The child components only
// receive values and callbacks, so they stay simple and reusable.
export default function App() {
  const [model,      setModel]      = useState('SN-Deg')
  const [condition,  setCondition]  = useState('original')
  const [imageFile,  setImageFile]  = useState(null)
  const [imageURL,   setImageURL]   = useState(null)   // local preview of the upload
  const [ckptFile,   setCkptFile]   = useState(null)
  const [result,     setResult]     = useState(null)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState(null)

  // Called by both the drop and the file dialog. Resets the previous result so
  // old predictions never sit next to a new image.
  function pickImage(file) {
    if (!file) return
    // free the previous preview so repeated uploads don't leak memory
    if (imageURL) URL.revokeObjectURL(imageURL)
    setImageFile(file)
    setImageURL(URL.createObjectURL(file))
    setResult(null)
    setError(null)
  }

  // Sends the patch, the chosen model and the condition to the backend as a
  // multipart form, because the image is binary.
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
      // Error responses carry a readable message in 'detail'. Validation errors
      // can send a list instead of a string, so fall back to a generic message.
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

  // The backend returns the condition id, but the results panel shows its name.
  const conditionLabel = CONDITIONS.find(c => c.id === condition)?.name

  return (
    <div className='min-h-screen px-20 py-12 max-w-[900px] mx-auto'>

      <Header />

      <FileDropZone accept='image/png,image/jpeg' file={imageFile} onFile={pickImage}
        placeholder='Drop tissue patch here or click to browse'
        hint='PNG · JPG · 512 × 512 px recommended (square)' />

      <FileDropZone variant='compact' accept='.pt,.pth' file={ckptFile} onFile={setCkptFile}
        placeholder='Upload custom model checkpoint (.pt)' />

      <div className='flex gap-4 mt-6'>
        <ModelSelector value={model} onChange={setModel} />
        <ConditionSelector value={condition} onChange={setCondition} />
      </div>

      {/* Disabled until an image is chosen and while a request is running, to avoid double submits */}
      <button onClick={runInference} disabled={loading || !imageFile}
        className='w-full bg-[#004AC6] hover:bg-[#2563eb] disabled:opacity-40 disabled:cursor-not-allowed transition-colors py-4 rounded-xl text-white font-mono font-bold mt-6'
      >
        {loading ? 'Running…' : 'Run inference'}
      </button>

      {error && <p className='mt-4 text-sm text-red-600 font-mono'>{error}</p>}

      {result && <ResultsPanel result={result} imageURL={imageURL} conditionLabel={conditionLabel} />}

    </div>
  )
}