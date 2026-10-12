import {Box, Button, Flex} from '@sanity/ui'
import {useEffect, useRef} from 'react'
import styled from 'styled-components'
import {useFormValue, type ObjectInputProps} from 'sanity'
import {shouldAutoGenerate} from './shouldAutoGenerate'
import type {ResolvedVideoPosterOptions} from './types'
import {useGeneratePoster} from './useGeneratePoster'

/**
 * Sanity's image input has no size option, so cap the preview box with CSS. The box that
 * directly contains the preview `<img>` is sized from the image's aspect ratio
 * (`--image-width` / `--image-height`), so derive its width from the height cap. If Sanity
 * changes that markup the preview simply returns to full size.
 */
const THUMBNAIL_HEIGHT = 160
const Thumbnail = styled.div`
  *:has(> img[data-testid='hotspot-image-input']) {
    max-height: ${THUMBNAIL_HEIGHT}px;
    max-width: 100%;
    width: calc(${THUMBNAIL_HEIGHT}px * var(--image-width) / var(--image-height));
  }
`

interface Props {
  inputProps: ObjectInputProps
  options: ResolvedVideoPosterOptions
}

export function VideoPosterInput({inputProps, options}: Props) {
  const {path, readOnly, value, renderDefault, onChange} = inputProps
  const videoRef = useFormValue([...path.slice(0, -1), options.videoField, 'asset', '_ref']) as
    | string
    | undefined
  const posterRef = (value as {asset?: {_ref?: string}} | undefined)?.asset?._ref
  const {generate, isGenerating} = useGeneratePoster(options, onChange)

  // `undefined` until the first render has recorded the current video, so mount never fires.
  const previous = useRef<{ref: string | undefined} | null>(null)
  useEffect(() => {
    const prev = previous.current
    previous.current = {ref: videoRef}
    if (!prev) return
    if (
      shouldAutoGenerate({
        mode: options.mode,
        readOnly: Boolean(readOnly),
        initialized: true,
        // A run in flight queues the newest video itself, so this never blocks.
        isGenerating: false,
        previousVideoRef: prev.ref,
        videoRef,
      })
    ) {
      void generate(videoRef as string)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoRef])

  return (
    <Flex gap={3} align="flex-start">
      <Box flex={1}>
        <Thumbnail>{renderDefault(inputProps)}</Thumbnail>
      </Box>
      <Button
        mode="ghost"
        text={posterRef ? 'Regenerate poster' : 'Generate poster'}
        disabled={!videoRef || isGenerating || Boolean(readOnly)}
        loading={isGenerating}
        onClick={() => videoRef && void generate(videoRef)}
      />
    </Flex>
  )
}
