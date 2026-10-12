import {parseFileAssetId, buildFileUrl} from '@sanity/asset-utils'
import {useToast} from '@sanity/ui/toast'
import {useCallback, useRef, useState} from 'react'
import {set, useClient, type ObjectInputProps} from 'sanity'
import {captureFrame, EXTENSION} from './captureFrame'
import type {ResolvedVideoPosterOptions} from './types'

const API_VERSION = '2025-02-19'

export function useGeneratePoster(
  options: ResolvedVideoPosterOptions,
  onChange: ObjectInputProps['onChange'],
) {
  const client = useClient({apiVersion: API_VERSION})
  const toast = useToast()
  const [isGenerating, setIsGenerating] = useState(false)
  const inFlight = useRef(false)

  const generate = useCallback(
    async (videoRef: string) => {
      if (inFlight.current) return
      inFlight.current = true
      setIsGenerating(true)
      try {
        const {projectId, dataset} = client.config()
        const parts = parseFileAssetId(videoRef)
        const url = buildFileUrl(parts, {projectId, dataset})
        const {blob, format} = await captureFrame(url, {
          offset: options.offset,
          maxWidth: options.maxWidth,
          format: options.format,
          quality: options.quality,
        })
        const filename = `${parts.assetId}-poster.${EXTENSION[format]}`
        const asset = await client.assets.upload('image', blob, {filename})
        onChange(set({_type: 'image', asset: {_type: 'reference', _ref: asset._id}}))
      } catch (err) {
        toast.push({
          status: 'error',
          title: 'Could not generate poster',
          description: err instanceof Error ? err.message : String(err),
        })
      } finally {
        inFlight.current = false
        setIsGenerating(false)
      }
    },
    [client, onChange, options.format, options.maxWidth, options.offset, options.quality, toast],
  )

  return {generate, isGenerating}
}
