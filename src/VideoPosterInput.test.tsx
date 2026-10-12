// @vitest-environment happy-dom
import {cleanup, fireEvent, render, screen} from '@testing-library/react'
import type {ReactNode} from 'react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import type {ResolvedVideoPosterOptions} from './types'

let videoRef: string | undefined
const generate = vi.fn()

vi.mock('sanity', () => ({useFormValue: () => videoRef}))
vi.mock('@sanity/ui', () => ({
  Flex: ({children}: {children: ReactNode}) => <div>{children}</div>,
  Box: ({children}: {children: ReactNode}) => <div>{children}</div>,
  Button: ({
    text,
    disabled,
    onClick,
  }: {
    text: string
    disabled?: boolean
    onClick?: () => void
  }) => (
    <button disabled={disabled} onClick={onClick}>
      {text}
    </button>
  ),
}))
vi.mock('./useGeneratePoster', () => ({useGeneratePoster: () => ({generate, isGenerating: false})}))

import {VideoPosterInput} from './VideoPosterInput'

const options: ResolvedVideoPosterOptions = {
  videoField: 'video',
  mode: 'automatic',
  format: 'webp',
  offset: 0,
  maxWidth: 1200,
  quality: 0.85,
}

function ui(opts: Partial<ResolvedVideoPosterOptions> = {}, props: Record<string, unknown> = {}) {
  const inputProps = {
    path: ['poster'],
    readOnly: false,
    value: undefined,
    renderDefault: () => null,
    onChange: vi.fn(),
    ...props,
  }
  return <VideoPosterInput inputProps={inputProps as never} options={{...options, ...opts}} />
}

beforeEach(() => {
  videoRef = undefined
  generate.mockClear()
})
afterEach(cleanup)

describe('VideoPosterInput', () => {
  it('does not generate on mount, even with an existing video', () => {
    videoRef = 'file-old-mp4'
    render(ui())
    expect(generate).not.toHaveBeenCalled()
  })

  it('generates when a video is added after mount', () => {
    const {rerender} = render(ui())
    videoRef = 'file-new-mp4'
    rerender(ui())
    expect(generate).toHaveBeenCalledWith('file-new-mp4')
  })

  it('generates when the video is replaced', () => {
    videoRef = 'file-old-mp4'
    const {rerender} = render(ui())
    videoRef = 'file-new-mp4'
    rerender(ui())
    expect(generate).toHaveBeenCalledTimes(1)
    expect(generate).toHaveBeenCalledWith('file-new-mp4')
  })

  it('does not generate when the video is removed', () => {
    videoRef = 'file-old-mp4'
    const {rerender} = render(ui())
    videoRef = undefined
    rerender(ui())
    expect(generate).not.toHaveBeenCalled()
  })

  it('does not generate automatically in manual mode or when read-only', () => {
    const manual = render(ui({mode: 'manual'}))
    videoRef = 'file-new-mp4'
    manual.rerender(ui({mode: 'manual'}))
    manual.unmount()

    videoRef = undefined
    const readOnly = render(ui({}, {readOnly: true}))
    videoRef = 'file-newer-mp4'
    readOnly.rerender(ui({}, {readOnly: true}))
    expect(generate).not.toHaveBeenCalled()
  })

  it('disables the button without a video or when read-only', () => {
    const {unmount} = render(ui())
    expect(screen.getByRole('button')).toHaveProperty('disabled', true)
    unmount()
    videoRef = 'file-a-mp4'
    render(ui({}, {readOnly: true}))
    expect(screen.getByRole('button')).toHaveProperty('disabled', true)
  })

  it('generates from the button and labels it by poster presence', () => {
    videoRef = 'file-a-mp4'
    const {unmount} = render(ui())
    fireEvent.click(screen.getByText('Generate poster'))
    expect(generate).toHaveBeenCalledWith('file-a-mp4')
    unmount()
    render(ui({}, {value: {asset: {_ref: 'image-x'}}}))
    expect(screen.getByText('Regenerate poster')).toBeTruthy()
  })
})
