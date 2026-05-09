# Deploying Big Z Burger to Netlify

The app's Supabase connection is configured via **build-time environment variables** that Vite inlines into the client bundle. Set them in Netlify before deploying so the build is portable.

## 1. Required environment variables

In the Netlify dashboard go to:

**Site → Site configuration → Environment variables → Add a variable**

| Variable | Where to find it | Example |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Supabase → Project Settings → API → Project URL | `https://xxxx.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase → Project Settings → API → `anon` / `publishable` key | `eyJhbGciOi...` |
| `VITE_SUPABASE_PROJECT_ID` *(optional)* | Supabase → Project Settings → General → Reference ID | `puvhqxutwprhmddiosve` |

Set the **Scope** to **Builds** (and **Runtime** if you also want them at runtime). The `VITE_` prefix is required — Vite only exposes variables with that prefix to client code.

> The `anon` / publishable key is safe to ship in the client bundle. Never set `SUPABASE_SERVICE_ROLE_KEY` on Netlify for this app — it must never reach the browser.

## 2. Build settings

Already declared in `netlify.toml`:

```toml
[build]
  command = "bun run build"
  publish = "dist"
```

If Netlify doesn't detect Bun automatically, set **Build command** to `npm run build` in the UI and Netlify will use Node.

## 3. Trigger a deploy

After adding the variables, redeploy:

**Deploys → Trigger deploy → Clear cache and deploy site**

(The cache clear is important — Vite inlines env values at build time, so an old cached build will keep the old keys.)

## 4. Verify

Open the deployed site, open the browser console, and confirm there is no `Missing Supabase environment variable(s)` error. Menu items should load from your Supabase project.

## Notes

- This is a static SPA deploy. Server-side rendering and TanStack server functions are not used on Netlify — all Supabase calls happen client-side via the publishable key + RLS.
- For full SSR, deploy via Lovable's Publish button (Cloudflare Workers) instead.
