# AGENTS.md

Notes for AI agents working on `sanity-plugin-video-posters`. `README.md` is the user-facing doc; this covers internals.

## What it does

Fills an `image` field with a frame from a sibling `file` (video) field, entirely in the browser. No server code.

## Source layout (`src/`)

| File | Role |
| --- | --- |
| `index.ts` | Public exports. |
| `types.ts` | Config types, plus the `declare module 'sanity'` augmentation of `ImageOptions` (`videoPoster`). |
| `plugin.tsx` | `definePlugin`. A `form.components.input` resolver wraps image fields that have `options.videoPoster` in `VideoPosterInput`; all others render the default. |
| `resolveConfig.ts` | Merges defaults, plugin config and field options, and validates them. |
| `shouldAutoGenerate.ts` | Pure decision for the automatic trigger. Unit-tested; keep logic here, not in the component. |
| `VideoPosterInput.tsx` | Renders the default input plus the button. Reads the sibling video ref with `useFormValue`; a `useRef` records the previous ref so mount never fires. |
| `useGeneratePoster.ts` | Builds the CDN URL (`@sanity/asset-utils`), calls `captureFrame`, uploads with `client.assets.upload`, sets the field. An in-flight ref prevents overlapping runs. |
| `captureFrame.ts` | Hidden `<video>` → canvas → blob. Tries the CDN URL with `crossOrigin='anonymous'`; on a load error or tainted canvas it retries via a downloaded blob URL. |

## Gotchas

- `@sanity/ui` v4: `useToast` lives in `@sanity/ui/toast` and `Stack` uses `gap`, not `space`.
- `@sanity/icons` v5 has no named exports from its main entry, so the plugin uses no icons.
- Test in a Studio by packing (`pnpm pack`) and installing the tarball; a symlink pulls in a second copy of `react`/`sanity`.
- Don't fire on first mount: it would write to old documents and race between editors.

## Testing in a Studio

`dev/studio/` is a Studio connected to the test project `ypmzefjz` (dataset `production`). The project ID is not secret. Don't commit tokens, `.env.local` files or claim links.

1. `cd dev/studio && npm install && npm run install-plugin && npm run dev` (port 3333, which the project's CORS list allows).
2. Sign in with a Sanity account that is a member of the project, and open a new Clip.
3. Check: automatic poster (WebP); manual mode needs the button; the JPEG field uses a 1s offset; the PNG field inside the `items` array; replacing the video regenerates the poster; reopening an old document generates nothing; an undecodable file shows an error toast.

Re-run `npm run install-plugin` after every plugin change.
