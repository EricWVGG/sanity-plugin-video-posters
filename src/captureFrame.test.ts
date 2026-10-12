import {describe, expect, it} from 'vitest'
import {scaledSize} from './captureFrame'

describe('scaledSize', () => {
  it('scales down to maxWidth, keeping the aspect ratio', () => {
    expect(scaledSize(1920, 1080, 1200)).toEqual({width: 1200, height: 675})
  })
  it('never enlarges', () => {
    expect(scaledSize(640, 360, 1200)).toEqual({width: 640, height: 360})
  })
  it('keeps the video size for -1', () => {
    expect(scaledSize(3840, 2160, -1)).toEqual({width: 3840, height: 2160})
  })
})
