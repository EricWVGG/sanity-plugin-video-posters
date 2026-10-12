# sanity-plugin-video-posters

A Sanity Studio (v5/v6) plugin that fills an `image` field with a poster frame taken from a sibling video `file` field. Everything happens in the browser: the Studio loads the video, grabs a frame onto a canvas, encodes it and uploads it as an image asset. There is no Sanity Function, Blueprint or FFMPEG binary to deploy.

## Install

```sh
npm install sanity-plugin-video-posters
```

```ts
// sanity.config.ts
import {defineConfig} from 'sanity'
import {videoPosters} from 'sanity-plugin-video-posters'

export default defineConfig({
  // ...
  plugins: [videoPosters({mode: 'automatic', format: 'webp', offset: 0, maxWidth: 1200, quality: 0.85})],
})
```

## Schema

Declare the relationship on the **poster** field, naming the sibling video field. This works at any nesting depth, including inside array items.

```ts
defineField({name: 'video', type: 'file', options: {accept: 'video/*'}}),
defineField({
  name: 'poster',
  type: 'image',
  options: {videoPoster: {videoField: 'video' /*, mode, format, offset, quality */}},
}),
```

## Options

Set them on the plugin for defaults, or on `options.videoPoster` per field (field wins).

| Option | Default | Description |
| --- | --- | --- |
| `videoField` | (required, field only) | Name of the sibling `file` field holding the video. |
| `mode` | `'automatic'` | `'automatic'` generates when the video changes; `'manual'` only via the button. |
| `format` | `'webp'` | `'webp'`, `'jpeg'` or `'png'`. WebP falls back to JPEG in browsers that can't encode it. |
| `offset` | `0` | Seconds into the video for the frame. Clamped to the video's duration. |
| `maxWidth` | `1200` | Maximum poster width in pixels. Larger frames are scaled down (aspect ratio kept), smaller ones are never enlarged. `-1` keeps the video's own resolution. |
| `quality` | `0.85` | Encoder quality, 0–1. Ignored for PNG. |

A **Generate poster** / **Regenerate poster** button appears under the field in both modes.

## Behavior

- **Automatic mode** runs when the video is added or replaced during the editing session, and replaces any existing poster. It never runs when a document is first opened, on read-only fields, or while another generation is running.
- Replaced posters are not deleted; the old image asset stays in the dataset until you clean it up.

## Limits

- Only videos added through the Studio form get posters. Videos uploaded through the API or the Media Library do not.
- Only codecs the browser can decode work (for example HEVC `.mov` files often fail outside Safari). Failures show an error toast and the form stays usable.
- The Studio origin must be allowed by the project's CORS settings, which it is for any working Studio. If the CDN refuses a direct read, the plugin downloads the file and reads the frame from that copy.

## License

MIT
