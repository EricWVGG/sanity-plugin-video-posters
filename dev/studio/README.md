# Test Studio

Throwaway Studio for exercising the plugin against the real Sanity API. Project `ypmzefjz`, dataset `production`.

```sh
npm install
npm run install-plugin   # builds + packs the plugin from ../.. and installs it (no symlink)
npm run dev              # http://localhost:3333
```

Re-run `install-plugin` after every plugin change. Sign in with your own Sanity account; no token is needed. Never commit `.env.local` or claim links.
