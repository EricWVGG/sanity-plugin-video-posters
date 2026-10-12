import {definePlugin, isImageSchemaType, type InputProps} from 'sanity'
import {resolveConfig} from './resolveConfig'
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
          return (
            <VideoPosterInput
              inputProps={props as never}
              options={resolveConfig(pluginConfig, fieldOptions)}
            />
          )
        },
      },
    },
  }
})
