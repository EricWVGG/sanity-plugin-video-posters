import {describe, expect, it} from 'vitest'
import {resolveConfig, tryResolveConfig} from './resolveConfig'

describe('resolveConfig', () => {
  it('applies defaults', () => {
    expect(resolveConfig(undefined, {videoField: 'video'})).toEqual({
      videoField: 'video',
      mode: 'automatic',
      format: 'webp',
      offset: 0,
      maxWidth: 1200,
      quality: 0.85,
    })
  })
  it('lets field options override plugin config, ignoring undefined', () => {
    const r = resolveConfig({mode: 'manual', format: 'png'}, {videoField: 'v', format: 'jpeg', mode: undefined})
    expect(r.mode).toBe('manual')
    expect(r.format).toBe('jpeg')
  })
  it('accepts -1 for the video size', () => {
    expect(resolveConfig({maxWidth: 800}, {videoField: 'v', maxWidth: -1}).maxWidth).toBe(-1)
  })
  it('rejects invalid values', () => {
    expect(() => resolveConfig(undefined, {videoField: ''})).toThrow()
    expect(() => resolveConfig(undefined, {videoField: 'v', offset: -1})).toThrow()
    expect(() => resolveConfig(undefined, {videoField: 'v', quality: 2})).toThrow()
    expect(() => resolveConfig(undefined, {videoField: 'v', maxWidth: 0})).toThrow()
    expect(() => resolveConfig(undefined, {videoField: 'v', maxWidth: -2})).toThrow()
    expect(() => resolveConfig(undefined, {videoField: 'v', format: 'gif' as never})).toThrow()
  })
})

describe('tryResolveConfig', () => {
  it('returns options when valid', () => {
    expect(tryResolveConfig(undefined, {videoField: 'v'})).toHaveProperty('options.videoField', 'v')
  })
  it('returns the error message instead of throwing', () => {
    expect(tryResolveConfig(undefined, {videoField: 'v', quality: 2})).toEqual({
      error: expect.stringContaining('quality'),
    })
  })
})
