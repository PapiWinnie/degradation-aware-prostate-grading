export const MAX_UPLOAD_MB = 10      // must match MAX_UPLOAD_BYTES in the backend
export const TIMEOUT_MS = 60_000     // a cold start on the host can take a while

export const GENERIC = 'Something went wrong. Please try again.'

// The request never got an answer: no internet, the server is down, or it was too slow.
export function messageForNetworkError(e) {
  if (!navigator.onLine) return 'You seem to be offline. Check your internet connection and try again.'
  if (e?.name === 'TimeoutError' || e?.name === 'AbortError') return 'The server took too long to answer. Try again in a moment.'
  return 'We could not reach the server. It may be starting up or briefly unavailable. Wait a minute and try again.'
}

// The server answered with an error status.
export async function messageForResponse(res, model) {
  const body = await res.json().catch(() => ({}))
  // A bad checkpoint is the one 400 that needs its own advice.
  if (res.status === 400 && String(body.detail).startsWith('Bad checkpoint')) {
    return `These weights do not fit the ${model} architecture, or the file is not a valid checkpoint. Choose the model the file was trained as, or remove it to use the built-in weights.`
  }
  if (res.status === 400) return 'That file could not be read as an image. Upload a PNG or JPEG.'
  if (res.status === 413) return `That image is larger than ${MAX_UPLOAD_MB} MB. Choose a smaller one.`
  if (res.status === 422) return 'The tool did not accept that choice. Reload the page and try again.'
  if (res.status >= 502 && res.status <= 504) return 'The server is starting up or busy. Wait a minute and try again.'
  return 'Something went wrong while running the model. Please try again.'
}

// Checked in the browser before anything is uploaded. Returns a message, or null if the file is fine.
export function messageForBadImage(file) {
  if (!file.type.startsWith('image/')) return 'That file is not an image. Choose a PNG or JPEG.'
  if (file.size > MAX_UPLOAD_MB * 1024 * 1024) return `That image is larger than ${MAX_UPLOAD_MB} MB. Choose a smaller one.`
  return null
}
