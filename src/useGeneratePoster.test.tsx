// @vitest-environment happy-dom
import {act, renderHook} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import type {ResolvedVideoPosterOptions} from './types'

const upload = vi.fn()
const push = vi.fn()
const captureFrame = vi.fn()

vi.mock('sanity', () => ({
  set: (value: unknown) => ({set: value}),
  useClient: () => ({
    config: () => ({projectId: 'proj', dataset: 'production'}),
    assets: {upload},
  }),
}))
vi.mock('@sanity/ui/toast', () => ({useToast: () => ({push})}))
vi.mock('./captureFrame', () => ({
  captureFrame: (...args: unknown[]) => captureFrame(...args),
  EXTENSION: {webp: 'webp', jpeg: 'jpg', png: 'png'},
}))

import {useGeneratePoster} from './useGeneratePoster'

const options: ResolvedVideoPosterOptions = {
  videoField: 'video',
  mode: 'automatic',
  format: 'webp',
  offset: 1,
  maxWidth: 800,
  quality: 0.9,
}
const hash = (c: string) => c.repeat(40)
const refA = `file-${hash('a')}-mp4`
const refB = `file-${hash('b')}-mp4`

function deferred<T>() {
  let resolve!: (v: T) => void
  const promise = new Promise<T>((r) => (resolve = r))
  return {promise, resolve}
}
const frame = {blob: new Blob(['x']), format: 'webp' as const}

beforeEach(() => {
  vi.clearAllMocks()
  upload.mockImplementation(async (_t, _b, {filename}) => ({_id: `image-${filename}`}))
})

describe('useGeneratePoster', () => {
  it('captures, uploads and sets the image reference', async () => {
    captureFrame.mockResolvedValue(frame)
    const onChange = vi.fn()
    const {result} = renderHook(() => useGeneratePoster(options, onChange))
    await act(() => result.current.generate(refA))

    expect(captureFrame).toHaveBeenCalledWith(
      expect.stringContaining(hash('a')),
      expect.objectContaining({offset: 1, maxWidth: 800, format: 'webp', quality: 0.9}),
    )
    expect(upload).toHaveBeenCalledWith('image', frame.blob, {
      filename: `${hash('a')}-poster.webp`,
    })
    expect(onChange).toHaveBeenCalledWith({
      set: {_type: 'image', asset: {_type: 'reference', _ref: `image-${hash('a')}-poster.webp`}},
    })
    expect(result.current.isGenerating).toBe(false)
  })

  it('names the file after the format actually produced', async () => {
    captureFrame.mockResolvedValue({blob: frame.blob, format: 'jpeg'})
    const {result} = renderHook(() => useGeneratePoster(options, vi.fn()))
    await act(() => result.current.generate(refA))
    expect(upload).toHaveBeenCalledWith('image', frame.blob, {
      filename: `${hash('a')}-poster.jpg`,
    })
  })

  it('shows an error toast and leaves the field untouched on failure', async () => {
    captureFrame.mockRejectedValue(new Error('boom'))
    const onChange = vi.fn()
    const {result} = renderHook(() => useGeneratePoster(options, onChange))
    await act(() => result.current.generate(refA))

    expect(push).toHaveBeenCalledWith(
      expect.objectContaining({status: 'error', description: 'boom'}),
    )
    expect(onChange).not.toHaveBeenCalled()
    expect(result.current.isGenerating).toBe(false)
  })

  it('discards a stale result when a newer video arrives mid-run', async () => {
    const first = deferred<typeof frame>()
    captureFrame.mockReturnValueOnce(first.promise).mockResolvedValueOnce(frame)
    const onChange = vi.fn()
    const {result} = renderHook(() => useGeneratePoster(options, onChange))

    let done!: Promise<void>
    act(() => {
      done = result.current.generate(refA)
    })
    await act(() => result.current.generate(refB))
    await act(async () => {
      first.resolve(frame)
      await done
    })

    expect(captureFrame).toHaveBeenCalledTimes(2)
    expect(upload).toHaveBeenCalledTimes(1)
    expect(upload).toHaveBeenCalledWith('image', frame.blob, {
      filename: `${hash('b')}-poster.webp`,
    })
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith({
      set: {_type: 'image', asset: {_type: 'reference', _ref: `image-${hash('b')}-poster.webp`}},
    })
  })

  it('ignores a repeat request for the video already running', async () => {
    const first = deferred<typeof frame>()
    captureFrame.mockReturnValueOnce(first.promise)
    const onChange = vi.fn()
    const {result} = renderHook(() => useGeneratePoster(options, onChange))

    let done!: Promise<void>
    act(() => {
      done = result.current.generate(refA)
    })
    await act(() => result.current.generate(refA))
    await act(async () => {
      first.resolve(frame)
      await done
    })

    expect(captureFrame).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledTimes(1)
  })
})
