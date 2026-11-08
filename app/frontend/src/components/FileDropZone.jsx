import { useRef } from 'react'
import { ArrowUp } from 'lucide-react'

// 'patch' is the large dashed drop area, 'compact' is the single-row picker.
// 'onClear' (compact only) adds a Remove button once a file is chosen.
export default function FileDropZone({ variant = 'patch', accept, file, placeholder, hint, onFile, onClear }) {
  const inputRef = useRef(null)

  // Without preventDefault on dragover and drop, the browser opens the file
  // in the tab instead of handing it to us.
  function handleDrop(e) {
    e.preventDefault()
    onFile(e.dataTransfer.files[0])
  }

  // Resetting the input lets the same file be picked again after removing it.
  function clear(e) {
    e.stopPropagation()
    inputRef.current.value = ''
    onClear()
  }

  return (
    <>
      {variant === 'patch' ? (
        <div
          onClick={() => inputRef.current.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className='border-2 border-dashed border-[#C3C6D7] flex flex-col gap-2 items-center justify-center p-14 bg-white rounded-2xl hover:border-[#004AC6] hover:bg-blue-50 cursor-pointer transition-colors'
        >
          <div className='border border-[#C3C6D7] p-3 rounded-full'>
            <ArrowUp className='text-[#004AC6]' size={20} />
          </div>
          <p className='text-sm text-[#191C1E]'>{file ? file.name : placeholder}</p>
          <p className='text-xs text-[#737686]'>{hint}</p>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current.click()}
          className='flex justify-between items-center bg-white mt-3 px-4 py-3 rounded-xl border border-[#C3C6D7] hover:border-[#004AC6] transition-colors cursor-pointer'
        >
          <span className='text-sm text-[#5b5e66] truncate'>{file ? file.name : placeholder}</span>
          {file && onClear ? (
            <button type='button' onClick={clear}
              className='text-[#004AC6] font-semibold text-xs ml-3 shrink-0 hover:underline focus-visible:outline-2 focus-visible:outline-[#004AC6]'>
              Remove
            </button>
          ) : (
            <span className='text-[#004AC6] font-semibold text-xs ml-3 shrink-0'>Browse</span>
          )}
        </div>
      )}
      {/* The native input is hidden. Clicking the styled area opens it through the ref. */}
      <input ref={inputRef} type='file' accept={accept} className='hidden'
             onChange={(e) => onFile(e.target.files[0])} />
    </>
  )
}
