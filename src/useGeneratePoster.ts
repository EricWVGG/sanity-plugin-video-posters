import {parseFileAssetId, buildFileUrl} from '@sanity/asset-utils'
import {useToast} from '@sanity/ui/toast'
import {useCallback, useEffect, useRef, useState} from 'react'
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
  const inFlight = useRef<string | undefined>(undefined)
  // The newest video requested while a run was in flight; older results are discarded.
  const pending = useRef<string | undefined>(undefined)
  const onChangeRef = useRef(onChange)
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  const generate = useCallback(
    async (videoRef: string) => {
      if (inFlight.current) {
        if (videoRef !== inFlight.current) pending.current = videoRef
        return
      }
      setIsGenerating(true)
      let current: string | undefined = videoRef
      try {
        while (current) {
          inFlight.current = current
          current = await generateOne(current)
        }
      } finally {
        inFlight.current = undefined
        pending.current = undefined
        setIsGenerating(false)
      }

      /** Returns the video ref to process next, if a newer one arrived meanwhile. */
      async function generateOne(ref: string): Promise<string | undefined> {
        const takeNewer = () => {
          const newer = pending.current
          pending.current = undefined
          return newer && newer !== ref ? newer : undefined
        }
        try {
          const {projectId, dataset} = client.config()
          const parts = parseFileAssetId(ref)
          const url = buildFileUrl(parts, {projectId, dataset})
          const {blob, format} = await captureFrame(url, {
            offset: options.offset,
            maxWidth: options.maxWidth,
            format: options.format,
            quality: options.quality,
          })
          const newerBeforeUpload = takeNewer()
          if (newerBeforeUpload) return newerBeforeUpload
          const filename = `${parts.assetId}-poster.${EXTENSION[format]}`
          const asset = await client.assets.upload('image', blob, {filename})
          const newerAfterUpload = takeNewer()
          if (newerAfterUpload) return newerAfterUpload
          onChangeRef.current(set({_type: 'image', asset: {_type: 'reference', _ref: asset._id}}))
          return undefined
        } catch (err) {
          toast.push({
            status: 'error',
            title: 'Could not generate poster',
            description: err instanceof Error ? err.message : String(err),
          })
          return takeNewer()
        }
      }
    },
    [client, options.format, options.maxWidth, options.offset, options.quality, toast],
  )

  return {generate, isGenerating}
}
