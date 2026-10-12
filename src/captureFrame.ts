import type {PosterFormat} from './types'

export interface CaptureOptions {
  offset: number
  format: PosterFormat
  quality: number
  /** Milliseconds before giving up. */
  timeout?: number
}

export interface CaptureResult {
  blob: Blob
  /** The format actually produced (WebP falls back to JPEG where unsupported). */
  format: PosterFormat
}

const MIME: Record<PosterFormat, string> = {
  webp: 'image/webp',
  jpeg: 'image/jpeg',
  png: 'image/png',
}

export const EXTENSION: Record<PosterFormat, string> = {webp: 'webp', jpeg: 'jpg', png: 'png'}

/**
 * Loads `url` into a hidden <video>, grabs the frame at `offset` and encodes it.
 * Tries the URL directly first (needs CORS); on failure retries via a downloaded blob.
 */
/** @public */
export async function captureFrame(url: string, options: CaptureOptions): Promise<CaptureResult> {
  try {
    return await captureFromSource(url, options, true)
  } catch (err) {
    // A CORS failure surfaces as a load error or a tainted canvas; retry via a downloaded blob.
    if (!(err instanceof CaptureError) || err.kind === 'other') throw err
  }
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Could not download the video (HTTP ${response.status}).`)
  const objectUrl = URL.createObjectURL(await response.blob())
  try {
    return await captureFromSource(objectUrl, options, false)
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

class CaptureError extends Error {
  constructor(
    message: string,
    readonly kind: 'tainted' | 'load' | 'other',
  ) {
    super(message)
  }
}

async function captureFromSource(
  src: string,
  {offset, format, quality, timeout = 30000}: CaptureOptions,
  crossOrigin: boolean,
): Promise<CaptureResult> {
  const video = document.createElement('video')
  if (crossOrigin) video.crossOrigin = 'anonymous'
  video.muted = true
  video.playsInline = true
  video.preload = 'auto'

  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    const work = (async () => {
      const loaded = once(
        video,
        'loadedmetadata',
        () =>
          new CaptureError(
            'The browser could not load this video (unsupported codec or blocked request).',
            'load',
          ),
      )
      video.src = src
      await loaded
      const duration = Number.isFinite(video.duration) ? video.duration : 0
      const target = Math.min(Math.max(offset, 0), Math.max(duration - 0.05, 0))
      const seeked = once(video, 'seeked', () => decodeError('Seeking the video failed.'))
      video.currentTime = target
      await seeked
      await nextPaint()

      if (!video.videoWidth || !video.videoHeight) {
        throw decodeError('The video has no decodable picture (unsupported codec?).')
      }
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) throw decodeError('Canvas is not available in this browser.')
      ctx.drawImage(video, 0, 0)
      return encode(canvas, format, quality)
    })()
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () => reject(decodeError('Timed out while reading the video.')),
        timeout,
      )
    })
    return await Promise.race([work, timeoutPromise])
  } finally {
    clearTimeout(timer)
    video.removeAttribute('src')
    video.load()
    video.remove()
  }
}

function decodeError(message: string) {
  return new CaptureError(message, 'other')
}

function once(video: HTMLVideoElement, event: string, onError: () => Error): Promise<void> {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      video.removeEventListener(event, onOk)
      video.removeEventListener('error', onFail)
    }
    const onOk = () => {
      cleanup()
      resolve()
    }
    const onFail = () => {
      cleanup()
      reject(onError())
    }
    video.addEventListener(event, onOk)
    video.addEventListener('error', onFail)
  })
}

function nextPaint(): Promise<void> {
  return new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  )
}

async function encode(
  canvas: HTMLCanvasElement,
  format: PosterFormat,
  quality: number,
): Promise<CaptureResult> {
  let blob: Blob | null
  try {
    blob = await toBlob(canvas, MIME[format], quality)
  } catch (err) {
    if (err instanceof DOMException && err.name === 'SecurityError') {
      throw new CaptureError('Canvas is tainted (video served without CORS headers).', 'tainted')
    }
    throw err
  }
  if (!blob) throw decodeError('The browser could not encode the poster image.')
  if (blob.type !== MIME[format]) {
    if (format === 'webp') {
      console.warn('[video-posters] WebP encoding is unsupported here; falling back to JPEG.')
      const jpeg = await toBlob(canvas, MIME.jpeg, quality)
      if (!jpeg) throw decodeError('The browser could not encode the poster image.')
      return {blob: jpeg, format: 'jpeg'}
    }
  }
  return {blob, format}
}

function toBlob(canvas: HTMLCanvasElement, mime: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob(resolve, mime, quality)
    } catch (err) {
      reject(err)
    }
  })
}
