import {describe, expect, it} from 'vitest'
import {shouldAutoGenerate, type AutoGenerateInput} from './shouldAutoGenerate'

const base: AutoGenerateInput = {
  mode: 'automatic',
  readOnly: false,
  initialized: true,
  isGenerating: false,
  previousVideoRef: undefined,
  videoRef: 'file-abc-mp4',
}

describe('shouldAutoGenerate', () => {
  it('fires when a video is added after mount', () => {
    expect(shouldAutoGenerate(base)).toBe(true)
  })
  it('fires when the video is replaced', () => {
    expect(shouldAutoGenerate({...base, previousVideoRef: 'file-old-mp4'})).toBe(true)
  })
  it('does not fire when unchanged, removed, manual, read-only, uninitialized or busy', () => {
    expect(shouldAutoGenerate({...base, previousVideoRef: base.videoRef})).toBe(false)
    expect(shouldAutoGenerate({...base, videoRef: undefined, previousVideoRef: 'x'})).toBe(false)
    expect(shouldAutoGenerate({...base, mode: 'manual'})).toBe(false)
    expect(shouldAutoGenerate({...base, readOnly: true})).toBe(false)
    expect(shouldAutoGenerate({...base, initialized: false})).toBe(false)
    expect(shouldAutoGenerate({...base, isGenerating: true})).toBe(false)
  })
})
