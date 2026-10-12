import {Card, Stack, Text} from '@sanity/ui'
import {definePlugin, isImageSchemaType, type InputProps} from 'sanity'
import {tryResolveConfig} from './resolveConfig'
import type {VideoPosterConfig} from './types'
import {VideoPosterInput} from './VideoPosterInput'

/** @public */
export const videoPosters = definePlugin<VideoPosterConfig | void>((config) => {
  const pluginConfig = config || undefined
  return {
    name: 'sanity-plugin-video-posters',
    form: {
      components: {
        input: (props: InputProps) => {
          const fieldOptions = isImageSchemaType(props.schemaType)
            ? props.schemaType.options?.videoPoster
            : undefined
          if (!fieldOptions) return props.renderDefault(props)
          const resolved = tryResolveConfig(pluginConfig, fieldOptions)
          if ('error' in resolved) {
            // Keep the field usable; a typo in the options must not take the form down.
            return (
              <Stack gap={3}>
                {props.renderDefault(props)}
                <Card tone="caution" padding={3} border radius={2}>
                  <Text size={1}>{resolved.error}</Text>
                </Card>
              </Stack>
            )
          }
          return <VideoPosterInput inputProps={props as never} options={resolved.options} />
        },
      },
    },
  }
})
