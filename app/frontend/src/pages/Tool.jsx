import { useState } from 'react'
import { Link } from 'react-router-dom'
import { API, CONDITIONS } from '../constants'
import { GENERIC, TIMEOUT_MS, messageForBadImage, messageForNetworkError, messageForResponse } from '../errors'
import FileDropZone from '../components/FileDropZone'
import ModelSelector from '../components/ModelSelector'
import ConditionSelector from '../components/ConditionSelector'
import ResultsPanel from '../components/ResultsPanel'

// The tool page. It holds the state and the one network call; the child
// components only receive values and callbacks.
export default function Tool() {
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
    // A dropped file ignores the input's accept list, so check it here.
    const problem = messageForBadImage(file)
    if (problem) { setError(problem); return }
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
    if (!imageFile) { setError('Choose a tissue patch first.'); return }
    if (!navigator.onLine) { setError(messageForNetworkError()); return }
    setLoading(true); setError(null); setResult(null)

    const form = new FormData()
    form.append('image',        imageFile)
    form.append('model_name',   model)
    form.append('condition_id', condition)
    if (ckptFile) form.append('checkpoint', ckptFile)

    try {
      const res = await fetch(`${API}/infer`, { method: 'POST', body: form, signal: AbortSignal.timeout(TIMEOUT_MS) })
      if (!res.ok) { setError(await messageForResponse(res, model)); return }
      const data = await res.json().catch(() => null)
      if (!data) { setError(GENERIC); return }
      setResult(data)
    } catch (e) {
      // fetch only rejects when no answer came back: offline, server down, or too slow
      setError(messageForNetworkError(e))
    } finally {
      setLoading(false)
    }
  }

  // The backend returns the condition id, but the results panel shows its name.
  const conditionLabel = CONDITIONS.find(c => c.id === condition)?.name

  // Inputs on the left, result on the right, so the result is visible without scrolling on a wide screen.
  return (
    <div className='grid gap-6 lg:grid-cols-2 items-start'>

      <div className='bg-white border border-[#F0C9DC] rounded-2xl p-5 flex flex-col gap-6'>
        <div>
          <p className='text-sm font-semibold text-[#191C1E] mb-2'>1. Upload a tissue patch</p>
          <FileDropZone accept='image/png,image/jpeg' file={imageFile} preview={imageURL} onFile={pickImage}
            placeholder='Drop tissue patch here or click to browse'
            hint='PNG · JPG · 512 × 512 px recommended (square)' />
          <p className='mt-2 text-xs text-[#5A5266]'>
            Do not upload images that identify a patient. Your image is processed in memory and not stored.
            See the <Link to='/privacy' className='font-semibold text-[#A12F77] hover:underline'>privacy policy</Link>.
          </p>
        </div>

        <ModelSelector value={model} onChange={setModel} customWeights={!!ckptFile} />
        <ConditionSelector value={condition} onChange={setCondition} />

        {/* Rarely needed, so it stays closed until someone asks for it */}
        <details>
          <summary className='cursor-pointer text-xs font-semibold text-[#A12F77]'>
            {ckptFile ? `Your weights: ${ckptFile.name}` : 'Advanced: use your own weights'}
          </summary>
          <FileDropZone variant='compact' accept='.pt,.pth' file={ckptFile} onFile={setCkptFile}
            onClear={() => setCkptFile(null)} placeholder='Choose a .pt file' />
          <p className='mt-2 text-xs text-[#5A5266]'>
            Your file replaces the weights of the selected model. Pick the model it was trained as.
          </p>
        </details>

        {/* Disabled until an image is chosen and while a request is running, to avoid double submits */}
        <button onClick={runInference} disabled={loading || !imageFile}
          className='w-full bg-[#C0408C] hover:bg-[#A12F77] disabled:opacity-40 disabled:cursor-not-allowed transition-colors py-4 rounded-xl text-white font-mono font-bold'
        >
          {loading ? <span className='loading loading-spinner loading-sm' aria-label='Running'></span> : 'Run inference'}
        </button>

        {error && <p role='alert' className='text-sm text-red-600'>{error}</p>}
      </div>

      <div>
        {result
          ? <ResultsPanel result={result} imageURL={imageURL} conditionLabel={conditionLabel} />
          : <div className='hidden lg:flex items-center justify-center min-h-80 border-2 border-dashed border-[#F0C9DC] rounded-2xl text-sm text-[#6B6577]'>
              Your result will appear here
            </div>}
      </div>
    </div>
  )
}
