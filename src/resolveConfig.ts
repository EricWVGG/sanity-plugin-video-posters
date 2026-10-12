import type {
  PosterFormat,
  PosterMode,
  ResolvedVideoPosterOptions,
  VideoPosterConfig,
  VideoPosterFieldOptions,
} from './types'

export const DEFAULTS: Required<VideoPosterConfig> = {
  mode: 'automatic',
  format: 'webp',
  offset: 0,
  maxWidth: 1200,
  quality: 0.85,
}

const FORMATS: PosterFormat[] = ['webp', 'jpeg', 'png']
const MODES: PosterMode[] = ['automatic', 'manual']

/** Merges defaults, plugin config and field options (later wins) and validates the result. */
export function resolveConfig(
  pluginConfig: VideoPosterConfig | undefined,
  fieldOptions: VideoPosterFieldOptions,
): ResolvedVideoPosterOptions {
  const merged = {
    ...DEFAULTS,
    ...stripUndefined(pluginConfig),
    ...stripUndefined(fieldOptions),
  } as ResolvedVideoPosterOptions

  if (!merged.videoField || typeof merged.videoField !== 'string') {
    throw new Error('videoPoster: `videoField` must be the name of a sibling file field')
  }
  if (!FORMATS.includes(merged.format)) {
    throw new Error(`videoPoster: \`format\` must be one of ${FORMATS.join(', ')}`)
  }
  if (!MODES.includes(merged.mode)) {
    throw new Error(`videoPoster: \`mode\` must be one of ${MODES.join(', ')}`)
  }
  if (!Number.isFinite(merged.offset) || merged.offset < 0) {
    throw new Error('videoPoster: `offset` must be a number >= 0')
  }
  if (merged.maxWidth !== -1 && !(Number.isInteger(merged.maxWidth) && merged.maxWidth > 0)) {
    throw new Error('videoPoster: `maxWidth` must be a positive integer, or -1 for the video size')
  }
  if (!Number.isFinite(merged.quality) || merged.quality < 0 || merged.quality > 1) {
    throw new Error('videoPoster: `quality` must be a number between 0 and 1')
  }
  return merged
}

function stripUndefined<T extends object>(obj: T | undefined): Partial<T> {
  if (!obj) return {}
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>
}
