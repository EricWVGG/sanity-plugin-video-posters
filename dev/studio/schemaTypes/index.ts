import {defineArrayMember, defineField, defineType} from 'sanity'

const videoPair = (name = 'video', poster = 'poster', opts: Record<string, unknown> = {}) => [
  defineField({name, type: 'file', options: {accept: 'video/*'}}),
  defineField({
    name: poster,
    type: 'image',
    options: {videoPoster: {videoField: name, ...opts}},
  }),
]

export const schemaTypes = [
  defineType({
    name: 'clip',
    title: 'Clip',
    type: 'document',
    fields: [
      defineField({name: 'title', type: 'string'}),
      ...videoPair('video', 'poster'),
      ...videoPair('manualVideo', 'manualPoster', {mode: 'manual'}),
      ...videoPair('jpegVideo', 'jpegPoster', {format: 'jpeg', offset: 1}),
      defineField({
        name: 'items',
        type: 'array',
        of: [
          defineArrayMember({
            type: 'object',
            name: 'item',
            fields: videoPair('video', 'poster', {format: 'png', offset: 2}),
          }),
        ],
      }),
    ],
  }),
]
