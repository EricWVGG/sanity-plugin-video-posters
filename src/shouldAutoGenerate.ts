import type {PosterMode} from './types'

export interface AutoGenerateInput {
  mode: PosterMode
  readOnly: boolean
  /** True once the input has been mounted and the first video ref has been recorded. */
  initialized: boolean
  isGenerating: boolean
  previousVideoRef: string | undefined
  videoRef: string | undefined
}

/**
 * Decides whether a video change should trigger poster generation.
 * Only fires when an existing video is replaced by a different one, or a video is added
 * after mount, during this session. Never on first mount. An existing poster is replaced.
 */
export function shouldAutoGenerate(input: AutoGenerateInput): boolean {
  const {mode, readOnly, initialized, isGenerating, previousVideoRef, videoRef} = input
  if (mode !== 'automatic' || readOnly || !initialized || isGenerating) return false
  if (!videoRef) return false
  return videoRef !== previousVideoRef
}
