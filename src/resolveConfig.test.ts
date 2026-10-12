import {describe, expect, it} from 'vitest'
import {resolveConfig} from './resolveConfig'

describe('resolveConfig', () => {
  it('applies defaults', () => {
    expect(resolveConfig(undefined, {videoField: 'video'})).toEqual({
      videoField: 'video',
      mode: 'automatic',
      format: 'webp',
      offset: 0,
      quality: 0.85,
    })
  })
  it('lets field options override plugin config, ignoring undefined', () => {
    const r = resolveConfig({mode: 'manual', format: 'png'}, {videoField: 'v', format: 'jpeg', mode: undefined})
    expect(r.mode).toBe('manual')
    expect(r.format).toBe('jpeg')
  })
  it('rejects invalid values', () => {
    expect(() => resolveConfig(undefined, {videoField: ''})).toThrow()
    expect(() => resolveConfig(undefined, {videoField: 'v', offset: -1})).toThrow()
    expect(() => resolveConfig(undefined, {videoField: 'v', quality: 2})).toThrow()
    expect(() => resolveConfig(undefined, {videoField: 'v', format: 'gif' as never})).toThrow()
  })
})
