/** @public */
export type PosterFormat = 'webp' | 'jpeg' | 'png'
/** @public */
export type PosterMode = 'automatic' | 'manual'

/** @public */
export interface VideoPosterConfig {
  /** `automatic` generates when the video changes in the Studio; `manual` only via the button. */
  mode?: PosterMode
  format?: PosterFormat
  /** Seconds into the video to grab the frame from. Clamped to the video duration. */
  offset?: number
  /**
   * Maximum poster width in pixels. Larger frames are scaled down, smaller ones are never
   * enlarged. Use `-1` to keep the video's own resolution. Defaults to 1200.
   */
  maxWidth?: number
  /** Encoder quality, 0–1. Ignored for PNG. */
  quality?: number
}

/** @public */
export interface VideoPosterFieldOptions extends VideoPosterConfig {
  /** Name of the sibling `file` field that holds the video. */
  videoField: string
}

export type ResolvedVideoPosterOptions = Required<VideoPosterFieldOptions>

declare module 'sanity' {
  interface ImageOptions {
    videoPoster?: VideoPosterFieldOptions
  }
}
