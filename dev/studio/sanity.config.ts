import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {videoPosters} from 'sanity-plugin-video-posters'
import {schemaTypes} from './schemaTypes'

export default defineConfig({
  name: 'default',
  title: 'video-posters-test',

  projectId: 'ypmzefjz',
  dataset: 'production',

  plugins: [structureTool(), visionTool(), videoPosters()],

  schema: {
    types: schemaTypes,
  },
})
