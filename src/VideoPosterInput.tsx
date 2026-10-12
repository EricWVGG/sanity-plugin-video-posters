import {Button, Stack} from '@sanity/ui'
import {useEffect, useRef} from 'react'
import {useFormValue, type ObjectInputProps} from 'sanity'
import {shouldAutoGenerate} from './shouldAutoGenerate'
import type {ResolvedVideoPosterOptions} from './types'
import {useGeneratePoster} from './useGeneratePoster'

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
        isGenerating,
        previousVideoRef: prev.ref,
        videoRef,
      })
    ) {
      void generate(videoRef as string)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoRef])

  return (
    <Stack gap={3}>
      {renderDefault(inputProps)}
      <Button
        mode="ghost"
        text={posterRef ? 'Regenerate poster' : 'Generate poster'}
        disabled={!videoRef || isGenerating || Boolean(readOnly)}
        loading={isGenerating}
        onClick={() => videoRef && void generate(videoRef)}
      />
    </Stack>
  )
}
