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
